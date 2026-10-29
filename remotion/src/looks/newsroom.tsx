import React, { useMemo } from 'react';
import { AbsoluteFill, OffthreadVideo, Img, staticFile } from 'remotion';
import { Circle, Highlight, Underline } from '@remotion/rough-notation';
import { geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { clamp, e, fAt, FxCtx, FxDef, hash, lerp, life, list, LOOK, opt, px, str } from '../lib/core';
import { abs, Greek, PaperFill, tornRect } from './common';
import { LF, NEWS } from './fonts';

// NEWSROOM - the documentary look (Johnny Harris / Vox): the person is a clipping on a printed world. Cream newsprint,
// a blackletter masthead, greeked columns, a yellow highlighter sweeping the key words, a red pen circling them, moving
// photos inside the page, a map with a dotted route, redaction bars, a rubber stamp, a typewriter lower third. The
// graphics animate on twelve frames a second (`step: 12`), the stepped hand-made feel of that look; the camera and the
// person stay smooth. The grade (grain, warm paper tone, gate weave, light leak) is in looks/index.tsx.

const paperName = () => LOOK.hud.paper ?? 'The Daily Session';
const dateLine = () => LOOK.hud.date ?? 'Thursday, October 29, 2026';

/** Words wrapped as `[word]` get the annotation; the rest is plain. */
const marked = (text: string, mark: (w: string, i: number) => React.ReactNode) =>
  text.split(/(\[[^\]]+\])/).filter(Boolean).map((part, i) => (part.startsWith('[') ? <React.Fragment key={i}>{mark(part.slice(1, -1), i)}</React.Fragment> : <span key={i}>{part}</span>));

// ---------------- sets ----------------
/** A broadsheet front page fills the wall: masthead, rules, columns, photo boxes. The person stands in front of it. */
export const Newsprint: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => {
  const m = W * 0.06, cw = W - m * 2;
  return (
    <AbsoluteFill style={{ background: NEWS.paper, transform: `rotate(${-1.2 + Math.sin(t * 0.3) * 0.15}deg) scale(1.06)` }}>
      <PaperFill w={W} h={H} id="np" color={NEWS.paper} seed={3} />
      <div style={abs(m, H * 0.135, { width: cw, textAlign: 'center', color: NEWS.ink })}>
        <div style={{ borderTop: `${W * 0.004}px solid ${NEWS.ink}`, borderBottom: `${W * 0.0015}px solid ${NEWS.ink}`, height: W * 0.006 }} />
        <div style={{ fontFamily: LF.masthead, fontSize: W * 0.105, lineHeight: 1.15, opacity: 0.92 }}>{paperName()}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LF.book, fontSize: W * 0.019, borderTop: `${W * 0.0015}px solid ${NEWS.ink}`,
          borderBottom: `${W * 0.004}px solid ${NEWS.ink}`, padding: `${W * 0.006}px 0` }}>
          <span>VOL. CXII · No. 302</span><span>{dateLine()}</span><span>PRICE 5,000</span>
        </div>
      </div>
      <div style={abs(m, H * 0.255, { width: cw, display: 'flex', gap: W * 0.03, opacity: 0.55 })}>
        <div style={{ width: cw * 0.62 }}>
          <div style={{ height: H * 0.2, background: 'linear-gradient(160deg, #b9ae98, #8d826d)', filter: 'contrast(1.1)', marginBottom: W * 0.02 }} />
          <Greek w={cw * 0.62} h={H * 0.5} cols={3} line={W * 0.0085} seed={5} color="#7d7465" />
        </div>
        <div style={{ width: cw * 0.35 }}>
          <div style={{ fontFamily: LF.didone, fontWeight: 900, fontSize: W * 0.04, lineHeight: 1.05, color: NEWS.ink, marginBottom: W * 0.015 }}>Markets steady as season turns</div>
          <Greek w={cw * 0.35} h={H * 0.6} cols={1} line={W * 0.0085} seed={9} color="#7d7465" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A cork evidence board: pinned scraps and red string, softly out of focus behind the person. */
export const Evidence: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => {
  const scraps = [[0.12, 0.2, 0.26, 0.15, -6], [0.7, 0.16, 0.24, 0.18, 5], [0.08, 0.62, 0.22, 0.16, 4], [0.74, 0.58, 0.22, 0.2, -4], [0.42, 0.08, 0.2, 0.1, 2]];
  const pin = (x: number, y: number) => [x * W, y * H] as const;
  return (
    <AbsoluteFill style={{ background: '#9B6B3F' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <filter id="cork"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed={4} />
          <feColorMatrix values="0 0 0 0 0.28  0 0 0 0 0.16  0 0 0 0 0.07  0 0 0 1.4 -0.45" /></filter>
        <rect width={W} height={H} filter="url(#cork)" />
      </svg>
      <AbsoluteFill style={{ filter: `blur(${W * 0.004}px)` }}>
        {scraps.map(([x, y, w, h, r], i) => (
          <div key={i} style={abs(x * W, y * H, { width: w * W, height: h * H, transform: `rotate(${r + Math.sin(t * 0.5 + i) * 0.4}deg)`,
            boxShadow: '0 10px 18px rgba(0,0,0,0.35)' })}>
            <PaperFill w={w * W} h={h * H} id={`ev${i}`} color={i % 2 ? '#F2EBDC' : '#E9DFC4'} seed={i + 2} />
            <div style={abs(w * W * 0.1, h * H * 0.14)}><Greek w={w * W * 0.8} h={h * H * 0.7} cols={1} line={W * 0.008} seed={i * 13} color="#8a8170" /></div>
          </div>
        ))}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {[[0, 1], [1, 3], [0, 2], [2, 3], [4, 1]].map(([a, b], i) => {
            const A = pin(scraps[a][0] + 0.04, scraps[a][1] + 0.01), B = pin(scraps[b][0] + 0.04, scraps[b][1] + 0.01);
            return <path key={i} d={`M ${A[0]} ${A[1]} Q ${(A[0] + B[0]) / 2} ${(A[1] + B[1]) / 2 + H * 0.03} ${B[0]} ${B[1]}`} stroke={NEWS.string} strokeWidth={W * 0.004} fill="none" />;
          })}
          {scraps.map(([x, y], i) => <circle key={i} cx={(x + 0.04) * W} cy={(y + 0.01) * H} r={W * 0.011} fill="#D52B22" stroke="#7a0f0a" strokeWidth={2} />)}
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 45%, rgba(0,0,0,0) 45%, rgba(20,8,0,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

/** A dark archive desk under a warm lamp: the moody interview room of a documentary. */
export const Archive: React.FC<{ W: number; H: number; t: number }> = ({ W, H, t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at ${48 + Math.sin(t * 0.35) * 3}% 30%, #6b4a2c 0%, #2b1c11 55%, #120b06 100%)` }}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay' }}>
      <filter id="wood"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="3" seed={2} /></filter>
      <rect width={W} height={H} filter="url(#wood)" />
    </svg>
    {[0, 1, 2].map((i) => (
      <div key={i} style={abs(W * (0.06 + i * 0.32), H * (0.7 + (i % 2) * 0.05), { width: W * 0.3, height: W * 0.38, transform: `rotate(${(hash(i) - 0.5) * 18}deg)`,
        opacity: 0.55, filter: `blur(${W * 0.003}px)`, boxShadow: '0 12px 24px rgba(0,0,0,0.5)' })}>
        <PaperFill w={W * 0.3} h={W * 0.38} id={`ar${i}`} color="#E6DCC3" seed={i + 11} />
      </div>
    ))}
  </AbsoluteFill>
);

// ---------------- effects ----------------
/** A front-page clipping: masthead strip, a big didone headline with the [marked] words highlighted, a deck under it. */
const Newspaper: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 9, 7);
  const w = px(c, opt(c, 'width', 900)), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.25);
  const spin = str(c, 'enter', 'spin') === 'spin';
  const rot = spin ? (1 - a) * 540 * (opt(c, 'dir', 1)) + opt(c, 'tilt', -2) : opt(c, 'tilt', -2);
  const s = spin ? lerp(0.08, 1, a) : lerp(1.08, 1, a);
  const mark = fAt(c, Number(c.o.markAt ?? c.o.start + 0.6));
  const hl = clamp((f - mark) / 6);
  const head = str(c, 'text', '[Welcome] back'), deck = str(c, 'deck', '');
  const h = w * opt(c, 'aspect', 0.62);
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { width: w, height: h, transform: `rotate(${rot}deg) scale(${s})`, opacity: clamp(f / 1.5) * (1 - x),
      filter: `drop-shadow(0 ${px(c, 24)}px ${px(c, 26)}px rgba(40,25,10,0.45))` })}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <clipPath id={`np${c.o.start}`}><path d={tornRect(w, h, 4, 'b', 0.012)} /></clipPath>
      </svg>
      <div style={{ position: 'absolute', inset: 0, clipPath: `path('${tornRect(w, h, 4, 'b', 0.012)}')` }}>
        <PaperFill w={w} h={h} id={`nc${c.o.start}`} color={NEWS.paperHi} seed={6} edge={0.25} />
        <div style={{ position: 'absolute', inset: 0, padding: `${w * 0.035}px ${w * 0.05}px`, color: NEWS.ink, textAlign: 'center' }}>
          <div style={{ fontFamily: LF.masthead, fontSize: w * 0.075, lineHeight: 1.05 }}>{paperName()}</div>
          <div style={{ borderTop: `${w * 0.004}px solid ${NEWS.ink}`, borderBottom: `${w * 0.0016}px solid ${NEWS.ink}`, fontFamily: LF.book,
            fontSize: w * 0.022, padding: `${w * 0.005}px 0`, display: 'flex', justifyContent: 'space-between' }}><span>{str(c, 'edition', 'SPECIAL EDITION')}</span><span>{dateLine()}</span></div>
          <div style={{ fontFamily: LF.didone, fontWeight: 900, fontSize: w * opt(c, 'size', 0.13), lineHeight: 1.0, marginTop: w * 0.03, letterSpacing: -w * 0.002 }}>
            {marked(head, (word, i) => (
              <Highlight key={i} progress={hl} color={NEWS.yellow} iterations={2} seed={i + 3} padding={{ left: w * 0.01, right: w * 0.01, top: 0, bottom: 0 }}
                style={{ mixBlendMode: 'multiply' }}>{word}</Highlight>
            ))}
          </div>
          {deck ? <div style={{ fontFamily: LF.didoneItalic, fontStyle: 'italic', fontWeight: 700, fontSize: w * 0.045, marginTop: w * 0.025, opacity: e('power2.out', f, 4, 6) }}>{deck}</div> : null}
          <div style={{ marginTop: w * 0.03, opacity: 0.65 }}><Greek w={w * 0.9} h={h * 0.3} cols={3} line={w * 0.008} seed={21} color="#857c6c" /></div>
        </div>
      </div>
    </div>
  );
};

/** A torn strip with one quoted line, taped on; the [marked] word is circled in red pen (or underlined). */
const Clipping: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 7, 6);
  const w = px(c, opt(c, 'width', 820)), h = px(c, opt(c, 'height', 210)), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.62);
  const tilt = opt(c, 'tilt', 3);
  const mark = fAt(c, Number(c.o.markAt ?? c.o.start + 0.5)), pr = clamp((f - mark) / 7);
  const how = str(c, 'mark', 'circle');
  const d = tornRect(w, h, 9, 'lr', 0.03);
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { width: w, height: h, transform: `translateY(${(1 - a) * px(c, 140)}px) rotate(${tilt + (1 - a) * 8}deg)`,
      opacity: clamp(f / 1.5) * (1 - x), filter: `drop-shadow(0 ${px(c, 16)}px ${px(c, 18)}px rgba(30,20,8,0.45))` })}>
      <div style={{ position: 'absolute', inset: 0, clipPath: `path('${d}')` }}>
        <PaperFill w={w} h={h} id={`cl${c.o.start}`} color={NEWS.paperHi} seed={12} edge={0.2} />
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${w * 0.06}px`,
        fontFamily: str(c, 'font', 'type') === 'serif' ? LF.didone : LF.type, fontWeight: 700, fontSize: px(c, opt(c, 'size', 64)), color: NEWS.ink, textAlign: 'center', lineHeight: 1.15 }}>
        <div>{marked(str(c, 'text', 'I am [really] excited'), (word, i) => how === 'underline'
          ? <Underline key={i} progress={pr} color={NEWS.pen} strokeWidth={px(c, 5)} iterations={2} seed={i + 5}>{word}</Underline>
          : <Circle key={i} progress={pr} color={NEWS.pen} strokeWidth={px(c, 5)} iterations={2} seed={i + 5} padding={{ left: px(c, 16), right: px(c, 16), top: px(c, 6), bottom: px(c, 6) }}>{word}</Circle>)}</div>
      </div>
      <div style={abs(w * 0.04, -px(c, 22), { width: px(c, 120), height: px(c, 44), transform: 'rotate(-8deg)', background: 'rgba(240,232,200,0.75)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' })} />
      <div style={abs(w * 0.84, h - px(c, 20), { width: px(c, 120), height: px(c, 44), transform: 'rotate(6deg)', background: 'rgba(240,232,200,0.75)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' })} />
    </div>
  );
};

/** A moving photo printed in the page (the Harry Potter newspaper): the clip or an image in grainy black and white
 *  inside a white border, a typed caption under it, and a red circle drawn on one point. */
const Photo: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 8, 6);
  const w = px(c, opt(c, 'width', 560)), h = w * opt(c, 'aspect', 0.75), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.27);
  const src = str(c, 'src', 'source.mp4'), border = w * 0.04;
  const cap = str(c, 'caption', ''), typed = Math.floor(clamp((f - 6) / Math.max(1, cap.length * 0.45)) * cap.length);
  const ring = c.o.circle ? String(c.o.circle).split(',').map(Number) : null;
  const pr = clamp((f - fAt(c, Number(c.o.markAt ?? c.o.start + 0.8))) / 7);
  const media: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.35) brightness(1.05) sepia(0.25)' };
  return (
    <div style={abs(cx - w / 2 - border, cy - h / 2 - border, { padding: border, paddingBottom: border * 3.2, background: '#F4EFE4',
      transform: `rotate(${opt(c, 'tilt', -3) + (1 - a) * -10}deg) scale(${lerp(0.85, 1, a)})`, opacity: clamp(f / 1.5) * (1 - x),
      boxShadow: `0 ${px(c, 22)}px ${px(c, 30)}px rgba(30,18,6,0.45)` })}>
      <div style={{ width: w, height: h, overflow: 'hidden', position: 'relative', background: '#333' }}>
        {/\.(mp4|mov|webm|m4v)$/i.test(src)
          ? <OffthreadVideo muted src={staticFile(src)} style={{ ...media, transform: `scale(${opt(c, 'zoom', 1.6)})`, transformOrigin: `50% ${opt(c, 'focusY', 0.45) * 100}%` }} />
          : <Img src={staticFile(src)} style={media} />}
        <svg width={w} height={h} style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.55 }}>
          <filter id={`ph${c.o.start}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(c.frame / 2)} />
            <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 1.2 -0.2" /></filter>
          <rect width={w} height={h} filter={`url(#ph${c.o.start})`} />
        </svg>
        {ring ? (
          <div style={abs(ring[0] * w - (ring[2] ?? 0.2) * w / 2, ring[1] * h - (ring[2] ?? 0.2) * w / 2)}>
            <Circle progress={pr} color={NEWS.pen} strokeWidth={px(c, 6)} iterations={2} seed={7}>
              <div style={{ width: (ring[2] ?? 0.2) * w, height: (ring[2] ?? 0.2) * w }} />
            </Circle>
          </div>
        ) : null}
      </div>
      <div style={{ fontFamily: LF.type, fontSize: w * 0.05, color: NEWS.ink, marginTop: border * 0.8, whiteSpace: 'nowrap' }}>
        {cap.slice(0, typed)}<span style={{ opacity: typed < cap.length && Math.floor(f / 3) % 2 ? 1 : 0 }}>|</span>
      </div>
    </div>
  );
};

type Pin = { lon: number; lat: number; label: string };
const parsePins = (s: string): Pin[] => s.split('|').map((p) => p.split(',')).filter((p) => p.length >= 2)
  .map(([lon, lat, label]) => ({ lon: Number(lon), lat: Number(lat), label: (label ?? '').trim() }));
const LAND = feature(world as unknown as Topology, (world as unknown as Topology).objects.countries as GeometryCollection);

/** A paper map: land printed in ink on cream, a dotted route drawing from pin to pin, each pin dropping as the line
 *  reaches it with a typed label. */
const MapFx: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 8, 6);
  const w = px(c, opt(c, 'width', 940)), h = w * opt(c, 'aspect', 0.72), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.3);
  const pins = useMemo(() => parsePins(str(c, 'pins', '106.8,-6.2,Jakarta|103.8,1.35,Singapore|139.7,35.7,Tokyo')), [c.o.pins]);
  const proj = useMemo(() => {
    const p = geoNaturalEarth1();
    const ctr = c.o.center ? String(c.o.center).split(',').map(Number) : [pins.reduce((s, q) => s + q.lon, 0) / pins.length, pins.reduce((s, q) => s + q.lat, 0) / pins.length];
    return p.center([0, 0]).rotate([-ctr[0], 0]).center([0, ctr[1]]).scale(w * opt(c, 'zoom', 0.9)).translate([w / 2, h / 2]);
  }, [w, h, pins, c.o.center, c.o.zoom]);
  const path = geoPath(proj);
  const legs = pins.slice(1).map((p, i) => {
    const ip = geoInterpolate([pins[i].lon, pins[i].lat], [p.lon, p.lat]);
    return Array.from({ length: 41 }, (_, k) => proj(ip(k / 40)) as [number, number]);
  });
  const per = opt(c, 'leg', 10), draw = (f - 6) / per;          // legs drawn one after another, `leg` frames each
  const camZ = 1 + 0.06 * clamp(f / 60);
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { width: w, height: h, transform: `rotate(${opt(c, 'tilt', 1.5)}deg) scale(${lerp(0.9, 1, a)})`, opacity: clamp(f / 1.5) * (1 - x),
      boxShadow: `0 ${px(c, 24)}px ${px(c, 34)}px rgba(30,18,6,0.45)`, overflow: 'hidden' })}>
      <PaperFill w={w} h={h} id={`mp${c.o.start}`} color="#E9DEC2" seed={14} edge={0.3} />
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, transform: `scale(${camZ})`, transformOrigin: '50% 50%' }}>
        <defs><pattern id="sea" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="7" stroke="#9c8e70" strokeWidth="1" opacity="0.5" /></pattern></defs>
        <rect width={w} height={h} fill="url(#sea)" />
        <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="#8a7a5a" strokeWidth={0.6} opacity={0.35} />
        <path d={path(LAND) ?? ''} fill="#F3EBD6" stroke={NEWS.ink} strokeWidth={1.1} strokeLinejoin="round" />
        {legs.map((pts, i) => {
          const k = clamp(draw - i), n = Math.max(1, Math.round(k * (pts.length - 1)));
          return k > 0 ? <polyline key={i} points={pts.slice(0, n + 1).map((p) => p.join(',')).join(' ')} fill="none" stroke={NEWS.pen} strokeWidth={px(c, 5)}
            strokeDasharray={`${px(c, 2)} ${px(c, 12)}`} strokeLinecap="round" /> : null;
        })}
        {pins.map((p, i) => {
          const [X, Y] = proj([p.lon, p.lat]) as [number, number], k = e('back.out(2)', draw - (i - 1) - 1, 0, 0.5);
          if (i > 0 && draw < i) return null;
          const lab = p.label, typed = Math.floor(clamp((draw - i + 0.1) * 1.4) * lab.length);
          return (
            <g key={i} transform={`translate(${X} ${Y})`}>
              <g transform={`scale(${i === 0 ? e('back.out(2)', f, 4, 5) : k})`}>
                <path d={`M0 0 C ${-px(c, 14)} ${-px(c, 22)} ${-px(c, 16)} ${-px(c, 40)} 0 ${-px(c, 42)} C ${px(c, 16)} ${-px(c, 40)} ${px(c, 14)} ${-px(c, 22)} 0 0 Z`} fill={NEWS.pen} stroke="#5a0b06" strokeWidth={1.5} />
                <circle cy={-px(c, 28)} r={px(c, 6)} fill="#F7F1E3" />
              </g>
              <text x={px(c, 14)} y={px(c, 10)} fontFamily={LF.type} fontSize={px(c, 30)} fill={NEWS.ink} stroke="#F3EBD6" strokeWidth={px(c, 6)} paintOrder="stroke">{lab.slice(0, typed)}</text>
            </g>
          );
        })}
      </svg>
      {c.o.title ? <div style={abs(px(c, 24), px(c, 18), { fontFamily: LF.didone, fontWeight: 900, fontSize: px(c, 44), color: NEWS.ink, background: 'rgba(247,241,227,0.85)', padding: `0 ${px(c, 12)}px` })}>{str(c, 'title', '')}</div> : null}
    </div>
  );
};

/** A document with every line blacked out, the bars sliding on one by one; the `reveal` line is uncovered and highlighted. */
const Redact: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 8, 6);
  const w = px(c, opt(c, 'width', 760)), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.3);
  const lines = list(c, 'lines', ['Status: in progress', 'Started: months ago', 'Codename: SESSION']);
  const reveal = opt(c, 'reveal', lines.length - 1), rAt = fAt(c, Number(c.o.revealAt ?? c.o.start + 1.0));
  const fs = px(c, opt(c, 'size', 50));
  return (
    <div style={abs(cx - w / 2, cy, { width: w, transform: `translate(0, -50%) rotate(${opt(c, 'tilt', -2)}deg) translateY(${(1 - a) * px(c, 120)}px)`,
      opacity: clamp(f / 1.5) * (1 - x), boxShadow: `0 ${px(c, 20)}px ${px(c, 30)}px rgba(20,12,4,0.5)` })}>
      <PaperFill w={w} h={fs * 1.9 * (lines.length + 2.3)} id={`rd${c.o.start}`} color="#F1EADA" seed={17} edge={0.25} />
      <div style={{ position: 'relative', padding: `${fs * 0.7}px ${fs * 0.8}px`, fontFamily: LF.type, color: NEWS.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs * 0.62, borderBottom: `2px solid ${NEWS.ink}`, paddingBottom: fs * 0.2, marginBottom: fs * 0.5 }}>
          <span>{str(c, 'title', 'PROJECT FILE')}</span><span style={{ color: NEWS.pen, border: `2px solid ${NEWS.pen}`, padding: `0 ${fs * 0.15}px` }}>{str(c, 'stamp', 'CLASSIFIED')}</span>
        </div>
        {lines.map((l, i) => {
          const bar = e('power3.out', f, 3 + i * 2, 4), off = i === reveal ? e('power2.in', f, rAt, 4) : 0;
          return (
            <div key={i} style={{ position: 'relative', fontSize: fs, lineHeight: 1.9, whiteSpace: 'nowrap' }}>
              {i === reveal ? <Highlight progress={clamp((f - rAt - 3) / 5)} color={NEWS.yellow} iterations={1} seed={3}>{l}</Highlight> : <span>{l}</span>}
              <div style={{ position: 'absolute', left: -fs * 0.1, top: fs * 0.32, height: fs * 1.15, width: `${bar * (1 - off) * 104}%`, background: '#111',
                transformOrigin: 'right', marginLeft: `${off * 104}%` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** A rubber stamp slams in, ink unevenly printed, the paper (and the camera) jolting under it. */
const Stamp: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 4, 6);
  const k = e('power4.in', f, 0, 4), cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.6);
  const s = f < 4 ? lerp(2.4, 1, k) : 1 + 0.04 * Math.exp(-(f - 4) / 2) * Math.cos((f - 4) * 1.6);
  const color = str(c, 'color', NEWS.pen), text = str(c, 'text', 'CONFIRMED');
  const fs = px(c, opt(c, 'size', 118));
  return (
    <div style={abs(cx, cy, { transform: `translate(-50%, -50%) rotate(${opt(c, 'tilt', -9)}deg) scale(${s})`, opacity: (f < 1 ? 0 : clamp(f / 4)) * (1 - x) * 0.92 })}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={`ink${c.o.start}`}><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed={5} result="n" />
          <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.5" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" /></filter>
      </svg>
      <div style={{ filter: `url(#ink${c.o.start})`, border: `${fs * 0.08}px solid ${color}`, borderRadius: fs * 0.12, padding: `${fs * 0.05}px ${fs * 0.25}px`,
        fontFamily: LF.didone, fontWeight: 900, fontSize: fs, color, letterSpacing: fs * 0.04, whiteSpace: 'nowrap', lineHeight: 1.1,
        boxShadow: `inset 0 0 0 ${fs * 0.03}px ${color}` }}>{text}</div>
    </div>
  );
};

/** A typewriter lower third: a paper label strip, the line typed letter by letter with a carriage-return cursor. */
const Typewriter: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 6, 6);
  const text = str(c, 'text', 'SESSION · TODAY'), sub = str(c, 'sub', '');
  const n = Math.floor(clamp((f - 3) / Math.max(1, text.length * opt(c, 'speed', 0.3))) * text.length);
  const fs = px(c, opt(c, 'size', 46)), y = c.H * opt(c, 'y', 0.73), x0 = c.W * opt(c, 'x', 0.08);
  return (
    <div style={abs(x0, y, { transform: `translateX(${(1 - a) * -px(c, 300)}px) rotate(-1.5deg)`, opacity: (1 - x), filter: `drop-shadow(0 ${px(c, 10)}px ${px(c, 12)}px rgba(0,0,0,0.35))` })}>
      <div style={{ position: 'relative', padding: `${fs * 0.35}px ${fs * 0.6}px`, background: '#F4EEDF' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fs * 0.22, background: NEWS.pen }} />
        <div style={{ fontFamily: LF.type, fontSize: fs, color: NEWS.ink, whiteSpace: 'nowrap', minWidth: fs * text.length * 0.6 }}>
          {text.slice(0, n)}<span style={{ opacity: Math.floor(f / 3) % 2 ? 1 : 0.15 }}>▌</span>
        </div>
        {sub ? <div style={{ fontFamily: LF.book, fontSize: fs * 0.55, color: '#5d554a', opacity: clamp((f - 3 - text.length * opt(c, 'speed', 0.3)) / 4) }}>{sub}</div> : null}
      </div>
    </div>
  );
};

const S = 12;   // graphics on twelve frames a second
export const NEWSROOM_FX: Record<string, FxDef> = {
  newspaper: {
    desc: 'NEWSROOM - a front-page clipping spins in (or settles), masthead and date, a big didone headline with the [marked] words swept by a yellow highlighter, a deck line and columns',
    options: 'text ([word] = highlighted), deck, edition, markAt, enter (spin|settle), dir, x, y (0-1), width, size (x width), tilt, aspect',
    Front: Newspaper, step: S,
  },
  clipping: {
    desc: 'NEWSROOM - a torn strip with one quoted line, taped on; the [marked] word is circled (or underlined) in red pen on its word',
    options: 'text ([word] = marked), mark (circle|underline), markAt, font (type|serif), x, y, width, height, size, tilt',
    Front: Clipping, step: S,
  },
  photo: {
    desc: 'NEWSROOM - a moving photo printed in the page: the clip or an image in grainy black and white in a white border, a typed caption, a red pen circle on one point',
    options: 'src (default source.mp4), caption, circle (x,y,size in 0-1 of the photo), markAt, zoom, focusY, x, y, width, aspect, tilt',
    Behind: Photo, step: S,
  },
  map: {
    desc: 'NEWSROOM - a printed map (Natural Earth): land in ink on cream, a dotted route drawing from pin to pin, each pin dropping with a typed label',
    options: 'pins ("lon,lat,Label|..."), center ("lon,lat"), zoom, leg (frames per leg), title, x, y, width, aspect, tilt',
    Front: MapFx, step: S,
  },
  redact: {
    desc: 'NEWSROOM - a typed file with every line blacked out, bars sliding on one by one; the reveal line is uncovered and highlighted on its word',
    options: 'lines (|), reveal (index), revealAt, title, stamp, x, y, width, size, tilt',
    Front: Redact, step: S,
  },
  stamp: {
    desc: 'NEWSROOM - a rubber stamp slams in with uneven ink and a jolt (CONFIRMED, BIG NEWS, TRUE)',
    options: 'text, color, x, y, size, tilt',
    Screen: Stamp, step: S,
    personScale: (c) => { const f = (c.t * c.fps); return 1 + 0.025 * Math.exp(-Math.max(0, f - 4) / 3) * (f > 3 ? 1 : 0); },
  },
  typewriter: {
    desc: 'NEWSROOM - a typewriter lower third on a paper strip with a red edge: place, date or name typed letter by letter',
    options: 'text, sub, speed (frames per letter), x, y, size',
    Screen: Typewriter, step: S,
  },
};
