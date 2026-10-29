import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, e, fAt, FxCtx, FxDef, hash, lerp, life, list, opt, px, str } from '../lib/core';
import { abs, Glyph } from './common';
import { GLASS, LF } from './fonts';

// GLASS - the premium keynote look: soft moving colour fields, real refractive glass (the panel bends what is behind it
// at its edges, blurs and brightens it: CSS backdrop-filter through an SVG displacement map generated for each panel's
// shape, the technique of the open "liquid glass" web demos), clean Inter with one Instrument Serif italic accent,
// masked line reveals that focus in from a blur, thin giant numbers. Nothing pops: everything glides, settles and
// breathes. Glass needs what is behind it inside the same layer stack, so these effects never sit inside a faded parent.

const dark = (set?: string) => set === 'midnight';

// ---------------- sets ----------------
const Blob: React.FC<{ x: number; y: number; r: number; color: string; o?: number }> = ({ x, y, r, color, o = 0.85 }) => (
  <div style={abs(x - r, y - r, { width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, ${color}00 70%)`, opacity: o })} />
);
const Grain: React.FC<{ W: number; H: number; o: number }> = ({ W, H, o }) => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o, mixBlendMode: 'overlay' }}>
    <filter id="gg"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed={3} /></filter>
    <rect width={W} height={H} filter="url(#gg)" />
  </svg>
);
/** A slow aurora of four colour fields on mist. */
export const Aurora: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: '#EEF0F8', overflow: 'hidden' }}>
    <Blob x={W * (0.2 + 0.08 * Math.sin(t * 0.31))} y={H * (0.22 + 0.04 * Math.cos(t * 0.27))} r={W * 0.75} color={GLASS.violet} />
    <Blob x={W * (0.85 + 0.06 * Math.cos(t * 0.23))} y={H * (0.35 + 0.05 * Math.sin(t * 0.29))} r={W * 0.7} color={GLASS.cyan} o={0.75} />
    <Blob x={W * (0.3 + 0.07 * Math.sin(t * 0.19 + 1))} y={H * (0.78 + 0.03 * Math.cos(t * 0.33))} r={W * 0.8} color={GLASS.pink} o={0.7} />
    <Blob x={W * (0.9 + 0.05 * Math.sin(t * 0.21 + 2))} y={H * (0.9 + 0.03 * Math.cos(t * 0.25))} r={W * 0.6} color={GLASS.peach} o={0.7} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)' }} />
    <Grain W={W} H={H} o={0.18} />
  </AbsoluteFill>
);
/** White, nearly empty: two faint pastel fields and a floor that catches a soft shadow. */
export const Frost: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #FAFAFC 0%, #EFEFF3 62%, #E6E6EC 100%)', overflow: 'hidden' }}>
    <Blob x={W * (0.12 + 0.04 * Math.sin(t * 0.3))} y={H * 0.18} r={W * 0.6} color={GLASS.cyan} o={0.32} />
    <Blob x={W * (0.92 + 0.04 * Math.cos(t * 0.26))} y={H * 0.42} r={W * 0.55} color={GLASS.violet} o={0.28} />
    <div style={abs(W * 0.1, H * 0.86, { width: W * 0.8, height: H * 0.08, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(20,20,40,0.16), rgba(20,20,40,0) 70%)' })} />
    <Grain W={W} H={H} o={0.1} />
  </AbsoluteFill>
);
/** Black with one coloured glow behind the head and a faint reflective floor. */
export const Midnight: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: '#05060A', overflow: 'hidden' }}>
    <Blob x={W * (0.5 + 0.05 * Math.sin(t * 0.4))} y={H * 0.36} r={W * 0.75} color={GLASS.violet} o={0.55} />
    <Blob x={W * (0.25 + 0.05 * Math.cos(t * 0.3))} y={H * 0.55} r={W * 0.5} color={GLASS.cyan} o={0.3} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 65%, rgba(255,255,255,0.05) 66%, rgba(0,0,0,0) 90%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)' }} />
    <Grain W={W} H={H} o={0.12} />
  </AbsoluteFill>
);

// ---------------- the glass itself ----------------
const maps = new Map<string, string>();
/** A displacement map for a rounded rectangle: inside a bevel band along the edge, pixels are pushed along the edge
 *  normal (R = x, G = y, 128 = no move), strongest at the rim, so the backdrop bends like light through a thick lens. */
function lensMap(w: number, h: number, r: number, bevel: number) {
  const key = [w, h, r, bevel].map(Math.round).join(':');
  let url = maps.get(key);
  if (url) return url;
  const s = 0.5, cw = Math.max(2, Math.round(w * s)), ch = Math.max(2, Math.round(h * s));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d')!, img = g.createImageData(cw, ch);
  const hw = w / 2, hh = h / 2, rr = Math.min(r, hw, hh);
  const sdf = (x: number, y: number) => {
    const qx = Math.abs(x) - hw + rr, qy = Math.abs(y) - hh + rr;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
  };
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const x = i / s - hw, y = j / s - hh, d = -sdf(x, y);            // distance inside the edge
    let dx = 0, dy = 0;
    if (d > 0 && d < bevel) {
      const gx = sdf(x + 1, y) - sdf(x - 1, y), gy = sdf(x, y + 1) - sdf(x, y - 1), n = Math.hypot(gx, gy) || 1;
      const k = Math.pow(1 - d / bevel, 2);
      dx = (-gx / n) * k; dy = (-gy / n) * k;
    }
    const o = (j * cw + i) * 4;
    img.data[o] = 128 + dx * 127; img.data[o + 1] = 128 + dy * 127; img.data[o + 2] = 128; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  url = cv.toDataURL();
  maps.set(key, url);
  return url;
}

/** A pane of liquid glass of size w x h (radius r): refracting edges, blur, a bright rim, a specular sweep. */
// The pane fades and softens through its own layers (`fade`, `soft`): an opacity or a filter on any parent would cut
// the glass off from the scene behind it (that parent becomes the backdrop's root) and the glass would show nothing.
export const GlassPane: React.FC<{ id: string; w: number; h: number; r: number; blur?: number; tint?: string; strength?: number; sweep?: number;
  style?: React.CSSProperties; children?: React.ReactNode; onDark?: boolean; fade?: number; soft?: number }> =
  ({ id, w, h, r, blur = 18, tint, strength = 60, sweep = -1, style, children, onDark, fade = 1, soft = 0 }) => {
  const sf = soft > 0.3 ? `blur(${soft.toFixed(1)}px)` : undefined;
  const bevel = Math.min(w, h) * 0.16;
  const url = useMemo(() => lensMap(w, h, r, bevel), [w, h, r, bevel]);
  const fid = `lg${id.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: r, ...style }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={fid} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={url} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, borderRadius: r, backdropFilter: `url(#${fid}) blur(${blur + soft}px) saturate(1.8) brightness(${onDark ? 1.15 : 1.06})`,
        background: tint ?? (onDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.22)'), opacity: fade }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: r, pointerEvents: 'none', opacity: fade, filter: sf,
        boxShadow: `inset 0 ${h * 0.01 + 1}px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(255,255,255,0.25), inset 0 0 ${Math.min(w, h) * 0.08}px rgba(255,255,255,${onDark ? 0.12 : 0.3}), 0 ${h * 0.08}px ${h * 0.22}px rgba(20,20,50,${onDark ? 0.45 : 0.16})`,
        border: `1.5px solid rgba(255,255,255,${onDark ? 0.28 : 0.6})` }} />
      {sweep >= 0 && sweep <= 1 ? (
        <div style={{ position: 'absolute', inset: 0, borderRadius: r, overflow: 'hidden', pointerEvents: 'none', opacity: fade }}>
          <div style={{ position: 'absolute', top: -h, bottom: -h, width: w * 0.35, left: lerp(-w * 0.5, w * 1.2, sweep), transform: 'rotate(18deg)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
        </div>
      ) : null}
      <div style={{ position: 'relative', width: '100%', height: '100%', opacity: fade, filter: sf }}>{children}</div>
    </div>
  );
};

/** Floating: a slow 3D tilt and bob, every element on its own phase. */
const floatT = (c: FxCtx, seed: number) => {
  const t = c.t;
  return `perspective(${px(c, 1600)}px) rotateX(${Math.sin(t * 0.9 + seed) * 4}deg) rotateY(${Math.cos(t * 0.7 + seed) * 6}deg) translateY(${Math.sin(t * 1.1 + seed) * px(c, 8)}px)`;
};

// ---------------- effects ----------------
/** Lines rise out of a mask and focus in from a blur, tracking tightening as they settle; *word* is the serif accent. */
const Title: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const lines = list(c, 'text', ['Welcome *back*']);
  const fs = px(c, opt(c, 'size', 120)), y = c.H * opt(c, 'y', 0.2), align = str(c, 'align', 'center');
  const color = str(c, 'color', dark(c.scene.set) ? '#FFFFFF' : GLASS.ink);
  return (
    <div style={abs(0, y, { width: c.W, padding: `0 ${px(c, 80)}px`, boxSizing: 'border-box', textAlign: align as 'center', transform: `translateY(${-x * px(c, 40)}px)`,
      filter: x > 0 ? `blur(${x * 14}px)` : undefined, opacity: 1 - x })}>
      {lines.map((l, i) => {
        const k = e('premium', f, i * 5, 14);
        return (
          <div key={i} style={{ overflow: 'hidden', paddingBottom: fs * 0.12, marginBottom: -fs * 0.1 }}>
            <div style={{ transform: `translateY(${(1 - k) * 110}%)`, filter: `blur(${(1 - k) * 12}px)`, opacity: clamp(k * 1.6),
              fontFamily: LF.sans, fontWeight: Number(c.o.weight ?? 600), fontSize: fs * (i ? opt(c, 'sub', 1) : 1), lineHeight: 1.05,
              letterSpacing: `${lerp(0.06, -0.035, k)}em`, color }}>
              {l.split(/(\*[^*]+\*)/).filter(Boolean).map((p, j) => p.startsWith('*')
                ? <span key={j} style={{ fontFamily: LF.accent, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.01em', fontSize: '1.08em' }}>{p.slice(1, -1)}</span>
                : <span key={j}>{p}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AppIcon: React.FC<{ s: number; glyph: string; a: string; b: string }> = ({ s, glyph, a, b }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.24, background: `linear-gradient(145deg, ${a}, ${b})`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `inset 0 ${s * 0.03}px 0 rgba(255,255,255,0.5), 0 ${s * 0.08}px ${s * 0.2}px rgba(40,30,90,0.25)` }}>
    <Glyph name={glyph} size={s * 0.52} color="#fff" width={2.2} />
  </div>
);

/** A glass card: icon, title and a line under it, floating with a slow tilt, a light sweep crossing it once. */
const Card: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const k = e('premium', f, 0, 16), w = px(c, opt(c, 'width', 760)), h = px(c, opt(c, 'height', 250));
  const cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.66), onDark = dark(c.scene.set);
  const sweep = clamp((f - 10) / 18);
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { transform: `${floatT(c, 1)} translateY(${(1 - k) * px(c, 120) + x * px(c, 60)}px) scale(${lerp(0.94, 1, k)})` })}>
      <GlassPane id={`card${c.o.start}`} w={w} h={h} r={h * 0.3} sweep={sweep} onDark={onDark} fade={clamp(k * 2) * (1 - x)} soft={((1 - k) + x) * 10}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: `0 ${h * 0.2}px`, gap: h * 0.16 }}>
          <AppIcon s={h * 0.5} glyph={str(c, 'icon', 'spark')} a={str(c, 'from', GLASS.violet)} b={str(c, 'to', GLASS.cyan)} />
          <div style={{ fontFamily: LF.sans, color: onDark ? '#fff' : GLASS.ink }}>
            <div style={{ fontWeight: 650, fontSize: h * 0.2, letterSpacing: '-0.02em' }}>{str(c, 'title', 'Really excited')}</div>
            <div style={{ fontWeight: 400, fontSize: h * 0.13, opacity: 0.68 * e('silk', f, 6, 10), marginTop: h * 0.03 }}>{str(c, 'sub', 'something to share')}</div>
          </div>
        </div>
      </GlassPane>
    </div>
  );
};

/** iOS-style notifications drop in from the top and stack, newest on top, each on its time. */
const Notify: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8);
  const items = list(c, 'items', ['Session::Today’s session is live']).map((s) => s.split('::'));
  const times = list(c, 'times', []).map(Number);
  const w = px(c, opt(c, 'width', 900)), h = px(c, 170), top = c.H * opt(c, 'y', 0.15), onDark = dark(c.scene.set);
  return (
    <div style={abs((c.W - w) / 2, top, { width: w })}>
      {items.map(([title, text], i) => {
        const f0 = times[i] !== undefined ? fAt(c, times[i]) : i * 14;
        const k = e('premium', f, f0, 14), shown = items.filter((_, j) => j > i && f >= (times[j] !== undefined ? fAt(c, times[j]) : j * 14)).length;
        const push = shown * (h + px(c, 18)), s = 1 - shown * 0.04;
        if (f < f0) return null;
        return (
          <div key={i} style={abs(0, 0, { transform: `translateY(${(1 - k) * -h * 1.4 + push}px) scale(${lerp(0.9, s, k)})`, zIndex: 10 + i })}>
            <GlassPane id={`nt${c.o.start}${i}`} w={w} h={h} r={h * 0.28} blur={22} onDark={onDark} strength={40} fade={clamp(k * 2) * (1 - x) * (1 - shown * 0.25)} soft={(1 - k) * 10}>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: `0 ${h * 0.16}px`, gap: h * 0.14, fontFamily: LF.sans, color: onDark ? '#fff' : GLASS.ink }}>
                <AppIcon s={h * 0.5} glyph={str(c, 'icon', 'bell')} a={str(c, 'from', GLASS.pink)} b={str(c, 'to', GLASS.violet)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: h * 0.15, opacity: 0.6, fontWeight: 500 }}><span>{str(c, 'app', 'SESSION').toUpperCase()}</span><span>now</span></div>
                  <div style={{ fontWeight: 650, fontSize: h * 0.19, letterSpacing: '-0.01em' }}>{title}</div>
                  {text ? <div style={{ fontWeight: 400, fontSize: h * 0.16, opacity: 0.75 }}>{text}</div> : null}
                </div>
              </div>
            </GlassPane>
          </div>
        );
      })}
    </div>
  );
};

/** A hairline giant number counting up in a glass disc, a thin ring filling around it, the unit in the serif accent. */
const NumberFx: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const k = e('premium', f, 0, 16), cnt = e('glide', f, 4, opt(c, 'count', 26));
  const from = opt(c, 'from', 0), to = opt(c, 'to', 6), v = lerp(from, to, cnt);
  const dec = Number(c.o.decimals ?? (Math.round(to) === to ? 0 : 1));
  const d = px(c, opt(c, 'size', 560)), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.3), onDark = dark(c.scene.set);
  const col = onDark ? '#fff' : GLASS.ink, R = d * 0.46, L = 2 * Math.PI * R;
  return (
    <div style={abs(cx - d / 2, cy - d / 2, { transform: `${floatT(c, 2)} scale(${lerp(0.9, 1, k)})` })}>
      <GlassPane id={`num${c.o.start}`} w={d} h={d} r={d / 2} blur={14} strength={90} onDark={onDark} sweep={clamp((f - 20) / 16)} fade={clamp(k * 2) * (1 - x)} soft={((1 - k) + x) * 10}>
        <svg width={d} height={d} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <defs><linearGradient id={`rg${c.o.start}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={GLASS.cyan} /><stop offset="0.5" stopColor={GLASS.violet} /><stop offset="1" stopColor={GLASS.pink} /></linearGradient></defs>
          <circle cx={d / 2} cy={d / 2} r={R} fill="none" stroke={onDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,40,0.08)'} strokeWidth={d * 0.012} />
          <circle cx={d / 2} cy={d / 2} r={R} fill="none" stroke={`url(#rg${c.o.start})`} strokeWidth={d * 0.016} strokeLinecap="round"
            strokeDasharray={`${L * cnt * opt(c, 'ring', 1)} ${L}`} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: col, fontFamily: LF.sans }}>
          <div style={{ fontWeight: 200, fontSize: d * 0.36, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {str(c, 'prefix', '')}{v.toFixed(dec)}
          </div>
          <div style={{ fontFamily: LF.accent, fontStyle: 'italic', fontSize: d * 0.1, marginTop: -d * 0.01, opacity: e('silk', f, 10, 10) }}>{str(c, 'suffix', 'months')}</div>
          <div style={{ fontWeight: 500, fontSize: d * 0.045, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55 * e('silk', f, 14, 10), marginTop: d * 0.02 }}>{str(c, 'label', 'in the making')}</div>
        </div>
      </GlassPane>
    </div>
  );
};

/** A glass settings panel: rows with switches that turn on one by one (each on its word). */
const ListFx: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const rows = list(c, 'rows', ['Built', 'Tested', 'Ready to show']), times = list(c, 'times', []).map(Number);
  const w = px(c, opt(c, 'width', 780)), rh = px(c, 120), h = rh * rows.length + px(c, 40);
  const cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.66), onDark = dark(c.scene.set), k = e('premium', f, 0, 16);
  const col = onDark ? '#fff' : GLASS.ink;
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { transform: `${floatT(c, 3)} translateY(${(1 - k) * px(c, 100)}px)` })}>
      <GlassPane id={`ls${c.o.start}`} w={w} h={h} r={px(c, 56)} onDark={onDark} fade={clamp(k * 2) * (1 - x)} soft={((1 - k) + x) * 10}>
        <div style={{ padding: `${px(c, 20)}px ${px(c, 40)}px`, fontFamily: LF.sans, color: col }}>
          {rows.map((r, i) => {
            const on = e('glide', f, times[i] !== undefined ? fAt(c, times[i]) : 8 + i * 8, 7), seen = e('silk', f, 2 + i * 3, 10);
            return (
              <div key={i} style={{ height: rh, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: seen,
                borderBottom: i < rows.length - 1 ? `1px solid ${onDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,40,0.08)'}` : undefined }}>
                <span style={{ fontWeight: 550, fontSize: px(c, 46), letterSpacing: '-0.01em' }}>{r}</span>
                <div style={{ width: px(c, 120), height: px(c, 70), borderRadius: px(c, 35), position: 'relative',
                  background: `rgba(${lerp(120, 52, on)}, ${lerp(120, 199, on)}, ${lerp(130, 89, on)}, ${lerp(0.3, 1, on)})` }}>
                  <div style={abs(lerp(px(c, 5), px(c, 55), on), px(c, 5), { width: px(c, 60), height: px(c, 60), borderRadius: '50%', background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.2)' })} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassPane>
    </div>
  );
};

/** A specular sweep: a soft diagonal band of light crosses the whole frame once. */
const Sweep: React.FC<{ c: FxCtx }> = ({ c }) => {
  const k = e('glide', c.t / Math.max(0.1, c.d), 0, 1);
  return (
    <AbsoluteFill style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}>
      <div style={abs(lerp(-c.W, c.W * 1.4, k), -c.H * 0.2, { width: c.W * 0.5, height: c.H * 1.4, transform: 'rotate(20deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))', filter: `blur(${px(c, 30)}px)` })} />
    </AbsoluteFill>
  );
};

/** Floating glass orbs (depth elements made of glass) that bend the set behind them. */
const Orbs: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 14, 8), n = opt(c, 'count', 4);
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        const d = px(c, 120 + 160 * hash(i + 3)), k = e('premium', f, i * 4, 18);
        const ox = c.W * (i % 2 ? 0.86 - 0.1 * hash(i) : 0.1 + 0.1 * hash(i + 9)), oy = c.H * (0.2 + 0.55 * hash(i + 5));
        return (
          <div key={i} style={abs(ox - d / 2, oy - d / 2 + Math.sin(c.t * 0.8 + i) * px(c, 20), { transform: `scale(${lerp(0.6, 1, k)})` })}>
            <GlassPane id={`orb${c.o.start}${i}`} w={d} h={d} r={d / 2} blur={2} strength={d * 0.5} tint="rgba(255,255,255,0.04)" onDark={dark(c.scene.set)} fade={clamp(k * 2) * (1 - x)}>
              <div style={abs(d * 0.18, d * 0.12, { width: d * 0.34, height: d * 0.22, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)', transform: 'rotate(-30deg)' })} />
            </GlassPane>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const GLASS_LOOK_FX: Record<string, FxDef> = {
  'glass-title': {
    desc: 'GLASS - headline lines rise out of a mask and focus in from a blur, tracking tightening; *word* turns into the Instrument Serif italic accent',
    options: 'text (lines |, *accent*), y (0-1), size, sub (size of later lines, x first), weight, align, color',
    Screen: Title,
  },
  'glass-card': {
    desc: 'GLASS - a refractive glass card (icon, title, line) floating with a slow 3D tilt; a light sweep crosses it',
    options: 'title, sub, icon (spark|bolt|chart|check|lock|clock|heart|star|bell|rocket|play|user), from, to (icon colours), x, y, width, height',
    Front: Card,
  },
  'glass-notify': {
    desc: 'GLASS - iOS-style glass notifications drop in from the top and stack, newest on top',
    options: 'items ("Title::text|..."), times (|, anchors), app, icon, from, to, y, width',
    Front: Notify,
  },
  'glass-number': {
    desc: 'GLASS - a hairline giant number counts up inside a glass disc, a thin gradient ring filling around it',
    options: 'from, to, decimals, prefix, suffix (serif accent), label, ring (0-1), count (frames), x, y, size',
    Front: NumberFx,
  },
  'glass-list': {
    desc: 'GLASS - a glass settings panel whose switches turn on one by one, each on its word',
    options: 'rows (|), times (|, anchors), x, y, width',
    Front: ListFx,
  },
  'light-sweep': {
    desc: 'GLASS - a soft specular band of light crosses the whole frame once (a premium accent on a key word)',
    options: '(none: its length is the sweep)',
    Screen: Sweep,
  },
  'glass-orbs': {
    desc: 'GLASS - glass orbs float at the sides and bend the set behind them (depth that reads as glass)',
    options: 'count',
    Behind: Orbs,
  },
};
