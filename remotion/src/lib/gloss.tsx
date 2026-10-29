import React from 'react';
import { C } from './fonts';

// Glossy red type, the look's signature: a lit red face (light at the top, deep in the middle, a lift at the bottom),
// an extrusion of darker red copies behind it, a white gloss band that can sweep across, a halftone dot screen, and
// round joins on a stroke of the same colour so a hard condensed face gets the reference's soft, moulded corners.
// SVG <text> with textLength fits the word to an exact width, so nothing needs measuring.

export type GlossProps = {
  id: string;
  text: string;
  font: string;
  weight?: number | string;
  italic?: boolean;
  width: number;            // the word's exact width (px)
  size: number;             // font size (px) before the vertical stretch
  stretch?: number;         // vertical stretch (the tall condensed words use ~1.5)
  extrude?: number;         // extrusion depth (px), down and to the right
  round?: number;           // the rounding stroke (px)
  sweep?: number;           // gloss band position 0..1 (across the word), <0 for none
  halftone?: number;        // dot screen strength 0..1
  palette?: 'red' | 'white';
  reflect?: number;         // a floor reflection under the word, 0..1 strength
  shadow?: number;          // a soft cast shadow, 0..1
};

export const glossHeight = (p: Pick<GlossProps, 'size' | 'stretch' | 'extrude'>) => p.size * (p.stretch ?? 1) * 0.86 + (p.extrude ?? 0);

export const GlossText: React.FC<GlossProps & { style?: React.CSSProperties }> = (p) => {
  const st = p.stretch ?? 1, ex = p.extrude ?? 0, rd = p.round ?? p.size * 0.015;
  const capH = p.size * st * 0.86;          // cap height of the stretched word, about
  const padX = rd + ex + 8, padY = rd + 8;
  const W = p.width + padX * 2, Hh = capH + ex + padY * 2 + (p.reflect ? capH * 0.7 : 0);
  const base = padY + capH;                 // baseline in the svg
  const white = p.palette === 'white';
  const face = white ? ['#FFFFFF', '#F2F2F2', '#D9D9D9', '#FFFFFF'] : ['#FF2E2E', '#D80A12', '#8E0008', '#C8000E'];
  const side = white ? ['#BDBDBD', '#8A8A8A'] : [C.redDeep, C.redInk];
  const id = p.id.replace(/[^a-z0-9]/gi, '');
  const text = (fill: string, extra: React.SVGProps<SVGTextElement> = {}) => (
    <text x={padX} y={0} textLength={p.width} lengthAdjust="spacingAndGlyphs"
      fontFamily={p.font} fontWeight={p.weight ?? 400} fontStyle={p.italic ? 'italic' : 'normal'} fontSize={p.size}
      fill={fill} stroke={fill} strokeWidth={rd * 2} strokeLinejoin="round" paintOrder="stroke" {...extra}
      transform={`translate(0 ${base}) scale(1 ${st})`}>{p.text}</text>
  );
  const sw = p.sweep ?? -1;
  const steps = Math.max(0, Math.round(ex / 2));
  return (
    <svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`} style={{ overflow: 'visible', ...p.style }}>
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1={base - capH} x2="0" y2={base} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={face[0]} /><stop offset="0.38" stopColor={face[1]} />
          <stop offset="0.72" stopColor={face[2]} /><stop offset="1" stopColor={face[3]} />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1={base - capH} x2="0" y2={base + ex} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={side[0]} /><stop offset="1" stopColor={side[1]} />
        </linearGradient>
        <linearGradient id={`g${id}`} x1={padX + (sw - 0.25) * p.width} y1="0" x2={padX + (sw + 0.25) * p.width} y2={capH * 0.6}
          gradientUnits="userSpaceOnUse">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id={`h${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="4.5" cy="4.5" r="2.1" fill="#000" />
        </pattern>
        <linearGradient id={`hm${id}`} x1="0" y1={base - capH} x2="0" y2={base} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.55" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`m${id}`}><rect x="0" y="0" width={W} height={Hh} fill={`url(#hm${id})`} /></mask>
        <clipPath id={`c${id}`}>{text('#000')}</clipPath>
        <filter id={`b${id}`} x="-10%" y="-10%" width="120%" height="140%"><feGaussianBlur stdDeviation={p.size * 0.03} /></filter>
        <linearGradient id={`rf${id}`} x1="0" y1={base} x2="0" y2={base + capH * 0.6} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`rm${id}`}><rect x="0" y={base} width={W} height={Hh} fill={`url(#rf${id})`} /></mask>
      </defs>
      {p.shadow ? <g opacity={0.28 * p.shadow} filter={`url(#b${id})`} transform={`translate(${ex * 0.6 + 10} ${ex + 16})`}>{text('#3a0000')}</g> : null}
      {p.reflect ? (
        <g mask={`url(#rm${id})`} opacity={p.reflect}>
          <g transform={`translate(0 ${base * 2 + ex * 2 + 6}) scale(1 -1)`} filter={`url(#b${id})`}>
            {text(white ? '#cfcfcf' : C.red)}
          </g>
        </g>
      ) : null}
      {Array.from({ length: steps }, (_, i) => {
        const k = (steps - i) / Math.max(1, steps);
        return <g key={i} transform={`translate(${ex * 0.35 * k} ${ex * k})`}>{text(`url(#s${id})`, { strokeWidth: rd })}</g>;
      })}
      {text(`url(#f${id})`)}
      <g clipPath={`url(#c${id})`}>
        {p.halftone ? <rect x="0" y="0" width={W} height={Hh} fill={`url(#h${id})`} opacity={0.22 * p.halftone} mask={`url(#m${id})`} /> : null}
        {/* a soft top light, then the sweeping gloss band */}
        <rect x="0" y={base - capH - rd} width={W} height={capH * 0.22} fill="#fff" opacity={white ? 0 : 0.16} />
        {sw >= -0.5 ? <rect x="0" y="0" width={W} height={Hh} fill={`url(#g${id})`} /> : null}
      </g>
    </svg>
  );
};

/** Advance widths (em) of the tall condensed face, close enough to cut a word into per-letter strips. */
const tallW = (ch: string) => (/[.,:;'!|]/.test(ch) ? 0.24 : /[IJ1]/.test(ch) ? 0.34 : /[MW]/.test(ch) ? 0.68 : ch === ' ' ? 0.2 : 0.5);

/** A glossy word built one letter at a time: the word is drawn once per letter, each copy clipped to that letter's strip and
 *  moved on its own (rise, pop, blur), so the letters arrive separately while sharing one lit surface. `k(i)` is letter i's
 *  arrival 0..1. Strip widths follow the face's advances (or equal shares for unknown faces). */
export const LetterStrips: React.FC<GlossProps & { k: (i: number) => number; rise: number; pop?: number }> = ({ k, rise, pop = 0, ...p }) => {
  const chars = [...p.text];
  const ws = chars.map(tallW), sum = ws.reduce((a, b) => a + b, 0) || 1;
  const rd = p.round ?? p.size * 0.015, ex = p.extrude ?? 0;
  const padX = rd + ex + 8, padY = rd + 8, capH = p.size * (p.stretch ?? 1) * 0.86;
  const Wsvg = p.width + padX * 2, Hsvg = capH + ex + padY * 2 + (p.reflect ? capH * 0.7 : 0);
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: Wsvg, height: Hsvg }}>
      {chars.map((ch, i) => {
        const x0 = i === 0 ? -padX * 3 : padX + (acc / sum) * p.width;
        acc += ws[i];
        const x1 = i === chars.length - 1 ? Wsvg + padX * 3 : padX + (acc / sum) * p.width;
        const ki = k(i);
        if (ki <= 0.001 || ch === ' ') return null;
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(-40% ${Wsvg - x1}px -40% ${x0}px)`,
            transform: `translateY(${(1 - ki) * rise}px) scale(${1 + pop * (1 - ki)})`, transformOrigin: `${(x0 + x1) / 2}px ${padY + capH}px`,
            opacity: Math.min(1, ki * 3), filter: ki < 0.98 ? `blur(${((1 - ki) * 8).toFixed(1)}px)` : undefined }}>
            <GlossText {...p} id={`${p.id}_${i}`} />
          </div>
        );
      })}
    </div>
  );
};
