import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, FxDef, hash, Look, LOOK, SetName } from '../lib/core';
import { abs } from './common';
import { LF, VHS } from './fonts';
import { Archive, Evidence, Newsprint, NEWSROOM_FX } from './newsroom';
import { Aurora, Frost, Midnight, GLASS_LOOK_FX } from './glass';
import { Bluescreen, Snow, VHS_FX } from './vhs';
import { Board, SPLIT_FX } from './split';

// The four looks beside the red gloss. A look is a finish over the whole frame (grade, texture, HUD) and a family of
// sets, effects and cuts; the plan picks it with "look" and can still borrow any effect from another look.

export const LOOK_FX: Record<string, FxDef> = { ...NEWSROOM_FX, ...GLASS_LOOK_FX, ...VHS_FX, ...SPLIT_FX };

/** The look's own sets (null: not a look set, the gloss SetView draws it). */
export function lookSet(set: SetName, W: number, H: number, t: number, frame: number): React.ReactNode | null {
  switch (set) {
    case 'newsprint': return <Newsprint W={W} H={H} t={t} />;
    case 'evidence': return <Evidence W={W} H={H} t={t} />;
    case 'archive': return <Archive W={W} H={H} t={t} />;
    case 'aurora': return <Aurora W={W} H={H} t={t} />;
    case 'frost': return <Frost W={W} H={H} t={t} />;
    case 'midnight': return <Midnight W={W} H={H} t={t} />;
    case 'bluescreen': return <Bluescreen W={W} H={H} t={t} />;
    case 'snow': return <Snow W={W} H={H} frame={frame} />;
    case 'board': return <Board W={W} H={H} t={t} />;
    case 'slate': return <Board W={W} H={H} t={t} dark />;
    default: return null;
  }
}
/** A look's default set when a scene names none. */
export const LOOK_SET: Record<Look, SetName> = { gloss: 'studio', newsroom: 'newsprint', glass: 'aurora', vhs: 'footage', split: 'board' };
/** Depth elements belong to the gloss look; the others bring their own depth (orbs of glass, paper, none). */
export const lookDepth = (look: Look) => (look === 'gloss' ? null : 'none');

// ---------------- grades ----------------
const Noise: React.FC<{ W: number; H: number; seed: number; freq: number; o: number; blend: React.CSSProperties['mixBlendMode']; id: string; tone?: string }> =
  ({ W, H, seed, freq, o, blend, id, tone = '0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.3' }) => (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o, mixBlendMode: blend }}>
      <filter id={id}><feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={seed} /><feColorMatrix values={tone} /></filter>
      <rect width={W} height={H} filter={`url(#${id})`} />
    </svg>
  );

/** Newsroom: warm paper tone, film grain on twos, dust, a slow light leak, vignette. */
const NewsGrade: React.FC<{ W: number; H: number; frame: number; t: number }> = ({ W, H, frame, t }) => {
  const g = Math.floor(frame / 2);
  const leak = 0.5 + 0.5 * Math.sin(t * 0.6);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: '#E8D6B0', mixBlendMode: 'multiply', opacity: 0.22 }} />
      <Noise W={W} H={H} seed={g % 50} freq={0.8} o={0.28} blend="overlay" id="ngr" />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const s = hash(g * 13 + i);
          return s < 0.5 ? <circle key={i} cx={hash(g + i * 7) * W} cy={hash(g * 3 + i) * H} r={1 + 3 * hash(i + g)} fill="#2a2015" opacity={0.35} /> : null;
        })}
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at ${-5 + leak * 20}% ${15 + leak * 10}%, rgba(255,140,60,${0.22 * leak}) 0%, rgba(255,120,40,0) 70%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(40,22,5,0.45) 100%)' }} />
    </AbsoluteFill>
  );
};

/** Glass: a clean, cool finish: a soft top light and a light vignette (no grain on the picture). */
const GlassGrade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 60%, rgba(10,10,30,0.18) 100%)' }} />
  </AbsoluteFill>
);

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
/** VHS: scanlines, tape noise, a tracking band rolling up, the head-switching tear, vignette, and the camcorder HUD. */
const VhsGrade: React.FC<{ W: number; H: number; frame: number; fps: number }> = ({ W, H, frame, fps }) => {
  const t = frame / fps, band = ((t * 0.09 + 0.3) % 1.25) * H - H * 0.1, fs = W * 0.06;
  const mode = LOOK.hud.mode ?? 'rec', sec = t + Number(LOOK.hud.counter ?? 0);
  const blink = Math.floor(t * 1.6) % 2 === 0;
  const hudY0 = H * 0.135, hudY1 = H * 0.775;     // inside the platform-safe band
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)` }} />
      <Noise W={W} H={H} seed={frame % 61} freq={0.9} o={0.2} blend="overlay" id="vnz" />
      <div style={abs(0, band, { width: W, height: H * 0.05, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.13) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0))',
        mixBlendMode: 'screen', filter: 'blur(3px)' })} />
      <div style={abs(0, H * 0.965, { width: W, height: H * 0.035, background: 'linear-gradient(180deg, rgba(20,20,20,0.6), rgba(0,0,0,0.9))' })}>
        <Noise W={W} H={H * 0.035} seed={(frame * 7) % 53} freq={0.4} o={0.7} blend="screen" id="vhs-head" />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 47%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)' }} />
      {LOOK.hud.off ? null : (
        <div style={{ fontFamily: LF.osd, fontSize: fs, color: VHS.osd, textShadow: `${fs * 0.06}px ${fs * 0.06}px 0 rgba(0,0,0,0.85)` }}>
          <div style={abs(W * 0.08, hudY0, { display: 'flex', alignItems: 'center', gap: fs * 0.25 })}>
            {mode === 'rec'
              ? <><span style={{ color: VHS.rec, opacity: blink ? 1 : 0 }}>●</span><span>REC</span></>
              : <span>PLAY ▶</span>}
          </div>
          <div style={abs(W * 0.68, hudY0, { display: 'flex', alignItems: 'center', gap: fs * 0.2 })}>
            <span>SP</span>
            <svg width={fs * 1.3} height={fs * 0.65} viewBox="0 0 26 13"><rect x="1" y="1" width="21" height="11" fill="none" stroke={VHS.osd} strokeWidth="2" /><rect x="22" y="4" width="3" height="5" fill={VHS.osd} />
              {[0, 1, 2].map((i) => <rect key={i} x={3.5 + i * 6} y="3.5" width="4.5" height="6" fill={VHS.osd} opacity={i < 2 || blink ? 1 : 0} />)}</svg>
          </div>
          <div style={abs(W * 0.08, hudY1, { lineHeight: 1 })}>
            <div>{LOOK.hud.time ?? 'PM 4:20'}</div>
            <div>{LOOK.hud.date ?? 'OCT.29 2026'}</div>
          </div>
          <div style={abs(W * 0.6, hudY1 + fs, {})}>{`${pad2(sec / 3600)}:${pad2((sec / 60) % 60)}:${pad2(sec % 60)}`}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Grade: React.FC<{ look: Look; W: number; H: number; frame: number; fps: number }> = ({ look, W, H, frame, fps }) => {
  if (look === 'newsroom') return <NewsGrade W={W} H={H} frame={frame} t={frame / fps} />;
  if (look === 'glass') return <GlassGrade />;
  if (look === 'vhs') return <VhsGrade W={W} H={H} frame={frame} fps={fps} />;
  return null;
};

/** The VHS bleed on the whole picture (under the HUD): the red and blue channels pulled apart, the image softened and
 *  its colour pushed, a sideways jitter on some frames. Returned as an SVG filter + the CSS for the content wrapper. */
export function vhsWrap(frame: number, W: number): { defs: React.ReactNode; style: React.CSSProperties } {
  const jit = hash(frame * 3.7) < 0.12 ? (hash(frame) - 0.5) * W * 0.012 : 0;
  const sh = W * 0.004;
  return {
    defs: (
      <filter id="vhs-bleed" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={sh} dy="0" result="r2" />
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-sh} dy="0" result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
        <feGaussianBlur in="rgb" stdDeviation={`${W * 0.0012} 0.4`} />
      </filter>
    ),
    // overscanned a little, so the channels pulled sideways never leave a coloured line at the frame's edge
    style: { filter: 'url(#vhs-bleed) saturate(1.35) contrast(1.08) brightness(1.03) sepia(0.12)', transform: `translateX(${jit}px) scale(1.012)` },
  };
}
export const clamp01 = clamp;
