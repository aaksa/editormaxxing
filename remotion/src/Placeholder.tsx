import React from 'react';
import { Pose } from './lib/core';

// The stand-in presenter: an original, flat-shaded character seated in a dark armchair, drawn in a 1080 x 1920 frame
// (the "as shot" composition). Its head, hands, blinks and mouth come from poseAt(), the same function the effects use
// for the face, so everything that tracks a real face tracks this one. Swap in real footage and this is never drawn.

const SKIN = '#E9B48F', SKIN_SH = '#C98E6B', HAIR = '#1E1714', JACKET = '#7C1722', JACKET_SH = '#4C0A12', TEE = '#F1ECE3';
const PANTS = '#1F1C1D', SHOE = '#ECECEC', CHAIR = '#2B2A2C', CHAIR_SH = '#151416';

export const Placeholder: React.FC<{ pose: Pose; W: number; H: number }> = ({ pose: p, W, H }) => {
  const b = p.breath;
  // hands: each forearm swings up from the elbow by armL / armR (0 = resting on the lap, 1 = raised to the chest)
  const hand = (side: -1 | 1, k: number) => {
    const ex = 540 + side * 168, ey = 1110 + b * 0.5;                       // elbow
    const ang = (-15 - k * 70) * (Math.PI / 180);
    const len = 175;
    return { ex, ey, hx: ex - side * Math.cos(ang) * len * 0.82, hy: ey + Math.sin(ang) * len };
  };
  const L = hand(-1, p.armL), R = hand(1, p.armR);
  const eyeH = 13 * (1 - p.blink * 0.92);
  const mh = 6 + p.mouth * 26;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="phShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#000" stopOpacity="0.38" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="phChair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A393C" /><stop offset="1" stopColor={CHAIR_SH} /></linearGradient>
        <linearGradient id="phJacket" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={JACKET_SH} /><stop offset="0.35" stopColor={JACKET} /><stop offset="0.7" stopColor={JACKET} /><stop offset="1" stopColor={JACKET_SH} /></linearGradient>
        <linearGradient id="phSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={SKIN_SH} /><stop offset="0.3" stopColor={SKIN} /><stop offset="0.75" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_SH} /></linearGradient>
      </defs>
      {/* floor shadow */}
      <ellipse cx="540" cy="1660" rx="380" ry="70" fill="url(#phShadow)" />
      {/* armchair: back, legs, arms */}
      <rect x="250" y="800" width="580" height="560" rx="150" fill="url(#phChair)" />
      <path d="M330 1500 L300 1650 M750 1500 L780 1650" stroke="#0E0E0F" strokeWidth="16" strokeLinecap="round" />
      <rect x="215" y="1040" width="170" height="420" rx="80" fill={CHAIR} />
      <rect x="695" y="1040" width="170" height="420" rx="80" fill={CHAIR} />
      <rect x="300" y="1300" width="480" height="210" rx="70" fill={CHAIR_SH} />
      {/* legs: thighs come toward us, shins down to the shoes */}
      <rect x="378" y="1250" width="150" height="150" rx="60" fill={PANTS} />
      <rect x="552" y="1250" width="150" height="150" rx="60" fill={PANTS} />
      <rect x="392" y="1360" width="118" height="290" rx="50" fill={PANTS} />
      <rect x="570" y="1360" width="118" height="290" rx="50" fill={PANTS} />
      <ellipse cx="447" cy="1665" rx="78" ry="38" fill={SHOE} /><ellipse cx="633" cy="1665" rx="78" ry="38" fill={SHOE} />
      <path d="M382 1672 h130 M568 1672 h130" stroke="#BDBDBD" strokeWidth="9" strokeLinecap="round" />
      {/* torso: tee, open jacket */}
      <g transform={`translate(0 ${b * 0.5})`}>
        <path d="M370 850 Q540 800 710 850 L730 1280 Q540 1310 350 1280 Z" fill="url(#phJacket)" />
        <path d="M480 840 L600 840 L598 1270 L482 1270 Z" fill={TEE} />
        <path d="M478 838 L436 1010 L470 1000 L512 860 Z M602 838 L644 1010 L610 1000 L568 860 Z" fill={JACKET_SH} />
        <path d="M352 1240 Q540 1285 728 1240 L730 1282 Q540 1312 350 1282 Z" fill={JACKET_SH} opacity="0.6" />
      </g>
      {/* arms: sleeve from shoulder to elbow, forearm to the hand */}
      {[{ s: -1, P: L }, { s: 1, P: R }].map(({ s, P }) => (
        <g key={s}>
          <path d={`M${540 + s * 175} ${870 + b * 0.5} Q ${540 + s * 205} ${990} ${P.ex} ${P.ey}`} stroke={JACKET} strokeWidth="92" strokeLinecap="round" fill="none" />
          <path d={`M${P.ex} ${P.ey} L ${P.hx} ${P.hy}`} stroke={JACKET} strokeWidth="80" strokeLinecap="round" />
          <path d={`M${P.ex} ${P.ey} L ${P.hx} ${P.hy}`} stroke={JACKET_SH} strokeWidth="80" strokeLinecap="round" opacity="0.25" />
          <circle cx={P.hx} cy={P.hy} r="38" fill={SKIN} />
          <circle cx={P.hx - s * 12} cy={P.hy - 10} r="16" fill={SKIN_SH} opacity="0.5" />
        </g>
      ))}
      {/* neck and head, turning about the neck */}
      <g transform={`rotate(${p.tilt} ${p.hx} ${p.hy + 120})`}>
        <rect x={p.hx - 38} y={p.hy + 60} width="76" height="100" rx="30" fill={SKIN_SH} />
        <ellipse cx={p.hx - 82} cy={p.hy + 8} rx="16" ry="26" fill={SKIN_SH} />
        <ellipse cx={p.hx + 82} cy={p.hy + 8} rx="16" ry="26" fill={SKIN_SH} />
        <ellipse cx={p.hx} cy={p.hy} rx="84" ry="104" fill="url(#phSkin)" />
        {/* hair: a full top with a swept front */}
        <path d={`M${p.hx - 92} ${p.hy - 10} Q ${p.hx - 100} ${p.hy - 120} ${p.hx - 10} ${p.hy - 128} Q ${p.hx + 96} ${p.hy - 130} ${p.hx + 94} ${p.hy - 18}
          Q ${p.hx + 70} ${p.hy - 70} ${p.hx + 20} ${p.hy - 76} Q ${p.hx - 30} ${p.hy - 50} ${p.hx - 70} ${p.hy - 60} Q ${p.hx - 86} ${p.hy - 30} ${p.hx - 92} ${p.hy - 10} Z`} fill={HAIR} />
        {/* brows, eyes, nose, mouth */}
        <path d={`M${p.hx - 52} ${p.hy - 30 - p.mouth * 4} q 20 -10 38 -2 M${p.hx + 14} ${p.hy - 32 - p.mouth * 4} q 20 -8 38 2`} stroke={HAIR} strokeWidth="9" strokeLinecap="round" fill="none" />
        <ellipse cx={p.hx - 33} cy={p.hy - 4} rx="9" ry={eyeH} fill="#231a17" />
        <ellipse cx={p.hx + 33} cy={p.hy - 4} rx="9" ry={eyeH} fill="#231a17" />
        <path d={`M${p.hx + 2} ${p.hy + 6} q 8 22 -6 28`} stroke={SKIN_SH} strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x={p.hx - 26} y={p.hy + 52 - mh * 0.3} width="52" height={mh} rx={Math.min(18, mh / 2)} fill="#5A1A1A" />
        <rect x={p.hx - 20} y={p.hy + 52 - mh * 0.3} width="40" height={Math.min(7, mh * 0.3)} rx="3" fill="#FFFFFF" opacity={p.mouth > 0.15 ? 0.9 : 0} />
        <path d={`M${p.hx - 50} ${p.hy + 60} Q ${p.hx} ${p.hy + 112} ${p.hx + 50} ${p.hy + 60}`} stroke={HAIR} strokeWidth="5" fill="none" opacity="0.18" />
      </g>
    </svg>
  );
};
