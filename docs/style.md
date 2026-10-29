# The red gloss look

Measured from the reference reel (a 47 s, 1080 × 1920, 24 fps business explainer; 21 cuts, a new visual act every
~2.2 s). Use this to plan beats and to judge your own render.

## Palette (sampled)
| role | value |
|---|---|
| the one colour, lit | `#FF2E2E` → `#D80A12` → `#8E0008` (top → middle → shade), bottom lift `#C8000E` |
| extrusion / dark set mid | `#A00101`, `#6A0006` |
| studio wall | `#ECEBE2` (cooler `#E9EDE1` at the edges) |
| blush set | `#F7ECE8` |
| dark set corners | `#0A0000` |

Nothing else: no second accent, no blue UI, no grey cards. White type only on red or dark.

## Type, five voices
1. **The giant word** - tall condensed caps (Anton stretched ~1.9×), lit red with an extrusion down-right, a halftone dot
   screen on its lower half, a gloss band that sweeps once, tilted −6 to −10°. It sits behind the person: the head breaks
   into it, the shoulders cover its foot. One per scene at most.
2. **The pen script** - a fast handwriting word (Mr Dafoe) that always rides on a big word: across a giant word's corner,
   above a headline, above and below a serif title. White with a thin dark edge on red, dark red on cream.
3. **The round heavy sans** - Poppins 800: the front words (with extrusion + floor reflection), headlines, the stacked
   block, the arc lines, the ribbon. Lines are fitted to an exact width, so a short line comes out big.
4. **The serif** - Bodoni Moda, white, only on the dark set (the conclusion).
5. **Small print** - Poppins 600 / Inter, dark grey on cream, white on dark; never more than one line.

## Space
- The person sits small and full-body in a dark armchair in the `wide` shot (face ~0.11 of the frame's width, at ~0.4 of its
  height), or as shot, or close with the face just below the middle; the top third is for type.
- Giant words fill ~75-85 % of the width; front words sit beside the shins; headlines sit at 13-17 % of the height.
- Sets without the person (blush, dark) carry one centred 3D icon at ~45-50 % of the width.

## Motion (refined, the default)
Premium, award-site motion layered over the reference's language. Measured at 24 fps.
- **Tempo:** effects run on a clock 1.8x slower than the punchy reel timing: a title reveal ~1.2 s, a supporting line
  ~0.9 s, an exit ~0.6 s. Exits still end exactly when the effect ends.
- **Curves:** `premium` (0.16, 1, 0.3, 1) for arrivals - most of the travel early, then a long glide in; `silk`
  (0.22, 1, 0.36, 1) for secondary arrivals; `glide` (0.65, 0, 0.35, 1) between two rests; `leave` (0.55, 0, 0.85, 0.35)
  for exits. No overshoot anywhere.
- **Reveal, don't pop:** rise out of a mask (+3° settle), focus from an 8-10 px blur, settle from 1.12x (not 1.45x).
- **Sequence:** title (0 s) → script word (+0.45 s) → subtitle (+0.75 s) → button (+1.1 s) → image / icon (+1.0 s after a title).
- **React:** each arrival sends a damped ripple (rise 0.4 s, settle ~1.2 s): the camera answers with a ~0.6 % zoom, depth
  elements drift outward ~1 %, the 3D paper flutters, the pill dips 5 % and shines when pressed.
- **Parallax:** one camera, seven depths (set 0.28 … near 1.7); a 6-7 % push or a ~65 px lateral drift per scene, plus a
  breathing of three incommensurate sines (±7 px, ±0.25°): the room barely moves, the person moves, near elements sweep.
- **Transitions overlap:** glide 0.86 s, depth 0.82 s, curtain 0.88 s, bloom 0.92 s, iris 1.0 s. The person stays one figure
  through glide / depth, reframing from shot to shot.
- **Calm vs strong:** most of the film is low-amplitude continuous motion; reserve the punch-in, the depth cut and the giant
  word for the sentence that carries the point.

## Motion (punchy, `"motion": "punchy"`)
- Entry from oversize (1.4-1.45×) in 6-9 frames, `expo.out`; giant words rise ~half their height and focus from a blur.
- Letters cascade at 1-1.5 frames apart (arc text, serif title); lines in a block land at their spoken word.
- The ribbon arrives from 1.7× its radius spinning fast and settles to ~55°/s.
- Icons turn in from ~−60° about the vertical and then sway ±12°; their parts build after landing (bars, a dart, a check).
- Cuts: a horizontal smear (~70 px blur, 3 frames out, 5 in) between most scenes; a white bloom (5 out, 8 in) into a new
  world (the blush set, the close-up section).
- Every held frame keeps a living thing: a 3-4 % push on the scene, an icon's sway and glow pulse, the ribbon's turn, a set's
  drifting light.

## Self-review (after every render)
1. Watch at real speed. One sentence per scene: what is the hero, what does it make the viewer believe?
2. Is every word on screen readable on a phone (giant words: letters separate; front words: not lost on the chair)?
3. Does anything cover the face, clip at the frame edge, or sit in the top 250 / bottom 384 px?
4. Any frame static for more than 3 frames? Any light pop outside a bloom cut?
5. Are the numbers real, or marked as examples? What would you still fix, in order of impact?
