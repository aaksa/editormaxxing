import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { clamp, e, FxCtx, FxDef, hash, lerp, life, list, opt, over, px, str } from '../lib/core';
import { C, FONT } from '../lib/fonts';

const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: x, top: y, ...extra });

// ---------------- magnifier: a lens scanning a frosted glass board ----------------
// Two stacked glass cards hold an audit: a red tab, rows with a mark each and a small chart. A chrome-rimmed lens travels
// from row to row; under the lens the board is drawn again, magnified, and each row's verdict (a red cross or a check)
// pops in as the lens reaches it. Everything is DOM + SVG, so the magnified copy is exact.

type BoardProps = { title: string; rows: string[]; marks: string[]; shown: number; w: number; h: number };
const Board: React.FC<BoardProps> = ({ title, rows, marks, shown, w, h }) => {
  const u = w / 640;
  return (
    <div style={{ width: w, height: h, position: 'relative', fontFamily: FONT.round }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${28 * u}px, ${-30 * u}px) rotate(5deg)`, borderRadius: 44 * u,
        background: 'linear-gradient(150deg, rgba(255,255,255,0.75), rgba(255,236,236,0.45))', border: `${2 * u}px solid rgba(255,255,255,0.9)`,
        boxShadow: `0 ${30 * u}px ${60 * u}px rgba(160,40,40,0.18)` }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 44 * u, overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,242,242,0.78) 60%, rgba(255,226,226,0.7) 100%)',
        border: `${2.5 * u}px solid rgba(255,255,255,0.95)`, boxShadow: `0 ${40 * u}px ${70 * u}px rgba(150,20,20,0.22), inset 0 ${2 * u}px 0 #fff` }}>
        <div style={{ position: 'absolute', left: 44 * u, top: 40 * u, display: 'flex', alignItems: 'center', gap: 16 * u }}>
          <div style={{ width: 56 * u, height: 56 * u, borderRadius: 14 * u, background: `linear-gradient(160deg, ${C.redHi}, ${C.redDeep})`,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5 * u, padding: 10 * u, boxSizing: 'border-box' }}>
            {[0.4, 0.7, 1].map((k, i) => <div key={i} style={{ width: 8 * u, height: 34 * u * k, background: '#fff', borderRadius: 2 * u }} />)}
          </div>
          <div style={{ fontWeight: 800, fontSize: 46 * u, color: C.red }}>{title}</div>
        </div>
        {rows.map((r, i) => {
          const bad = (marks[i] ?? 'ok') === 'bad';
          const k = clamp(shown - i);                         // 0..1 as the lens reaches row i
          const pop = e('back.out(2)', k, 0, 1);
          return (
            <div key={i} style={{ position: 'absolute', left: 44 * u, top: (150 + i * 96) * u, width: w - 88 * u, height: 70 * u,
              display: 'flex', alignItems: 'center', gap: 22 * u, borderRadius: 18 * u,
              background: k > 0.5 && bad ? 'rgba(242,15,20,0.08)' : 'rgba(255,255,255,0.5)' }}>
              <div style={{ width: 52 * u, height: 52 * u, borderRadius: '50%', border: `${4 * u}px solid ${bad && k > 0 ? C.red : '#e3b9b9'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', flexShrink: 0 }}>
                <svg width={30 * u} height={30 * u} viewBox="0 0 24 24" style={{ transform: `scale(${pop})` }}>
                  {bad ? <path d="M5 5 L19 19 M19 5 L5 19" stroke={C.red} strokeWidth="4" strokeLinecap="round" />
                    : <path d="M4 12.5 L10 18 L20 6" stroke={C.red} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 30 * u, color: '#4a3434', whiteSpace: 'nowrap' }}>{r}</div>
              <div style={{ flex: 1, height: 10 * u, borderRadius: 5 * u, background: 'rgba(160,1,1,0.12)' }} />
            </div>
          );
        })}
        <div style={{ position: 'absolute', right: 44 * u, bottom: 40 * u, display: 'flex', alignItems: 'flex-end', gap: 10 * u }}>
          {[0.35, 0.6, 0.45, 0.85, 1].map((k, i) => (
            <div key={i} style={{ width: 26 * u, height: 90 * u * k, borderRadius: 6 * u, background: i === 4 ? C.red : 'rgba(160,1,1,0.35)' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Lens: React.FC<{ x: number; y: number; r: number; u: number }> = ({ x, y, r, u }) => (
  <svg width={r * 4} height={r * 4} viewBox={`${-r * 1.4} ${-r * 1.4} ${r * 4} ${r * 4}`} style={abs(x - r * 1.4, y - r * 1.4, { overflow: 'visible' })}>
    <defs>
      <linearGradient id="lensRim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#A9A9AE" /><stop offset="0.6" stopColor="#F4F4F6" /><stop offset="1" stopColor="#6E6E74" />
      </linearGradient>
      <radialGradient id="lensGlass" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#fff" stopOpacity="0.45" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    </defs>
    {/* handle: collar, then a black grip, down and to the right */}
    <g transform="rotate(42)">
      <rect x={r * 1.0} y={-r * 0.13} width={r * 0.32} height={r * 0.26} rx={r * 0.05} fill="url(#lensRim)" />
      <rect x={r * 1.3} y={-r * 0.15} width={r * 1.25} height={r * 0.3} rx={r * 0.15} fill="#1b1b1d" />
      <rect x={r * 1.35} y={-r * 0.1} width={r * 1.1} height={r * 0.06} rx={r * 0.03} fill="#fff" opacity="0.18" />
    </g>
    <circle r={r} fill="url(#lensGlass)" />
    <circle r={r} fill="none" stroke="url(#lensRim)" strokeWidth={r * 0.13} />
    <circle r={r * 0.94} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={2 * u} />
    <path d={`M ${-r * 0.62} ${-r * 0.45} A ${r * 0.78} ${r * 0.78} 0 0 1 ${-r * 0.1} ${-r * 0.76}`} stroke="#fff" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

const Magnifier: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x, total } = life(c, 10, 9);
  const title = str(c, 'title', 'Audit bisnis');
  const rows = list(c, 'rows', ['Iklan', 'Leads', 'Follow-up', 'Closing']);
  const marks = list(c, 'marks', ['ok', 'bad', 'bad', 'ok']);
  const w = px(c, opt(c, 'width', 680)), h = w * (0.4 + rows.length * 0.15);
  const u = w / 640;
  const bx = c.W / 2 - w / 2, by = c.H * opt(c, 'y', 0.5) - h / 2;
  // the lens: enters from the lower right, visits each row, leaves
  const visitF = (i: number) => 10 + ((total - 24) * (i + 0.5)) / rows.length;
  const rowPt = (i: number) => ({ x: bx + 70 * u, y: by + (186 + i * 96) * u });
  let lx = c.W * 1.1, ly = c.H * 0.85, shown = 0;
  const pts = rows.map((_, i) => rowPt(i));
  for (let i = 0; i < rows.length; i++) {
    const t0 = i === 0 ? 4 : visitF(i - 1) + 4, t1 = visitF(i);
    const k = e('power2.inOut', f, t0, Math.max(1, t1 - t0 - 2));
    const from = i === 0 ? { x: c.W * 1.1, y: c.H * 0.85 } : pts[i - 1];
    if (f >= t0) { lx = lerp(from.x, pts[i].x, k); ly = lerp(from.y, pts[i].y, k); }
    if (f >= t1 - 2) shown = i + clamp((f - (t1 - 2)) / 4);
  }
  const leave = e('power2.in', f, total - 10, 10);
  lx += leave * c.W * 0.6; ly += leave * c.H * 0.3;
  const r = px(c, opt(c, 'lens', 120)), mag = opt(c, 'zoom', 1.75);
  const sway = Math.sin(f / c.fps * 2.2) * px(c, 5);
  const enter = `perspective(${px(c, 1800)}px) rotateX(${lerp(26, 9, a)}deg) rotateZ(${lerp(-10, -3, a)}deg) scale(${over(a, 1.35) * (1 - x * 0.1)})`;
  const board = <Board title={title} rows={rows} marks={marks} shown={shown} w={w} h={h} />;
  return (
    <AbsoluteFill style={{ opacity: clamp(f / 2) * (1 - x), filter: x > 0 ? `blur(${x * 10}px)` : undefined }}>
      <AbsoluteFill style={{ transform: enter, transformOrigin: `${c.W / 2}px ${c.H * 0.5}px` }}>
        <div style={abs(bx, by)}>{board}</div>
        {/* the magnified copy, seen only inside the lens */}
        <AbsoluteFill style={{ clipPath: `circle(${r * 0.94}px at ${lx}px ${ly + sway}px)` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.35)' }} />
          <div style={abs(bx, by, { transform: `translate(${lx - bx}px, ${ly + sway - by}px) scale(${mag}) translate(${-(lx - bx)}px, ${-(ly + sway - by)}px)`, transformOrigin: '0 0' })}>{board}</div>
        </AbsoluteFill>
        <Lens x={lx} y={ly + sway} r={r} u={u} />
      </AbsoluteFill>
      {str(c, 'caption', '') ? (
        <div style={abs(c.W / 2, by + h + px(c, 70), { transform: 'translateX(-50%)', fontFamily: FONT.round, fontWeight: 600, fontSize: px(c, 34),
          color: '#5a4040', whiteSpace: 'nowrap', opacity: e('power2.out', f, 12, 10) })}>{str(c, 'caption', '')}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------- chevrons: three red chevrons pulsing down the chest ----------------
const Chevrons: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 7, 8);
  const n = opt(c, 'count', 3);
  const cx = c.face.x, cy = c.H * opt(c, 'y', 0) || c.face.y + c.face.w * opt(c, 'below', 2.3);
  const s = px(c, opt(c, 'size', 110));
  const t = f / c.fps;
  return (
    <AbsoluteFill style={{ opacity: clamp(f / 2) * (1 - x), transform: `scale(${over(a, 1.4)})`, transformOrigin: `${cx}px ${cy}px` }}>
      {Array.from({ length: n }, (_, i) => {
        const wave = (t * 1.6 - i * 0.22) % 1, glow = Math.pow(Math.sin(Math.PI * clamp(wave)), 2);
        return (
          <svg key={i} width={s * 1.6} height={s} viewBox="0 0 160 100" style={abs(cx - s * 0.8, cy + i * s * 0.55, {
            opacity: 0.35 + 0.65 * glow, filter: `drop-shadow(0 ${px(c, 4)}px ${px(c, 8)}px rgba(140,0,0,${0.3 + 0.3 * glow}))` })}>
            <defs><linearGradient id={`chv${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.redHi} /><stop offset="1" stopColor={C.redDeep} /></linearGradient></defs>
            <path d="M14 18 L80 72 L146 18" stroke={`url(#chv${i})`} strokeWidth="26" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- torn-note: a torn sheet pinned to the set, with chips floating around it ----------------
const tornPath = (w: number, h: number, seed: number) => {
  const step = w / 28, j = (i: number) => (hash(seed + i) - 0.5) * h * 0.06;
  let d = `M 0 ${j(0)}`;
  for (let i = 1; i <= 28; i++) d += ` L ${i * step} ${j(i)}`;
  for (let i = 1; i <= 16; i++) d += ` L ${w + j(i + 40) * 0.6} ${(i * h) / 16}`;
  for (let i = 27; i >= 0; i--) d += ` L ${i * step} ${h + j(i + 80)}`;
  for (let i = 15; i >= 1; i--) d += ` L ${j(i + 120) * 0.6} ${(i * h) / 16}`;
  return d + ' Z';
};
const ChipIcon: React.FC<{ kind: number; s: number }> = ({ kind, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    {kind % 3 === 0 ? <g fill={C.red}><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></g>
      : kind % 3 === 1 ? <path d="M3 10 L14 5 L14 19 L3 14 Z M14 8 L20 6 M14 16 L20 18" stroke={C.red} strokeWidth="2.2" fill={C.red} strokeLinejoin="round" />
        : <g><circle cx="12" cy="12" r="9" fill="none" stroke={C.red} strokeWidth="2.5" /><path d="M10 8 L16 12 L10 16 Z" fill={C.red} /></g>}
  </svg>
);
const TornNote: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 10, 8);
  const w = px(c, opt(c, 'width', 560)), h = w * 0.62;
  const cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.24);
  const t = f / c.fps;
  const flutter = Math.sin(f * 0.9) * 6 * Math.exp(-f / 9);            // the paper settles after the pin goes in
  const rot = lerp(-16, opt(c, 'tilt', -3), a) + flutter * 0.4;
  const subs = list(c, 'sub', []);
  const chips = list(c, 'chips', []);
  return (
    <AbsoluteFill style={{ opacity: clamp(f / 2) * (1 - x), filter: x > 0 ? `blur(${x * 10}px)` : undefined }}>
      {chips.map((ch, i) => {
        // chips sit on alternating sides of the note, stepping down, never behind it
        const SLOTS = [[-0.62, 0.05], [0.64, 0.3], [-0.56, 0.68], [0.6, 0.9]];
        const [sx, sy] = SLOTS[i % SLOTS.length], k = e('expo.out', f, 6 + i * 3, 9);
        const px_ = cx + sx * w, py = cy + (sy - 0.25) * h + Math.sin(t * 1.4 + i) * px(c, 8);
        return (
          <div key={i} style={abs(px_, py, { transform: `translate(-50%, -50%) scale(${over(k, 1.4)}) rotate(${(hash(i + 2) - 0.5) * 14}deg)`,
            opacity: clamp((f - 6 - i * 3) / 2), display: 'flex', alignItems: 'center', gap: px(c, 10), padding: `${px(c, 12)}px ${px(c, 18)}px`,
            borderRadius: px(c, 18), background: 'rgba(255,255,255,0.88)', boxShadow: `0 ${px(c, 14)}px ${px(c, 30)}px rgba(0,0,0,0.25)`,
            fontFamily: FONT.round, fontWeight: 700, fontSize: px(c, 26), color: '#3a2a2a', whiteSpace: 'nowrap' })}>
            <ChipIcon kind={i} s={px(c, 34)} />{ch}
          </div>
        );
      })}
      <div style={abs(cx, cy + lerp(-c.H * 0.25, 0, a), { transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${over(a, 1.25)})`,
        transformOrigin: '50% 0%', width: w, height: h })}>
        <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 ${px(c, 18)}px ${px(c, 22)}px rgba(0,0,0,0.3))` }}>
          <defs><linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBF8F1" /><stop offset="1" stopColor="#E9E3D6" /></linearGradient></defs>
          <path d={tornPath(w, h, 3)} fill="url(#paperG)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.round }}>
          <div style={{ fontWeight: 800, fontSize: px(c, opt(c, 'size', 120)), color: C.red, lineHeight: 1 }}>{str(c, 'text', '4 tahun')}</div>
          {subs.map((s, i) => (
            <div key={i} style={{ fontWeight: 600, fontSize: px(c, 32), color: '#4a3a3a', marginTop: px(c, i ? 2 : 14),
              opacity: e('power2.out', f, 10 + i * 4, 8) }}>{s}</div>
          ))}
        </div>
        {/* the pin */}
        <svg width={px(c, 70)} height={px(c, 70)} viewBox="0 0 40 40" style={abs(w / 2 - px(c, 35), -px(c, 28))}>
          <defs><radialGradient id="pinG" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#FF7A7A" /><stop offset="0.5" stopColor={C.red} /><stop offset="1" stopColor={C.redInk} /></radialGradient></defs>
          <ellipse cx="22" cy="30" rx="9" ry="3" fill="rgba(0,0,0,0.25)" />
          <circle cx="20" cy="18" r="12" fill="url(#pinG)" />
          <circle cx="16" cy="13" r="3.5" fill="#fff" opacity="0.6" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- broll: a cutaway image or clip with a slow Ken Burns ----------------
// `src` is copied into the job by emx.py. Without one, a labelled stand-in panel shows where the cutaway goes.
const Broll: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, total } = life(c, 6, 6);
  const k = clamp(f / Math.max(1, total));
  const s = lerp(opt(c, 'from', 1.12), opt(c, 'to', 1.0), e('sine.inOut', k, 0, 1));
  const pan = lerp(-1, 1, k) * px(c, opt(c, 'pan', 20));
  const src = str(c, 'src', '');
  const media: React.CSSProperties = { width: c.W, height: c.H, objectFit: 'cover', position: 'absolute', inset: 0 };
  return (
    <AbsoluteFill style={{ transform: `translateX(${pan}px) scale(${s})` }}>
      {src ? (/\.(mp4|mov|webm|m4v)$/i.test(src) ? <OffthreadVideo muted src={staticFile(src)} style={media} /> : <Img src={staticFile(src)} style={media} />)
        : (
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #3b2a26 0%, #120c0b 75%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: px(c, 34), letterSpacing: px(c, 6), color: 'rgba(255,255,255,0.35)',
              border: '2px dashed rgba(255,255,255,0.25)', padding: `${px(c, 24)}px ${px(c, 36)}px`, borderRadius: px(c, 20) }}>B-ROLL · {str(c, 'label', 'your cutaway')}</div>
          </AbsoluteFill>
        )}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${opt(c, 'vignette', 0.55)}) 100%)` }} />
    </AbsoluteFill>
  );
};

export const EXTRA_FX: Record<string, FxDef> = {
  magnifier: {
    desc: 'A chrome lens scans a frosted glass audit board row by row, magnifying it; each row gets its verdict (check or cross) as the lens arrives',
    options: 'title, rows (|), marks (ok|bad per row), caption, y (0-1), width, lens (radius px), zoom',
    Screen: Magnifier,
  },
  chevrons: {
    desc: 'Red chevrons pulse down the chest in a cascade (a "look here / this way" accent under a headline)',
    options: 'count, size, below (x face width under the face), y (0-1)',
    Front: Chevrons,
  },
  'torn-note': {
    desc: 'A torn sheet drops in and is pinned: a big red line and small lines under it, with glass chips (icon + label) floating around',
    options: 'text, sub (|), chips (|), x, y (0-1), width, size, tilt',
    Front: TornNote,
  },
  broll: {
    desc: 'A cutaway image or clip under the type, with a slow Ken Burns push and a vignette (a labelled stand-in until src is given)',
    options: 'src (image or video file), label, from, to (scale), pan (px), vignette (0-1)',
    Behind: Broll,
  },
};

