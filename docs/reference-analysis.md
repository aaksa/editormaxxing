# Reference analysis

The studied reel: a 47.3 s Uzbek-language business-marketing explainer, 1080 × 1920, **24 fps** (1,135 frames), VP9 +
AAC 44.1 kHz stereo, **−14.1 LUFS** integrated. Kept local only (the user's download); nothing from it is reused.
Measured with ffprobe / ffmpeg scene detection (threshold 0.18), a 2 fps timecoded contact sheet, full-size stills,
pixel sampling and a log spectrogram.

## Shot list (measured cuts)

| # | Time (s) | Set / framing | What happens | Technique |
|---|---|---|---|---|
| 01 | 0.00–4.21 | Cream seamless studio, wide, seated full body in a dark armchair | Giant tilted glossy word behind the head + a pen-script word on its corner; a curled checklist sheet flies across (0.9–2.0); a chunky gloss word with a floor reflection lands by the legs (2.5), then a two-line gloss phrase (3.0) | Rotoscoped subject over the plate, 2.5D type, simulated extrusion, motion blur on the sheet |
| 02 | 4.21–6.63 | Same, wide | A ring of words turns around the body (front half over, back half behind, mirrored); a headline + script + small line arrive top; a glossy red 3D people icon with a red glow pops behind the head | 3D layer text on a cylinder, subject matte splitting front/back, pre-rendered 3D icon |
| — | 6.63 | — | White smear cut | Directional blur transition |
| 03 | 6.63–8.96 | Halftone wall, wide, white sticker outline around the person | Giant word "luck" behind, pen-script "not this!" + small script lines | Matte-based sticker stroke, dot-screen backdrop |
| 04 | 8.96–9.40 | — | White bloom, then a glass pill word wiped by vertical pillars | Light swell + mask wipe |
| 05 | 9.40–16.88 | Blush set, leaves in two corners, **no person** | Headline + script; a frosted glass audit board; a magnifier scans it, the content under the lens changes (funnel, people with a cross, cart) | Pre-rendered glass 3D, lens with magnified copy |
| 06 | 16.88–22.21 | Red wall + red floor band on white, wide | A justified block of red lines grows upward line by line, in speech order (bottom first) | Speech-synced kinetic type |
| 07 | 22.21–26.92 | Dark red vignette, no person | Serif title with script above and below; 3D icons cycle (clipboard → gift → megaphone/laptop); white caption words land under | Serif + script type, 3D icon swaps with blur |
| 08 | 26.92–28.04 | Red diagonals, medium shot | Name in heavy italic, two lines, script "I am" | Lower-third name title |
| — | 28.04–28.30 | — | Rapid flash frames (5 cuts in 0.25 s) | Stutter / flash transition |
| 09 | 28.30–29.79 | Blue room B-roll (person at a desk) | A torn paper note pinned with "4 years", floating app cards | B-roll + paper prop + parallax cards |
| 10 | 29.79–33.29 | Cream wall, medium close | Two lines arc over the head (red small, white big); the floor goes black; a white number counts to $1,000,000 with a target + dart; red/white lines under | Arc text, counter, 3D icon on the number |
| 11 | 33.29–35.25 | Dark wood room with chess (B-roll) | Serif script "from my experience" | B-roll + script title |
| 12 | 35.25–38.33 | Keyhole → dark red | A keyhole reveals an eye on a banknote; then a target icon + script line | Iris (keyhole) transition, 3D icon |
| 13 | 38.33–47.30 | Cream wall, medium close | Headline words replace each other in place on cue ("if your business" → "is" → "your sales" + "2x 3x"); red chevrons pulse on the chest | Word-swap headline, looping accent |

**Rhythm:** 13 shots in 47.3 s (mean 3.6 s), but a new visual act lands every **1.2–2.0 s** inside each shot: the cut
carries the topic, the effects carry the sentence. Reduced motion only at the start of shot 07 and the B-roll beats.

## Visual identity
- **Palette** (sampled): signal red `#FF0300` lit / `#A00101`, `#8D0001`, `#B40000` shade; cream wall `#ECEBE0`–`#E9EDE1`;
  blush `#F9EEEA`; dark set corners `#0A0000`. One accent colour; white only on red or dark; blue only in one B-roll.
- **Type:** five voices (tall condensed caps with gloss + halftone, pen script, heavy round geometric sans, high-contrast
  serif, small print). Details and sizes in `style.md`.
- **Composition:** the person small and full-body in the wide shots (face ≈ 0.11 of the width at ≈ 0.4 of the height);
  the top third is type; giant words fill ~80 % of the width behind the head; sets without the person carry one centred
  3D object.

## Motion language
- Entries: from oversize (~1.4×) in 6–9 frames, decelerating; giant words rise from behind the body and focus; letters
  cascade 1–1.5 frames apart; nothing scales up from zero.
- Exits: smear sideways, drop with blur, or blow past the camera.
- Camera: post-production pushes (3–4 % per shot), punch-ins on numbers; no real camera move.
- Cuts: horizontal smear (most), white bloom (into new worlds), flash stutter (once), keyhole iris (once).
- Living holds: icon sway + glow pulse, the ribbon's turn, slow pushes.
- Overshoot: rare — only the icon pops; type lands without bounce.

## Audio
Voice-over on a **continuous music bed** (energy in the low end never drops to silence; `silencedetect` at −35 dB finds no
gaps), with **broadband transients at the cuts** (whoosh / impact) and brief dips where the bed is cut on a transition
(≈ 6.6 s, 9.0 s, 16.9 s). Loudness −14.1 LUFS, the platform norm.

## Production environment (what it is, what it is not)
- **Real**: two seamless-studio setups (wide in an armchair, medium close), plus B-roll (desk, chess room).
- **Composited**: every set except the cream studio is a backdrop behind a rotoscoped subject (the stripes, halftone and
  dark sets show no real light interaction); sticker outlines prove a clean matte.
- **3D**: the icons are pre-rendered glossy 3D (stock-icon style); the giant words are flat type with gradients, halftone
  and an offset extrusion — **simulated 3D**, not geometry; the ribbon is 3D-layer text on a cylinder.
- **Likely tool**: After Effects (3D layers, Roto Brush, Element-style icons). Not verified, and not needed: every
  technique has a deterministic code equivalent (see `stack.md`).

## What editormaxxing reproduces, and how faithfully
| Reference technique | editormaxxing | Fidelity |
|---|---|---|
| Giant glossy word behind, script on its corner | `mega-word` | close |
| Gloss word + reflection in front | `gloss-word` | close |
| Ring of words around the body | `ribbon` | close |
| Glossy 3D icons with glow | `icon-3d` (9 icons built from primitives) | close in material, simpler in form |
| Curled checklist flying | `paper-card` | close |
| Sticker outline on halftone | `sticker` + `halftone` set | close |
| Magnifier over glass board | `magnifier` | close (2D glass, exact magnified copy) |
| Growing justified block on stripes | `stack-lines` + `stripes` | close |
| Serif title cards on dark red | `title-card` + `dark` | close |
| Name title | `name-title` | close |
| Torn note on blue B-roll | `torn-note` + `blue` set (+ `broll` for real footage) | close; B-roll needs your footage |
| Arc text, counting number on a black floor | `arc-text`, `big-number` (+ `punch`) | close |
| Keyhole reveal | `iris` cut | close (opens on the next shot instead of an inserted image) |
| Headline word swaps, chevrons | `headline` with `times`, `chevrons` | close |
| Whip smear, bloom, zoom-through | `whip`, `bloom`, `zoom` cuts | close |
| Flash stutter (0.25 s) | not built (used once; a `bloom` covers the job) | — |
| Music bed | `--music` with voice ducking (no bed is invented) | depends on your track |
| Whooshes / impacts at cuts | synthesized, auto-cued | equivalent in role, not in timbre |
