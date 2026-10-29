# Architecture decisions

**Principle:** the simplest stack that reaches the reference's quality, deterministic (any frame renders the same on its
own), scriptable end to end, and editable as data (a JSON plan), not as a timeline in a GUI.

## Technique → technology

| Technique | Chosen | Why | Simpler option considered |
|---|---|---|---|
| Timeline, layering, render | **Remotion 4** (React) | Frame-accurate, deterministic, headless, one plan → MP4; layers are components | Motion Canvas (no WebGL/R3F story, smaller ecosystem) |
| Kinetic type, masks, wipes | **SVG text + CSS** in Remotion | `textLength` fits words to exact widths; masks/gradients are native; zero cost | — (already the simplest) |
| Extruded glossy words | **Simulated extrusion in SVG** (stacked offset copies + lit gradient + halftone + gloss band) | The reference's words are simulated too; real geometry (Three.js `TextGeometry` / Blender) adds font conversion, bevels and lighting with no visible gain | Three.js `TextGeometry` — rejected |
| Ring of words | **Per-glyph math** (cylinder positions, front/back split around the person) | Seek-safe, no WebGL, exact front/back layering against the matte | Three.js text on a cylinder — needs the person in the 3D scene to occlude |
| Curled paper | **Nested CSS-3D strips** | A true accumulating bend with live HTML content; motion blur via samples | Three.js plane deformation |
| Glossy 3D icons | **Three.js via @react-three/fiber + @remotion/three**, physical materials + environment map | Real light and clearcoat; primitives keep it dependency-free | Blender (kept as the upgrade path for hero props, e.g. facecammaxxing's `fcm blender`) |
| Camera + parallax | **One camera per scene applied per layer by depth** (`lib/camera.ts`), inverse-mapped so effects at any depth still find the face | Real 2.5D from CSS transforms on a cut-out; no 3D scene needed | Three.js camera over textured planes - heavier, same result |
| Premium easing | **GSAP CustomEase** (free since GSAP 3.13) bezier curves, remapped globally in the refined mode | One switch turns the whole library from snappy to premium | Hand-tuning every effect |
| Overlapping transitions | Two scene stacks rendered at once, masked (feathered linear / radial) | Glides and reveals instead of dissolves; the person drawn once and reframed | Cross-dissolves (muddy between light and dark worlds) |
| Shader backdrops | **Fragment shader** (domain-warped fbm silk) in a full-frame Three.js quad, time = frame time | Living, premium backgrounds at almost no cost | Video loops (licence, file size) |
| 3D paper | **Three.js plane, 56x40 segments, bent on the CPU every frame** (curve + ripple + corner lift), canvas-printed face, physical material | Real light over real folds; deterministic | CSS strips (kept for the quick `paper-card`) |
| Glass typography | **drei `Text3D` + `MeshTransmissionMaterial`** (after hjunhuh/glass, MIT): extruded, bevelled type in transmission glass with a thin white core copy, Lightformer environment; fonts converted from Poppins TTF (OFL) to typeface JSON (`remotion/ttf2json.mjs`, Latin only, 33 KB) and imported into the bundle | The repo's exact technique; real refraction and chromatic aberration; synchronous fonts, so frames never miss them | SVG/CSS "glass" (no real refraction) |
| Viewport language | Per-scene camera entries (pull-back + roll + blur), Dutch angle, strong pushes; five reference cuts (push, flare, spin, slats with `clip-path: path()` strips, flood) as frame functions | Measured from the reference at 24 fps; deterministic | Pre-rendered transition packs (licences, no adaptation to the scene) |
| Letter-by-letter builds | One glossy word drawn once per letter, each copy clipped to its letter's strip and moved on its own (`LetterStrips`); headline letters as spans with a centring glide | Letters arrive separately but share one lit surface | Per-glyph SVG layout (needs exact glyph metrics) |
| Magnifier | **DOM drawn twice** (board + magnified copy clipped to the lens) | Exact magnification of the same content, no shader | Refraction shader — overkill |
| Easing | **GSAP's ease functions only**, read as pure functions | Industry-standard curves; never a self-playing timeline (breaks seek-safety) | Hand-written curves |
| Punch-ins, pushes, parallax | **CSS transforms per layer** (set zooms ~35 % of the person's push) | 2.5D depth for free; real parallax needs a clean plate the cut-out already gives | 3D camera |
| Motion blur | **`CameraMotionBlur` with low samples** on fast layers; **directional SVG blur** for whips | Remotion's docs warn blur is costly and colour-destructive at high sample counts; whips only need a smear | Post blur in ffmpeg |
| Transitions | Whip (smear), bloom (light swell), zoom-through, keyhole iris (`clip-path: path()`) | All per-frame transforms/filters, no extra render passes | — |
| Subject cut-out (real clip) | **RobustVideoMatting** via facecammaxxing (working today) | Fast, proven on talking heads; MediaPipe fallback | **MatAnyone 2** (CVPR 2026) beats RVM on benchmarks (4.73 vs 6.08 MAD on VideoMatte-SD) but needs SAM2, conda and heavier compute — the upgrade path for hair-edge quality |
| Word timing | **faster-whisper** word timestamps, aligned to the known script and clamped to measured line spans | One small model, CPU, no torch; script alignment fixes spelling and boundary drift | **WhisperX** (wav2vec2 forced alignment) is more precise but heavier; worth it for real footage with music under the voice |
| Placeholder voice | macOS **`say`** per line | Exact line timings for free; the mouth follows the measured loudness | ElevenLabs (paid, network) |
| Sound effects | **ffmpeg-synthesized** (formula / seeded noise), auto-cued from the plan | Deterministic, no sample library, no licence | Stock SFX packs (licence + curation) |
| Mix, loudness | ffmpeg `amix`, optional `sidechaincompress` music ducking, `loudnorm` to −14 LUFS | Matches the reference's measured loudness | — |
| QC | ffprobe / ffmpeg (`blackdetect`, `freezedetect`, `ebur128`) on the rendered file + frames from the output | Checks the real output, not a preview | Manual review only |

## Rejected, and why
- **After Effects** — not headless or scriptable from a plan, a paid seat, and the result is not reproducible from text.
  Its techniques (3D layers, Roto Brush) all have deterministic equivalents here.
- **Blender for type** — real extrusion adds nothing over the simulated look the reference itself uses; render times jump.
- **GSAP timelines that play** — break when Remotion renders frames out of order in parallel tabs; only eases are used.
- **WebCodecs** — Remotion already handles decode/encode; no gain for this job.

## Dependencies and licences
| Dependency | Version | Licence / cost |
|---|---|---|
| Remotion (+ bundler, renderer, three, motion-blur, google-fonts) | 4.0.534 | Free for individuals and companies ≤ 3 people; larger companies need a Company License (Creators $25/seat/month; Automators $0.01/render, $100/month minimum) |
| React | 19.1.1 | MIT |
| Three.js / @react-three/fiber / @react-three/drei | 0.179.1 / 9.3.0 / 10.7.6 | MIT |
| Poppins TTF → typeface JSON (`fonts/`, `remotion/src/fonts/`) | Google Fonts | OFL (`fonts/OFL.txt`) |
| GSAP | 3.15.0 | Free (standard no-charge licence) |
| Fonts: Anton, Poppins, Mr Dafoe, Bodoni Moda, Inter | Google Fonts | OFL |
| faster-whisper (+ CTranslate2, Whisper "small" weights) | 1.1.1 | MIT |
| ffmpeg | system | LGPL/GPL build |
| RobustVideoMatting (via facecammaxxing, real clips only) | — | GPL-3.0, downloaded at setup, not bundled |
| Node.js 22+, Python 3.11 (uv) | — | — |

## Inspiration and licences checked
- [threeui 3D Paper](https://threeui.com/three-js/3d-paper/certificate): lists "Three.js + custom GLSL + CanvasTexture"; no
  licence terms are shown, so nothing is copied - `paper-3d` is written fresh with the same technique family.
- [webgl-shader-lab](https://github.com/PSCactux/webgl-shader-lab) (MIT): its "Aurora Gradient" (domain-warped fbm) is the
  model for the `silk` / `ember` shader, written fresh.
- [hjunhuh/glass](https://github.com/hjunhuh/glass) (MIT, Hyeong Jun Huh): the glass typography technique (Text3D +
  MeshTransmissionMaterial + a thin white core copy + Lightformers), rebuilt for deterministic video in `fx/glass.tsx`.
- [three.js](https://github.com/mrdoob/three.js) (MIT): the renderer. CodePen pens were not copied (licences vary per pen).

## Research sources
- Remotion licensing: [remotion.dev/docs/license](https://remotion.dev/docs/license), [pricing](https://www.remotion.dev/docs/license/pricing), [company licenses](https://www.remotion.dev/blog/company-licenses)
- Remotion motion blur: [motion blur guide](https://www.remotion.dev/docs/motion-blur-guide), [CameraMotionBlur](https://v3.remotion.dev/docs/motion-blur/camera-motion-blur)
- Word timing: [WhisperX](https://github.com/m-bain/whisperx)
- Video matting: [MatAnyone 2](https://gittrend.io/repo/pq-yang/MatAnyone2), [SAM2Matting comparison table](https://arxiv.org/pdf/2606.27339)
