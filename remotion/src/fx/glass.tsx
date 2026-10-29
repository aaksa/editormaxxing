import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import * as THREE from 'three';
import { Center, Environment, Lightformer, MeshTransmissionMaterial, RoundedBox, Text3D } from '@react-three/drei';
import { clamp, e, FxCtx, FxDef, lerp, life, opt, over, px, SetName, str } from '../lib/core';
import { at, PixelCanvas } from '../lib/three';
import bold from '../fonts/poppins-extrabold.json';
import thin from '../fonts/poppins-light.json';

// Glass typography, after hjunhuh/glass (MIT, Hyeong Jun Huh): the word is real extruded 3D type with a small bevel in a
// transmission material (refraction, chromatic aberration, anisotropic blur, a lit back side), with a thin white copy of
// the same word floating inside it - the glass's bright "core" - lit by soft light panels so its edges catch highlights.
// Rebuilt here for video: the glass refracts a backdrop drawn to match the scene's set (a transparent video layer has no
// scene behind it to bend), every value is a function of the frame (temporal distortion off), and it can sit on a glass
// pill slab with a red glow behind it (the reference's "DEADLINE" chip).

type FontJSON = { glyphs: Record<string, { ha: number }>; resolution: number };
const FONTS = { bold: bold as unknown as FontJSON, thin: thin as unknown as FontJSON };
/** The word's width in px at a given size, from the font's own advances. */
const measure = (font: FontJSON, text: string, size: number) =>
  [...text].reduce((w, ch) => w + (font.glyphs[ch]?.ha ?? font.resolution * 0.3), 0) * (size / font.resolution);

const backdrops = new Map<string, THREE.Texture>();
/** What the glass refracts: the set's colours as a soft field with a red bloom (cream sets) or a red glow (dark sets). */
function backdrop(set: SetName, tint: string) {
  const key = `${set}:${tint}`;
  let t = backdrops.get(key);
  if (!t) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
    const g = cv.getContext('2d')!;
    const dark = set === 'dark' || set === 'ember';
    const base = g.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, dark ? '#1a0202' : set === 'blue' ? '#2f7fc8' : '#f4f2ec'); base.addColorStop(1, dark ? '#4a0606' : set === 'blue' ? '#0b3a73' : '#e2dfd6');
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (const [x, y, r, a] of [[150, 200, 220, 0.55], [380, 330, 180, 0.4], [260, 470, 160, 0.3]] as const) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, tint === 'clear' && !dark ? `rgba(242,15,20,${a * 0.6})` : `rgba(255,40,40,${a})`); rg.addColorStop(1, 'rgba(242,15,20,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 512, 512);
    }
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    backdrops.set(key, t);
  }
  return t;
}

const GlassWord: React.FC<{ c: FxCtx }> = ({ c }) => {
  const { f, a, x } = life(c, 16, 10);
  const text = str(c, 'text', 'DEADLINE');
  const tint = str(c, 'tint', 'red');                  // red | clear
  const pill = opt(c, 'pill', 0) > 0;
  // the word fits the frame with room to breathe (82 % of the width, less inside a pill)
  const want = px(c, opt(c, 'size', 150)), maxW = c.W * (pill ? 0.68 : 0.82);
  const size = Math.min(want, (want * maxW) / Math.max(1, measure(FONTS.bold, text, want)));
  const textW = measure(FONTS.bold, text, size);
  const depth = size * opt(c, 'depth', 0.26);
  const cx = c.W * opt(c, 'x', 0.5), cy = c.H * opt(c, 'y', 0.2);
  const t = f / c.fps;
  const set = c.scene.set ?? 'studio';
  const bg = backdrop(set, tint);
  // arrival: turns in from the side and comes into focus; then a slow sway (the light slides along the bevels)
  const ry = lerp(-0.85, opt(c, 'tiltY', -0.12), a) + Math.sin(t * 0.7) * 0.07 + x * 0.9;
  const rx = lerp(0.45, opt(c, 'tiltX', 0.08), a) + Math.sin(t * 0.55 + 1) * 0.04 - x * 0.3;
  const s = over(a, 1.3) * (1 - x * 0.15);
  const blur = (1 - a) * 14 + x * 12;
  const glass = (thick: number) => (
    <MeshTransmissionMaterial background={bg} transmission={tint === 'red' ? 0.55 : 1} thickness={thick} roughness={opt(c, 'roughness', 0.16)} ior={1.45}
      chromaticAberration={opt(c, 'aberration', 0.4)} anisotropicBlur={0.25} distortion={0.2} distortionScale={0.35} temporalDistortion={0}
      backside={tint !== 'red'} backsideThickness={thick * 0.4} samples={6} resolution={768}
      color={tint === 'red' ? '#ff1e24' : '#ffffff'} attenuationColor={tint === 'red' ? '#f20f14' : '#ffffff'} attenuationDistance={tint === 'red' ? depth * 1.8 : 1e6} />
  );
  const env = useMemo(() => (
    <Environment resolution={256} frames={1}>
      <group rotation={[-Math.PI / 4, -0.3, 0]}>
        <Lightformer intensity={2.4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.4} rotation-y={Math.PI / 2} position={[-10, 0, -1]} scale={[10, 2, 1]} />
        <Lightformer intensity={0.8} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 10, 1]} />
        <Lightformer form="ring" color={tint === 'red' ? '#ff4040' : '#ffffff'} intensity={3} position={[6, 6, 6]} scale={3} />
      </group>
    </Environment>
  ), [tint]);
  return (
    <AbsoluteFill style={{ opacity: clamp(f / 3) * (1 - x), filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
      {pill || tint === 'red' ? (
        <div style={{ position: 'absolute', left: cx - textW * 0.75, top: cy - size * 0.9, width: textW * 1.5, height: size * 1.8, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,30,30,${0.7 * e('silk', f, 4, 16)}) 0%, rgba(255,30,30,0) 70%)`, filter: 'blur(10px)' }} />
      ) : null}
      <PixelCanvas W={c.W} H={c.H} env={0}>
        {env}
        <ambientLight intensity={0.4} />
        <directionalLight position={[-c.W, c.H, c.W]} intensity={1.6} />
        <group position={at(c.W, c.H, cx, cy)} rotation={[rx, ry, 0]} scale={s}>
          {pill ? (
            <RoundedBox args={[textW + size * 0.9, size * 1.45, depth * 0.8]} radius={size * 0.3} smoothness={6} position={[0, 0, -depth * 1.1]}>
              <meshPhysicalMaterial color="#fff6f5" transparent opacity={0.78} roughness={0.08} clearcoat={1} clearcoatRoughness={0.04}
                sheen={0.8} sheenColor="#ffc9c9" envMapIntensity={1.6} />
            </RoundedBox>
          ) : null}
          <Center>
            <Text3D font={bold as never} size={size} height={depth} bevelEnabled bevelSize={size * 0.018} bevelThickness={size * 0.02}
              bevelSegments={3} curveSegments={10} letterSpacing={-size * 0.02}>
              {text}
              {glass(depth)}
            </Text3D>
          </Center>
          {opt(c, 'core', 1) ? (
            <Center position={[size * 0.01, size * 0.02, depth * 0.55]} scale={[0.94, 0.9, 1]}>
              <Text3D font={thin as never} size={size} height={size * 0.004} curveSegments={8} letterSpacing={size * 0.05}>
                {text}
                <meshBasicMaterial color={tint === 'red' ? '#fff3f2' : '#ffffff'} toneMapped={false} />
              </Text3D>
            </Center>
          ) : null}
        </group>
      </PixelCanvas>
    </AbsoluteFill>
  );
};

const slot = (want: string): React.FC<{ c: FxCtx }> => ({ c }) => (str(c, 'layer', 'screen') === want ? <GlassWord c={c} /> : null);

export const GLASS_FX: Record<string, FxDef> = {
  'glass-word': {
    desc: 'Glass typography (after hjunhuh/glass): real extruded 3D type in refractive glass with a thin white core, turning into focus; optional glass pill with a red glow',
    options: 'text, size (px at 1080), x, y (0-1), tint (red|clear), pill (0|1), depth (x size), core (0|1), roughness, aberration, tiltX, tiltY, layer (screen|front|behind)',
    Behind: slot('behind'), Front: slot('front'), Screen: slot('screen'),
  },
};
