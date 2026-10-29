# The looks

The red gloss is one look. Four more sit beside it, each a different reason to watch the same talking head. A plan picks
one with `"look"`; every look keeps the skill's rules (voice-anchored beats, one hero per scene, the face never covered,
platform zones, -14 LUFS) and its pipeline (`emx.py check / render`). Effects and cuts from any look can be borrowed by
another, but a film reads best when it stays in one world.

Demos (the same 10-second clip in each look): `demo/looks/{newsroom,glass,vhs,split}.mp4`, plans in
`examples/looks/*.json`.

## How the looks were chosen
Researched October 2026 (sources at the end). Short-form editing has settled into recognisable "aesthetics"; the ones
that suit a talking head and that the red gloss and the user's other skills (collage, wayang/ink, navy tech explainer,
LEGO, isometric) do not cover:
- **Documentary / newspaper** - named in every 2026 trend list ("documentary-style reels", "that newspaper headline text
  vibe", Vox / Johnny Harris). It makes a claim feel sourced.
- **Apple-style premium / liquid glass** - "clean, glossy, premium" motion is the other style brands push; iOS 26's
  liquid glass made refractive glass the look of 2026 UI.
- **VHS / camcorder** - the nostalgic home-video finish (REC, date stamp, tape noise) is a lasting short-form staple for
  behind-the-scenes, storytime and humour.
- **Green-screen explain / split screen** - presenter in a third of the frame, visuals in the rest, swapped every
  4-6 s: the format of tutorials and tool demos.

## newsroom - the documentary look
**Use for:** stories, case studies, "this happened", proof, history, numbers that need to feel sourced.
**World:** cream newsprint and paper (`newsprint` - a broadsheet front page fills the wall; `evidence` - a cork board
with pinned scraps and red string; `archive` - a dark desk under a warm lamp).
**Type:** Playfair Display 900 headlines, Old Standard body, UnifrakturMaguntia masthead, Special Elite typewriter,
Permanent Marker for notes. Ink `#1E1B17`, highlighter `#FFD93B` (multiply), red pen `#C42318`.
**Motion:** every graphic animates on 12 fps (`step: 12`) while the camera and the person stay at the film's rate - the
stepped, hand-made feel of the look. Highlights sweep, circles draw, bars slide, stamps slam.
**Effects:** `newspaper` (front page spins in, the [marked] words highlighted on their word), `clipping` (torn quote
strip, a word circled in red pen), `photo` (a moving photo printed in the page - the clip itself in grainy B/W - a typed
caption, a red circle), `map` (Natural Earth map, dotted route drawing pin to pin, typed labels), `redact` (a file
blacked out line by line, one line revealed and highlighted), `stamp` (rubber stamp slams with a jolt),
`typewriter` (lower third typed on a paper strip).
**Cuts:** `paper` (the spinning newspaper: the next scene arrives as a page from far away, spinning, slowing as it
fills the frame), `tear` (the page is ripped away along a ragged edge with a paper rim).
**Finish:** warm paper multiply, film grain on twos, dust, a drifting light leak, vignette.
**HUD:** `"hud": {"paper": "The Daily Session", "date": "Thursday, October 29, 2026"}` names the paper.
**Annotations** use `@remotion/rough-notation` (MIT): wrap words as `[word]` in `text`; `markAt` places the stroke on a
spoken word.

## glass - the premium keynote look
**Use for:** products, apps, tech, announcements, premium brands, anything that should feel expensive and calm.
**World:** `aurora` (four slow colour fields on mist), `frost` (white, two faint pastels, a soft floor), `midnight`
(black, one violet glow, a faint floor line).
**Type:** Inter from 200 to 700, tracking tightening as lines settle; one word per headline in Instrument Serif italic
(`*word*`). Hairline giant numbers.
**Motion:** reveal, never pop: lines rise out of a mask and focus in from a blur; cards float with a slow 3D tilt; a
specular sweep crosses a pane once. Long soft eases (the refined clock).
**Glass:** real refraction. Each pane is a `backdrop-filter` through an SVG displacement map generated for its rounded
shape (pixels near the rim pushed along the edge normal - the technique of the open liquid-glass web demos), plus blur,
saturation and a bright rim. Rule: a glass pane must never sit inside a parent with `opacity`, `filter` or a mask -
that parent becomes the backdrop's root and the glass goes blank. `GlassPane` fades through its own layers (`fade`,
`soft`) for this reason.
**Effects:** `glass-title`, `glass-card`, `glass-notify` (iOS notifications drop and stack), `glass-number` (count-up in a
glass disc with a gradient ring), `glass-list` (switches turn on, each on its word), `light-sweep`, `glass-orbs`.
**Cuts:** `lens` (a bar of glass sweeps across; behind it the world has changed), plus `glide`.
**Finish:** a soft top light and a light vignette; no grain on the picture.

## vhs - the camcorder look
**Use for:** behind the scenes, storytime, throwbacks, humour, "raw" honesty, a creator talking to camera at home.
**World:** the person's own room (`footage`, the clean plate - VHS wants the real place), `bluescreen` (the VCR's blue),
`snow` (tape static).
**Type:** VT323, the on-screen-display face, white with a hard shadow; captions on black boxes like 90s closed captions;
marker pen on tape labels.
**Effects:** `osd` (PLAY ▶, CH 03, any line), `glitch-word` (RGB split, slices jumping), `menu` (a VCR menu whose cursor
walks the items on their words, done ones marked OK - a list in this world), `cc-caption`, `tape` (a cassette with a
marker label, reels turning), `ff` (fast-forward tears).
**Cuts:** `rewind` (the picture rolls and tears under ◀◀ REW, then catches the tracking), `static` (a burst of snow).
**Finish:** the red and blue channels pulled apart, softened, colour pushed, an occasional sideways jitter; scanlines,
tape noise, a tracking band rolling up, the head-switching tear at the bottom, vignette; the camcorder HUD (● REC or PLAY,
SP and battery, time, date, tape counter) placed inside the platform-safe band.
**HUD:** `"hud": {"mode": "rec"|"play", "date": "OCT.29 2026", "time": "PM 4:20", "counter": "0", "off": ""}`.

## split - the screen-share explainer
**Use for:** tutorials, tool demos, "how I do X", walkthroughs of a dashboard, numbers on a chart, step-by-step.
**World:** `board` (off-white dot grid) and `slate` (charcoal dot grid). Every scene sets `"place": "bottom"` (or `left`
/ `right`): the person sits small at the bottom and stays put; the camera does not enter-move (`enter` defaults to none).
**Type:** Inter for UI, JetBrains Mono for numbers and URLs, Caveat for hand notes. One accent (`#2F6BFF`), green / red
only for good / bad.
**Effects:** `panel` (a screen in a browser frame - your screenshot or clip as `src`, or a drawn stand-in app - with a
tag; `focus` zooms into a region and boxes it on `focusAt`), `chart` (bars grow, values count in mono, accent bar),
`steps` (numbered cards land on their words, the current outlined, done ones ticked), `compare` (before / after rows in
pairs), `arrow-note` (hand note with an arrow drawing itself), `lower-third`.
**Cuts:** `swap` (the world slides like a carousel while the person stays one continuous figure).
**Rhythm:** change the visual every 4-6 s (a new panel, a zoom into it, a chart, the steps).

## Picking a look
| The video is... | Look |
|---|---|
| a bold business claim with energy | gloss |
| a story, proof, a case, a number that must feel sourced | newsroom |
| a product, an app, a launch, premium | glass |
| personal, nostalgic, funny, behind the scenes | vhs |
| a tutorial, a tool, a dashboard, steps | split |

## Sources (October 2026)
- OpusClip, "11 Editing Aesthetics Dominating Short-Form in 2026" - opus.pro/blog/editing-aesthetics-dominating-short-form-2026
- AutoAE, "How to make newspaper animation effect" (July 2026) - autoae.online/blog/how-to-make-newspaper-animation-effect
- Motion Array, "Edit Documentaries in Premiere Pro: 3 Johnny Harris Style Tips" - blog.motionarray.com
- PremiumBeat, "Replicating a Vox motion graphic" (12 fps graphics in a 24 fps edit) - premiumbeat.com/blog/replicating-vox-motion-graphic
- Liquid glass on the web: naughtyduk/liquidGL, archisvaze/liquid-glass, iyinchao/liquid-glass-studio (displacement-map refraction)
- Remotion: @remotion/rough-notation (MIT) - remotion.dev/docs/rough-notation/api
- Maps: world-atlas (Natural Earth, public domain data; ISC), d3-geo (ISC), topojson-client (ISC)
- Fonts (OFL) via @remotion/google-fonts: Playfair Display, Old Standard TT, UnifrakturMaguntia, Special Elite, Permanent
  Marker, Inter, Instrument Serif, VT323, Caveat, JetBrains Mono
- Paper, grain, cork, wood, static: generated with SVG noise (no image files, no licences)
