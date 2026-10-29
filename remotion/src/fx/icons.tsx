import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import * as THREE from 'three';
import { clamp, e, FxCtx, FxDef, lerp, life, opt, over, px, str } from '../lib/core';
import { C, FONT } from '../lib/fonts';
import { at, labelTexture, lathe, materials, PixelCanvas, roundedBox } from '../lib/three';
import { HeadlineBlock } from './type';

// Glossy red 3D icons, the look's props: red clearcoat plastic, frosted glass plates, white enamel, a little chrome.
// Every icon is built from primitives in a box about 2 units across (so scale = size / 2), facing the camera (+z).
// `g` (0..1) is the icon's own build progress after it lands: bars rise, a dart flies in, a check draws.

type IconProps = { g: number; t: number };
const M = () => materials();

const bust = lathe([[0, 0], [0.62, 0], [0.64, 0.08], [0.58, 0.3], [0.42, 0.5], [0.2, 0.6], [0, 0.62]]);
const Person: React.FC<{ s?: number; p: [number, number, number]; m: THREE.Material }> = ({ s = 1, p, m }) => (
  <group position={p} scale={s}>
    <mesh geometry={bust} material={m} position={[0, -0.75, 0]} scale={[1, 1, 0.75]} />
    <mesh material={m} position={[0, 0.2, 0]}><sphereGeometry args={[0.36, 48, 32]} /></mesh>
  </group>
);

const People: React.FC<IconProps> = () => (
  <group>
    <Person p={[-0.68, -0.12, -0.35]} s={0.72} m={M().deep} />
    <Person p={[0.68, -0.12, -0.35]} s={0.72} m={M().deep} />
    <Person p={[0, 0.05, 0.1]} s={1} m={M().red} />
  </group>
);

const Target: React.FC<IconProps> = ({ g }) => {
  const rings = [1, 0.74, 0.48, 0.22];
  const k = e('expo.out', g, 0, 0.5);
  return (
    <group>
      {rings.map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, i * 0.07]} material={i % 2 ? M().white : M().red}>
          <cylinderGeometry args={[r, r, 0.16, 64]} />
        </mesh>
      ))}
      {/* the dart flies in and sticks */}
      <group position={[lerp(1.8, 0.08, k), lerp(1.4, 0.1, k), 0.35]} rotation={[0, 0, Math.PI * 0.8]} visible={g > 0.01}>
        <group rotation={[0, -0.5, 0]}>
          <mesh material={M().chrome} rotation={[0, 0, Math.PI / 2]} position={[-0.55, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 1.1, 16]} /></mesh>
          <mesh material={M().chrome} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}><coneGeometry args={[0.06, 0.25, 16]} /></mesh>
          <mesh material={M().deep} position={[-1.05, 0, 0]}><boxGeometry args={[0.3, 0.32, 0.02]} /></mesh>
          <mesh material={M().deep} position={[-1.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><boxGeometry args={[0.3, 0.32, 0.02]} /></mesh>
        </group>
      </group>
    </group>
  );
};

const Gift: React.FC<IconProps> = ({ t }) => {
  const tag = useMemo(() => new THREE.MeshPhysicalMaterial({ map: labelTexture('%', `800 170px ${FONT.round}`, '#fff', C.red), roughness: 0.25, clearcoat: 1 }), []);
  return (
    <group rotation={[0.25, -0.5, 0]}>
      <mesh geometry={roundedBox(1.4, 1.05, 1.4, 0.08)} material={M().pink} position={[0, -0.35, 0]} />
      <mesh geometry={roundedBox(1.52, 0.3, 1.52, 0.08)} material={M().pink} position={[0, 0.28, 0]} />
      <mesh geometry={roundedBox(0.26, 1.42, 1.56, 0.05)} material={M().red} position={[0, -0.12, 0]} />
      <mesh geometry={roundedBox(1.56, 1.42, 0.26, 0.05)} material={M().red} position={[0, -0.12, 0]} />
      {[-1, 1].map((s) => (
        <mesh key={s} material={M().red} position={[s * 0.3, 0.6, 0]} rotation={[Math.PI / 2, s * 0.5, 0]} scale={[1, 1, 0.55]}>
          <torusGeometry args={[0.28, 0.1, 20, 40]} />
        </mesh>
      ))}
      <group position={[0.85, -0.55, 0.75]} rotation={[0, 0.5, 0.35 + Math.sin(t * 2.2) * 0.12]}>
        <mesh geometry={roundedBox(0.55, 0.42, 0.06, 0.06)} material={tag} />
      </group>
    </group>
  );
};

const Clipboard: React.FC<IconProps> = ({ g }) => (
  <group rotation={[0.1, -0.35, 0.05]}>
    <mesh geometry={roundedBox(1.5, 1.9, 0.14, 0.14)} material={M().glass} position={[0.18, 0.08, -0.25]} rotation={[0, 0, 0.08]} />
    <mesh geometry={roundedBox(1.5, 1.9, 0.14, 0.14)} material={M().glass} />
    <mesh geometry={roundedBox(0.6, 0.26, 0.22, 0.08)} material={M().red} position={[0, 0.95, 0.06]} />
    {[0, 1, 2].map((i) => (
      <group key={i} position={[-0.4, 0.45 - i * 0.42, 0.1]}>
        <mesh geometry={roundedBox(0.24, 0.24, 0.08, 0.06)} material={M().red} />
        <mesh geometry={roundedBox(0.62, 0.07, 0.04, 0.03)} material={M().deep} position={[0.5, 0, 0]} />
      </group>
    ))}
    {[0.3, 0.55, 0.85].map((h, i) => {
      const hh = h * clamp(e('power3.out', g, i * 0.12, 0.5) + 0.15);
      return <mesh key={i} geometry={roundedBox(0.18, hh, 0.12, 0.04)} material={M().red} position={[0.22 + i * 0.24, -0.72 + hh / 2, 0.12]} />;
    })}
  </group>
);

const Chart: React.FC<IconProps> = ({ g }) => {
  const k = e('power3.out', g, 0.2, 0.6);
  const arrow = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-0.8, -0.5, 0.2), new THREE.Vector3(-0.2, -0.05, 0.2),
    new THREE.Vector3(0.15, -0.25, 0.2), new THREE.Vector3(0.8, 0.55, 0.2)]), []);
  return (
    <group rotation={[0.08, -0.3, 0]}>
      <mesh geometry={roundedBox(2, 1.6, 0.14, 0.16)} material={M().glass} />
      {[0.35, 0.6, 0.85, 1.15].map((h, i) => {
        const hh = h * clamp(e('power3.out', g, i * 0.1, 0.45) + 0.1);
        return <mesh key={i} geometry={roundedBox(0.26, hh, 0.16, 0.05)} material={i === 3 ? M().red : M().deep} position={[-0.6 + i * 0.4, -0.65 + hh / 2, 0.12]} />;
      })}
      <mesh material={M().red} visible={k > 0.02}><tubeGeometry args={[arrow, 40, 0.06, 12, false]} /></mesh>
      <mesh material={M().red} position={[0.84, 0.6, 0.2]} rotation={[0, 0, -0.75]} scale={k}><coneGeometry args={[0.16, 0.3, 24]} /></mesh>
    </group>
  );
};

const Megaphone: React.FC<IconProps> = ({ t }) => (
  <group rotation={[0.1, -0.6, 0.35 + Math.sin(t * 6) * 0.015]}>
    <mesh material={M().red} rotation={[0, 0, -Math.PI / 2]} position={[0.1, 0, 0]}><cylinderGeometry args={[0.72, 0.26, 1.3, 48, 1, true]} /></mesh>
    <mesh material={M().white} rotation={[0, Math.PI / 2, 0]} position={[0.75, 0, 0]}><torusGeometry args={[0.72, 0.07, 16, 64]} /></mesh>
    <mesh material={M().deep} rotation={[0, 0, -Math.PI / 2]} position={[-0.7, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.4, 32]} /></mesh>
    <mesh geometry={roundedBox(0.18, 0.6, 0.2, 0.06)} material={M().deep} position={[-0.4, -0.5, 0]} rotation={[0, 0, 0.25]} />
  </group>
);

const Check: React.FC<IconProps> = ({ g }) => {
  const k = e('power3.out', g, 0, 0.5);
  return (
    <group>
      <mesh material={M().glass} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1, 1, 0.16, 64]} /></mesh>
      <mesh geometry={roundedBox(0.62 * clamp(k * 2), 0.24, 0.2, 0.1)} material={M().red} position={[-0.32, -0.1, 0.15]} rotation={[0, 0, -0.8]} />
      <mesh geometry={roundedBox(1.1 * clamp(k * 2 - 1) + 0.01, 0.24, 0.2, 0.1)} material={M().red} position={[0.2, 0.12, 0.15]} rotation={[0, 0, 0.9]} />
    </group>
  );
};

const Coin: React.FC<IconProps> = () => {
  const face = useMemo(() => new THREE.MeshPhysicalMaterial({ map: labelTexture('$', `800 190px ${FONT.round}`, '#fff', C.red), roughness: 0.2, clearcoat: 1 }), []);
  return (
    <group rotation={[0, -0.4, 0.1]}>
      <mesh material={M().deep} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1, 1, 0.24, 64]} /></mesh>
      <mesh material={face} position={[0, 0, 0.125]}><circleGeometry args={[0.86, 64]} /></mesh>
      <mesh material={M().red} position={[0, 0, 0.12]}><torusGeometry args={[0.93, 0.06, 16, 64]} /></mesh>
    </group>
  );
};

const Funnel: React.FC<IconProps> = ({ g }) => {
  const shape = useMemo(() => lathe([[0.18, -0.9], [0.2, -0.3], [0.95, 0.5], [1, 0.6], [0.9, 0.6], [0.15, -0.25], [0.12, -0.9]]), []);
  return (
    <group rotation={[0.25, 0, 0]}>
      <mesh geometry={shape} material={M().red} />
      {[-0.5, 0, 0.5].map((x, i) => {
        const k = e('power2.in', g, i * 0.15, 0.4);
        return <mesh key={i} material={M().white} position={[x * (1 - k), 1.05 - k * 1.2, 0.1]} scale={1 - k * 0.4}><sphereGeometry args={[0.2, 32, 24]} /></mesh>;
      })}
      <mesh material={M().white} position={[0, -1.05, 0.1]} scale={clamp(g * 1.5)}><sphereGeometry args={[0.18, 32, 24]} /></mesh>
    </group>
  );
};

const ICONS: Record<string, React.FC<IconProps>> = {
  people: People, target: Target, gift: Gift, clipboard: Clipboard, chart: Chart, megaphone: Megaphone, check: Check, coin: Coin, funnel: Funnel,
};

const Icon3D: React.FC<{ c: FxCtx }> = ({ c }) => {
  const life0 = life(c, 9, 9);
  // with a headline the icon is the last step of the sequence: title, subtitle, then the image
  const delay = str(c, 'title', '') ? 14 : 0;
  const f = life0.f, x = life0.x, a = e('expo.out', f, delay, 9);
  const name = str(c, 'icon', 'people');
  const Shape = ICONS[name] ?? People;
  const size = px(c, opt(c, 'size', 360));
  const layer = str(c, 'layer', c.scene.shot === 'none' ? 'screen' : 'behind');
  const cx = c.W * opt(c, 'x', 0) || (layer === 'screen' ? c.W / 2 : c.face.x);
  const cy = c.H * opt(c, 'y', 0) || (layer === 'screen' ? c.H * 0.5 : c.face.top - size * 0.12);
  const t = f / c.fps;
  const s = over(a, 1.45) * (1 - x * 0.25);
  const turn = lerp(-1.1, 0, e('power3.out', f, 0, 14)) + Math.sin(t * 1.3) * 0.22 * opt(c, 'sway', 1) + x * 1.2;
  const float = Math.sin(t * 1.7) * px(c, 8) - x * c.H * 0.35;
  const g = clamp((f - 6 - delay) / 24);
  const glow = opt(c, 'glow', 1);
  const k = clamp((f - delay) / 3);
  const title = str(c, 'title', '');
  return (
    <AbsoluteFill style={{ opacity: k * (1 - x * 0.6), filter: x > 0 ? `blur(${x * 10}px)` : undefined }}>
      {glow > 0 ? (
        <div style={{ position: 'absolute', left: cx - size, top: cy - size + float, width: size * 2, height: size * 2, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,40,40,${0.55 * glow}) 0%, rgba(255,40,40,${0.18 * glow}) 35%, rgba(255,40,40,0) 68%)`,
          transform: `scale(${s * (1 + 0.04 * Math.sin(t * 2.4))})` }} />
      ) : null}
      <div style={{ position: 'absolute', left: cx - size * 0.7, top: cy + size * 0.62 + float * 0.3, width: size * 1.4, height: size * 0.22,
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(80,0,0,0.28), rgba(80,0,0,0))', opacity: layer === 'screen' ? 1 : 0 }} />
      <PixelCanvas W={c.W} H={c.H} env={opt(c, 'env', 0.9)}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[-c.W, c.H, c.W]} intensity={2.4} />
        <directionalLight position={[c.W, -c.H * 0.2, -c.W * 0.4]} intensity={1.2} color="#ffb0b0" />
        <group position={at(c.W, c.H, cx, cy + float)} scale={(size / 2) * s} rotation={[0.08 * Math.sin(t), turn, 0]}>
          <Shape g={g} t={t} />
        </group>
      </PixelCanvas>
      {title ? (
        <HeadlineBlock c={c} f={f} cx={c.W / 2} top={c.H * opt(c, 'titleY', 0.15)} script={str(c, 'script', '')} text={title}
          sub={str(c, 'sub', '')} width={px(c, opt(c, 'titleWidth', 560))} dark={c.scene.set === 'dark' || c.scene.set === 'ember'} tag={`i${c.o.start}`} />
      ) : null}
    </AbsoluteFill>
  );
};

const slot = (want: string): React.FC<{ c: FxCtx }> => ({ c }) => {
  const layer = str(c, 'layer', c.scene.shot === 'none' ? 'screen' : 'behind');
  return layer === want ? <Icon3D c={c} /> : null;
};

export const ICON_FX: Record<string, FxDef> = {
  'icon-3d': {
    desc: 'A glossy red 3D icon (people, target, gift, clipboard, chart, megaphone, check, coin, funnel) lands from oversize turning into place, glows, sways; an optional headline rides above it',
    options: 'icon, size (px at 1080), x, y (0-1), layer (behind|front|screen), glow (0-1), sway, title, script, sub, titleY, titleWidth',
    Behind: slot('behind'), Front: slot('front'), Screen: slot('screen'),
  },
};
