import React, { useMemo } from 'react';
import { AbsoluteFill, Html5Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Cam, camAt, camStyle, DEPTH, faceIn } from './lib/camera';
import { applyShot, clamp, CutName, ease, faceAt, FxCtx, FxDef, FxSpec, lerp, MOTION, poseAt, Props, reactAt, Scene, setMotion, Shot, shotAt } from './lib/core';
import { EFFECTS } from './fx';
import { Placeholder } from './Placeholder';
import { defaultDepth, DepthField } from './sets/Depth';
import { SetView } from './sets/Sets';

// One frame of the film. Each scene is a stack of depth layers under its own camera (lib/camera.ts):
//   set (0.28) → far depth elements (~0.5) → behind (0.82) → person (1) → front (1.16) → near depth elements (~1.7) → screen (0.18)
// so one camera move reads as space. Scenes hand over through transitions that overlap them (glide, depth, curtain,
// bloom), or through single-scene cuts (whip, zoom, iris, cut). Effects belong to the scene they start in.

type Active = { o: FxSpec; def: FxDef; i: number };
type Slot = 'Behind' | 'Front' | 'Screen';
const SLOT_DEPTH: Record<Slot, number> = { Behind: DEPTH.behind, Front: DEPTH.front, Screen: DEPTH.screen };

// transition windows in seconds before / after the cut
const WINDOW: Record<CutName, [number, number]> = {
  glide: [0.24, 0.62], depth: [0.26, 0.56], curtain: [0.42, 0.46], bloom: [0.3, 0.62], iris: [0, 1.0],
  whip: [0.13, 0.21], zoom: [0.17, 0.25], cut: [0, 0],
  flare: [0.36, 0.56], spin: [0.3, 0.42], slats: [0, 0.62], push: [0.22, 0.4], flood: [0.3, 0.56],
};
const OVERLAP: CutName[] = ['glide', 'depth', 'curtain', 'bloom', 'flare', 'spin', 'slats', 'push', 'flood'];

type View = { sc: Scene; idx: number; style: React.CSSProperties; filter?: string; hidePerson?: boolean };

/** The person: cut-out footage or the placeholder, framed by a shot under a camera. When a shot lifts the clip so its
 *  bottom edge shows, that edge fades out instead of ending in a line. */
const PersonLayer: React.FC<{ p: Props; shot: Shot; cam: Cam; sticker: number; id: string; frame: number }> = ({ p, shot, cam, sticker, id, frame }) => {
  const { width: W, height: H } = useVideoConfig();
  const fade = shot.lift > 0 ? 'linear-gradient(to top, transparent 0%, #000 8%)' : undefined;
  return (
    <AbsoluteFill style={camStyle(cam, DEPTH.person, W, H)}>
      <AbsoluteFill style={{ transform: `translate(${shot.tx}px, ${shot.ty}px) scale(${shot.s})`, transformOrigin: '0 0', filter: sticker > 0.2 ? `url(#emx-stk${id})` : undefined,
        WebkitMaskImage: fade, maskImage: fade }}>
        {sticker > 0.2 ? (
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <filter id={`emx-stk${id}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feComponentTransfer in="SourceAlpha" result="a"><feFuncA type="linear" slope="3" intercept="-1" /></feComponentTransfer>
              <feMorphology in="a" operator="dilate" radius={sticker / shot.s} result="d" />
              <feFlood floodColor="#ffffff" result="w" />
              <feComposite in="w" in2="d" operator="in" result="outline" />
              <feDropShadow in="outline" dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.3" result="o2" />
              <feMerge><feMergeNode in="o2" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </svg>
        ) : null}
        {p.track.placeholder
          ? <Placeholder pose={poseAt(p.track, frame)} W={W} H={H} />
          : <OffthreadVideo muted transparent src={staticFile('person.webm')} style={{ width: W, height: H, position: 'absolute', left: 0, top: 0 }} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ p: Props; v: View; frame: number; react: number; owner: number[] }> = ({ p, v, frame, react, owner }) => {
  const { fps, width: W, height: H } = useVideoConfig();
  const { sc, idx } = v;
  const t = frame / fps;
  const active: Active[] = p.effects
    .map((o, i) => ({ o, i, def: EFFECTS[o.fx] }))
    .filter((a) => a.def && owner[a.i] === idx && t >= a.o.start && t < a.o.end);
  const shot = shotAt(p.track, sc, frame, W, H);
  const face1 = applyShot(shot, faceAt(p.track, frame));
  const ctx = (o: FxSpec, d: number, cam: Cam, f = frame): FxCtx => ({
    t: f / fps - o.start, d: Math.max(0.05, o.end - o.start), fps, W, H, frame: f, face: faceIn(cam, d, W, H, face1),
    shot, o, track: p.track, scene: sc, react,
  });
  // punches act on the camera, so every layer takes them at its own depth
  let punch = 1, sticker = sc.sticker ?? 0;
  const cam0 = camAt(sc, idx, t, W, H, react);
  for (const a of active) {
    punch *= a.def.personScale?.(ctx(a.o, 1, cam0)) ?? 1;
    sticker = Math.max(sticker, a.def.sticker?.(ctx(a.o, 1, cam0)) ?? 0);
  }
  const cam = camAt(sc, idx, t, W, H, react, punch);
  const set = sc.set ?? 'studio';
  const depth = sc.depth ?? defaultDepth(set);
  const layer = (a: Active, slot: Slot) => {
    const d = SLOT_DEPTH[slot];
    const Comp = a.def[slot]!;
    const Inner: React.FC = () => <Comp c={ctx(a.o, d, cam, useCurrentFrame())} />;
    return (
      <AbsoluteFill key={`${slot}${a.i}`} style={camStyle(cam, d, W, H)}>
        {a.def.blur ? <CameraMotionBlur samples={a.def.blur} shutterAngle={180}><Inner /></CameraMotionBlur> : <Inner />}
      </AbsoluteFill>
    );
  };
  const vb = (cam.b ?? 0) > 0.3 ? `blur(${(cam.b ?? 0).toFixed(1)}px)` : '';
  return (
    <AbsoluteFill style={{ overflow: 'hidden', ...v.style, filter: [v.filter, vb].filter(Boolean).join(' ') || undefined }}>
      <AbsoluteFill style={camStyle(cam, DEPTH.set, W, H, 1.16 + 0.04 * Math.abs(sc.dutch ?? 0) / 5)}>
        <SetView set={set} W={W} H={H} t={t} frame={frame} room={p.room} />
      </AbsoluteFill>
      <DepthField layer="far" kind={depth} set={set} seed={idx + 1} t={t} t0={sc.start} cam={cam} react={react} W={W} H={H} />
      {active.filter((a) => a.def.Behind).map((a) => layer(a, 'Behind'))}
      {sc.shot !== 'none' && !v.hidePerson ? <PersonLayer p={p} shot={shot} cam={cam} sticker={sticker} id={`${idx}`} frame={frame} /> : null}
      {active.filter((a) => a.def.Front).map((a) => layer(a, 'Front'))}
      <DepthField layer="near" kind={depth} set={set} seed={idx + 1} t={t} t0={sc.start} cam={cam} react={react} W={W} H={H} />
      {active.filter((a) => a.def.Screen).map((a) => layer(a, 'Screen'))}
    </AbsoluteFill>
  );
};

/** A keyhole centred at (cx, cy), k = its size (1 = a keyhole ~22 % of the frame wide), as a CSS clip path. */
const keyhole = (W: number, H: number, k: number) => {
  const cx = W / 2, cy = H * 0.44, r = W * 0.11 * k, top = cy + r * 0.6, bot = cy + r * 3.1, nw = r * 0.45, bw = r * 0.95;
  return `path('M ${cx - nw} ${top} A ${r} ${r} 0 1 1 ${cx + nw} ${top} L ${cx + bw} ${bot} L ${cx - bw} ${bot} Z')`;
};
const sm = (a: number, b: number, x: number) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

export const Stage: React.FC<Props> = (p) => {
  setMotion(p.motion ?? 'refined');
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const scenes = useMemo(() => (p.scenes.length ? p.scenes : [{ start: 0, end: 1e9, set: 'studio', shot: 'mid' } as Scene]), [p.scenes]);
  // every effect belongs to the scene it overlaps most (an effect that lands a couple of frames before its cut still
  // belongs to the scene after it); its arrival sends the film's micro-interaction ripple
  const owner = useMemo(() => p.effects.map((e) => {
    let k = 0, best = -1;
    scenes.forEach((s, i) => { const o = Math.min(e.end, s.end) - Math.max(e.start, s.start); if (o > best) { best = o; k = i; } });
    return k;
  }), [p.effects, scenes]);
  const events = useMemo(() => p.effects.map((e) => e.start + 0.2 * MOTION.tempo), [p.effects]);
  const react = reactAt(events, t);
  let idx = 0; scenes.forEach((s, i) => { if (t >= s.start - 1e-6) idx = i; });
  const cutKind = (i: number): CutName => (i <= 0 ? 'cut' : scenes[i].in ?? (MOTION.mode === 'refined' ? 'glide' : 'whip'));

  // near an overlapping boundary? nb = the incoming scene's index, q = progress through its window
  const views: View[] = [];
  let white = 0, pushBlur = 0;
  let overlay: React.ReactNode = null;
  const near = (i: number, before: boolean) => i > 0 && i < scenes.length && OVERLAP.includes(cutKind(i)) &&
    (before ? scenes[i].start - t <= WINDOW[cutKind(i)][0] && scenes[i].start > t : t - scenes[i].start < WINDOW[cutKind(i)][1]);
  const nb = near(idx + 1, true) ? idx + 1 : near(idx, false) ? idx : -1;
  if (nb > 0) {
    const kind = cutKind(nb), [pre, post] = WINDOW[kind];
    const q = clamp((t - (scenes[nb].start - pre)) / (pre + post));
    const a = scenes[nb - 1], b = scenes[nb], dir = a.dir ?? ((nb - 1) % 2 ? -1 : 1);
    const qc = pre / (pre + post);                                        // q at the cut itself
    if (kind === 'glide') {
      // the old scene keeps drifting the way its camera moved and dissolves into blur; the new one is wiped in from that
      // side behind a soft feathered edge, settling from slightly too large
      const g = ease('glide')(q), pq = ease('premium')(q);
      views.push({ sc: a, idx: nb - 1, style: { transform: `translateX(${-dir * W * 0.07 * g}px) scale(${1 - 0.03 * g})`, opacity: 1 - sm(0.45, 1, q) }, filter: `blur(${(7 * g).toFixed(2)}px)` });
      const m = g * 150 - 50, edge = dir > 0 ? 'to left' : 'to right';
      const mask = `linear-gradient(${edge}, #000 0%, #000 ${m}%, transparent ${m + 50}%)`;
      views.push({ sc: b, idx: nb, style: { transform: `translateX(${dir * W * 0.06 * (1 - pq)}px) scale(${1 + 0.05 * (1 - pq)})`, WebkitMaskImage: mask, maskImage: mask },
        filter: q < 0.98 ? `blur(${(6 * (1 - pq)).toFixed(2)}px)` : undefined });
    } else if (kind === 'depth') {
      // a push through: the old scene rushes past the lens and dissolves, the new one settles in from just behind it
      const g = ease('leave')(q), pq = ease('premium')(q);
      views.push({ sc: a, idx: nb - 1, style: { transform: `scale(${1 + 0.22 * g})` }, filter: `blur(${(12 * g).toFixed(2)}px)` });
      // the new world opens as a soft circle from the face outward (no cross-dissolve: two worlds never mix into grey)
      const fb = applyShot(shotAt(p.track, b, frame, W, H), faceAt(p.track, frame));
      const r = ease('glide')(q) * 135, ring = `radial-gradient(circle at ${fb.x}px ${fb.y}px, #000 ${r}%, transparent ${r + 22}%)`;
      views.push({ sc: b, idx: nb, style: { transform: `scale(${0.94 + 0.06 * pq})`, WebkitMaskImage: ring, maskImage: ring }, filter: q < 0.98 ? `blur(${(8 * (1 - pq)).toFixed(2)}px)` : undefined });
    } else if (kind === 'curtain') {
      views.push(q < qc ? { sc: a, idx: nb - 1, style: {} } : { sc: b, idx: nb, style: { transform: `scale(${1 + 0.04 * (1 - ease('premium')((q - qc) / (1 - qc)))})` } });
    } else if (kind === 'flare') {
      // a warm lens flare sweeps across and blows the frame out; the new scene blooms back from the overexposure
      const u = ease('leave')(clamp(q / qc)), v = ease('premium')(clamp((q - qc) / (1 - qc)));
      views.push(q < qc ? { sc: a, idx: nb - 1, style: {}, filter: `brightness(${1 + 0.9 * u})` } : { sc: b, idx: nb, style: {}, filter: v < 0.99 ? `brightness(${1 + 0.9 * (1 - v)}) blur(${(6 * (1 - v)).toFixed(1)}px)` : undefined });
      white = q < qc ? Math.pow(u, 1.6) * 0.95 : (1 - v) * 0.95;
      const fx = lerp(-1.7, 0.7, ease('glide')(q)) * W;
      overlay = (
        <AbsoluteFill style={{ mixBlendMode: 'screen', transform: `translateX(${fx}px) rotate(-8deg) scale(1.3)`, width: W * 2, left: 0,
          background: 'linear-gradient(100deg, rgba(255,140,90,0) 25%, rgba(255,190,150,0.55) 40%, rgba(255,245,235,0.95) 49%, #fff 50%, rgba(255,215,190,0.8) 55%, rgba(255,120,90,0) 72%)',
          filter: 'blur(18px)' }} />
      );
    } else if (kind === 'spin') {
      // the frame rolls and dives into a corner; the new one arrives counter-rolled and settles
      const u = ease('leave')(clamp(q / qc)), v = ease('premium')(clamp((q - qc) / (1 - qc)));
      views.push(q < qc
        ? { sc: a, idx: nb - 1, style: { transform: `rotate(${dir * 26 * u}deg) scale(${1 + 0.65 * u})`, transformOrigin: '72% 28%' }, filter: `blur(${(14 * u).toFixed(1)}px)` }
        : { sc: b, idx: nb, style: { transform: `rotate(${-dir * 12 * (1 - v)}deg) scale(${1 + 0.3 * (1 - v)})` }, filter: v < 0.99 ? `blur(${(12 * (1 - v)).toFixed(1)}px)` : undefined });
    } else if (kind === 'slats') {
      // vertical blinds: the new scene is revealed strip by strip, right to left, a thin pillar riding each edge
      const N = 7, sw = W / N;
      let path = '';
      const bars: React.ReactNode[] = [];
      for (let i = N - 1; i >= 0; i--) {
        const pi = ease('glide')(clamp((q - (N - 1 - i) * 0.06) / 0.55));
        const x1 = (i + 1) * sw, x0 = x1 - sw * pi;
        if (pi > 0.001) path += `M ${x0} 0 H ${x1 + 0.5} V ${H} H ${x0} Z `;
        if (pi > 0.01 && pi < 0.99) bars.push(<div key={i} style={{ position: 'absolute', left: x0 - 5, top: 0, width: 10, height: H,
          background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(120,110,105,0.75) 45%, rgba(255,255,255,0.6) 60%, rgba(0,0,0,0))' }} />);
      }
      views.push({ sc: a, idx: nb - 1, style: {} });
      if (path) views.push({ sc: b, idx: nb, style: { clipPath: `path('${path}')`, transform: `scale(${1.04 - 0.04 * ease('premium')(q)})` } });
      overlay = <AbsoluteFill>{bars}</AbsoluteFill>;
    } else if (kind === 'push') {
      // a push through into white, then the new scene whips in from the side on a directional smear
      const u = ease('leave')(clamp(q / qc)), v = ease('premium')(clamp((q - qc) / (1 - qc)));
      if (q < qc) views.push({ sc: a, idx: nb - 1, style: { transform: `scale(${1 + 0.45 * u})` }, filter: `blur(${(20 * u).toFixed(1)}px)` });
      else { views.push({ sc: b, idx: nb, style: { transform: `translateX(${dir * W * 0.42 * (1 - v)}px) scale(${1 + 0.42 * 2.1 * (1 - v)})` }, filter: v < 0.99 ? 'url(#emx-push)' : undefined }); pushBlur = 34 * (1 - v); }
      white = q < qc ? u * u * 0.9 : Math.pow(1 - v, 3) * 0.9;
    } else if (kind === 'flood') {
      // the frame floods red; the red drains downward off the new scene
      const u = ease('silk')(clamp(q / qc)), v = ease('glide')(clamp((q - qc) / (1 - qc)));
      views.push(q < qc ? { sc: a, idx: nb - 1, style: { transform: `scale(${1 + 0.05 * u})` } } : { sc: b, idx: nb, style: {} });
      const m = q < qc ? -40 : v * 140 - 20, alpha = q < qc ? u : 1;
      const drain = q < qc ? undefined : `linear-gradient(to bottom, transparent ${m - 25}%, #000 ${m}%)`;
      overlay = (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(242,15,20,${alpha}) 0%, rgba(150,0,8,${alpha}) 100%)`,
          WebkitMaskImage: drain, maskImage: drain }} />
      );
    } else {   // bloom: a soft light swells over the cut
      views.push(q < qc ? { sc: a, idx: nb - 1, style: {} } : { sc: b, idx: nb, style: {} });
      white = q < qc ? ease('silk')(q / qc) : 1 - ease('silk')((q - qc) / (1 - qc));
    }
  } else {
    // single-scene cuts (whip / zoom / iris) and the steady state
    const sc = scenes[idx], next = scenes[idx + 1];
    const fIn = t - sc.start, fOut = next ? next.start - t : 1e9;
    const kind = cutKind(idx), nextKind = next ? cutKind(idx + 1) : 'cut';
    let tr = '', fl = '', clip: string | undefined;
    if (kind === 'whip' && fIn < WINDOW.whip[1]) { const q = 1 - ease('power3.out')(fIn / WINDOW.whip[1]); tr = `translateX(${q * W * 0.12}px) scale(${1 + q * 0.28})`; fl = `blur(${(q * 30).toFixed(1)}px)`; }
    if (nextKind === 'whip' && fOut <= WINDOW.whip[0]) { const q = ease('power2.in')(1 - fOut / WINDOW.whip[0]); tr = `translateX(${-q * W * 0.12}px) scale(${1 + q * 0.28})`; fl = `blur(${(q * 30).toFixed(1)}px)`; }
    if (nextKind === 'zoom' && fOut <= WINDOW.zoom[0]) { const q = ease('power2.in')(1 - fOut / WINDOW.zoom[0]); tr = `scale(${1 + q * 0.6})`; fl = `blur(${(q * 22).toFixed(1)}px)`; }
    if (kind === 'zoom' && fIn < WINDOW.zoom[1]) { const q = 1 - ease('expo.out')(fIn / WINDOW.zoom[1]); tr = `scale(${1 + q * 0.3})`; fl = `blur(${(q * 22).toFixed(1)}px)`; }
    if (kind === 'iris' && fIn < WINDOW.iris[1]) clip = keyhole(W, H, 0.3 + 9 * ease(MOTION.mode === 'refined' ? 'glide' : 'power3.in')(fIn / WINDOW.iris[1]));
    views.push({ sc, idx, style: { transform: tr || undefined, clipPath: clip }, filter: fl || undefined });
  }
  // continuity: through a glide or a depth cut the person stays one continuous figure, reframing from shot to shot,
  // while the world changes around them
  let carried: React.ReactNode = null;
  if (nb > 0 && (cutKind(nb) === 'glide' || cutKind(nb) === 'depth') && scenes[nb - 1].shot !== 'none' && scenes[nb].shot !== 'none') {
    const [pre, post] = WINDOW[cutKind(nb)], q = clamp((t - (scenes[nb].start - pre)) / (pre + post)), k = ease('glide')(q);
    const A = shotAt(p.track, scenes[nb - 1], frame, W, H), B = shotAt(p.track, scenes[nb], frame, W, H);
    const ca = camAt(scenes[nb - 1], nb - 1, t, W, H, react), cb = camAt(scenes[nb], nb, t, W, H, react);
    const shot: Shot = { s: lerp(A.s, B.s, k), tx: lerp(A.tx, B.tx, k), ty: lerp(A.ty, B.ty, k), lift: lerp(A.lift, B.lift, k) };
    const cam: Cam = { z: lerp(ca.z, cb.z, k), x: lerp(ca.x, cb.x, k), y: lerp(ca.y, cb.y, k), r: lerp(ca.r, cb.r, k) };
    views.forEach((v) => { v.hidePerson = true; });
    carried = <PersonLayer p={p} shot={shot} cam={cam} sticker={0} id="carry" frame={frame} />;
  }
  // the curtain: a red gloss panel sweeps across, covering the cut
  let curtain: React.ReactNode = null;
  if (nb > 0 && cutKind(nb) === 'curtain') {
    const [pre, post] = WINDOW.curtain, q = clamp((t - (scenes[nb].start - pre)) / (pre + post));
    const dir = scenes[nb - 1].dir ?? ((nb - 1) % 2 ? -1 : 1);
    const x = (1 - 2 * ease('glide')(q)) * W * 1.25 * dir;
    curtain = (
      <AbsoluteFill style={{ transform: `translateX(${x}px) skewX(-5deg)`, left: -W * 0.15, width: W * 1.3,
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)', maskImage: 'linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)',
        background: 'linear-gradient(100deg, #8E0008 0%, #E3060F 35%, #FF4A48 50%, #E3060F 65%, #8E0008 100%)', boxShadow: '0 0 120px rgba(80,0,0,0.6)' }} />
    );
  }
  const audio = p.audio ?? (p.track.audio ? (p.track.placeholder ? 'voice.wav' : 'source.mp4') : null);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      {audio ? <Html5Audio src={staticFile(audio)} /> : null}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        {pushBlur > 0.3 ? <filter id="emx-push" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation={`${pushBlur.toFixed(1)} 0`} edgeMode="duplicate" /></filter> : null}
      </svg>
      {views.map((v) => <SceneView key={`${v.idx}`} p={p} v={v} frame={frame} react={react} owner={owner} />)}
      {carried}
      {curtain}
      {overlay}
      {white > 0.01 ? (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(255,255,255,${clamp(white * 1.1)}) 0%, rgba(255,250,245,${white * 0.9}) 70%)` }} />
      ) : null}
    </AbsoluteFill>
  );
};
