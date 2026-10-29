import { e, fr, FxDef, MOTION, opt } from '../lib/core';
import { EXTRA_FX } from './extra';
import { GLASS_FX } from './glass';
import { ICON_FX } from './icons';
import { PAPER_FX } from './paper';
import { PAPER3D_FX } from './paper3d';
import { RIBBON_FX } from './ribbon';
import { TYPE_FX } from './type';

// The effect library, in the order `emx.py list` prints it. Each entry is an FxDef (see lib/core.ts).
export const EFFECTS: Record<string, FxDef> = {
  ...TYPE_FX,
  ...RIBBON_FX,
  ...ICON_FX,
  ...PAPER_FX,
  ...PAPER3D_FX,
  ...EXTRA_FX,
  ...GLASS_FX,
  sticker: {
    desc: 'A white sticker outline around the person (pair it with the halftone set and a mega-word)',
    options: 'width (px at 1080)',
    sticker: (c) => opt(c, 'width', 9) * Math.min(1, fr(c) / 4),
  },
  punch: {
    desc: 'A hard punch-in on the person for one word: in over 5 frames, a slow creep, out over 6',
    options: 'zoom',
    personScale: (c) => {
      const f = fr(c), total = (c.d * c.fps) / MOTION.tempo, z = opt(c, 'zoom', 1.18);
      return 1 + (z - 1) * (e('expo.out', f, 0, 5) * (1 - e('power2.in', f, total - 6, 6))) * (1 + 0.02 * (f / total));
    },
  },
};
