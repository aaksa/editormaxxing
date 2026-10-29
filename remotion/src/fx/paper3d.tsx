import React, { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import * as THREE from 'three';
import { clamp, e, FxCtx, FxDef, hash, lerp, life, list, opt, px, str } from '../lib/core';
import { C, FONT, fontsReady } from '../lib/fonts';
import { at, PixelCanvas } from '../lib/three';

// A real 3D sheet of paper (a project brief, a certificate, a flyer) in Three.js: a finely divided plane whose vertices
// are bent every frame - a soft cylindrical curve across the sheet, a travelling ripple, one corner lifting - lit by the
// studio environment so the light slides over the folds as it moves. The printed face is a canvas drawn once with the
// film's fonts. It floats in on a long premium ease, breathes while it holds (and flutters a little when something lands
// nearby: the micro-interaction ripple), then drifts up and away. Same technique family as threeui's 3D Paper
// (Three.js + CanvasTexture + vertex work), written fresh here.

const SEG_X = 56, SEG_Y = 40, TEX_W = 1600;

/** The faces the printed sheet draws with. A canvas only sees a web font once that exact weight has been loaded (CSS loads
 *  lazily, and document.fonts.check() says "yes" for a family it has not met yet), so they are loaded explicitly, and the
 *  sheet mounts its 3D canvas only after that: the canvas's own first-render wait then covers the finished texture. */
const FACES = () => [`800 64px ${FONT.round}`, `700 64px ${FONT.round}`, `600 64px ${FONT.ui}`, `400 64px ${FONT.script}`, `500 64px ${FONT.serif}`];
let fontsLoaded = false;
function useFonts() {
  const [ok, setOk] = useState(fontsLoaded);
  const [h] = useState(() => (fontsLoaded ? null : delayRender('paper-3d fonts')));
  useEffect(() => {
    if (ok) return;
    fontsReady.then(() => Promise.all(FACES().map((f) => document.fonts.load(f)))).then(() => { fontsLoaded = true; setOk(true); });
  }, [ok]);
  useEffect(() => { if (ok && h !== null) continueRender(h); }, [ok, h]);
  return ok;
}

type Kind = 'brief' | 'certificate' | 'flyer';

/** The printed face, drawn once per sheet. Remotion's font loader holds every frame until the fonts are in, so this can be
 *  synchronous (an async texture would arrive after the 3D canvas has already drawn the frame). */
const faces = new Map<string, THREE.CanvasTexture>();
function printFace(kind: Kind, aspect: number, o: { title: string; sub: string; items: string[]; name: string; done: number }) {
  const w = TEX_W, h = Math.round(TEX_W * aspect), cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!;
  // paper: warm white with a faint fibre texture
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#FFFDF8'); bg.addColorStop(1, '#F1ECE2');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(120,100,80,${0.025 * hash(i)})`; g.fillRect(hash(i * 3) * w, hash(i * 7) * h, 1 + hash(i * 11) * 3, 1); }
  const u = w / 1000;
  const seal = (x: number, y: number, r: number) => {
    const sg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    sg.addColorStop(0, '#FF6B66'); sg.addColorStop(0.55, C.red); sg.addColorStop(1, C.redInk);
    g.fillStyle = sg; g.beginPath();
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2, rr = r * (k % 2 ? 0.92 : 1); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3 * u; g.beginPath(); g.arc(x, y, r * 0.72, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; g.font = `800 ${r * 0.42}px ${FONT.round}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✓', x, y + r * 0.04);
  };
  g.textBaseline = 'alphabetic';
  if (kind === 'certificate') {
    g.strokeStyle = C.redDeep; g.lineWidth = 6 * u; g.strokeRect(36 * u, 36 * u, w - 72 * u, h - 72 * u);
    g.lineWidth = 1.5 * u; g.strokeRect(54 * u, 54 * u, w - 108 * u, h - 108 * u);
    g.fillStyle = C.redDeep; g.textAlign = 'center';
    g.font = `500 ${86 * u}px ${FONT.serif}`; g.fillText(o.title.toUpperCase(), w / 2, 200 * u);
    g.font = `600 ${30 * u}px ${FONT.ui}`; g.fillStyle = '#6b5a52'; g.fillText(o.sub, w / 2, 262 * u);
    g.font = `400 ${120 * u}px ${FONT.script}`; g.fillStyle = '#2b2222'; g.fillText(o.name, w / 2, 420 * u);
    g.strokeStyle = '#c9bdb2'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(260 * u, 450 * u); g.lineTo(w - 260 * u, 450 * u); g.stroke();
    seal(w - 190 * u, h - 170 * u, 92 * u);
  } else {
    // brief / flyer: a red header band, the title, a month-by-month progress row, checklist lines, a seal
    g.fillStyle = C.red; g.fillRect(0, 0, w, 120 * u);
    g.fillStyle = '#fff'; g.font = `700 ${34 * u}px ${FONT.round}`; g.textAlign = 'left'; g.fillText(o.sub.toUpperCase(), 60 * u, 76 * u);
    g.fillStyle = '#1d1515'; g.font = `800 ${kind === 'flyer' ? 112 : 92 * 1}px ${FONT.round}`;
    g.fillText(o.title, 60 * u, (kind === 'flyer' ? 290 : 250) * u);
    const months = o.items.length ? o.items : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const y0 = (kind === 'flyer' ? 380 : 340) * u, step = (w - 160 * u) / Math.max(1, months.length - 1);
    g.strokeStyle = '#e6d8d3'; g.lineWidth = 10 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(80 * u, y0); g.lineTo(w - 80 * u, y0); g.stroke();
    const doneX = 80 * u + step * Math.min(months.length - 1, o.done - 1);
    g.strokeStyle = C.red; g.beginPath(); g.moveTo(80 * u, y0); g.lineTo(doneX, y0); g.stroke();
    months.forEach((m, i) => {
      const x = 80 * u + step * i, ok = i < o.done;
      g.fillStyle = ok ? C.red : '#fff'; g.strokeStyle = ok ? C.red : '#d8c6c0'; g.lineWidth = 5 * u;
      g.beginPath(); g.arc(x, y0, 20 * u, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#5a4848'; g.font = `600 ${26 * u}px ${FONT.ui}`; g.textAlign = 'center'; g.fillText(m, x, y0 + 64 * u);
    });
    g.textAlign = 'left';
    for (let i = 0; i < 4; i++) {
      const y = y0 + (150 + i * 62) * u;
      g.fillStyle = i < 3 ? C.red : '#e3d5d0'; g.beginPath(); g.arc(84 * u, y - 10 * u, 13 * u, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#E2D2CC'; g.fillRect(118 * u, y - 18 * u, (w - 420 * u) * (0.55 + 0.4 * hash(i + 3)), 16 * u);
    }
    seal(w - 170 * u, h - 160 * u, 88 * u);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  return t;
}

const Sheet: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x, total } = life(c, 22, 14);
  const kind = (str(c, 'kind', 'brief') as Kind);
  const wpx = px(c, opt(c, 'width', 560));
  const aspect = opt(c, 'aspect', kind === 'certificate' ? 0.72 : 1.32);   // height / width
  const hpx = wpx * aspect;
  const ready = useFonts();
  const key = `${kind}:${aspect}:${JSON.stringify(c.o)}`;
  let tex = faces.get(key) ?? null;
  if (!tex && ready) {
    tex = printFace(kind, aspect, { title: str(c, 'title', 'The Project'), sub: str(c, 'sub', 'Project brief'), items: list(c, 'items', []),
      name: str(c, 'name', 'Nama Kamu'), done: opt(c, 'done', 6) });
    faces.set(key, tex);
  }
  const geo = useMemo(() => new THREE.PlaneGeometry(wpx, hpx, SEG_X, SEG_Y), [wpx, hpx]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const front = useMemo(() => tex && new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.72, sheen: 0.15, sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#ffffff'), clearcoat: kind === 'certificate' ? 0.35 : 0.08, clearcoatRoughness: 0.35, side: THREE.FrontSide }), [tex, kind]);
  const back = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#EFE9DF'), roughness: 0.8, side: THREE.BackSide }), []);
  const t = f / c.fps;
  // the sheet's shape this frame: curve, ripple, corner lift (bigger while it travels, calmer at rest)
  const travel = 1 - a + x;
  const bend = lerp(opt(c, 'bend', 0.32), 1.1, clamp(travel)) + Math.sin(t * 0.9) * 0.05;     // radians across the width
  const ripple = px(c, 7) * (1 + 3 * clamp(travel) + 2.5 * Math.max(0, c.react));
  const lift = px(c, opt(c, 'curl', 46)) * (0.6 + 0.4 * Math.sin(t * 1.3)) + px(c, 80) * clamp(travel);
  const R = wpx / Math.max(0.05, bend);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const bx = base[i * 3], by = base[i * 3 + 1];
    const th = bx / R;
    let X = R * Math.sin(th), Z = R * (1 - Math.cos(th)) - wpx * 0.08;
    Z += ripple * Math.sin(bx / wpx * 5.5 + by / hpx * 2 + t * 2.4) * (0.4 + 0.6 * Math.abs(bx / wpx * 2));
    // the top-right corner lifts toward the camera
    const cu = clamp((bx / wpx + 0.5 - 0.62) / 0.38) * clamp((by / hpx + 0.5 - 0.6) / 0.4);
    Z += lift * cu * cu;
    X -= lift * 0.25 * cu * cu;
    pos.setXYZ(i, X, by, Z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  // flight: in from below and to the side with a long premium settle, a floating hold, a soft drift up and out
  const side = str(c, 'from', 'right') === 'left' ? -1 : 1;
  const cx = c.W * opt(c, 'x', 0.62) + side * c.W * 0.5 * (1 - a) + Math.sin(t * 0.7) * px(c, 6) + x * side * c.W * 0.25;
  const cy = c.H * opt(c, 'y', 0.64) + c.H * 0.32 * (1 - a) + Math.sin(t * 1.1 + 1) * px(c, 10) - x * c.H * 0.3;
  const rx = lerp(-0.95, opt(c, 'tiltX', -0.28), a) + Math.sin(t * 0.8) * 0.04 - x * 0.4;
  const ry = lerp(side * 0.9, opt(c, 'tiltY', -0.32) * side, a) + Math.sin(t * 0.6 + 2) * 0.06 + x * 0.5 * side;
  const rz = lerp(side * 0.35, opt(c, 'tiltZ', 0.1) * side, a) + Math.sin(t * 0.5) * 0.02;
  const shadowK = clamp(a - x);
  return (
    <AbsoluteFill style={{ opacity: clamp(f / 3) * (1 - e('leave', f, total - 8, 8) * 0.9) }}>
      <div style={{ position: 'absolute', left: cx - wpx * 0.55, top: cy + hpx * 0.42, width: wpx * 1.1, height: hpx * 0.22, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(40,10,10,0.28), rgba(40,10,10,0) 70%)', filter: 'blur(14px)', opacity: shadowK }} />
      {ready ? <PixelCanvas W={c.W} H={c.H} env={0.5}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[-c.W, c.H * 1.2, c.W * 1.4]} intensity={1.35} />
        <directionalLight position={[c.W, -c.H * 0.3, c.W * 0.6]} intensity={0.35} color="#ffd9d4" />
        {front ? (
          <group position={at(c.W, c.H, cx, cy)} rotation={[rx, ry, rz]}>
            <mesh geometry={geo} material={front} frustumCulled={false} />
            <mesh geometry={geo} material={back} frustumCulled={false} />
          </group>
        ) : null}
      </PixelCanvas> : null}
    </AbsoluteFill>
  );
};

export const PAPER3D_FX: Record<string, FxDef> = {
  'paper-3d': {
    desc: 'A real 3D sheet (brief, certificate or flyer) floats in bending, rippling and catching the light, breathes while it holds, drifts away',
    options: 'kind (brief|certificate|flyer), title, sub, items (|, e.g. months), done (how many reached), name (certificate), x, y (0-1), width, aspect, bend (rad), curl (px), from (left|right), tiltX, tiltY, tiltZ',
    Front: Sheet,
  },
};
