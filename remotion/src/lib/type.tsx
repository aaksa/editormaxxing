import React from 'react';
import { clamp } from './core';

/** Rough advance widths (in em) for the heavy round sans: enough to space letters on an arc or pick a fitting size. */
export const charW = (ch: string) => (/[iIl.,'!:;|]/.test(ch) ? 0.3 : /[\s]/.test(ch) ? 0.28 : /[mwMW]/.test(ch) ? 0.92 : /[A-Z0-9$]/.test(ch) ? 0.7 : 0.6);
export const textEm = (s: string) => [...s].reduce((a, ch) => a + charW(ch), 0);
/** The font size that makes `s` about `width` wide in the round sans (textLength then makes it exact). */
export const fitSize = (s: string, width: number, max = 1e9) => Math.min(max, width / Math.max(0.5, textEm(s)));

/** One line of flat type fitted to an exact width, revealed by a soft left-to-right wipe (reveal 0..1). */
export const FitText: React.FC<{
  id: string; text: string; width: number; size: number; font: string; weight?: number | string; italic?: boolean;
  fill?: string; stroke?: string; strokeW?: number; reveal?: number; shadow?: string; letterSpacing?: number;
  style?: React.CSSProperties; anchor?: 'start' | 'middle';
}> = (p) => {
  const id = p.id.replace(/[^a-z0-9]/gi, '');
  const pad = (p.strokeW ?? 0) + p.size * 0.25;
  const W = p.width + pad * 2, H = p.size * 1.3 + pad;
  const r = clamp(p.reveal ?? 1, 0, 1);
  const soft = 0.18;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', ...p.style }}>
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset={clamp(r * (1 + soft) - soft)} stopColor="#fff" stopOpacity="1" />
          <stop offset={clamp(r * (1 + soft))} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x={-W} y={-H} width={W * 3} height={H * 3}>
          <rect x={pad - p.size * 0.1} y={-H} width={p.width + p.size * 0.2} height={H * 3} fill={`url(#w${id})`} />
        </mask>
      </defs>
      <text x={p.anchor === 'middle' ? W / 2 : pad} y={pad * 0.5 + p.size * 0.98} textAnchor={p.anchor ?? 'start'}
        textLength={p.width} lengthAdjust="spacingAndGlyphs" fontFamily={p.font} fontWeight={p.weight ?? 800}
        fontStyle={p.italic ? 'italic' : 'normal'} fontSize={p.size} fill={p.fill ?? '#E3060F'}
        stroke={p.stroke} strokeWidth={p.strokeW} strokeLinejoin="round" paintOrder="stroke"
        style={{ filter: p.shadow }} mask={r < 1 ? `url(#m${id})` : undefined}>{p.text}</text>
    </svg>
  );
};

/** A pen-script word written on with a wipe, white with a thin dark edge (the small voice riding on a big word). */
export const Script: React.FC<{ id: string; text: string; size: number; font: string; reveal: number; color?: string; edge?: string; style?: React.CSSProperties }> =
  ({ id, text, size, font, reveal, color = '#fff', edge = 'rgba(40,0,0,0.85)', style }) => {
    const w = textEm(text) * size * 0.62 + size * 0.6;
    return <FitText id={id} text={text} width={w} size={size} font={font} weight={400} fill={color} stroke={edge}
      strokeW={size * 0.06} reveal={reveal} style={style} />;
  };
