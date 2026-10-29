import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, fAt, FxCtx, FxDef, hash, lerp, life, list, LOOK, opt, px, str } from '../lib/core';
import { abs } from './common';
import { LF, VHS } from './fonts';

// VHS - home video from a camcorder: the frame bleeds (red and blue split apart), scanlines, tape noise, a tracking band
// rolling up, the head-switching tear at the bottom, a REC / PLAY display with the date and the tape counter (the grade
// in looks/index.tsx). The effects speak in the camera's own on-screen display (VT323, white with a hard shadow): OSD
// titles, a VCR menu whose cursor walks the items, closed-caption lines, a cassette with a marker label, RGB-split glitch
// words, fast-forward. Cuts: `rewind` (the tape rewinds into the next scene) and `static` (a burst of snow).

const osdShadow = (s: number) => `${s * 0.06}px ${s * 0.06}px 0 rgba(0,0,0,0.85), 0 0 ${s * 0.12}px rgba(0,0,0,0.4)`;

// ---------------- sets ----------------
/** The VCR's blue screen with its own PLAY mark, the way a tape starts. */
export const Bluescreen: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, #2a4cf0 0%, ${VHS.blue} 60%, #0b1f8a 100%)` }}>
    {LOOK.hud.channel ? <div style={abs(W * 0.08, H * 0.22, { fontFamily: LF.osd, fontSize: W * 0.09, color: VHS.osd, textShadow: osdShadow(W * 0.09), opacity: Math.floor(t * 1.5) % 2 ? 1 : 0.85 })}>
      {LOOK.hud.channel}
    </div> : null}
  </AbsoluteFill>
);
/** Snow: tape noise with a dim roll. */
export const Snow: React.FC<{ W: number; H: number; frame: number }> = ({ W, H, frame }) => (
  <AbsoluteFill style={{ background: '#777' }}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <filter id="snowf"><feTurbulence type="fractalNoise" baseFrequency="0.75 0.35" numOctaves="1" seed={frame % 97} />
        <feColorMatrix values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" /><feComponentTransfer><feFuncR type="discrete" tableValues="0.1 0.5 0.9" />
        <feFuncG type="discrete" tableValues="0.1 0.5 0.9" /><feFuncB type="discrete" tableValues="0.1 0.5 0.9" /></feComponentTransfer></filter>
      <rect width={W} height={H} filter="url(#snowf)" />
    </svg>
  </AbsoluteFill>
);

// ---------------- effects ----------------
/** On-screen display text: blocky white lines with a hard shadow, appearing a line at a time, optionally blinking. */
const Osd: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 1, 1);
  const lines = list(c, 'text', ['PLAY ▶']), fs = px(c, opt(c, 'size', 110)), blink = opt(c, 'blink', 0);
  const col = str(c, 'color', VHS.osd), align = str(c, 'align', 'left');
  if (blink && Math.floor(f / 8) % 2) return null;
  return (
    <div style={abs(align === 'center' ? 0 : c.W * opt(c, 'x', 0.09), c.H * opt(c, 'y', 0.2), { width: align === 'center' ? c.W : undefined, textAlign: align as 'left',
      fontFamily: LF.osd, fontSize: fs, lineHeight: 0.95, color: col, textShadow: osdShadow(fs), opacity: x > 0.5 ? 0 : 1 })}>
      {lines.map((l, i) => (f >= i * 4 ? <div key={i}>{l.slice(0, Math.ceil(clamp((f - i * 4) / Math.max(1, l.length * 0.6)) * l.length))}</div> : null))}
    </div>
  );
};

/** A big word torn by the tape: RGB channels split, slices of it jump sideways on some frames. */
const Glitch: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 6, 4);
  const text = str(c, 'text', 'BIG NEWS'), fs = px(c, opt(c, 'size', 220)), y = c.H * opt(c, 'y', 0.22);
  const burst = (n: number) => (hash(Math.floor(f) * 7.3 + n) < (f < 8 ? 0.7 : 0.18) ? (hash(Math.floor(f) + n * 3) - 0.5) : 0);
  const split = px(c, 10) + px(c, 30) * Math.abs(burst(1)) * 2;
  const slices = 6;
  const layer = (color: string, dx: number, blend: 'screen' | 'normal') => (
    <div style={{ position: 'absolute', inset: 0, color, mixBlendMode: blend, transform: `translateX(${dx}px)` }}>
      {Array.from({ length: slices }, (_, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${(i * 100) / slices}% 0 ${100 - ((i + 1) * 100) / slices}% 0)`, transform: `translateX(${burst(i + 10) * px(c, 120)}px)` }}>{text}</div>
      ))}
    </div>
  );
  return (
    <div style={abs(0, y, { width: c.W, height: fs * 1.1, textAlign: 'center', fontFamily: LF.osd, fontSize: fs, lineHeight: 1.05, transform: `scale(${lerp(1.3, 1, a)})`,
      opacity: (1 - x) * (f < 1 ? 0 : 1), textShadow: osdShadow(fs) })}>
      {layer('#ff2b4a', -split, 'screen')}
      {layer('#2bd9ff', split, 'screen')}
      {layer('#ffffff', 0, 'normal')}
    </div>
  );
};

/** A VCR menu: a title bar and numbered items; the cursor (a block) walks down them, each on its time. */
const Menu: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 2, 2);
  const items = list(c, 'items', ['WORKING', 'FOR MONTHS', 'ALMOST DONE']), times = list(c, 'times', []).map(Number);
  const fs = px(c, opt(c, 'size', 78)), x0 = c.W * opt(c, 'x', 0.1), y0 = c.H * opt(c, 'y', 0.18);
  let cur = 0;
  items.forEach((_, i) => { if (f >= (times[i] !== undefined ? fAt(c, times[i]) : 6 + i * 10)) cur = i; });
  return (
    <div style={abs(x0, y0, { fontFamily: LF.osd, fontSize: fs, color: VHS.osd, textShadow: osdShadow(fs), lineHeight: 1.15, opacity: x > 0.5 ? 0 : 1 })}>
      <div style={{ background: 'rgba(16,40,200,0.85)', padding: `0 ${fs * 0.3}px`, marginBottom: fs * 0.25, textShadow: 'none', display: 'inline-block' }}>{str(c, 'title', '— MENU —')}</div>
      {items.map((it, i) => (f >= 2 + i * 2 ? (
        <div key={i} style={{ display: 'flex', gap: fs * 0.3, alignItems: 'center' }}>
          <span style={{ width: fs * 0.6, color: i === cur ? VHS.green : 'transparent', textShadow: i === cur ? osdShadow(fs) : 'none' }}>▶</span>
          <span style={{ background: i === cur ? 'rgba(255,255,255,0.92)' : 'transparent', color: i === cur ? '#111' : VHS.osd, textShadow: i === cur ? 'none' : osdShadow(fs), padding: `0 ${fs * 0.15}px` }}>
            {i + 1}. {it}
          </span>
          {i < cur ? <span style={{ color: VHS.green }}>OK</span> : null}
        </div>
      ) : null))}
    </div>
  );
};

/** Closed captions, the 90s TV way: white blocky letters on black boxes, typed out with the voice. */
const Caption: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 1, 1);
  const lines = list(c, 'text', ['I’M REALLY EXCITED']), fs = px(c, opt(c, 'size', 70));
  const per = opt(c, 'speed', 0.9), total = lines.join(' ').length;
  let left = Math.floor(f / per);
  return (
    <div style={abs(0, c.H * opt(c, 'y', 0.68), { width: c.W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: fs * 0.08, opacity: x > 0.5 ? 0 : 1,
      fontFamily: LF.osd, fontSize: fs, color: '#fff', lineHeight: 1 })}>
      {lines.map((l, i) => {
        const n = clamp(left, 0, l.length); left -= l.length + 1;
        return n > 0 ? <div key={i} style={{ background: '#000', padding: `${fs * 0.08}px ${fs * 0.25}px` }}>{l.slice(0, n)}</div> : null;
      })}
      {total ? null : null}
    </div>
  );
};

/** A cassette slides in tilted: black shell, two reels turning, a white label with the title in marker pen. */
const Tape: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { a, x } = life(c, 10, 8);
  const w = px(c, opt(c, 'width', 640)), h = w * 0.62, cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.66);
  const spin = c.t * 220;
  const reel = (rx: number) => (
    <div style={abs(rx - h * 0.13, h * 0.5, { width: h * 0.26, height: h * 0.26, borderRadius: '50%', background: '#2b2b2b', border: `${h * 0.02}px solid #555`, transform: `rotate(${spin}deg)` })}>
      {[0, 60, 120].map((r) => <div key={r} style={abs(h * 0.11, 0, { width: h * 0.02, height: h * 0.24, background: '#777', transform: `rotate(${r}deg)` })} />)}
    </div>
  );
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { width: w, height: h, transform: `translateX(${(1 - a) * c.W}px) rotate(${lerp(18, opt(c, 'tilt', -6), a)}deg)`,
      opacity: 1 - x, filter: `drop-shadow(0 ${px(c, 20)}px ${px(c, 24)}px rgba(0,0,0,0.5))` })}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: h * 0.05, background: 'linear-gradient(180deg, #1d1d1d, #0d0d0d)', border: '2px solid #333' }} />
      <div style={abs(w * 0.07, h * 0.08, { width: w * 0.86, height: h * 0.34, background: '#F4F1E8', borderRadius: h * 0.02, overflow: 'hidden' })}>
        <div style={{ height: h * 0.07, background: 'linear-gradient(90deg, #ff5a3c, #ffb43a, #3cc3ff)' }} />
        <div style={{ fontFamily: LF.marker, fontSize: h * 0.15, color: '#1b1b1b', padding: `0 ${w * 0.04}px`, transform: 'rotate(-2deg)', whiteSpace: 'nowrap' }}>{str(c, 'title', 'SESSION ’26')}</div>
      </div>
      <div style={abs(w * 0.22, h * 0.48, { width: w * 0.56, height: h * 0.3, borderRadius: h * 0.04, background: '#0a0a0a', border: '2px solid #3a3a3a' })} />
      {reel(w * 0.33)}{reel(w * 0.67)}
      <div style={abs(w * 0.05, h * 0.86, { fontFamily: LF.osd, fontSize: h * 0.08, color: '#aaa' })}>{str(c, 'sub', 'T-120 · SP')}</div>
    </div>
  );
};

/** Fast-forward: the FF mark, tracking tears racing across the frame, the counter spinning (Screen). */
const Ff: React.FC<{ c: FxCtx }> = ({ c }) => {
  const f = c.t * c.fps, fs = px(c, 100);
  return (
    <AbsoluteFill>
      {Array.from({ length: 5 }, (_, i) => {
        const yy = ((hash(i + 1) + f * 0.035 * (1 + i * 0.3)) % 1) * c.H;
        return <div key={i} style={abs(0, yy, { width: c.W, height: px(c, 6 + 30 * hash(i + 4)), background: 'rgba(255,255,255,0.25)', mixBlendMode: 'screen', filter: `blur(${px(c, 3)}px)` })} />;
      })}
      <div style={abs(c.W * 0.62, c.H * 0.155, { fontFamily: LF.osd, fontSize: fs, color: VHS.osd, textShadow: osdShadow(fs) })}>{str(c, 'label', 'FF ▶▶')}</div>
    </AbsoluteFill>
  );
};

export const VHS_FX: Record<string, FxDef> = {
  osd: {
    desc: 'VHS - on-screen display text (PLAY ▶, CH 03, any line): blocky white VT323 with a hard shadow, typed a line at a time, optional blink',
    options: 'text (lines |), x, y (0-1), size, color, align (left|center), blink (0|1)',
    Screen: Osd,
  },
  'glitch-word': {
    desc: 'VHS - a big word torn by the tape: red and cyan channels split apart, slices jumping sideways in bursts',
    options: 'text, y, size',
    Front: Glitch,
  },
  menu: {
    desc: 'VHS - a VCR menu: title bar and numbered items, a cursor block walking down them (each on its time), done items marked OK',
    options: 'title, items (|), times (|, anchors), x, y, size',
    Screen: Menu,
  },
  'cc-caption': {
    desc: 'VHS - closed captions the 90s way: white blocky letters on black boxes, typed out with the voice',
    options: 'text (lines |), y, size, speed (frames per letter)',
    Screen: Caption,
  },
  tape: {
    desc: 'VHS - a cassette slides in tilted: black shell, reels turning, a white label with the title in marker pen',
    options: 'title, sub, x, y, width, tilt',
    Front: Tape,
  },
  ff: {
    desc: 'VHS - fast-forward: the FF mark and tracking tears racing across the frame',
    options: 'label (FF ▶▶ | REW ◀◀)',
    Screen: Ff,
  },
};
