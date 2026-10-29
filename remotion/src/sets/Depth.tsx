import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Cam, onScreen } from '../lib/camera';
import { clamp, hash, Scene, SetName } from '../lib/core';

// Depth elements: soft things at many depths that make the camera's move readable as space. Far ones are small, slow
// and gently soft; near ones are large, out of focus and pass the edges of the frame in front of the person. Each one
// drifts on its own heading and speed (never in lockstep), turns slowly, and is nudged outward by the film's
// micro-interaction ripple when an element lands. Positions are seeded per scene, so every scene composes differently.

type Kind = 'orb' | 'shard' | 'ring' | 'ember';
const KINDS: Record<string, Kind[]> = {
  mix: ['orb', 'shard', 'ring', 'orb'], orbs: ['orb', 'orb', 'ring'], shards: ['shard', 'shard', 'orb'], embers: ['ember', 'ember', 'orb'],
};
export const defaultDepth = (set: SetName): NonNullable<Scene['depth']> =>
  set === 'dark' || set === 'ember' ? 'embers' : set === 'stripes' || set === 'halftone' ? 'shards' : set === 'blush' || set === 'blue' ? 'orbs' : 'mix';

const look = (kind: Kind, dark: boolean, i: number, near: boolean): React.CSSProperties => {
  if (kind === 'shard') return {
    borderRadius: '42% 42% 42% 42% / 50% 50% 50% 50%',
    background: `linear-gradient(135deg, #FF5A56 0%, #E3060F 45%, #8E0008 100%)`,
    boxShadow: `inset 0 2px 0 rgba(255,255,255,0.55), 0 12px 30px rgba(120,0,0,${near ? 0.15 : 0.22})`,
  };
  if (kind === 'ring') return { borderRadius: '50%', border: `2px solid ${dark ? 'rgba(255,120,110,0.35)' : 'rgba(200,20,25,0.28)'}` };
  if (kind === 'ember') return { borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,120,90,0.95) 0%, rgba(255,40,30,0.5) 40%, rgba(255,40,30,0) 70%)' };
  const warm = i % 3 === 0;
  return {
    borderRadius: '50%',
    background: dark
      ? 'radial-gradient(circle, rgba(255,70,60,0.55) 0%, rgba(255,40,30,0) 70%)'
      : warm && i % 2 === 0 ? 'radial-gradient(circle at 35% 35%, rgba(255,90,85,0.75) 0%, rgba(242,15,20,0.45) 45%, rgba(242,15,20,0) 72%)'
        : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 72%)',
  };
};

export const DepthField: React.FC<{
  layer: 'far' | 'near'; kind: NonNullable<Scene['depth']>; set: SetName; seed: number; t: number; t0: number;
  cam: Cam; react: number; W: number; H: number;
}> = ({ layer, kind, set, seed, t, t0, cam, react, W, H }) => {
  if (kind === 'none') return null;
  const kinds = KINDS[kind] ?? KINDS.mix;
  const near = layer === 'near';
  const n = near ? 3 : 10;
  const dark = set === 'dark' || set === 'ember' || set === 'blue';
  const ts = t - t0;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const h = (k: number) => hash(seed * 97 + i * 13 + k + (near ? 500 : 0));
        const kd = kinds[i % kinds.length];
        // near elements live at the edges and corners, so they pass in front without crossing the face
        const side = h(1) < 0.5 ? -1 : 1;
        const bx = near ? W * (0.5 + side * (0.42 + 0.14 * h(2))) : W * (0.04 + 0.92 * h(2));
        const by = near ? H * (0.18 + 0.8 * h(3)) : H * (0.05 + 0.9 * h(3));
        const d = near ? 1.45 + 0.5 * h(4) : 0.35 + 0.35 * h(4);
        const size = (near ? 0.2 + 0.22 * h(5) : 0.012 + 0.05 * h(5)) * W * (kd === 'shard' ? 1.3 : 1) * (kd === 'ember' ? 0.5 : 1);
        const heading = h(6) * Math.PI * 2, speed = (near ? 14 : 5) + h(7) * (near ? 22 : 10);
        const wob = Math.sin(ts * (0.4 + h(8) * 0.6) + h(9) * 6) * (near ? 18 : 8);
        let x = bx + Math.cos(heading) * speed * ts + wob, y = by + Math.sin(heading) * speed * ts * 0.6 + Math.cos(ts * 0.5 + i) * 6;
        if (kd === 'ember') y -= ts * (10 + 20 * h(10));             // embers rise
        // the ripple pushes everything a little away from the centre
        x += (x - W / 2) * 0.012 * react; y += (y - H * 0.45) * 0.012 * react;
        const p = onScreen(cam, d, W, H, x, y);
        const blur = near ? 14 + 16 * h(11) : 0.4 + 2.2 * (1 - (d - 0.35) / 0.35);
        const fade = clamp(ts / 0.6);                                  // they settle in with the scene, never pop
        const rot = (h(12) - 0.5) * 80 + ts * (h(13) - 0.5) * 14;
        const w = size * p.s, hh = kd === 'shard' ? w * 0.34 : w;
        const op = (near ? 0.38 : 0.7) * fade * (kd === 'ring' ? 0.8 : 1) * (dark && kd === 'orb' ? 0.8 : 1);
        return (
          <div key={i} style={{
            position: 'absolute', left: p.x - w / 2, top: p.y - hh / 2, width: w, height: hh, opacity: op,
            transform: `rotate(${rot}deg)`, filter: `blur(${blur.toFixed(1)}px)`, ...look(kd, dark, i, near),
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
