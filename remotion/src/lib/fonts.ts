import { loadFont as anton } from '@remotion/google-fonts/Anton';
import { loadFont as poppins } from '@remotion/google-fonts/Poppins';
import { loadFont as dafoe } from '@remotion/google-fonts/MrDafoe';
import { loadFont as bodoni } from '@remotion/google-fonts/BodoniModa';
import { loadFont as inter } from '@remotion/google-fonts/Inter';

// The look's five voices: a tall condensed display face (the giant words), a heavy round geometric sans (the gloss words,
// headlines, stacked lines), a fast pen script (the small accent word that always rides on a big one), a high-contrast
// serif (the dark title cards) and a plain UI sans for small print.
const A = anton('normal', { weights: ['400'], subsets: ['latin'] });
const P = poppins('normal', { weights: ['500', '600', '700', '800', '900'], subsets: ['latin'] });
const PI = poppins('italic', { weights: ['800', '900'], subsets: ['latin'] });
const D = dafoe('normal', { weights: ['400'], subsets: ['latin'] });
const B = bodoni('normal', { weights: ['500', '600'], subsets: ['latin'] });
const I = inter('normal', { weights: ['500', '600', '700'], subsets: ['latin'] });

export const FONT = {
  tall: A.fontFamily, round: P.fontFamily, roundItalic: PI.fontFamily, script: D.fontFamily, serif: B.fontFamily, ui: I.fontFamily,
} as const;
export const fontsReady = Promise.all([A, P, PI, D, B, I].map((f) => f.waitUntilDone()));

// ---------- palette, sampled from the reference ----------
export const C = {
  red: '#F20F14',        // the one colour: pure signal red
  redHi: '#FF4A48',      // its lit face
  redDeep: '#A00101',    // its shade and extrusion
  redInk: '#6A0006',     // the darkest red (extrusion back, dark set mid)
  cream: '#ECEBE2',      // the studio wall
  blush: '#F7ECE8',      // the soft pink set
  night: '#0A0000',      // the dark set's corners
  ink: '#151313',
  white: '#FFFFFF',
} as const;
