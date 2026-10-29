---
name: editormaxxing
description: Editor maxxing - make vertical business / marketing explainer reels (Instagram Reels, TikTok, YouTube Shorts) in five looks - the "red gloss" (below), plus NEWSROOM (Johnny Harris / Vox documentary - newsprint, highlighter and red-pen annotations, moving photos, maps with routes, redactions, stamps, typewriter, spinning-newspaper and torn-paper cuts, 12 fps graphics, film grain), GLASS (Apple-keynote premium - aurora / frost / midnight sets, real refractive liquid-glass cards, iOS notifications, glass counters and switches, masked blur-to-focus Inter type with a serif accent), VHS (camcorder home video - REC / date / counter HUD, chroma bleed, scanlines, tape noise, OSD titles, VCR menus, closed captions, cassette, glitch words, rewind and static cuts) and SPLIT (screen-share explainer - the person small at the bottom, browser panels with zoom-to-region, charts, steps, before/after, hand-drawn arrows, carousel swap cuts). The red gloss look is a talking person cut out onto drawn sets (cream studio cove, halftone wall, blush set with leaves, red-and-white diagonal stripes, dark red vignette, blue room), with giant glossy condensed red words rising from behind them, chunky red words with an extrusion and a floor reflection in front, a 3D ring of words turning around their body, glossy red 3D icons (people, target, gift, clipboard, chart, megaphone, check, coin, funnel) with a glow, a curled paper checklist flying past, a magnifier scanning a glass audit board, a pinned torn note with floating chips, headlines with a pen-script word riding on a big round word (swapping words in place on cue), two lines bent over the head, a justified block of lines growing upward, a hero number counting up on a black floor, pulsing chevrons, a heavy italic name title, serif title cards, B-roll with Ken Burns, a sticker outline, punch-ins, and whip-smear / bloom / zoom-through / keyhole-iris cuts - every beat anchored to the spoken words, with synthesized sound effects mixed to -14 LUFS, a shot-by-shot timeline and an automated QC report. Rendered with Remotion + Three.js. Works with NO footage yet - a drawn placeholder presenter (lip-synced to a macOS `say` voice from a script) stands in until the user's own clip is tracked, then the same plan renders on the real person. Use when the user says editor maxxing / editormaxxing, wants the "red glossy 3D text" / "business explainer with giant words behind me" style, gives a reel in this style to recreate, wants a professional motion-design edit of a talking-head clip in this look, or wants a placeholder version of a talking-head reel before they shoot. Also use for a documentary / newspaper / Vox / Johnny Harris edit, an Apple-style / liquid glass / premium edit, a VHS / camcorder / retro home-video edit, or a split-screen / green-screen / screen-share tutorial edit of a talking head.
---

# Editor maxxing

Direct short vertical film like a senior motion designer: the person is the hero, every sentence gets one visual act that
lands on its word, the look is one red on cream (or on dark red), and you judge the rendered file instead of
self-certifying. Read `docs/reference-analysis.md` (the studied reel, shot by shot) and `docs/style.md` (palette, type,
space, motion) before planning; `docs/stack.md` explains why each technology was chosen.

**The motion is refined by default** (`"motion": "refined"`; `"punchy"` keeps the snappy reel timing): premium,
award-site motion - every effect runs on a clock 1.8x slower with soft bezier curves (`premium` 0.16,1,0.3,1 for
arrivals, `leave` for exits), things *reveal* (rise out of a mask, focus from a blur, settle from 1.12x - never pop from
1.45x), each beat is a *guided sequence* (title → subtitle → button → image), elements *react* to each other (every
arrival sends a small damped ripple the camera, the depth elements and the paper answer), and the frame is *never static*
(a breathing camera, drifting depth, idle sways) while leaving room to breathe. Read `docs/style.md` → Motion.

The stack, one job each (decisions and rejected alternatives in `docs/stack.md`):
- **Remotion** - the timeline. Each scene is a stack of depth layers under one camera (`lib/camera.ts`):
  set 0.28 → far depth elements ~0.5 → behind 0.82 → **person 1** → front 1.16 → near depth elements ~1.7 → screen 0.18. One
  move (push / pull / lateral / rise + three-sine breathing + the reaction ripple) moves each layer by its depth: strong,
  real parallax. Scenes overlap through their transitions.
- **SVG + CSS** - all type (glossy words: lit gradient, simulated extrusion, gloss band, halftone), the ribbon (per-glyph
  math), the curled paper (nested CSS-3D strips), the magnifier (the board drawn twice), the keyhole (`clip-path`).
- **Three.js** - the glossy icons (`fx/icons.tsx`), the real 3D paper (`fx/paper3d.tsx`: a 56x40 plane bent every frame,
  printed face on a canvas), the shader backdrops (`sets/Shader.tsx`: domain-warped fbm silk, `silk` / `ember`).
- **Python + ffmpeg** (`scripts/`) - jobs, word timing (faster-whisper), anchor resolution, synthesized sound + mix,
  timeline and QC. macOS `say` voices the placeholder.

Every value is a pure function of the frame (no clocks, no `Math.random`). Paths are relative to this skill's folder;
`EMX="python3 <skill>/scripts/emx.py"`.

## Looks (read `docs/looks.md` before planning in one)
`"look"` at the top of the plan picks the film's world: `gloss` (default, everything below), `newsroom`, `glass`, `vhs`,
`split`. A look sets the finish over the whole frame (grade, texture, HUD), the default set and turns off the gloss depth
elements; its sets, effects and cuts are listed by `$EMX list` and in `docs/looks.md`. Demos of all four on one clip:
`demo/looks/*.mp4`, plans `examples/looks/*.json`.

| look | sets | effects | cuts | finish / HUD |
|---|---|---|---|---|
| `newsroom` | `newsprint`, `evidence`, `archive` | `newspaper`, `clipping`, `photo`, `map`, `redact`, `stamp`, `typewriter` (graphics on 12 fps) | `paper` (spinning newspaper), `tear` | warm paper, grain on twos, dust, light leak; `hud.paper`, `hud.date` |
| `glass` | `aurora`, `frost`, `midnight` | `glass-title`, `glass-card`, `glass-notify`, `glass-number`, `glass-list`, `light-sweep`, `glass-orbs` | `lens`, `glide` | soft top light, vignette |
| `vhs` | `footage` (the real room), `bluescreen`, `snow` | `osd`, `glitch-word`, `menu`, `cc-caption`, `tape`, `ff` | `rewind`, `static` | chroma bleed, scanlines, noise, tracking band, REC/PLAY HUD; `hud.mode/date/time` |
| `split` | `board`, `slate` + scene `"place": "bottom"` | `panel` (src or stand-in, `focus` zoom), `chart`, `steps`, `compare`, `arrow-note`, `lower-third` | `swap` | clean |

Look rules: newsroom words to mark go in `[brackets]`, `markAt` / `revealAt` / `focusAt` take voice anchors; glass panes
never sit inside a faded or filtered parent (they go blank); VHS wants the person's own room (`footage`); split keeps the
person still at the bottom and changes the visual every 4-6 s.

## Reel direction (distilled from reelmaxxing — read `docs/reel-direction.md` before planning)
The argument comes before the effects: one true thing, who it is for, the offer, the KEYWORD. Beats run hook → proof →
mechanism ×2-4 → payoff → CTA, each buying one written-down belief; the headline is the beat's claim (≤ 7 words). Cuts land
2 frames before the beat's first word; beats last 1.8-4 s with ≥ 2 events after each cut and one accent; a new set every
beat; the presenter acts and never sits pinned; VO 3.0-3.3 words/s in Indonesian, a ducked music bed, -14 LUFS; the CTA
types the keyword and ends in motion. Gates: `reel_check.py` from reelmaxxing (F1-F5 + look) on every final MP4, and the
plan lint (R1-R7) of the 3D studio. Deliver the cover, the post caption, the DM reply and NOTE.md.

## Render lanes
- **2D compositing lane (this skill's Remotion project):** the effects below over a cut-out person or the placeholder.
- **3D studio lane** (`EditorMaxxing/studio`): R3F + Drei build the world (sets, presenter, 3D type, props), GSAP animates
  it (paused timelines seeked to the frame, placed on spoken words), Remotion owns frames, audio and the render. Use it when
  the reel should live in real 3D sets (camera moves through rooms, real reflections, refraction, light).
  How a reel is built there: `src/reel/plan.json` (the argument + one entry per beat: start anchor, set, camera, cut-in,
  pose, claim, what it buys) → `npm run lint` (R0-R7) → one shot component per beat (`src/reel/shots/`), each mounted in its
  own `<Sequence layout="none">` with its own set, camera rig and GSAP timeline in the shot's own seconds (`useAt('w:word')`)
  → `npm run stills -- 60,110,...` (one batch, one bundle) to check framing → `python3 scripts/sound.py` (bed + SFX + VO,
  ducked, -14 LUFS) → `npm run reel`. Size type from the frame: at fov 30 a 9:16 frame is 0.3 × distance wide, and the
  typeface JSON's `size` is about the cap height; fit every headline with `fitSize(font, text, width)`.

## The workflow (in this order)

### 0. First run
`$EMX setup` prints READY (Remotion project; needs Node 22+ - nvm's v22 is found - and ffmpeg). Word timing needs the skill
venv once: `uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python -r requirements.txt`.

### 1. Brief and script
Ask for: the one true thing the reel says, audience and language, the real numbers and their source, the speaker's name,
the comment keyword. Write the voice-over one spoken line per line (`examples/demo-script.txt`). Invented numbers carry
`"note": "angka contoh"` on screen.

### 2. The job
- **No footage yet:** `$EMX placeholder jobs/<name> --script script.txt [--voice Damayanti] [--rate 185] [--fps 24]` -
  voices each line, writes `voice.wav`, `lines.json` (exact line spans) and the mouth curve.
- **Your own clip:** a landscape clip first goes through `$EMX reframe clip.mp4 vertical.mp4 [--x 0.5] [--follow 6]`
  (a generous crop around the person, scaled to the width and padded above - nothing of them is cut). Then
  `$EMX track vertical.mp4 jobs/<name>` (cut-out + face path through facecammaxxing; set it up once with its
  `scripts/setup.sh`). Shots then frame the real person by **face size and height averaged over the scene** (wide 14 % of
  the width, mid 20 %, close 30 %), follow the face back to centre as it drifts, and fade the clip's bottom edge when a shot
  lifts it. Check the matte over red before planning (see facecammaxxing's "Checking the cut-out").
- Then **`$EMX words jobs/<name>`** - word times (`words.json`). With a script, words are aligned to it (script spelling,
  clamped into each line's span). Check spellings of numbers: Whisper may write "lima belas" as "15".

### 3. Beat plan (`examples/demo.json`)
One scene per sentence (set, shot, cut), one hero effect per scene, an accent at most. **Anchor times to the voice:**
`"start": "w:hoki"` (word start), `"we:hoki"` (its end), `"w:kami@2"` (second one), `"w:hoki+0.2"`, `"l:3"` / `"le:3"`
(line start / end); effects land 2 frames before their word automatically; `times` lists take anchors too. Write `buys`
(what the viewer believes after it) on hero effects - it goes into the timeline. Pick by the sentence's job:
hook question → `mega-word` (+ `paper-card`); constraint → `gloss-word`; a promise / time → `ribbon`; who / what →
`icon-3d` + title; a denial → `mega-word` + `sticker` on `halftone`; a process / audit → `headline` + `magnifier` on `blush`;
a method in clauses → `stack-lines` on `stripes`; the conclusion → `title-card` + `icon-3d` on `dark`; who is talking →
`name-title`; experience → `torn-note` on `blue`, then `arc-text` → `big-number` + `punch`; a cutaway → `broll`; a reveal →
an `iris` cut; the CTA → `headline` swapping words + `chevrons` + `gloss-word` "komen KEYWORD".

### 4. Check stills, hardest beat first
`$EMX check jobs/<name> plan.json [--at 1.2,3.4]` → half-size stills + `jobs/<name>/check/<plan>/sheet.jpg`. **Look at
it.** Fix whatever covers the face, clips at an edge, sits in a platform zone, reads small or collides; check again.

### 5. Render, QC, deliver
`$EMX render jobs/<name> plan.json --out final.mp4 [--music bed.mp3] [--no-sfx] [--draft] [--range 4-10]`:
resolves anchors → mixes voice + auto-cued sound effects (+ an optional music bed ducked under the voice) to −14 LUFS →
renders → writes `final_timeline.md` (shot by shot: said, set, effects, sound) and `final_qc.md` + `final_qc.jpg`
(resolution, fps, frame count, A/V sync, black and frozen frames, loudness, true peak, scene tiling, a frame from every
shot - measured on the file). Then watch at real speed, fill the QC's eye-review section, fix in the order untrue → face /
platform UI → idea → timing → finish. Deliver the video, the timeline, the QC report, what is real vs example.

## The library (`$EMX list` prints it from the code)

| fx | What happens | Key options |
|---|---|---|
| `mega-word` | Giant tall condensed glossy red word rises from behind the body, tilted, halftone + extrusion; a pen-script word writes across its corner; blows past the camera or drops | `text`, `script`, `enter` (rise\|hold), `tilt`, `y`, `exit` |
| `gloss-word` | Chunky round red word lands from oversize in front, gloss sweep, floor reflection; a line types under it | `text`, `sub`, `side`, `x`, `y`, `width` |
| `ribbon` | A ring of words turns around the body: front half over, back half behind (mirrored) | `text`, `radius`, `size`, `pitch`, `tilt`, `speed`, `below` |
| `icon-3d` | Glossy 3D icon (people, target, gift, clipboard, chart, megaphone, check, coin, funnel) lands turning, glows, sways, builds; optional headline | `icon`, `size`, `x`, `y`, `layer`, `glow`, `title`, `script`, `sub` |
| `paper-3d` | A real 3D sheet (brief, certificate, flyer) floats in bending and rippling, the light sliding over its folds; breathes, flutters on the ripple, drifts away | `kind`, `title`, `sub`, `items`, `done`, `name`, `x`, `y`, `width`, `bend`, `curl` |
| `paper-card` | A curled checklist sheet (CSS strips) flies across the chest | `title`, `items`, `checks`, `from`, `bend` |
| `magnifier` | A chrome lens scans a frosted glass board row by row, magnifying it; each row gets its check or cross | `title`, `rows`, `marks`, `caption`, `lens`, `zoom` |
| `glass-word` | **Glass typography** (after hjunhuh/glass): real extruded 3D type in refractive glass (chromatic aberration, anisotropic blur) with a thin white core word inside, turning into focus; optional glass pill with a red glow (the reference's "DEADLINE" chip) | `text`, `size`, `x`, `y`, `tint` (red\|clear), `pill`, `depth`, `core`, `layer` |
| `cta-pill` | A button on its own: rises in, answers its press on the word (dip, shine, arrow nudge) | `text`, `y`, `press` |
| `headline` | A guided sequence: the title rises from a mask, its script word writes, the small line settles, a button pill arrives last and answers its press (dip, shine, arrow nudge); words (`a\|b`) swap in place at `times` | `script`, `text`, `sub`, `times`, `cta`, `ctaY`, `press`, `y` |
| `arc-text` | Two lines bent over the head, rolling in along the arc | `top`, `text`, `radius`, `size` |
| `stack-lines` | Justified block of red lines (white edge) growing upward, one spoken line at a time | `lines`, `times`, `width`, `tilt` |
| `big-number` | The floor falls to black; a white number counts up in 18 frames; lines land under it | `from`, `to`, `prefix`, `sub`, `note` |
| `torn-note` | A torn sheet drops and is pinned; big red line + small lines; glass chips float beside it | `text`, `sub`, `chips`, `x`, `y` |
| `name-title` | Script line + two-line heavy italic name sliding in on a red slash | `pre`, `name`, `y` |
| `title-card` | Serif title with script above / below focusing in; caption words land under it | `top`, `title`, `bottom`, `caption` |
| `chevrons` | Red chevrons pulse down the chest | `count`, `size`, `below` |
| `broll` | A cutaway image or clip under the type with a Ken Burns push (labelled stand-in until `src` is given) | `src`, `label`, `from`, `to`, `pan` |
| `sticker` | White sticker outline around the person | `width` |
| `punch` | Hard punch-in on the person for one word | `zoom` |

**Sets:** `studio`, `halftone`, `blush`, `stripes`, `dark`, `blue`, `silk` and `ember` (WebGL shader silk), `footage`
(the clip's clean plate). **Depth elements** per scene: `depth`: `mix` / `orbs` / `shards` / `embers` / `none` (default by set).
**Shots:** `wide`, `mid`, `close`, `none`, or `"zoom": 1.2`. **Camera:** `move`: `push` / `pull` / `left` / `right` / `rise` /
`still` (default: a varied sequence), `moveAmount`, `dir` (the way a scene drifts and hands its motion on), `recenter`.
**Viewport** (re-measured from the reference, frame by frame): every scene after the first arrives with `enter`:
`pullback` (default: from ~1.55x with a ~9° roll that settles and a blur that clears), `drop`, or `none`; `dutch`: a held
roll in degrees; pushes are strong (12 % default, up to ~25 %). **Cuts:** the reference's five - `push` (push through
into white, the new scene whips in on a directional smear), `flare` (a warm lens flare sweeps, the frame blows out to
white and blooms back), `spin` (the frame rolls ~26° and dives into a corner, the new one counter-rolls in), `slats`
(vertical blinds sweep right to left, a pillar riding each edge), `flood` (the frame floods red, the red drains down off
the next scene) - plus `glide` (default), `depth`, `curtain`, `bloom`, `iris`, and the punchy `whip`, `zoom`, `cut`.
**Type side effects** (from the reference): headlines build letter by letter (script word first, then each letter pops
in from ~1.7x out of a blur while the line glides to stay centred, then the small line); giant words rise one letter at
a time; big numbers build digit by digit and their first line flips up from its reflection; front words leave sideways
on a smear.
**Sound:** each cut and effect has a default cue (`scripts/sound.py`); `"sfx": "none"` or a name (`pop`, `tick`, `impact`,
`whoosh`, `whoosh_lo`, `swell`, `shimmer`, `paper`) overrides it.

## Rules
- **Never cover the face.** Giant words and icons go behind the head; front type sits under the chin or by the legs.
- **Platform zones** (1080 × 1920): type stays out of y 0-250, y 1536-1920 and x > 940 for y 864-1536.
- **One red, one meaning.** White and cream are the room; dark red is for conclusions; blue for the experience cutaway.
- **Motion (refined):** reveal, don't pop; sequence every beat (title → subtitle → button → image); give every move a purpose
  (a camera move follows the sentence, a ripple answers an arrival); vary the reveals (mask rise, focus, wipe, tracking,
  settle) - never the same entrance twice in a row; keep contrast between calm stretches and the few strong moments (punch
  on the key word, a depth cut into a new world); leave room to breathe (one hero per frame, generous margins); nothing
  sharp or sudden: no hard edges on transitions, no snaps, no overshoots.
- **Sound:** the voice stays on top (effects −14 dB under it, music ducked); no invented dialogue; no music unless given.
- **Real numbers**, or say on screen that they are examples. Preserve the speaker's words, face and proportions.

## Adding an effect
An `FxDef` in `remotion/src/fx/` (see `lib/core.ts`): `Behind` / `Front` / `Screen` components, optional `personScale`,
`sticker`, `blur`. Components are pure functions of `c.t`, `c.face` (on screen), `c.scene`, `c.o`; `life(c, in, out)` gives
eased arrival / exit. Helpers: `GlossText` (`lib/gloss.tsx`), `FitText` / `Script` (`lib/type.tsx`), `PixelCanvas` +
`materials()` (`lib/three.tsx`). Register it in `fx/index.tsx`, give it a sound in `scripts/sound.py` (`FX`), run
`npx tsc --noEmit` in `remotion/`, then check stills.

## Credits
The look was studied from the user's reference reel (kept local); no assets, text or footage from it are used - every set,
word, icon and the presenter are drawn here. Layering, seek-safe timing, the pixel-space Three.js canvas and the real-clip
track pass come from facecammaxxing (which credits claude-video-effects by Vibha Ramprakash, MIT). Fonts via
@remotion/google-fonts (OFL). Remotion is free for individuals and companies of up to 3 people; larger companies need a
Remotion company licence.
