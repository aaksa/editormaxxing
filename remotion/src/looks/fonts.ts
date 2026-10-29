import { loadFont as playfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as oldStandard } from '@remotion/google-fonts/OldStandardTT';
import { loadFont as fraktur } from '@remotion/google-fonts/UnifrakturMaguntia';
import { loadFont as elite } from '@remotion/google-fonts/SpecialElite';
import { loadFont as marker } from '@remotion/google-fonts/PermanentMarker';
import { loadFont as inter } from '@remotion/google-fonts/Inter';
import { loadFont as instrument } from '@remotion/google-fonts/InstrumentSerif';
import { loadFont as vt } from '@remotion/google-fonts/VT323';
import { loadFont as caveat } from '@remotion/google-fonts/Caveat';
import { loadFont as mono } from '@remotion/google-fonts/JetBrainsMono';

// The four looks' voices (all OFL, via @remotion/google-fonts):
//   newsroom: a heavy didone for headlines, a book serif for columns, a blackletter masthead, a typewriter, a marker pen
//   glass:    Inter from hairline to bold, with one Instrument Serif italic accent word
//   vhs:      VT323, the on-screen-display pixel face (and the marker pen for tape labels)
//   split:    Inter, a hand for notes (Caveat), a mono for numbers and UI
const PF = playfair('normal', { weights: ['700', '900'], subsets: ['latin'] });
const PFI = playfair('italic', { weights: ['700'], subsets: ['latin'] });
const OS = oldStandard('normal', { weights: ['400', '700'], subsets: ['latin'] });
const FR = fraktur('normal', { weights: ['400'], subsets: ['latin'] });
const SE = elite('normal', { weights: ['400'], subsets: ['latin'] });
const PM = marker('normal', { weights: ['400'], subsets: ['latin'] });
const IN = inter('normal', { weights: ['200', '300', '400', '500', '600', '700'], subsets: ['latin'] });
const IS = instrument('italic', { weights: ['400'], subsets: ['latin'] });
const VT = vt('normal', { weights: ['400'], subsets: ['latin'] });
const CV = caveat('normal', { weights: ['600', '700'], subsets: ['latin'] });
const JB = mono('normal', { weights: ['500', '700'], subsets: ['latin'] });

export const LF = {
  didone: PF.fontFamily, didoneItalic: PFI.fontFamily, book: OS.fontFamily, masthead: FR.fontFamily, type: SE.fontFamily,
  marker: PM.fontFamily, sans: IN.fontFamily, accent: IS.fontFamily, osd: VT.fontFamily, hand: CV.fontFamily, mono: JB.fontFamily,
} as const;
export const lookFontsReady = Promise.all([PF, PFI, OS, FR, SE, PM, IN, IS, VT, CV, JB].map((f) => f.waitUntilDone()));

export const NEWS = { paper: '#EEE5D0', paperHi: '#F7F1E3', ink: '#1E1B17', grey: '#8C8476', yellow: '#FFD93B', pen: '#C42318', string: '#B0121B' } as const;
export const GLASS = { violet: '#7B61FF', cyan: '#3FC8FF', pink: '#FF7DCB', peach: '#FFB25E', ink: '#0E0F14', mist: '#F4F4F8' } as const;
export const VHS = { osd: '#F4F4F4', green: '#7CFF6B', blue: '#1638D8', rec: '#FF2A2A', amber: '#FFB43A' } as const;
export const SPLIT = { board: '#F3F2EE', ink: '#16171B', accent: '#2F6BFF', good: '#18B26B', bad: '#F0443A', note: '#FF5A1F' } as const;
