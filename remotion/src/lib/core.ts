import type React from 'react';
import { useMemo } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// ---------- the job (scripts/emx.py writes track.json; a real clip's comes from facecammaxxing's track pass) ----------
export type Track = {
  fps: number; width: number; height: number; frames: number; duration: number;
  audio: boolean;
  placeholder?: boolean;   // no footage: the drawn stand-in character plays the person
  mouth?: number[];        // per frame 0..1, the voice's loudness (drives the placeholder's mouth)
  face: number[][];        // per frame [x, y, w], x/w normalised by width, y by height (empty for the placeholder)
  top: number[];           // per frame: top of the head, normalised by height
};
export type FxSpec = { fx: string; start: number; end: number } & Record<string, unknown>;
export type SetName = 'studio' | 'halftone' | 'blush' | 'stripes' | 'dark' | 'blue' | 'silk' | 'ember' | 'footage';
export type ShotName = 'wide' | 'mid' | 'close' | 'none';
export type CutName = 'glide' | 'depth' | 'curtain' | 'whip' | 'cut' | 'bloom' | 'zoom' | 'iris' | 'flare' | 'spin' | 'slats' | 'push' | 'flood';
export type MoveName = 'push' | 'pull' | 'left' | 'right' | 'rise' | 'still';
export type Scene = {
  start: number; end: number; set?: SetName; shot?: ShotName; zoom?: number;
  in?: CutName; push?: number; sticker?: number;
  move?: MoveName; moveAmount?: number; recenter?: number;
  enter?: 'pullback' | 'drop' | 'none';           // how the viewport arrives: a pull-back from close with a settling roll (default)
  dutch?: number;                                 // a held camera roll, degrees   // recenter: 0..1, how far the shot follows a real face back to centre           // the camera's move through the scene (default: alternating push + drift)
  depth?: 'mix' | 'orbs' | 'shards' | 'embers' | 'none';   // drifting depth elements, far and near
  dir?: 1 | -1;                                   // the direction this scene drifts and hands its motion to the next
};
export type Motion = 'refined' | 'punchy';
export type Props = { track: Track; scenes: Scene[]; effects: FxSpec[]; audio?: string | null; motion?: Motion; room?: string | null };
export type Face = { x: number; y: number; w: number; top: number };

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** A stable pseudo-random number for an integer seed (never Math.random: frames render out of order). */
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- the placeholder character's pose: one pure function of time, shared by the drawing and the face path ----------
export type Pose = { hx: number; hy: number; tilt: number; nod: number; armL: number; armR: number; blink: number; mouth: number; breath: number };
export function poseAt(tr: Track, frame: number): Pose {
  const t = frame / tr.fps;
  const m = tr.mouth ?? [];
  const i = clamp(Math.floor(frame), 0, Math.max(0, m.length - 1));
  const talk = m.length ? m[i] : 0;
  // a talker's head moves on the stresses: a slow sway plus a nod that follows the voice
  const env = m.length ? (m[clamp(i - 3, 0, m.length - 1)] + m[i] + m[clamp(i + 3, 0, m.length - 1)]) / 3 : 0;
  const sway = Math.sin(t * 0.9) * 6 + Math.sin(t * 2.3 + 1) * 3;
  const nod = env * 9 + Math.sin(t * 1.7) * 2;
  // hands gesture in phrases: a slow wave, louder when the voice is louder
  const g = 0.5 + 0.5 * Math.sin(t * 2.1 + Math.sin(t * 0.7) * 2);
  const blinkPhase = (t + hash(Math.floor(t / 3.1)) * 1.4) % 3.1;
  return {
    hx: 540 + sway, hy: 700 + nod * 0.6, tilt: Math.sin(t * 0.8) * 3.5 + env * 2, nod,
    armL: 0.35 + 0.45 * g * (0.4 + env), armR: 0.3 + 0.5 * (1 - g) * (0.4 + env),
    blink: blinkPhase < 0.12 ? 1 - Math.abs(blinkPhase - 0.06) / 0.06 : 0,
    mouth: clamp(talk * 1.35), breath: Math.sin(t * 1.6) * 4,
  };
}
/** The placeholder's head in its own 1080 x 1920 frame (the "as shot" composition: seated, full body). */
const placeholderFace = (tr: Track, frame: number): Face => {
  const p = poseAt(tr, frame), sx = tr.width / 1080, sy = tr.height / 1920;
  return { x: p.hx * sx, y: (p.hy + 10) * sy, w: 168 * sx, top: (p.hy - 128) * sy };
};

/** The face at a (possibly fractional) frame, in clip pixels (before the shot's framing). */
export function faceAt(tr: Track, f: number): Face {
  if (tr.placeholder) return placeholderFace(tr, f);
  const n = tr.face.length;
  if (!n) return { x: tr.width / 2, y: tr.height * 0.36, w: tr.width * 0.28, top: tr.height * 0.26 };
  const i = clamp(Math.floor(f), 0, n - 1), j = Math.min(n - 1, i + 1), k = clamp(f - i);
  const A = tr.face[i], B = tr.face[j];
  return {
    x: lerp(A[0], B[0], k) * tr.width, y: lerp(A[1], B[1], k) * tr.height,
    w: Math.max(lerp(A[2], B[2], k) * tr.width, tr.width * 0.05),
    top: lerp(tr.top[i] ?? A[1] - A[2], tr.top[j] ?? B[1] - B[2], k) * tr.height,
  };
}

// ---------- shots: how big the person sits in the frame ----------
// The clip is scaled about a point and its bottom edge never rises into the frame (a cut-out body must not end mid-air).
export type Shot = { s: number; tx: number; ty: number; lift: number };   // lift > 0: the clip's bottom edge is in frame (faded)
const SHOT_ZOOM = (tr: Track): Record<ShotName, number> => tr.placeholder
  ? { wide: 0.8, mid: 1, close: 1.62, none: 1 }
  : { wide: 0.74, mid: 1, close: 1.28, none: 1 };
// Real footage is framed like a camera operator would: by the face's size and height, averaged over the scene (so the
// framing holds still while the person moves), following the face back toward the centre line as they drift.
const TARGET: Record<Exclude<ShotName, 'none'>, [number, number]> = { wide: [0.14, 0.5], mid: [0.2, 0.44], close: [0.3, 0.45] };
const avgCache = new Map<string, Face>();
function sceneFace(tr: Track, sc: Scene): Face {
  const key = `${sc.start}:${sc.end}`;
  let f = avgCache.get(key);
  if (!f) {
    const a = Math.max(0, Math.floor(sc.start * tr.fps)), b = Math.max(a + 1, Math.min(tr.frames, Math.ceil(sc.end * tr.fps)));
    let x = 0, y = 0, w = 0, top = 0;
    for (let i = a; i < b; i++) { const q = faceAt(tr, i); x += q.x; y += q.y; w += q.w; top += q.top; }
    const n = b - a; f = { x: x / n, y: y / n, w: w / n, top: top / n }; avgCache.set(key, f);
  }
  return f;
}
export function shotAt(tr: Track, sc: Scene, frame: number, W: number, H: number): Shot {
  const face = faceAt(tr, frame);
  if (!tr.placeholder && tr.face.length) {
    const avg = sceneFace(tr, sc), t = frame / tr.fps;
    const [tw, tyF] = TARGET[(sc.shot ?? 'mid') === 'none' ? 'mid' : (sc.shot as Exclude<ShotName, 'none'>) ?? 'mid'];
    const k = clamp((t - sc.start) / Math.max(0.1, sc.end - sc.start));
    const s = (sc.zoom ?? (tw * W) / avg.w) * (1 + (sc.push ?? 0) * k);
    let ty = tyF * H - avg.y * s, lift = 0;
    if (ty + H * s < H) { lift = Math.min(H * 0.12, H - (ty + H * s)); ty = H - H * s - lift; }   // lift at most 12 %, faded
    const tx = W / 2 - avg.x * s - (face.x - avg.x) * s * (sc.recenter ?? 0.75);
    return { s, tx, ty, lift };
  }
  const t = frame / tr.fps;
  const k = clamp((t - sc.start) / Math.max(0.1, sc.end - sc.start));
  const s = (sc.zoom ?? SHOT_ZOOM(tr)[sc.shot ?? 'mid']) * (1 + (sc.push ?? 0.035) * k);   // the slow push is the living thing
  // keep the face's x on the frame's centre line (gently), the bottom edge at or below the frame's bottom
  let tx = W / 2 - (W / 2) * s, ty = H - H * s;         // zoomed out: centred, bottom-anchored
  // reframing: a real clip's face drifts; the shot leans most of the way back toward the centre line, like an operator
  if (!tr.placeholder) tx += (W / 2 - face.x) * s * (sc.recenter ?? 0.75);
  if (s > 1) { ty = H * 0.47 - face.y * s; ty = clamp(ty, H - H * s, 0); tx = clamp(W / 2 - face.x * s, W - W * s, 0); }
  return { s, tx, ty, lift: 0 };
}
export const applyShot = (sh: Shot, f: Face): Face => ({ x: f.x * sh.s + sh.tx, y: f.y * sh.s + sh.ty, w: f.w * sh.s, top: f.top * sh.s + sh.ty });

// ---------- effects ----------
/** Everything an effect gets: its own clock (t, d), the frame size, the face on screen and its options. */
export type FxCtx = {
  t: number; d: number; fps: number; W: number; H: number; frame: number;
  face: Face; shot: Shot; o: FxSpec; track: Track; scene: Scene;
  react: number;     // the film's micro-interaction signal: a small damped ripple after every element lands (-1..1)
};
export type FxDef = {
  desc: string;
  options: string;
  Behind?: React.FC<{ c: FxCtx }>;   // between the set and the person: the person covers it
  Front?: React.FC<{ c: FxCtx }>;    // over the person
  Screen?: React.FC<{ c: FxCtx }>;   // over everything
  personScale?: (c: FxCtx) => number;   // a punch on the person (around the face)
  sticker?: (c: FxCtx) => number;       // white outline width around the person
  blur?: number;                        // motion-blur samples for its layers
};

export const opt = (c: FxCtx, k: string, d: number) => { const v = c.o[k]; return v === undefined || v === '' ? d : Number(v); };
export const str = (c: FxCtx, k: string, d: string) => { const v = c.o[k]; return v === undefined || v === null ? d : String(v); };
export const list = (c: FxCtx, k: string, d: string[]) => { const v = c.o[k]; return v ? String(v).split('|').map((s) => s.trim()).filter(Boolean) : d; };
export const px = (c: FxCtx, v: number) => (v * c.W) / 1080;   // sizes are written for 1080 wide
/** The effect's own clock in frames. In the refined mode it runs MOTION.tempo times slower, so every entry, stagger and
 *  idle move is slower and softer, while exits (counted back from the effect's end on the same clock) still finish on time. */
export const fr = (c: FxCtx) => (c.t * c.fps) / MOTION.tempo;
/** A clip time (seconds) on an effect's own clock, for `times` lists. */
export const fAt = (c: FxCtx, sec: number) => ((sec - c.o.start) * c.fps) / MOTION.tempo;

// ---------- GSAP, seek-safe ----------
// Remotion renders frames in any order and in several tabs at once, so no timeline plays on its own clock: eases are
// read from GSAP as plain functions and every value is a pure function of the frame.
gsap.defaults({ lazy: false, overwrite: false });
gsap.registerPlugin(CustomEase);
// The refined curves: long, soft decelerations (no snap at the start, a very long settle) and gentle departures.
CustomEase.create('premium', '0.16,1,0.3,1');     // arrivals: most of the travel early, then a long glide in
CustomEase.create('silk', '0.22,1,0.36,1');       // secondary arrivals, a touch softer
CustomEase.create('glide', '0.65,0,0.35,1');      // moves between two rests
CustomEase.create('leave', '0.55,0,0.85,0.35');   // exits: accelerate away, no jerk

// The motion mode is set once per frame by the Stage (each render tab has its own module state, so this stays pure).
export const MOTION: { mode: Motion; tempo: number } = { mode: 'refined', tempo: 1.8 };
export const setMotion = (mode: Motion = 'refined') => { MOTION.mode = mode; MOTION.tempo = mode === 'refined' ? 1.8 : 1; };
// Sharp curves the punchy library was written with, mapped to their refined counterparts (overshoots become settles).
const REFINED: Record<string, string> = {
  'expo.out': 'premium', 'power3.out': 'silk', 'power2.out': 'silk', 'power4.out': 'premium', 'back.out(1.6)': 'silk',
  'back.out(2)': 'silk', 'power2.in': 'leave', 'power3.in': 'leave', 'power2.inOut': 'glide', 'power3.inOut': 'glide',
};
const easeCache = new Map<string, (p: number) => number>();
export const ease = (name: string) => {
  const n = MOTION.mode === 'refined' ? REFINED[name] ?? name : name;
  let f = easeCache.get(n);
  if (!f) { f = gsap.parseEase(n) as (p: number) => number; easeCache.set(n, f); }
  return f;
};
/** Arrive-from-oversize scale: the punchy 1.45 pop becomes a ~1.12 settle in the refined mode. */
export const over = (a: number, big = 1.45) => lerp(MOTION.mode === 'refined' ? 1 + (big - 1) * 0.27 : big, 1, a);
/** Blur that clears as an element settles (refined arrivals focus in instead of snapping). */
export const focus = (a: number, px = 10) => (MOTION.mode === 'refined' ? (1 - a) * px : 0);

/** The film's micro-interaction signal at time t: every element arrival sends a small damped ripple (0.4 s rise,
 *  ~1.2 s settle) that cameras, depth elements and neighbours can react to. */
export function reactAt(events: number[], t: number) {
  let v = 0;
  for (const t0 of events) {
    const dt = t - t0;
    if (dt > 0 && dt < 2.2) v += Math.sin(dt * 7.5) * Math.exp(-dt * 3.2);
  }
  return clamp(v, -1, 1);
}
/** e('expo.out', t, t0, dur) -> eased 0..1 progress of a move that starts at t0 and lasts dur (any unit, usually frames). */
export const e = (name: string, t: number, t0: number, dur: number) => ease(name)(clamp((t - t0) / dur));

export function useTimeline<S extends Record<string, number>>(
  t: number, init: S, build: (tl: gsap.core.Timeline, s: S) => void, deps: unknown[] = [],
): S {
  const ref = useMemo(() => {
    const s = { ...init };
    const tl = gsap.timeline({ paused: true });
    build(tl, s);
    return { s, tl };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  ref.tl.seek(Math.max(0, t), true);
  return { ...ref.s };
}

/** In / hold / out in frames: arrival progress a (0..1, eased), exit progress x (0..1, eased in). */
export function life(c: FxCtx, inF = 8, outF = 8, inEase = 'expo.out', outEase = 'power2.in') {
  const f = fr(c), total = (c.d * c.fps) / MOTION.tempo;
  return { f, total, a: e(inEase, f, 0, inF), x: e(outEase, f, total - outF, outF) };
}
