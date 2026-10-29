import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

// Shader backdrops: a full-frame fragment shader of domain-warped fractal noise (the technique behind webgl-shader-lab's
// "Aurora Gradient", MIT, written fresh here) shaped into slow silk folds. Time is the frame's time, so it renders the same
// in any order. `silk` is cream with blush folds; `ember` is the dark red conclusion world with glowing folds.

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime; uniform vec2 uRes; uniform vec3 cA; uniform vec3 cB; uniform vec3 cC; uniform float uGrain; uniform float uVig; uniform float uFold;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 1.7;
  float t = uTime * 0.045;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + 1.2 * t), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.6 * r);
  float folds = smoothstep(0.42, 0.92, f * f * 1.7 + 0.45 * r.x);          // silk: bright ridges where the warp piles up
  float sheen = pow(smoothstep(0.55, 0.95, 1.0 - abs(f - r.y)), 3.0);      // a thin highlight along each fold
  vec3 col = mix(cA, cB, clamp(f * 1.35, 0.0, 1.0));
  col = mix(col, cC, folds * uFold);
  col += sheen * 0.08;
  col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  float v = smoothstep(1.25, 0.25, length((vUv - 0.5) * vec2(1.0, 1.2)));
  col *= mix(uVig, 1.0, v);
  gl_FragColor = vec4(col, 1.0);
}`;

const PALETTES: Record<string, [string, string, string, number, number, number]> = {
  silk: ['#ECE9E2', '#F9F7F3', '#F1DCD6', 0.02, 0.88, 0.42],
  ember: ['#0E0202', '#4D0607', '#C8131B', 0.04, 0.55, 0.7],
};

export const ShaderSet: React.FC<{ name: 'silk' | 'ember'; W: number; H: number; t: number }> = ({ name, W, H, t }) => {
  const [a, b, c, grain, vig, fold] = PALETTES[name];
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) }, cA: { value: new THREE.Color(a) }, cB: { value: new THREE.Color(b) },
      cC: { value: new THREE.Color(c) }, uGrain: { value: grain }, uVig: { value: vig }, uFold: { value: fold },
    },
  }), [a, b, c, grain, vig, fold, W, H]);
  mat.uniforms.uTime.value = t;
  return (
    <ThreeCanvas width={W} height={H} linear flat gl={{ antialias: false, preserveDrawingBuffer: true }} style={{ position: 'absolute', inset: 0 }}>
      <mesh frustumCulled={false} material={mat}><planeGeometry args={[2, 2]} /></mesh>
    </ThreeCanvas>
  );
};
