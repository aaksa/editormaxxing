import React from 'react';
import { hash } from '../lib/core';

export const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: x, top: y, ...extra });

/** Paper: a base colour with fibres, soft stains and darker edges, all from SVG noise (no image files, so no licences). */
export const PaperFill: React.FC<{ w: number; h: number; id: string; color: string; seed?: number; stain?: number; edge?: number; style?: React.CSSProperties }> =
  ({ w, h, id, color, seed = 1, stain = 0.22, edge = 0.35, style }) => (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, ...style }}>
      <defs>
        <filter id={`fib${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85 0.55" numOctaves="3" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.9 -0.32" />
        </filter>
        <filter id={`stn${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed={seed + 7} />
          <feColorMatrix values={`0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.25  0 0 0 ${stain * 2.2} ${-stain * 0.9}`} />
        </filter>
        <radialGradient id={`edg${id}`} cx="50%" cy="50%" r="72%">
          <stop offset="0.6" stopColor="#5a4325" stopOpacity="0" /><stop offset="1" stopColor="#5a4325" stopOpacity={edge} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={color} />
      <rect width={w} height={h} filter={`url(#stn${id})`} />
      <rect width={w} height={h} filter={`url(#fib${id})`} opacity={0.5} />
      <rect width={w} height={h} fill={`url(#edg${id})`} />
    </svg>
  );

/** A torn edge as an SVG path around a w x h sheet (jitter on the chosen sides). */
export const tornRect = (w: number, h: number, seed: number, sides = 'tblr', amp = 0.018) => {
  const a = Math.min(w, h) * amp * 4, n = (len: number) => Math.max(8, Math.round(len / 14));
  const j = (i: number, s: string) => (sides.includes(s) ? (hash(seed + i * 3.1) - 0.5) * a : 0);
  const pts: string[] = [];
  const nx = n(w), ny = n(h);
  for (let i = 0; i <= nx; i++) pts.push(`${(i * w) / nx},${j(i, 't')}`);
  for (let i = 1; i <= ny; i++) pts.push(`${w + j(i + 50, 'r')},${(i * h) / ny}`);
  for (let i = nx - 1; i >= 0; i--) pts.push(`${(i * w) / nx},${h + j(i + 100, 'b')}`);
  for (let i = ny - 1; i >= 1; i--) pts.push(`${j(i + 150, 'l')},${(i * h) / ny}`);
  return `M ${pts.join(' L ')} Z`;
};

/** "Greeked" body text: grey bars of varied length in columns, the way a newspaper reads from across the room. */
export const Greek: React.FC<{ w: number; h: number; cols: number; line: number; seed: number; color: string; gap?: number }> = ({ w, h, cols, line, seed, color, gap = 0.06 }) => {
  const cw = (w - gap * w * (cols - 1)) / cols, rows = Math.floor(h / (line * 1.9));
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => {
        const para = hash(seed + c * 31 + r) < 0.12, len = para ? 0.35 + 0.4 * hash(seed + r) : 0.86 + 0.14 * hash(seed + c + r * 7);
        return <rect key={`${c}:${r}`} x={c * (cw + gap * w) + (para ? 0 : 0)} y={r * line * 1.9} width={cw * len} height={line} rx={line * 0.2} fill={color} />;
      }))}
    </svg>
  );
};

/** A stepped clock: the frame rounded down to `fps` frames per second (graphics on twos, like hand-made motion). */
export const stepFrame = (frame: number, videoFps: number, fps: number) => Math.floor(frame / (videoFps / fps)) * (videoFps / fps);

/** Simple line glyphs (24 x 24, stroked) shared by the glass and split looks. */
export const GLYPH: Record<string, string> = {
  spark: 'M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2 Z',
  bolt: 'M13 2 L4 14 H11 L10 22 L20 9 H13 Z',
  chart: 'M4 20 V10 M10 20 V4 M16 20 V13 M22 20 H2',
  check: 'M4 12.5 L9.5 18 L20 6',
  lock: 'M6 11 H18 V21 H6 Z M8.5 11 V7.5 A3.5 3.5 0 0 1 15.5 7.5 V11',
  clock: 'M12 3 A9 9 0 1 1 11.99 3 M12 7 V12 L15.5 14.5',
  heart: 'M12 20 C4 14 3 10 5 7 C7 4 10.5 4.5 12 7.5 C13.5 4.5 17 4 19 7 C21 10 20 14 12 20 Z',
  star: 'M12 3 L14.6 9 L21 9.6 L16 13.8 L17.6 20 L12 16.6 L6.4 20 L8 13.8 L3 9.6 L9.4 9 Z',
  bell: 'M6 17 V11 A6 6 0 0 1 18 11 V17 L19.5 18.5 H4.5 Z M10 20.5 A2 2 0 0 0 14 20.5',
  rocket: 'M12 2 C16 5 17 10 15 15 H9 C7 10 8 5 12 2 Z M9 15 L6.5 19 M15 15 L17.5 19 M12 15 V21 M12 8.5 A1.5 1.5 0 1 1 11.99 8.5',
  play: 'M7 4 L20 12 L7 20 Z',
  user: 'M12 12 A4 4 0 1 1 12.01 12 M4 21 C5 16 19 16 20 21',
};
export const Glyph: React.FC<{ name: string; size: number; color: string; width?: number; fill?: boolean }> = ({ name, size, color, width = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible' }}>
    <path d={GLYPH[name] ?? GLYPH.spark} fill={fill ? color : 'none'} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
