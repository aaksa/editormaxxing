import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { C } from './fonts';

// The Three.js lane (the PixelCanvas idea from facecammaxxing): a frame-sized canvas whose z = 0 plane maps 1:1 onto the
// frame's pixels, so a 3D object is placed in plain frame coordinates next to the face. Motion is a pure function of the
// frame (never useFrame or a clock), so any frame renders the same on its own.

export const FOV = 30;
export const camDist = (H: number) => H / 2 / Math.tan((FOV * Math.PI) / 360);
export const at = (W: number, H: number, x: number, y: number, z = 0): [number, number, number] => [x - W / 2, H / 2 - y, z];

const Setup: React.FC<{ env: number }> = ({ env }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }, [gl, scene]);
  scene.environmentIntensity = env;
  return null;
};

export const PixelCanvas: React.FC<{ W: number; H: number; env?: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ W, H, env = 1, style, children }) => {
    const dist = camDist(H);
    return (
      <ThreeCanvas width={W} height={H} flat linear={false} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ fov: FOV, position: [0, 0, dist], near: 10, far: dist * 4 }} style={{ position: 'absolute', inset: 0, ...style }}>
        <Setup env={env} />
        {children}
      </ThreeCanvas>
    );
  };

// ---------- one material set for every icon: glossy red plastic, frosted glass, white enamel, chrome ----------
let mats: Record<'red' | 'deep' | 'glass' | 'white' | 'chrome' | 'pink', THREE.Material> | null = null;
export function materials() {
  if (mats) return mats;
  mats = {
    red: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(C.red), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3, sheenColor: new THREE.Color('#ff8080') }),
    deep: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(C.redDeep), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#FBF3F3'), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.82 }),
    white: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#FBFAFA'), roughness: 0.3, clearcoat: 0.8 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#E6E6E6'), metalness: 1, roughness: 0.18 }),
    pink: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#FFE3E4'), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
  };
  return mats;
}

const boxCache = new Map<string, THREE.BufferGeometry>();
export function roundedBox(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join(':');
  let g = boxCache.get(key);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, 5, Math.min(r, w / 2, h / 2, d / 2)); boxCache.set(key, g); }
  return g;
}

/** A shape turned on a lathe (a bust, a funnel, a bell): points are [radius, height]. */
export function lathe(points: [number, number][], seg = 48): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

/** A text label drawn on a canvas once, for the small marks on icons (%, $). */
const texCache = new Map<string, THREE.CanvasTexture>();
export function labelTexture(text: string, font: string, color: string, bg = 'rgba(0,0,0,0)'): THREE.CanvasTexture {
  const key = `${text}|${font}|${color}|${bg}`;
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    const g = cv.getContext('2d')!;
    g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 138);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    texCache.set(key, t);
  }
  return t;
}
