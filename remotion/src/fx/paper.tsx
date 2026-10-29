import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, e, FxCtx, FxDef, lerp, life, list, opt, px, str } from '../lib/core';
import { C, FONT } from '../lib/fonts';

// A sheet of paper (a week's checklist) that flies through the frame in front of the person, curled like a page caught
// in the air. The curl is real 3D: the sheet is cut into strips, each hinged to the one before it with a small turn, so
// the bend accumulates across the sheet. Motion blur comes from the layer's blur samples.

const STRIPS = 12;

const Sheet: React.FC<{ c: FxCtx; w: number; h: number }> = ({ c, w, h }) => {
  const title = str(c, 'title', '1 MINGGU');
  const items = list(c, 'items', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Hasil']);
  const checks = Number(opt(c, 'checks', items.length));
  const cols = 4, rows = Math.ceil(items.length / cols);
  const u = w / 1000;
  return (
    <div style={{ width: w, height: h, background: 'linear-gradient(160deg, #FFFFFF 0%, #F3F1EE 60%, #E6E3DF 100%)',
      borderRadius: 18 * u, position: 'relative', fontFamily: FONT.round, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 60 * u, top: 50 * u, padding: `${12 * u}px ${34 * u}px`, background: C.red, color: '#fff',
        fontWeight: 800, fontSize: 64 * u, borderRadius: 14 * u, transform: 'rotate(-2deg)', boxShadow: `0 ${8 * u}px ${18 * u}px rgba(160,0,0,0.3)` }}>{title}</div>
      <div style={{ position: 'absolute', left: 50 * u, right: 50 * u, top: 190 * u, bottom: 50 * u, display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 26 * u }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * u }}>
            <div style={{ width: '100%', textAlign: 'center', background: C.redDeep, color: '#fff', fontWeight: 700, fontSize: 30 * u,
              padding: `${8 * u}px 0`, borderRadius: 8 * u, letterSpacing: 1 * u }}>{it.toUpperCase()}</div>
            <div style={{ width: 92 * u, height: 92 * u, borderRadius: '50%', border: `${6 * u}px solid ${C.red}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              {i < checks ? (
                <svg width={56 * u} height={56 * u} viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" stroke={C.red} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Paper: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, total } = life(c, 14, 10);
  const w = px(c, opt(c, 'width', 820)), h = w * 0.62;
  const sw = w / STRIPS;
  const fromLeft = str(c, 'from', 'left') !== 'right';
  const dir = fromLeft ? 1 : -1;
  // flight: in from a low corner, settle across the chest, leave up and out the other side
  const a = e('expo.out', f, 0, 14), x = e('power2.in', f, total - 10, 10);
  const hold = clamp(f / total);
  const cx = c.W / 2 + dir * (lerp(-c.W * 0.85, 0, a) + x * c.W * 0.9) + Math.sin(hold * 3) * px(c, 10);
  const cy = c.H * opt(c, 'y', 0.6) + lerp(c.H * 0.35, 0, a) - x * c.H * 0.25;
  const rz = dir * (lerp(-38, -8, a) + x * 22) + Math.sin(hold * 4) * 1.5;
  const rx = lerp(42, 14, a) - x * 20;
  const bend = lerp(70, opt(c, 'bend', 26), a) + x * 40 + Math.sin(hold * 5) * 3;   // total curl, degrees
  const step = bend / STRIPS;
  // nested strips: each one hangs off the right edge of the previous and turns a little more
  const strip = (i: number): React.ReactNode => i >= STRIPS ? null : (
    <div style={{ position: 'absolute', left: i === 0 ? 0 : sw, top: 0, width: sw, height: h, transformStyle: 'preserve-3d',
      transformOrigin: '0 50%', transform: i === 0 ? undefined : `rotateY(${-step}deg)` }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backfaceVisibility: 'visible' }}>
        <div style={{ position: 'absolute', left: -i * sw, top: 0, filter: `brightness(${1 - 0.012 * i * Math.sign(step) * (bend / 30)})` }}>
          <Sheet c={c} w={w} h={h} />
        </div>
      </div>
      {strip(i + 1)}
    </div>
  );
  return (
    <AbsoluteFill style={{ perspective: px(c, 1600), perspectiveOrigin: `${c.W / 2}px ${c.H * 0.45}px` }}>
      <div style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, transformStyle: 'preserve-3d',
        transform: `rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${bend * 0.45}deg)`,
        filter: `drop-shadow(0 ${px(c, 30)}px ${px(c, 30)}px rgba(60,20,20,0.3))` }}>
        {strip(0)}
      </div>
    </AbsoluteFill>
  );
};

export const PAPER_FX: Record<string, FxDef> = {
  'paper-card': {
    desc: 'A curled sheet (a week of checkboxes) flies in from a low corner across the chest, floats, and leaves up the other side',
    options: 'title, items (|), checks (how many ticked), from (left|right), y (0-1), width, bend (deg)',
    Front: Paper, blur: 5,
  },
};
