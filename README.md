# editormaxxing

Vertical business-explainer reels in the "red gloss" look, as a Claude Code skill: a talking person cut out onto drawn
sets, giant glossy red words rising from behind them, chunky red words with floor reflections in front, a 3D ring of words
around their body, glossy red 3D icons, a curled checklist, a magnifier over a glass board, a pinned torn note, arc text,
stacked lines, a counting hero number, word-swapping headlines, chevrons, name and title cards, B-roll, and whip / bloom /
zoom / keyhole cuts. Every beat is anchored to the spoken words; sound effects are synthesized and mixed to −14 LUFS; each
render writes a shot-by-shot timeline and a QC report measured on the file.

No footage yet? A drawn placeholder presenter lip-syncs to a macOS `say` voice read from your script, so the whole reel can
be planned, timed and reviewed before you shoot. Then track your own clip and render the same plan on you.

## Requirements
- macOS (for the placeholder voice; everything else is cross-platform), ffmpeg + ffprobe
- Node.js 22+ (nvm's v22 is found automatically), Python 3.11 via `uv` for word timing
- For your own clips: facecammaxxing set up once (`~/.claude/skills/facecammaxxing/scripts/setup.sh`)

## Commands
```bash
python3 scripts/emx.py setup                                        # Remotion project (prints READY)
uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python -r requirements.txt   # word timing

python3 scripts/emx.py placeholder jobs/demo --script examples/demo-script.txt --rate 185   # 24 fps job + voice
python3 scripts/emx.py words  jobs/demo                             # words.json (faster-whisper, aligned to the script)
python3 scripts/emx.py check  jobs/demo examples/demo.json          # stills + contact sheet
python3 scripts/emx.py render jobs/demo examples/demo.json --out demo/demo.mp4   # + demo_timeline.md, demo_qc.md/.jpg

# your own clip (a landscape clip is reframed to a padded vertical source first)
python3 scripts/emx.py reframe my_clip.mp4 my_vertical.mp4 --x 0.5
python3 scripts/emx.py track my_vertical.mp4 jobs/me
python3 scripts/emx.py words jobs/me
python3 scripts/emx.py render jobs/me my_plan.json --out final.mp4 [--music bed.mp3]
```

## What is where
| | |
|---|---|
| `SKILL.md` | the workflow, the plan format, the effect library, the rules |
| `docs/reference-analysis.md` | the studied reel shot by shot: identity, motion, rhythm, audio, production environment, fidelity map |
| `docs/stack.md` | architecture decisions, technique → technology matrix, rejected options, licences, sources |
| `docs/style.md` | palette, type, space and motion rules used to judge a render |
| `examples/` | the demo script, its word-anchored plan, `replica.json` (the reference reel's 13 shots on the placeholder) and `test.json` (real footage) |
| `demo/` | the placeholder demo and the real-footage test (`test.mp4`, from `examples/test.json`), each with its timeline and QC report |
| `remotion/src/` | Stage (layers + cuts), Placeholder, sets, `fx/` (effects), `lib/` (core timing, gloss type, three) |
| `scripts/` | `emx.py` (CLI), `plan.py` (anchors), `words.py`, `sound.py`, `report.py` |

## Looks
Beside the red gloss: `newsroom` (documentary), `glass` (premium liquid glass), `vhs` (camcorder) and `split` (screen-share
explainer). See `docs/looks.md`; demos in `demo/looks/`.
