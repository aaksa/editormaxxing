import type React from 'react';
import { clamp, ease, Face, MOTION, Scene } from './core';

// The camera rig: one virtual camera per scene, applied to every layer scaled by that layer's depth. A layer at depth d
// moves d times as far and zooms d times as much as the person (depth 1), so the room drifts slowly behind them, the words
// behind them a little less than they do, and near elements faster in front: real 2.5D parallax from one move.
//
// The move has three parts, each with its own rhythm so nothing moves in lockstep:
//   1. the scene's move (push, pull, lateral, rise) eased over the whole scene,
//   2. breathing: three slow, incommensurate sines per axis (a hand-held camera that never stops),
//   3. reaction: the film's micro-interaction ripple nudges the zoom when an element lands.

export type Cam = { z: number; x: number; y: number; r: number; b?: number };   // b: viewport blur (px) while it moves fast
export const DEPTH = { set: 0.28, far: 0.5, behind: 0.82, person: 1, front: 1.16, near: 1.7, screen: 0.18 } as const;
const MOVES: NonNullable<Scene['move']>[] = ['push', 'right', 'pull', 'push', 'left', 'rise'];

export function camAt(sc: Scene, idx: number, t: number, W: number, H: number, react: number, punch = 1): Cam {
  const dur = Math.max(0.1, sc.end - sc.start);
  const u = clamp((t - sc.start) / dur);
  const refined = MOTION.mode === 'refined';
  const k = ease('sine.inOut')(u);
  const dir = sc.dir ?? (idx % 2 ? -1 : 1);
  const amt = sc.moveAmount ?? (refined ? 0.12 : 0.06);
  const lat = W * (refined ? 0.06 : 0.03);
  const move = sc.move ?? MOVES[idx % MOVES.length];
  let z = 1, x = 0, y = 0, r = 0;
  if (move === 'push') { z = 1 + amt * k; x = dir * lat * (k - 0.5); }
  else if (move === 'pull') { z = 1 + amt * (1 - k); x = dir * lat * (k - 0.5); }
  else if (move === 'left' || move === 'right') { const s = move === 'right' ? 1 : -1; x = s * lat * 1.5 * (k - 0.5) * 2; z = 1 + amt * 0.45; }
  else if (move === 'rise') { y = H * 0.03 * (0.5 - k) * 2; z = 1 + amt * 0.6 * k; }
  if (refined || move !== 'still') {
    x += Math.sin(t * 0.61 + idx * 1.7) * W * 0.006 + Math.sin(t * 1.37 + 2.1) * W * 0.0025;
    y += Math.sin(t * 0.83 + 1.3 + idx) * H * 0.0032 + Math.sin(t * 1.91 + 0.4) * H * 0.0012;
    r += Math.sin(t * 0.47 + idx * 0.7) * 0.25;
  }
  // the viewport's arrival (the reference opens most scenes this way): a pull-back from ~1.55x with a roll that
  // settles and a blur that clears, or a drop from above; then the held Dutch angle
  const enter = sc.enter ?? (idx === 0 ? 'none' : 'pullback');
  const te = t - sc.start, ke = ease(refined ? 'premium' : 'expo.out')(clamp(te / (refined ? 0.7 : 0.4)));
  let b = 0;
  if (enter === 'pullback') { z *= 1 + 0.55 * (1 - ke); r += -dir * 9 * (1 - ke); b = 16 * (1 - ke) * (1 - ke); }
  else if (enter === 'drop') { y -= H * 0.22 * (1 - ke); r += dir * 5 * (1 - ke); b = 12 * (1 - ke) * (1 - ke); }
  r += sc.dutch ?? 0;
  z *= (1 + 0.006 * react) * punch;
  y += react * H * 0.0018;
  return { z, x, y, r, b };
}

const origin = (W: number, H: number) => ({ ox: W / 2, oy: H * 0.45 });

/** The CSS transform of a layer at depth d (overscan grows a backdrop so its edges never show while it moves). */
export function camStyle(cam: Cam, d: number, W: number, H: number, overscan = 1): React.CSSProperties {
  const { ox, oy } = origin(W, H);
  return {
    transform: `translate(${cam.x * d}px, ${cam.y * d}px) rotate(${cam.r * d}deg) scale(${(1 + (cam.z - 1) * d) * overscan})`,
    transformOrigin: `${ox}px ${oy}px`,
  };
}

/** Where a point on screen sits inside a layer at depth d (the inverse of camStyle), so an effect on that layer can be
 *  placed next to something seen at another depth (the face lives at depth 1). */
function unproject(cam: Cam, d: number, W: number, H: number, sx: number, sy: number) {
  const { ox, oy } = origin(W, H);
  const s = 1 + (cam.z - 1) * d, a = (-cam.r * d * Math.PI) / 180;
  const dx = sx - ox - cam.x * d, dy = sy - oy - cam.y * d;
  return { x: ox + (dx * Math.cos(a) - dy * Math.sin(a)) / s, y: oy + (dx * Math.sin(a) + dy * Math.cos(a)) / s };
}
function project(cam: Cam, d: number, W: number, H: number, px: number, py: number) {
  const { ox, oy } = origin(W, H);
  const s = 1 + (cam.z - 1) * d, a = (cam.r * d * Math.PI) / 180;
  const dx = (px - ox) * s, dy = (py - oy) * s;
  return { x: ox + cam.x * d + dx * Math.cos(a) - dy * Math.sin(a), y: oy + cam.y * d + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** The face (given in the person layer's own coordinates, i.e. after the shot) as seen from a layer at depth d. */
export function faceIn(cam: Cam, d: number, W: number, H: number, f: Face): Face {
  const c = project(cam, 1, W, H, f.x, f.y), tp = project(cam, 1, W, H, f.x, f.top);
  const lc = unproject(cam, d, W, H, c.x, c.y), lt = unproject(cam, d, W, H, tp.x, tp.y);
  const k = (1 + (cam.z - 1)) / (1 + (cam.z - 1) * d);
  return { x: lc.x, y: lc.y, w: f.w * k, top: lt.y };
}

/** A point at depth d drawn directly in screen space (depth elements place themselves this way). */
export const onScreen = (cam: Cam, d: number, W: number, H: number, x: number, y: number) => ({ ...project(cam, d, W, H, x, y), s: 1 + (cam.z - 1) * d });
