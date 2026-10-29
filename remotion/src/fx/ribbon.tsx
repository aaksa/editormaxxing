import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, fr, FxCtx, FxDef, life, opt, over, px, str } from '../lib/core';
import { C, FONT } from '../lib/fonts';
import { charW } from '../lib/type';

// A ring of words wrapped around the person at chest height, turning. Each glyph sits on a tilted circle: the front half
// is drawn over the person, the back half behind them (dimmer, softer, mirrored the way a real ring is seen from inside).
// Pure math per glyph, so it is seek-safe and needs no WebGL.

type Glyph = { ch: string; x: number; y: number; z: number; sx: number; size: number };

function glyphs(c: FxCtx): Glyph[] {
  const { f, a, x } = life(c, 12, 10);
  const word = str(c, 'text', '2 HARI');
  const sepr = str(c, 'sep', '  ');
  const R0 = px(c, opt(c, 'radius', 470));
  const R = R0 * over(a, 1.7) * (1 + x * 0.6);
  const size = px(c, opt(c, 'size', 150));
  const pitch = opt(c, 'pitch', 0.22);                          // how much we look down on the ring
  const cx = c.face.x, cy = c.H * opt(c, 'y', 0) || c.face.y + c.face.w * opt(c, 'below', 1.9);
  // spin: fast on arrival, settling into a steady turn
  const speed = (opt(c, 'speed', 55) * Math.PI) / 180;
  const spin = speed * (f / c.fps) + (1 - a) * 1.6 - x * 1.2;
  // repeat the word around the full circumference
  const unit = [...(word + sepr)];
  const unitLen = unit.reduce((s, ch) => s + charW(ch) * size * 1.05, 0);
  const reps = Math.max(1, Math.round((2 * Math.PI * R0) / unitLen));
  const chars = Array.from({ length: reps }, () => unit).flat();
  const total = chars.reduce((s, ch) => s + charW(ch) * size * 1.05, 0);
  const out: Glyph[] = [];
  let acc = 0;
  for (const ch of chars) {
    const w = charW(ch) * size * 1.05;
    const th = ((acc + w / 2) / total) * Math.PI * 2 + spin;
    acc += w;
    if (ch === ' ') continue;
    const z = Math.cos(th);
    out.push({ ch, x: cx + R * Math.sin(th), y: cy + R * pitch * z, z, sx: z, size: size * (1 + 0.18 * z) });
  }
  return out;
}

const Ring: React.FC<{ c: FxCtx; front: boolean }> = ({ c, front }) => {
  const { x } = life(c, 12, 10);
  const tilt = opt(c, 'tilt', -10);
  const f = fr(c);
  const g = glyphs(c).filter((q) => (front ? q.z >= 0 : q.z < 0));
  const ox = c.face.x, oy = c.face.y + c.face.w * opt(c, 'below', 1.9);
  return (
    <AbsoluteFill style={{
      transform: `rotate(${tilt}deg)`, transformOrigin: `${ox}px ${oy}px`, opacity: clamp(f / 3) * (1 - x),
      filter: front ? undefined : 'blur(1.5px)',
    }}>
      {g.map((q, i) => (
        <div key={i} style={{
          position: 'absolute', left: q.x, top: q.y, transform: `translate(-50%, -50%) scaleX(${Math.abs(q.sx) < 0.06 ? 0.06 * Math.sign(q.sx || 1) : q.sx})`,
          fontFamily: FONT.round, fontWeight: 800, fontSize: q.size, lineHeight: 1, whiteSpace: 'pre',
          color: front ? C.red : C.redDeep,
          backgroundImage: front ? `linear-gradient(180deg, ${C.redHi} 0%, ${C.red} 45%, ${C.redDeep} 100%)` : undefined,
          WebkitBackgroundClip: front ? 'text' : undefined, backgroundClip: front ? 'text' : undefined,
          WebkitTextFillColor: front ? 'transparent' : undefined,
          filter: front ? `drop-shadow(0 ${px(c, 6)}px ${px(c, 6)}px rgba(90,0,0,${0.25 + 0.2 * q.z}))` : undefined,
          opacity: front ? 1 : 0.55 + 0.35 * (1 + q.z),
        }}>{q.ch}</div>
      ))}
    </AbsoluteFill>
  );
};

export const RIBBON_FX: Record<string, FxDef> = {
  ribbon: {
    desc: 'A ring of words wraps around the person at chest height and turns: the front half over them, the back half behind',
    options: 'text, sep, radius (px at 1080), size, pitch, tilt, speed (deg/s), below (x face width under the face), y (0-1)',
    Behind: ({ c }) => <Ring c={c} front={false} />,
    Front: ({ c }) => <Ring c={c} front />,
  },
};
