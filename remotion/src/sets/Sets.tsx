import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { hash, SetName } from '../lib/core';
import { ShaderSet } from './Shader';
import { C } from '../lib/fonts';
import { lookSet } from '../looks';

// The sets the person is cut out onto. Each one keeps a slow living thing (a drift, a turning light) so a held shot
// never freezes. All are drawn, so they work the same on the placeholder and on real footage.

const Studio: React.FC<{ W: number; H: number; t: number; dots?: boolean }> = ({ W, H, t, dots }) => {
  const lx = 50 + Math.sin(t * 0.35) * 6;
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse 80% 55% at ${lx}% 42%, #F7F6F0 0%, ${C.cream} 55%, #D6D5CA 100%)`,
    }}>
      {/* the cove where the wall turns into the floor: a soft band of light */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(255,255,255,0.35) 66%, rgba(0,0,0,0.05) 100%)` }} />
      {dots ? (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="setdots" width={W / 90} height={W / 90} patternUnits="userSpaceOnUse" patternTransform={`rotate(45) translate(${t * 4} 0)`}>
              <circle cx={W / 180} cy={W / 180} r={W / 520} fill="#8b877c" />
            </pattern>
            <radialGradient id="setdotsfade" cx="50%" cy="45%" r="70%">
              <stop offset="0.25" stopColor="#fff" stopOpacity="0.25" /><stop offset="1" stopColor="#fff" stopOpacity="1" />
            </radialGradient>
            <mask id="setdotsmask"><rect width={W} height={H} fill="url(#setdotsfade)" /></mask>
          </defs>
          <rect width={W} height={H} fill="url(#setdots)" opacity={0.5} mask="url(#setdotsmask)" />
        </svg>
      ) : null}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 95% 75% at 50% 45%, rgba(0,0,0,0) 60%, rgba(60,50,40,0.18) 100%)' }} />
    </AbsoluteFill>
  );
};

/** A cluster of leaves, drawn: a stem fan of pointed ellipses in three greens, seeded so it is the same every frame. */
const Leaves: React.FC<{ seed: number; n: number; size: number; sway: number }> = ({ seed, n, size, sway }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const a = hash(seed + i) * Math.PI * 2, r = size * 0.55 * Math.sqrt(hash(seed + i * 7));
      const x = Math.cos(a) * r, y = Math.sin(a) * r, rot = (a * 180) / Math.PI + (hash(i + seed * 3) - 0.5) * 50 + sway;
      const L = size * (0.2 + 0.14 * hash(seed + i * 13)), tone = ['#3E7D2A', '#5C9E33', '#2C5E1F', '#79B847'][i % 4];
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d={`M0 0 Q ${L * 0.5} ${-L * 0.32} ${L} 0 Q ${L * 0.5} ${L * 0.32} 0 0 Z`} fill={tone} />
          <path d={`M0 0 L ${L * 0.92} 0`} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        </g>
      );
    })}
  </g>
);

const Blush: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 60% at 50% 45%, #FFF8F5 0%, ${C.blush} 60%, #E9D9D3 100%)` }}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><filter id="leafblur"><feGaussianBlur stdDeviation={W * 0.012} /></filter></defs>
      <g transform={`translate(${W * 0.06} ${H * 0.02})`}><Leaves seed={3} n={120} size={W * 0.36} sway={Math.sin(t * 0.8) * 3} /></g>
      <g transform={`translate(${W * 0.98} ${H * 0.97})`} filter="url(#leafblur)"><Leaves seed={11} n={160} size={W * 0.5} sway={Math.sin(t * 0.6 + 1) * 3} /></g>
    </svg>
  </AbsoluteFill>
);

/** Red and white: a red wall on the right and a red floor band on the left meeting at a hard diagonal, like a lit set. */
const Stripes: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => {
  const d = Math.sin(t * 0.4) * W * 0.01;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #EDEDED 100%)' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="stA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF1A1A" /><stop offset="1" stopColor="#B40000" /></linearGradient>
          <linearGradient id="stB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E00000" /><stop offset="1" stopColor="#7A0000" /></linearGradient>
          <linearGradient id="stShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.25" /></linearGradient>
        </defs>
        {/* the right wall */}
        <polygon points={`${W * 0.58 + d},0 ${W},0 ${W},${H} ${W * 0.86 + d},${H} ${W * 0.62 + d},${H * 0.46}`} fill="url(#stB)" />
        {/* the floor band, crossing from the bottom left */}
        <polygon points={`0,${H * 0.47} ${W * 0.62 + d},${H * 0.46} ${W * 0.84 + d},${H} 0,${H}`} fill="url(#stA)" />
        <polygon points={`0,${H * 0.83} ${W * 0.38 + d},${H * 0.55} ${W * 0.47 + d},${H * 0.62} ${W * 0.1},${H}  0,${H}`} fill="#FFFFFF" opacity={0.92} />
        <rect width={W} height={H} fill="url(#stShade)" />
      </svg>
    </AbsoluteFill>
  );
};

const Dark: React.FC<{ W: number; H: number; t: number; frame: number }> = ({ W, H, t, frame }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 55% at ${50 + Math.sin(t * 0.5) * 4}% 48%, #5E0707 0%, #2A0202 55%, ${C.night} 100%)` }}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.35 }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 24} /></filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

const Blue: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at ${50 + Math.sin(t * 0.4) * 5}% 18%, #4FA3E8 0%, #1F6FB8 40%, #0B3A73 75%, #061F44 100%)` }}>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,10,30,0.45) 100%)' }} />
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
      {Array.from({ length: 7 }, (_, i) => <rect key={i} x={(i + 0.5) * (W / 7) - 2} y={0} width={4} height={H * 0.62} fill="#fff" />)}
    </svg>
  </AbsoluteFill>
);

export const SetView: React.FC<{ set: SetName; W: number; H: number; t: number; frame: number; room?: string | null }> = ({ set, W, H, t, frame, room }) => {
  const own = lookSet(set, W, H, t, frame);
  if (own) return <>{own}</>;
  switch (set) {
    case 'halftone': return <Studio W={W} H={H} t={t} dots />;
    case 'blush': return <Blush W={W} H={H} t={t} />;
    case 'stripes': return <Stripes W={W} H={H} t={t} />;
    case 'dark': return <Dark W={W} H={H} t={t} frame={frame} />;
    case 'blue': return <Blue W={W} H={H} t={t} />;
    case 'silk': return <ShaderSet name="silk" W={W} H={H} t={t} />;
    case 'ember': return <ShaderSet name="ember" W={W} H={H} t={t} />;
    // the clip's own room: the clean plate (person removed) when the tracking pass made one
    case 'footage': return <OffthreadVideo muted src={staticFile(room ?? 'source.mp4')} style={{ width: W, height: H }} />;
    default: return <Studio W={W} H={H} t={t} />;
  }
};
