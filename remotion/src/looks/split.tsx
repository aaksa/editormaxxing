import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { clamp, e, fAt, FxCtx, FxDef, hash, lerp, life, list, opt, px, str } from '../lib/core';
import { abs, Glyph } from './common';
import { LF, SPLIT } from './fonts';

// SPLIT - the screen-share explainer ("greenscreen explain"): the person sits small at the bottom (scene `place:
// "bottom"`), the top two thirds hold what they talk about - a screen, a chart, the steps, a before/after - and the
// visual changes every 4-6 s while the person stays put (the `swap` cut slides the world, not the person). Notes and
// arrows are hand-drawn (Caveat), numbers are mono, the rest is Inter. One accent colour.

const isDark = (set?: string) => set === 'slate';
const fg = (c: FxCtx) => (isDark(c.scene.set) ? '#F4F5F7' : SPLIT.ink);
const card = (c: FxCtx): React.CSSProperties => ({
  background: isDark(c.scene.set) ? '#1F2228' : '#FFFFFF', borderRadius: px(c, 36),
  boxShadow: `0 ${px(c, 30)}px ${px(c, 60)}px rgba(15,20,40,${isDark(c.scene.set) ? 0.5 : 0.14}), 0 0 0 1px rgba(15,20,40,0.06)`,
});
/** The visual's area: the top of the frame, above the person (y 0.16 - 0.56 by default). */
const area = (c: FxCtx) => ({ x: px(c, opt(c, 'margin', 70)), y: c.H * opt(c, 'top', 0.155), w: c.W - 2 * px(c, opt(c, 'margin', 70)), h: c.H * opt(c, 'height', 0.4) });
/** Every visual arrives the same calm way: up from below and into focus. */
const arrive = (c: FxCtx, f: number, x: number) => {
  const k = e('premium', f, 0, 14);
  return { transform: `translateY(${(1 - k) * px(c, 90) - x * px(c, 40)}px) scale(${lerp(0.96, 1, k)})`, opacity: clamp(k * 2) * (1 - x),
    filter: (1 - k) > 0.02 || x > 0 ? `blur(${((1 - k) + x) * 8}px)` : undefined } as React.CSSProperties;
};

// ---------------- sets ----------------
export const Board: React.FC<{ W: number; H: number; t: number; dark?: boolean }> = ({ W, H, t, dark }) => (
  <AbsoluteFill style={{ background: dark ? '#121418' : SPLIT.board }}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><pattern id={`dots${dark ? 'd' : 'l'}`} width={W / 24} height={W / 24} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${t * 6})`}>
        <circle cx={W / 48} cy={W / 48} r={W / 600} fill={dark ? '#3a3f49' : '#c9c6bd'} /></pattern></defs>
      <rect width={W} height={H} fill={`url(#dots${dark ? 'd' : 'l'})`} />
    </svg>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,${dark ? 0.5 : 0.08}) 100%)` }} />
  </AbsoluteFill>
);

// ---------------- effects ----------------
/** A stand-in screen when no `src` is given: a plausible app page drawn in grey blocks, with a highlighted metric. */
const MockUi: React.FC<{ w: number; h: number; dark: boolean; seed: number; label: string }> = ({ w, h, dark, seed, label }) => {
  const g = dark ? '#2d3139' : '#ECEDF1', g2 = dark ? '#3a3f49' : '#DCDEE4';
  return (
    <div style={{ width: w, height: h, padding: w * 0.04, boxSizing: 'border-box', display: 'flex', gap: w * 0.03 }}>
      <div style={{ width: w * 0.2, display: 'flex', flexDirection: 'column', gap: h * 0.04 }}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: h * 0.06, borderRadius: h * 0.02, background: i === 1 ? SPLIT.accent : g, opacity: i === 1 ? 0.9 : 1 }} />)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: h * 0.04 }}>
        <div style={{ height: h * 0.1, width: '55%', borderRadius: h * 0.02, background: g2 }} />
        <div style={{ display: 'flex', gap: w * 0.025 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: h * 0.24, borderRadius: h * 0.04, background: g, padding: h * 0.035, boxSizing: 'border-box' }}>
              <div style={{ fontFamily: LF.mono, fontWeight: 700, fontSize: h * 0.075, color: i === 1 ? SPLIT.accent : dark ? '#cfd3da' : '#3b3f47' }}>{i === 1 ? label : `${Math.round(20 + 70 * hash(seed + i))}%`}</div>
              <div style={{ height: h * 0.03, width: '70%', marginTop: h * 0.03, borderRadius: 4, background: g2 }} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, borderRadius: h * 0.04, background: g, display: 'flex', alignItems: 'flex-end', gap: w * 0.012, padding: h * 0.04 }}>
          {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ flex: 1, height: `${25 + 70 * hash(seed + i * 2)}%`, borderRadius: 4, background: i === 9 ? SPLIT.accent : g2 }} />)}
        </div>
      </div>
    </div>
  );
};

/** A screen in a browser (or phone) frame, a tag above it; optionally zooms into a region and boxes it. */
const Panel: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const A = area(c), chrome = str(c, 'chrome', 'browser'), dark = isDark(c.scene.set);
  const src = str(c, 'src', ''), bar = chrome === 'browser' ? px(c, 64) : 0;
  const w = A.w, h = A.h - px(c, 70), innerH = h - bar;
  const focus = c.o.focus ? String(c.o.focus).split(',').map(Number) : null;     // x, y, w, h in 0-1 of the screen
  const fk = focus ? e('glide', f, fAt(c, Number(c.o.focusAt ?? c.o.start + 1)), 16) : 0;
  const z = focus ? lerp(1, Math.min(2.6, 0.8 / Math.max(focus[2], focus[3])), fk) : 1;
  const ox = focus ? (focus[0] + focus[2] / 2) : 0.5, oy = focus ? (focus[1] + focus[3] / 2) : 0.5;
  const media: React.CSSProperties = { width: w, height: innerH, objectFit: 'cover', display: 'block' };
  return (
    <div style={abs(A.x, A.y, { width: w, ...arrive(c, f, x) })}>
      {c.o.tag ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: px(c, 14), marginBottom: px(c, 18), fontFamily: LF.sans, fontWeight: 700, fontSize: px(c, 36), color: fg(c) }}>
          <span style={{ background: SPLIT.accent, color: '#fff', borderRadius: px(c, 14), padding: `${px(c, 4)}px ${px(c, 16)}px`, fontSize: px(c, 30), letterSpacing: '0.04em' }}>{str(c, 'tag', '')}</span>
          {str(c, 'title', '')}
        </div>
      ) : null}
      <div style={{ ...card(c), width: w, height: h, overflow: 'hidden' }}>
        {bar ? (
          <div style={{ height: bar, display: 'flex', alignItems: 'center', gap: px(c, 12), padding: `0 ${px(c, 24)}px`, background: dark ? '#2a2e35' : '#F1F2F5' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((col) => <div key={col} style={{ width: px(c, 20), height: px(c, 20), borderRadius: '50%', background: col }} />)}
            <div style={{ flex: 1, marginLeft: px(c, 20), height: px(c, 36), borderRadius: px(c, 12), background: dark ? '#1c1f24' : '#fff', fontFamily: LF.mono,
              fontSize: px(c, 22), color: '#8a8f99', display: 'flex', alignItems: 'center', padding: `0 ${px(c, 16)}px` }}>{str(c, 'url', 'app.yoursite.com')}</div>
          </div>
        ) : null}
        <div style={{ width: w, height: innerH, overflow: 'hidden', position: 'relative' }}>
          <div style={{ transform: `scale(${z * (1 + 0.03 * clamp(c.t / c.d))})`, transformOrigin: `${ox * 100}% ${oy * 100}%` }}>
            {src ? (/\.(mp4|mov|webm|m4v)$/i.test(src) ? <OffthreadVideo muted src={staticFile(src)} style={media} /> : <Img src={staticFile(src)} style={media} />)
              : <MockUi w={w} h={innerH} dark={dark} seed={Math.round(c.o.start * 10)} label={str(c, 'metric', '+38%')} />}
          </div>
          {focus && fk > 0.95 ? (
            <div style={abs(w * (0.5 - focus[2] * z / 2), innerH * (0.5 - focus[3] * z / 2), { width: w * focus[2] * z, height: innerH * focus[3] * z,
              border: `${px(c, 6)}px solid ${SPLIT.note}`, borderRadius: px(c, 18), boxShadow: '0 0 0 9999px rgba(0,0,0,0.18)',
              opacity: e('silk', f, fAt(c, Number(c.o.focusAt ?? c.o.start + 1)) + 16, 6) })} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

/** Bars grow one after another to their values, the accent bar last, values counting in mono above them. */
const Chart: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const A = area(c), vals = list(c, 'values', ['12', '18', '25', '41']).map(Number), labels = list(c, 'labels', ['Jan', 'Feb', 'Mar', 'Apr']);
  const hi = opt(c, 'accent', vals.length - 1), max = Math.max(...vals) * 1.12, unit = str(c, 'unit', '');
  const ch = A.h - px(c, 220), bw = (A.w - px(c, 120)) / vals.length;
  return (
    <div style={abs(A.x, A.y, { width: A.w, height: A.h, ...card(c), padding: px(c, 50), boxSizing: 'border-box', ...arrive(c, f, x) })}>
      <div style={{ fontFamily: LF.sans, fontWeight: 700, fontSize: px(c, 46), color: fg(c), letterSpacing: '-0.02em' }}>{str(c, 'title', 'Growth')}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: ch, marginTop: px(c, 30), gap: bw * 0.22 }}>
        {vals.map((v, i) => {
          const k = e('premium', f, 4 + i * 3, 11), on = i === hi;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontFamily: LF.mono, fontWeight: 700, fontSize: px(c, on ? 40 : 30), color: on ? SPLIT.accent : '#8a8f99', opacity: clamp(k * 2) }}>{Math.round(v * k)}{unit}</div>
              <div style={{ width: '100%', height: (v / max) * (ch - px(c, 60)) * k, borderRadius: px(c, 14), background: on ? SPLIT.accent : isDark(c.scene.set) ? '#3a3f49' : '#DADCE2', marginTop: px(c, 10) }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: bw * 0.22, marginTop: px(c, 14) }}>
        {labels.map((l, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: LF.sans, fontWeight: 500, fontSize: px(c, 28), color: '#8a8f99' }}>{l}</div>)}
      </div>
    </div>
  );
};

/** Numbered steps: each lands on its time, the current one lit in the accent, the done ones ticked. */
const Steps: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const A = area(c), items = list(c, 'items', ['Plan', 'Build', 'Test', 'Launch']), times = list(c, 'times', []).map(Number);
  const at = (i: number) => (times[i] !== undefined ? fAt(c, times[i]) : 6 + i * 12);
  let cur = -1; items.forEach((_, i) => { if (f >= at(i)) cur = i; });
  const rh = Math.min(px(c, 150), (A.h - px(c, 110)) / items.length);
  return (
    <div style={abs(A.x, A.y, { width: A.w, ...arrive(c, f, x) })}>
      <div style={{ fontFamily: LF.sans, fontWeight: 700, fontSize: px(c, 50), color: fg(c), marginBottom: px(c, 24), letterSpacing: '-0.02em' }}>{str(c, 'title', 'The plan')}</div>
      {items.map((it, i) => {
        const k = e('premium', f, at(i), 12), done = i < cur, now = i === cur;
        return (
          <div key={i} style={{ ...card(c), height: rh - px(c, 18), marginBottom: px(c, 18), display: 'flex', alignItems: 'center', gap: px(c, 28), padding: `0 ${px(c, 32)}px`,
            transform: `translateX(${(1 - k) * px(c, 80)}px)`, opacity: f >= at(i) ? clamp(k * 2) : 0.0, outline: now ? `${px(c, 5)}px solid ${SPLIT.accent}` : undefined }}>
            <div style={{ width: px(c, 70), height: px(c, 70), borderRadius: '50%', background: done ? SPLIT.good : now ? SPLIT.accent : '#DADCE2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: LF.mono, fontWeight: 700, fontSize: px(c, 34), color: '#fff' }}>{done ? <Glyph name="check" size={px(c, 40)} color="#fff" width={3} /> : i + 1}</div>
            <div style={{ fontFamily: LF.sans, fontWeight: now ? 700 : 550, fontSize: px(c, 46), color: done ? '#8a8f99' : fg(c), textDecoration: done ? 'line-through' : undefined }}>{it}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Before / after: two columns, rows landing in pairs, the left crossed in red, the right ticked in green. */
const Compare: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 12, 8);
  const A = area(c), rows = list(c, 'rows', ['Guessing::Testing', 'Months::Days']).map((r) => r.split('::')), times = list(c, 'times', []).map(Number);
  const colW = (A.w - px(c, 30)) / 2;
  const head = (t: string, col: string) => <div style={{ fontFamily: LF.sans, fontWeight: 800, fontSize: px(c, 48), color: col, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: px(c, 18) }}>{t}</div>;
  return (
    <div style={abs(A.x, A.y, { width: A.w, display: 'flex', gap: px(c, 30), ...arrive(c, f, x) })}>
      {[0, 1].map((side) => (
        <div key={side} style={{ ...card(c), width: colW, padding: px(c, 36), boxSizing: 'border-box' }}>
          {head(str(c, side ? 'right' : 'left', side ? 'After' : 'Before'), side ? SPLIT.good : SPLIT.bad)}
          {rows.map((r, i) => {
            const k = e('premium', f, (times[i] !== undefined ? fAt(c, times[i]) : 8 + i * 10) + side * 4, 12);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px(c, 18), padding: `${px(c, 22)}px 0`, opacity: clamp(k * 2), transform: `translateY(${(1 - k) * px(c, 30)}px)` }}>
                <div style={{ width: px(c, 60), height: px(c, 60), borderRadius: '50%', background: side ? SPLIT.good : SPLIT.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {side ? <Glyph name="check" size={px(c, 30)} color="#fff" width={3.2} /> : <svg width={px(c, 26)} height={px(c, 26)} viewBox="0 0 24 24"><path d="M5 5 L19 19 M19 5 L5 19" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" /></svg>}
                </div>
                <div style={{ fontFamily: LF.sans, fontWeight: 650, fontSize: px(c, 50), color: fg(c), letterSpacing: '-0.01em' }}>{r[side] ?? ''}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** A hand-written note with an arrow drawing itself to a point (on the person, a panel, anything). */
const Arrow: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 4, 6);
  const from = String(c.o.from ?? '0.7,0.62').split(',').map(Number), to = String(c.o.to ?? '0.55,0.45').split(',').map(Number);
  const X0 = from[0] * c.W, Y0 = from[1] * c.H, X1 = to[0] * c.W, Y1 = to[1] * c.H;
  const bend = opt(c, 'bend', 0.3), mx = (X0 + X1) / 2 + (Y1 - Y0) * bend, my = (Y0 + Y1) / 2 - (X1 - X0) * bend;
  const k = e('power2.out', f, 4, 9), len = Math.hypot(X1 - X0, Y1 - Y0) * 1.3;
  const ang = Math.atan2(Y1 - my, X1 - mx), hl = px(c, 36);
  const col = str(c, 'color', SPLIT.note), wob = (i: number) => (hash(i + Math.floor(f / 2)) - 0.5) * px(c, 1.5);
  const text = str(c, 'text', 'big news here!'), typed = Math.ceil(clamp(f / Math.max(1, text.length * 0.5)) * text.length);
  return (
    <AbsoluteFill style={{ opacity: 1 - x }}>
      <svg width={c.W} height={c.H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={`M ${X0} ${Y0} Q ${mx} ${my} ${X1 + wob(1)} ${Y1 + wob(2)}`} fill="none" stroke={col} strokeWidth={px(c, 9)} strokeLinecap="round"
          strokeDasharray={`${len * k} ${len * 2}`} />
        {k > 0.95 ? <path d={`M ${X1 - hl * Math.cos(ang - 0.5)} ${Y1 - hl * Math.sin(ang - 0.5)} L ${X1} ${Y1} L ${X1 - hl * Math.cos(ang + 0.5)} ${Y1 - hl * Math.sin(ang + 0.5)}`}
          fill="none" stroke={col} strokeWidth={px(c, 9)} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      <div style={abs(X0, Y0 + px(c, 10), { transform: `translateX(-50%) rotate(${opt(c, 'tilt', -4)}deg)`, fontFamily: LF.hand, fontWeight: 700, fontSize: px(c, opt(c, 'size', 76)),
        color: col, whiteSpace: 'nowrap', textShadow: '0 2px 0 rgba(255,255,255,0.6)' })}>{text.slice(0, typed)}</div>
    </AbsoluteFill>
  );
};

/** A name / topic strip at the person's chest: the bottom-of-frame label of a screen-share explainer. */
const Lower: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8), k = e('premium', f, 0, 12);
  return (
    <div style={abs(px(c, 70), c.H * opt(c, 'y', 0.6), { transform: `translateX(${(1 - k) * -px(c, 200)}px)`, opacity: clamp(k * 2) * (1 - x), display: 'flex', alignItems: 'stretch',
      boxShadow: '0 12px 30px rgba(0,0,0,0.18)', borderRadius: px(c, 18), overflow: 'hidden' })}>
      <div style={{ width: px(c, 14), background: SPLIT.accent }} />
      <div style={{ background: '#fff', padding: `${px(c, 14)}px ${px(c, 26)}px`, fontFamily: LF.sans }}>
        <div style={{ fontWeight: 750, fontSize: px(c, 40), color: SPLIT.ink }}>{str(c, 'text', 'Session')}</div>
        {c.o.sub ? <div style={{ fontWeight: 500, fontSize: px(c, 28), color: '#6b7079' }}>{str(c, 'sub', '')}</div> : null}
      </div>
    </div>
  );
};

export const SPLIT_FX: Record<string, FxDef> = {
  panel: {
    desc: 'SPLIT - a screen (image, clip or a drawn stand-in app) in a browser frame in the top of the frame, a tag above it; can zoom into a region and box it on a word',
    options: 'src, chrome (browser|plain), url, tag, title, metric (stand-in), focus ("x,y,w,h" in 0-1), focusAt, top, height (0-1), margin',
    Behind: Panel,
  },
  chart: {
    desc: 'SPLIT - a bar chart card: bars grow one after another, values counting in mono, the accent bar lit',
    options: 'title, values (|), labels (|), unit, accent (index), top, height',
    Behind: Chart,
  },
  steps: {
    desc: 'SPLIT - numbered steps land on their words; the current one is outlined in the accent, the done ones ticked and struck',
    options: 'title, items (|), times (|, anchors), top, height',
    Behind: Steps,
  },
  compare: {
    desc: 'SPLIT - before / after columns: rows land in pairs, crossed in red on the left, ticked in green on the right',
    options: 'left, right (titles), rows ("before::after|..."), times (|), top, height',
    Behind: Compare,
  },
  'arrow-note': {
    desc: 'SPLIT - a hand-written note with an arrow drawing itself to a point',
    options: 'text, from ("x,y" 0-1), to ("x,y"), bend, color, size, tilt',
    Screen: Arrow,
  },
  'lower-third': {
    desc: 'SPLIT - a name or topic strip by the person (accent edge, title, line)',
    options: 'text, sub, y',
    Front: Lower,
  },
};
