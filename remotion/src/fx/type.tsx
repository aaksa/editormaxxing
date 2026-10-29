import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, e, fAt, focus, fr, FxCtx, FxDef, lerp, life, list, MOTION, opt, over, px, str } from '../lib/core';
import { C, FONT } from '../lib/fonts';
import { GlossText, LetterStrips } from '../lib/gloss';
import { charW, FitText, fitSize, Script, textEm } from '../lib/type';

const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: x, top: y, ...extra });

// ---------------- mega-word: the giant glossy word behind the person ----------------
// A tall condensed word, lit red with an extrusion and a halftone screen, tilted a few degrees, rising out from behind the
// body and focusing in; a pen-script word writes itself across its top corner. It holds with a slow lift, then blows past
// the camera (or drops).
const MegaWord: React.FC<{ c: FxCtx }> = ({ c }) => {
  const text = str(c, 'text', 'GIMANA').toUpperCase();
  const { f, a: rise0, x, total } = life(c, 10, 8);
  // enter: hold carries a word already on screen across a cut without rising again
  const a = str(c, 'enter', 'rise') === 'hold' ? 1 : rise0;
  const width = px(c, opt(c, 'width', 800));
  // short words would grow past the frame: the word's height is capped at ~42 % of it
  const size = Math.min(width / Math.max(1, text.length * 0.47), (c.H * 0.42) / (opt(c, 'stretch', 1.9) * 0.86));
  const stretch = opt(c, 'stretch', 1.9);
  const capH = size * stretch * 0.86;
  const tilt = opt(c, 'tilt', -7);
  const cx = c.W / 2 + px(c, opt(c, 'dx', 0));
  // the word's middle sits a little above the face, so the head breaks into it and the shoulders cover its foot
  const cy = c.H * opt(c, 'y', 0) || c.face.y - c.face.w * 0.15;
  const exit = str(c, 'exit', 'blow');
  const hold = str(c, 'enter', 'rise') === 'hold';
  const n = text.length, stag = opt(c, 'stagger', 2.6);
  const letterK = (i: number) => (hold ? 1 : e('premium', f, 1 + i * stag, 14));
  const rise = 0, blurIn = hold ? 0 : (1 - e('silk', f, 0, 10 + n * stag)) * 4;
  const blow = exit === 'blow' ? x : 0, drop = exit === 'drop' ? x : 0;
  const s = over(a, 1.08) * (1 + 0.035 * clamp(f / total)) * (1 + blow * 0.5);
  const sweep = lerp(-0.4, 1.3, e('power2.inOut', f, 4, 26));
  const script = str(c, 'script', '');
  const sa = hold ? 1 : e('silk', f, 4 + n * stag, 14);
  return (
    <AbsoluteFill style={{ filter: `blur(${blurIn + blow * 14}px)`, opacity: 1 - blow * 0.9 }}>
      <div style={abs(cx, cy + rise + drop * c.H * 0.6, { transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${s})` })}>
        <LetterStrips id={`mw${c.o.start}`} text={text} font={FONT.tall} width={width} size={size} stretch={stretch}
          extrude={px(c, 22)} round={size * 0.02} sweep={sweep} halftone={opt(c, 'halftone', 1)}
          palette={str(c, 'color', 'red') === 'white' ? 'white' : 'red'} shadow={1} k={letterK} rise={capH * 0.75} />
        {script ? (
          <div style={abs(width * opt(c, 'scriptX', 0.5), -px(c, 30), { transform: `rotate(${opt(c, 'scriptTilt', -12)}deg)` })}>
            <Script id={`mws${c.o.start}`} text={script} size={px(c, opt(c, 'scriptSize', 150))} font={FONT.script} reveal={sa} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- gloss-word: the chunky red word in front, on the floor ----------------
// A heavy round word with a lit face, an extrusion and a floor reflection lands from oversize beside the legs; a gloss
// band sweeps it once; a smaller line types out under it, letter by letter.
const GlossWord: React.FC<{ c: FxCtx }> = ({ c }) => {
  const text = str(c, 'text', 'tes');
  const { f, a, x } = life(c, 7, 8);
  const width = px(c, opt(c, 'width', 470));
  const size = fitSize(text, width, px(c, 260)) * 1.08;
  const side = str(c, 'side', 'left');
  const cx = c.W * opt(c, 'x', side === 'right' ? 0.66 : side === 'center' ? 0.5 : 0.33);
  const cy = c.H * opt(c, 'y', 0.66);
  const dir = side === 'right' ? 1 : -1;
  const s = over(a, 1.45), rot = lerp(6 * dir, 0, a);
  const sub = str(c, 'sub', '');
  const subN = Math.floor(clamp((f - 6) / 1.2, 0, sub.length));
  const subSize = fitSize(sub || 'x', width * 1.05, px(c, 64));
  const slide = str(c, 'exit', 'slide') === 'slide' ? x : 0, drop = slide ? 0 : x;
  return (
    <AbsoluteFill style={{ filter: x > 0 ? `blur(${(x * (slide ? 16 : 10)).toFixed(1)}px)` : undefined }}>
      <div style={abs(cx - slide * c.W * 0.75 * (side === 'right' ? -1 : 1), cy + drop * c.H * 0.4, { transform: `translate(-50%, -60%) scale(${s}) rotate(${rot}deg)`, opacity: clamp(f / 2) })}>
        <GlossText id={`gw${c.o.start}`} text={text} font={FONT.round} weight={800} width={width} size={size}
          extrude={px(c, 12)} round={size * 0.03} sweep={lerp(-0.4, 1.4, e('power2.inOut', f, 3, 18))}
          reflect={sub ? 0 : 0.55} shadow={0.6} />
        {sub ? (
          <div style={{ marginTop: -size * 0.12, marginLeft: px(c, 6) }}>
            <FitText id={`gws${c.o.start}`} text={sub.slice(0, Math.max(1, subN))} width={width * 1.05 * (Math.max(1, subN) / sub.length)}
              size={subSize} font={FONT.round} weight={700} fill={C.red} reveal={1} />
            {/* its reflection */}
            <div style={{ transform: 'scaleY(-1)', opacity: 0.28, filter: 'blur(3px)', marginTop: -subSize * 0.35,
              WebkitMaskImage: 'linear-gradient(0deg, #000 0%, transparent 70%)', maskImage: 'linear-gradient(0deg, #000 0%, transparent 70%)' }}>
              <FitText id={`gwr${c.o.start}`} text={sub.slice(0, Math.max(1, subN))} width={width * 1.05 * (Math.max(1, subN) / sub.length)}
                size={subSize} font={FONT.round} weight={700} fill={C.red} />
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- headline: script + big word + small line, at the top of the hero zone ----------------
/** A button-like pill (the call to action): rises in, then answers its "press" - a soft dip, a shine passing across,
 *  the arrow nudging forward - a micro-interaction that tells the viewer to act. */
const Pill: React.FC<{ c: FxCtx; f: number; text: string; press: number; dark?: boolean }> = ({ c, f, text, press, dark }) => {
  const a = e('premium', f, 0, 16);
  const dip = e('silk', f, press, 4) - e('silk', f, press + 4, 14);
  const shine = e('glide', f, press + 3, 18);
  const nudge = Math.sin(clamp((f - press - 4) / 16) * Math.PI) * px(c, 8);
  const glow = 0.28 + 0.08 * Math.sin((f / c.fps) * 2.2);
  const fs = px(c, 40);
  return (
    <div style={{ overflow: 'hidden', padding: px(c, 18), marginTop: px(c, 4) }}>
      <div style={{ transform: `translateY(${(1 - a) * 120}%) scale(${over(a, 1.15) * (1 - 0.05 * dip)})`, filter: `blur(${focus(a, 8)}px)`,
        display: 'flex', alignItems: 'center', gap: px(c, 16), padding: `${px(c, 18)}px ${px(c, 22)}px ${px(c, 18)}px ${px(c, 38)}px`,
        borderRadius: px(c, 60), position: 'relative', overflow: 'hidden',
        background: dark ? 'linear-gradient(180deg, #FFFFFF, #F1E7E5)' : `linear-gradient(180deg, ${C.redHi} 0%, ${C.red} 55%, ${C.redDeep} 100%)`,
        boxShadow: `0 ${px(c, 18)}px ${px(c, 40)}px rgba(150,0,0,${glow}), inset 0 2px 0 rgba(255,255,255,0.45)`,
        fontFamily: FONT.round, fontWeight: 700, fontSize: fs, color: dark ? C.red : '#fff', whiteSpace: 'nowrap' }}>
        {text}
        <div style={{ width: fs * 1.25, height: fs * 1.25, borderRadius: '50%', background: dark ? C.red : '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transform: `translateX(${nudge}px)` }}>
          <svg width={fs * 0.6} height={fs * 0.6} viewBox="0 0 24 24"><path d="M5 12 H19 M13 6 L19 12 L13 18" stroke={dark ? '#fff' : C.red} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', left: `${lerp(-40, 130, shine)}%`, opacity: shine > 0 && shine < 1 ? 1 : 0,
          background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)', transform: 'skewX(-18deg)' }} />
      </div>
    </div>
  );
};

/** A line that builds itself one letter at a time (the reference's headline build): each letter pops in from ~1.7x,
 *  out of a blur, and settles; the line glides sideways as it grows so it stays centred, with no jumps. */
const BuildLine: React.FC<{ c: FxCtx; f: number; text: string; size: number; color: string; dark?: boolean; rate?: number }> =
  ({ c, f, text, size, color, dark, rate = 1.25 }) => {
    const chars = [...text];
    const ks = chars.map((_, i) => e('premium', f, i * rate, 10));
    // the part still to come, as a width: half of it is the offset that keeps the visible part centred
    const pending = chars.reduce((acc, ch, i) => acc + charW(ch) * size * (1 - ks[i]), 0);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', whiteSpace: 'pre', fontFamily: FONT.round, fontWeight: 800, fontSize: size, lineHeight: 1.12,
        color, transform: `translateX(${pending / 2}px)`, paddingBottom: size * 0.08,
        textShadow: `0 ${px(c, 8)}px ${px(c, 14)}px rgba(${dark ? '0,0,0' : '140,0,0'},0.22)` }}>
        {chars.map((ch, i) => (
          <span key={i} style={{ display: 'inline-block', opacity: clamp(ks[i] * 2.5), transform: `scale(${lerp(1.7, 1, ks[i])}) translateY(${(1 - ks[i]) * size * 0.1}px)`,
            transformOrigin: '50% 85%', filter: ks[i] < 0.98 ? `blur(${((1 - ks[i]) * 7).toFixed(1)}px)` : undefined }}>{ch}</span>
        ))}
      </div>
    );
  };

/** The guided sequence: the title rises out of a mask first, the script word writes itself across it, the small line
 *  settles under it, and the pill (if any) arrives last - title, subtitle, button - each on its own soft curve. */
export const HeadlineBlock: React.FC<{ c: FxCtx; f: number; cx: number; top: number; script: string; text: string; sub: string; width: number;
  dark?: boolean; tag: string; cta?: string; press?: number; reveal?: string }> =
  ({ c, f, cx, top, script, text, sub, width, dark, tag, cta, press, reveal = 'build' }) => {
    const size = fitSize(text, width, px(c, 210)) * 1.05;
    const build = reveal === 'build';
    // the reference's order when building: the small script word first, then the title letter by letter, then the line
    // under it; when rising: the title, its script word, the line
    const t0 = build && script ? 5 : 0, rate = 1.25;
    const ta = e('premium', f, t0, 16);
    const sr = build ? e('silk', f, 0, 10) : e('silk', f, 6, 14);
    const sa = e('premium', f, build ? t0 + [...text].length * rate * 0.8 : 10, 14);
    return (
      <div style={abs(cx, top, { transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
        {script ? (
          <div style={{ marginBottom: -size * 0.42, zIndex: 2, transform: `rotate(-6deg) translateY(${(1 - sr) * px(c, 10)}px)` }}>
            <Script id={`hs${tag}`} text={script} size={size * 0.55} font={FONT.script} reveal={sr}
              color={dark ? '#fff' : C.redDeep} edge={dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'} />
          </div>
        ) : null}
        {reveal === 'build' ? (
          <BuildLine c={c} f={f - t0} text={text} size={size * 0.95} color={dark ? '#fff' : C.red} dark={dark} rate={rate} />
        ) : (
          <div style={{ overflow: 'hidden', paddingBottom: size * 0.12 }}>
            <div style={{ transform: `translateY(${(1 - ta) * 105}%) rotate(${(1 - ta) * 3}deg)`, filter: `blur(${focus(ta, 8)}px)`, transformOrigin: '0 100%' }}>
              <FitText id={`hw${tag}`} text={text} width={width} size={size} font={FONT.round} weight={800} fill={dark ? '#fff' : C.red}
                shadow={`drop-shadow(0 ${px(c, 8)}px ${px(c, 10)}px rgba(${dark ? '0,0,0' : '140,0,0'},0.22))`} anchor="middle" />
            </div>
          </div>
        )}
        {sub ? (
          <div style={{ marginTop: -size * 0.24, opacity: sa, transform: `translateY(${(1 - sa) * px(c, 22)}px)`, filter: `blur(${focus(sa, 6)}px)` }}>
            <FitText id={`hb${tag}`} text={sub} width={Math.min(width * 0.8, textEm(sub) * px(c, 41))} size={px(c, 48)} font={FONT.round}
              weight={600} fill={dark ? 'rgba(255,255,255,0.85)' : '#3a2a2a'} reveal={1} anchor="middle" />
          </div>
        ) : null}
        {cta && f >= 15 ? <Pill c={c} f={f - 15} text={cta} press={(press ?? 40) - 15} dark={dark} /> : null}
      </div>
    );
  };

const Headline: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8);
  const top = c.H * opt(c, 'y', 0.15);
  return (
    <AbsoluteFill style={{ opacity: 1 - x, filter: x > 0 ? `blur(${x * 12}px)` : undefined, transform: `translateY(${-x * px(c, 60)}px)` }}>
      {(() => {
        // several words separated by | replace each other in place at their times (clip seconds, from w: anchors)
        const texts = str(c, 'text', 'bisnismu').split('|'), scripts = str(c, 'script', '').split('|'), subs = str(c, 'sub', '').split('|');
        const times = list(c, 'times', []).map((v) => fAt(c, Number(v)));
        let k = 0;
        times.forEach((tf, i) => { if (f >= tf && i + 1 < texts.length) k = i + 1; });
        const since = k ? f - times[k - 1] : f;
        const pick = (arr: string[]) => arr[Math.min(k, arr.length - 1)] ?? '';
        const pressF = c.o.press !== undefined ? fAt(c, Number(c.o.press)) : undefined;
        const out = k + 1 < texts.length && times[k] !== undefined ? e('power2.in', f, times[k] - 3, 3) : 0;
        return (
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined, transform: `translateY(${-out * px(c, 30)}px)` }}>
            <HeadlineBlock key={k} c={c} f={since} cx={c.W / 2} top={top} script={pick(scripts)} text={texts[k]} sub={pick(subs)}
              width={px(c, opt(c, 'width', 880))} dark={c.scene.set === 'dark' || c.scene.set === 'ember'} tag={`${c.o.start}_${k}`}
              reveal={str(c, 'reveal', 'build')} cta={k === texts.length - 1 && !opt(c, 'ctaY', 0) ? str(c, 'cta', '') : ''} press={pressF !== undefined ? pressF - (k ? times[k - 1] : 0) : undefined} />
            {k === texts.length - 1 && opt(c, 'ctaY', 0) && str(c, 'cta', '') && since >= 15 ? (
              <div style={abs(c.W / 2, c.H * opt(c, 'ctaY', 0), { transform: 'translateX(-50%)' })}>
                <Pill c={c} f={since - 15} text={str(c, 'cta', '')} press={(pressF ?? 40) - (k ? times[k - 1] : 0) - 15} dark={c.scene.set === 'dark' || c.scene.set === 'ember'} />
              </div>
            ) : null}
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ---------------- arc-text: two lines bent over the head ----------------
// A small red line and a big white line follow arcs centred on the face; letters roll in along the arc one by one.
const ArcLine: React.FC<{ c: FxCtx; text: string; r: number; size: number; color: string; f0: number; edge?: string; tag: string }> =
  ({ c, text, r, size, color, f0, edge, tag }) => {
    const f = fr(c);
    const total = textEm(text) * size;                    // arc length the line needs
    const span = total / r;                               // radians
    let acc = -span / 2;
    return (
      <>
        {[...text].map((ch, i) => {
          const w = charW(ch) * size;
          const ang = acc + w / (2 * r); acc += w / r;
          const k = e('back.out(1.6)', f, f0 + i * 1.2, 9);
          const a2 = ang - (1 - k) * 0.35;                // rolls in along the arc
          const x = c.face.x + Math.sin(a2) * r, y = c.face.y - c.face.w * 0.1 - Math.cos(a2) * r;
          return (
            <div key={`${tag}${i}`} style={abs(x, y, {
              transform: `translate(-50%, -50%) rotate(${(a2 * 180) / Math.PI}deg) scale(${lerp(0.6, 1, k)})`, opacity: clamp(k * 3),
              fontFamily: FONT.round, fontWeight: 800, fontSize: size, color, lineHeight: 1, whiteSpace: 'pre',
              textShadow: edge,
            })}>{ch}</div>
          );
        })}
      </>
    );
  };
const ArcText: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { x } = life(c, 10, 8);
  const r = c.face.w * opt(c, 'radius', 1.25);
  const big = px(c, opt(c, 'size', 120)), small = big * 0.62;
  return (
    <AbsoluteFill style={{ opacity: 1 - x, transform: `translateY(${-x * px(c, 80)}px) scale(${1 + x * 0.2})`, transformOrigin: `${c.face.x}px ${c.face.y}px` }}>
      <ArcLine c={c} text={str(c, 'top', 'selama')} r={r + big * 0.95} size={small} color={C.red} f0={0} tag="t"
        edge="0 3px 0 rgba(255,255,255,0.9)" />
      <ArcLine c={c} text={str(c, 'text', 'empat tahun')} r={r} size={big} color="#fff" f0={5} tag="b"
        edge={`0 ${px(c, 4)}px 0 rgba(0,0,0,0.10), 0 ${px(c, 10)}px ${px(c, 26)}px rgba(0,0,0,0.42), 0 0 2px rgba(0,0,0,0.35)`} />
    </AbsoluteFill>
  );
};

// ---------------- stack-lines: a justified block that grows upward, one spoken line at a time ----------------
// Lines arrive in speech order and each new one lands on top, pushing nothing: the block is laid out once and each line
// pops in from oversize at its time. Every line is fitted to the same width, so short lines come out big.
const StackLines: React.FC<{ c: FxCtx }> = ({ c }) => {
  const lines = list(c, 'lines', ['dan ini', 'yang kami pelajari']);
  const f = fr(c), total = (c.d * c.fps) / MOTION.tempo;
  const times = list(c, 'times', []).map(Number);
  const at = (i: number) => (times[i] !== undefined ? fAt(c, times[i]) : (i / lines.length) * total * 0.75);
  const width = px(c, opt(c, 'width', 800));
  const sizes = lines.map((l) => fitSize(l, width, px(c, 150)));
  const gap = px(c, 2);
  const bottom = opt(c, 'y', 0) ? c.H * opt(c, 'y', 0) : c.face.top - px(c, 30);
  let y = bottom;
  const x0 = c.W * opt(c, 'x', 0.1);
  const out = e('power2.in', f, total - 8, 8);
  return (
    <AbsoluteFill style={{ transform: `rotate(${opt(c, 'tilt', -7)}deg) translateY(${-out * c.H * 0.5}px)`, transformOrigin: `${x0}px ${bottom}px`,
      filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      {lines.map((l, i) => {
        y -= sizes[i] * 1.2 + gap;
        const k = e('expo.out', f, at(i), 7);
        if (f < at(i)) return null;
        return (
          <div key={i} style={abs(x0, y, { transform: `scale(${over(k, 1.4)})`, transformOrigin: '0% 100%', opacity: clamp((f - at(i)) / 2) })}>
            <FitText id={`sl${c.o.start}_${i}`} text={l} width={width} size={sizes[i]} font={FONT.round} weight={800} fill={C.red}
              stroke="#fff" strokeW={sizes[i] * 0.09} shadow="drop-shadow(0 6px 8px rgba(120,0,0,0.18))" />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- big-number: the hero number on a dark floor ----------------
// The bottom of the frame falls to black; the number counts up in 18 frames and lands exactly; the lines under it land
// one by one (the first red, the rest white).
const fmtNum = (v: number, sep: string) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const BigNumber: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8);
  const from = opt(c, 'from', 0), to = opt(c, 'to', 1000000);
  const k = e('power2.out', f, 2, 18);
  const value = `${str(c, 'prefix', '')}${fmtNum(lerp(from, to, k), str(c, 'sep', '.'))}${str(c, 'suffix', '')}`;
  const finalText = `${str(c, 'prefix', '')}${fmtNum(to, str(c, 'sep', '.'))}${str(c, 'suffix', '')}`;
  const width = px(c, opt(c, 'width', 900));
  const size = width / Math.max(1, finalText.length * 0.48);
  const subs = list(c, 'sub', []);
  const top = c.H * opt(c, 'y', 0.6);
  const fade = e('power2.out', f, 0, 10);
  return (
    <AbsoluteFill style={{ opacity: 1 - x }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) ${top / c.H * 100 - 14}%, rgba(0,0,0,${0.92 * fade}) ${top / c.H * 100 + 6}%, #000 100%)` }} />
      <div style={abs(c.W / 2, top, { transform: `translate(-50%, -50%) scale(${over(e('expo.out', f, 0, 7), 1.3)})`, opacity: clamp(f / 2) })}>
        {opt(c, 'count', 0) ? (
          <GlossText id={`bn${c.o.start}`} text={value} font={FONT.tall} width={width * (value.length / finalText.length)} size={size}
            stretch={1.12} extrude={px(c, 10)} round={size * 0.02} palette="white" sweep={lerp(-0.4, 1.4, e('power2.inOut', f, 16, 18))} shadow={1} />
        ) : (
          <LetterStrips id={`bn${c.o.start}`} text={finalText} font={FONT.tall} width={width} size={size} stretch={1.12} extrude={px(c, 10)}
            round={size * 0.02} palette="white" sweep={lerp(-0.4, 1.4, e('power2.inOut', f, 10 + finalText.length * 1.6, 18))} shadow={1}
            k={(i) => e('premium', f, 2 + i * 1.6, 9)} rise={-size * 0.1} pop={0.5} />
        )}
      </div>
      {subs.map((s, i) => {
        const at = (opt(c, 'count', 0) ? 10 : 6 + finalText.length * 1.6) + i * 6, kk = e('expo.out', f, at, 9);
        if (f < at) return null;
        const sz = i === 0 ? px(c, 104) : px(c, 74);
        return (
          <div key={i} style={abs(c.W / 2, top + size * 0.62 + i * px(c, 92) + (i > 0 ? px(c, 26) : 0), {
            transform: i === 0 ? `translate(-50%, 0) perspective(${px(c, 700)}px) rotateX(${lerp(-110, 0, kk)}deg)` : `translate(-50%, 0) scale(${over(kk, 1.35)})`,
            transformOrigin: '50% 100%', opacity: clamp((f - at) / 2), filter: kk < 0.98 ? `blur(${((1 - kk) * 6).toFixed(1)}px)` : undefined,
          })}>
            <FitText id={`bns${c.o.start}_${i}`} text={s} width={Math.min(px(c, 860), textEm(s) * sz)} size={sz} font={FONT.round}
              weight={i === 0 ? 800 : 500} fill={i === 0 ? C.red : '#fff'} anchor="middle" />
          </div>
        );
      })}
      {str(c, 'note', '') ? (
        <div style={abs(c.W - px(c, 70), c.H * 0.2, { transform: 'translateX(-100%)', fontFamily: FONT.ui, fontWeight: 600, fontSize: px(c, 26),
          color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.35)', padding: `${px(c, 6)}px ${px(c, 14)}px`, borderRadius: px(c, 20), opacity: fade })}>
          {str(c, 'note', '')}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------- name-title: who is talking ----------------
// A small script line and a two-line name in heavy italic: the first line red, the second white and bigger, sliding in
// from opposite sides on a red slash.
const NameTitle: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 9, 8);
  const [n1, n2] = [...list(c, 'name', ['Nama', 'Kamu']), ''];
  const y = c.H * opt(c, 'y', 0.6);
  const w = px(c, 860);
  const s1 = fitSize(n1.toUpperCase(), w * 0.8, px(c, 170)), s2 = fitSize(n2.toUpperCase(), w, px(c, 200));
  const k1 = e('expo.out', f, 2, 8), k2 = e('expo.out', f, 6, 8), ks = e('power3.out', f, 0, 10), kp = e('power2.out', f, 10, 10);
  const out = x;
  return (
    <AbsoluteFill style={{ filter: out > 0 ? `blur(${out * 10}px)` : undefined, opacity: 1 - out }}>
      <div style={abs(-px(c, 60), y - px(c, 40), { width: c.W * 1.2 * ks, height: px(c, 250), transform: 'skewY(-10deg)',
        background: `linear-gradient(90deg, ${C.redDeep}, ${C.red} 70%, rgba(242,15,20,0))`, opacity: 0.9 })} />
      <div style={abs(c.W * 0.1 + (1 - k1) * -c.W * 0.6, y - s1 * 0.9, { transform: 'skewX(-8deg)' })}>
        <FitText id={`nt1${c.o.start}`} text={n1.toUpperCase()} width={w * 0.8} size={s1} font={FONT.roundItalic} weight={900} italic fill={C.red}
          stroke="#fff" strokeW={px(c, 5)} />
      </div>
      <div style={abs(c.W * 0.06 + (1 - k2) * c.W * 0.6, y + s1 * 0.05, { transform: 'skewX(-8deg)' })}>
        <FitText id={`nt2${c.o.start}`} text={n2.toUpperCase()} width={w} size={s2} font={FONT.roundItalic} weight={900} italic fill="#fff"
          shadow={`drop-shadow(0 ${px(c, 8)}px ${px(c, 10)}px rgba(0,0,0,0.35))`} />
      </div>
      {str(c, 'pre', '') ? (
        <div style={abs(c.W * 0.52, y - s1 * 1.35, { transform: 'rotate(-8deg)' })}>
          <Script id={`ntp${c.o.start}`} text={str(c, 'pre', '')} size={px(c, 110)} font={FONT.script} reveal={kp} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------- title-card: a serif title with script above and below, for the dark set ----------------
const TitleCard: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8);
  const title = str(c, 'title', 'Kesimpulan');
  const y = c.H * opt(c, 'y', 0.2);
  const tw = px(c, opt(c, 'width', 640)), ts = tw / Math.max(1, title.length * 0.52);
  const caption = list(c, 'caption', []);
  const capW = caption.join(' ').split(' ');
  return (
    <AbsoluteFill style={{ opacity: 1 - x, filter: x > 0 ? `blur(${x * 12}px)` : undefined }}>
      <div style={abs(c.W / 2, y, { transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
        {str(c, 'top', '') ? (
          <div style={{ marginBottom: -ts * 0.35, marginLeft: tw * 0.2 }}>
            <Script id={`tct${c.o.start}`} text={str(c, 'top', '')} size={ts * 0.55} font={FONT.script} reveal={e('power2.out', f, 0, 12)} edge="rgba(0,0,0,0.4)" />
          </div>
        ) : null}
        <div style={{ display: 'flex' }}>
          {[...title].map((ch, i) => {
            const k = e('power3.out', f, 3 + i * 1.5, 10);
            return (
              <span key={i} style={{ fontFamily: FONT.serif, fontWeight: 500, fontSize: ts, color: '#fff', lineHeight: 1, whiteSpace: 'pre',
                opacity: clamp(k * 2), filter: `blur(${(1 - k) * 10}px)`, transform: `translateY(${(1 - k) * ts * 0.25}px)`,
                textShadow: `0 ${px(c, 6)}px ${px(c, 20)}px rgba(0,0,0,0.5)` }}>{ch}</span>
            );
          })}
        </div>
        {str(c, 'bottom', '') ? (
          <div style={{ marginTop: -ts * 0.28, marginLeft: tw * 0.45 }}>
            <Script id={`tcb${c.o.start}`} text={str(c, 'bottom', '')} size={ts * 0.45} font={FONT.script} reveal={e('power2.out', f, 12, 12)} edge="rgba(0,0,0,0.4)" />
          </div>
        ) : null}
      </div>
      {capW.length && caption.length ? (
        <div style={abs(c.W / 2, c.H * opt(c, 'captionY', 0.7), { transform: 'translateX(-50%)', width: px(c, 760), textAlign: 'center',
          fontFamily: FONT.round, fontWeight: 700, fontSize: px(c, 62), lineHeight: 1.05, color: '#fff' })}>
          {capW.map((w, i) => {
            const at = opt(c, 'captionAt', 14) + i * opt(c, 'rate', 4);
            const k = e('expo.out', f, at, 6);
            return f < at ? null : (
              <span key={i} style={{ display: 'inline-block', marginRight: '0.25em', transform: `scale(${over(k, 1.4)})`, opacity: clamp((f - at) / 2) }}>{w}</span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CtaPill: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, x } = life(c, 10, 8);
  const press = c.o.press !== undefined ? fAt(c, Number(c.o.press)) : 30;
  return (
    <AbsoluteFill style={{ opacity: 1 - x, filter: x > 0 ? `blur(${x * 10}px)` : undefined }}>
      <div style={abs(c.W / 2, c.H * opt(c, 'y', 0.76), { transform: 'translateX(-50%)' })}>
        <Pill c={c} f={f} text={str(c, 'text', 'Follow along')} press={press} dark={c.scene.set === 'dark' || c.scene.set === 'ember'} />
      </div>
    </AbsoluteFill>
  );
};

export const TYPE_FX: Record<string, FxDef> = {
  'cta-pill': {
    desc: 'A button pill on its own: rises in, then answers its press on the word (a soft dip, a shine, the arrow nudging forward)',
    options: 'text, y (0-1), press (clip s or w:word)',
    Screen: CtaPill,
  },
  'mega-word': {
    desc: 'A giant glossy condensed red word rises from behind the body, tilted, with a pen-script word written across its corner',
    options: 'text, script, enter (rise|hold), tilt, y (0-1, default above the face), dx, width, stretch, halftone (0-1), color (red|white), exit (blow|drop|cut: stays to the cut), scriptX, scriptTilt, scriptSize',
    Behind: MegaWord,
  },
  'gloss-word': {
    desc: 'A chunky red word with a lit face, extrusion and floor reflection lands in front beside the legs; a smaller line types under it',
    options: 'text, sub, side (left|right|center), x, y (0-1), width, exit (slide|drop)',
    Front: GlossWord, blur: 6,
  },
  headline: {
    desc: 'A guided headline: the title rises from a mask, then its script word, then the small line, then an optional button pill that reacts when pressed',
    options: 'script, text, sub (each may hold several, |, swapped in place at times), times (|), reveal (build|rise), cta (a pill that arrives last), ctaY (0-1: the pill on its own line), press (clip s: the pill reacts), y (0-1), width',
    Screen: Headline,
  },
  'arc-text': {
    desc: 'Two lines bent over the head (small red, big white), rolling in along the arc letter by letter',
    options: 'top, text, radius (x face width), size',
    Front: ArcText,
  },
  'stack-lines': {
    desc: 'A justified block of red lines that grows upward as each spoken line lands (best on the stripes set)',
    options: 'lines (speech order, |), times (clip seconds, |), width, x, y, tilt',
    Behind: StackLines,
  },
  'big-number': {
    desc: 'The bottom falls to black; a big white number counts up and lands; red and white lines land under it',
    options: 'from, to, prefix, suffix, sep, sub (|), y, width, note, count (1: roll the digits instead of building them)',
    Front: BigNumber,
  },
  'name-title': {
    desc: 'Who is talking: a script line and a two-line heavy italic name sliding in from both sides on a red slash',
    options: 'pre, name (two lines, |), y',
    Front: NameTitle,
  },
  'title-card': {
    desc: 'A serif title with script above and below, letters focusing in; caption words land under it (dark set, no person)',
    options: 'top, title, bottom, y, width, caption (|), captionY, captionAt, rate',
    Screen: TitleCard,
  },
};
