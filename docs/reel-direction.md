# Reel direction for the 3D studio (distilled from reelmaxxing)

reelmaxxing decoded three high-performing explainer reels and measured them. This is that knowledge carried into this
pipeline (R3F + Drei world → GSAP animation → Remotion frames, audio and render) and into the red-gloss look of the
editormaxxing skill. What belongs only to reelmaxxing's papercraft look (felt walls, paper chips, the Claude mascot) is
translated, not copied. Numbers are measured, not guessed.

## 1. Before anything: the argument
Four lines; if one is blank, stop and ask.
- **One true thing** — the result, finding or offer the reel is about.
- **For whom** — the person who will comment.
- **The offer** — what arrives when they comment (it must exist).
- **KEYWORD** — one word, ALL CAPS, 4-8 letters, easy to type (CEK, AUDIT, GUIDE). Never YES / WOW.
No offer → the reel ends on a follow, not a keyword.

## 2. The beat chain
`hook → problem / proof → mechanism ×2-4 → payoff → (offer) → CTA`
- **Each beat buys one belief.** Write it down: "after this beat the viewer believes ___". A beat that buys nothing is cut.
- **Hook types:** news · callout · I-built · myth ("not luck") · number. The first word is spoken by frame 6; the first
  picture already moves; no greeting, no logo.
- **Proof** is a real number with a real source, shown as an object that changes (a counter building, a chart rising).
  Invented numbers are labelled as examples on screen.
- **Mechanism beats** are literal metaphors (the metaphor bank in §7) — the product or process performing the claim.
- **Payoff** is smaller in scale than the hook, bigger in joy.
- **CTA** = "comment KEYWORD", typed into the platform's own comment box, 1.5-3.5 s, ending in motion (reels loop).

## 3. Headlines and voice
- **Headline = the beat's claim**, ≤ 7 words, ≤ 36 characters. Patterns: a plain claim, a contrast pair across two
  beats, a number, a role, the payoff. Never a label ("STEP 2"), never a question the beat does not answer.
- Headline and voice say the same thing in different words: the headline is the title, the voice is the sentence.
- **Voice pace:** 3.5-4.1 words/s in English, 3.0-3.3 in Indonesian; no silence > 0.15 s inside a beat; a music bed
  under it, ducked.
- **Banned copy:** "Not just X, it's Y", "Unlock", "Meet X", "the future of", three one-word sentences, invented stats,
  "game-changer".
- **Sound-off viewers read the argument from the type alone** — in this look the kinetic type IS the caption: every beat's
  key words are on screen when they are said.

## 4. Timing (frames at 30 fps; the studio renders at the reel's own fps — scale by fps/30)
| move | timing |
|---|---|
| scene cut | on the beat's first word, 2 f before it is heard (`word(w) - 2/fps`) |
| beat length | 1.8-4.0 s (median ≈ 2.6), none > 5.5 s; 7-11 beats in 25-36 s |
| events inside a beat | ≥ 2 after each cut; something new about every 1 s |
| headline / prop arrival | 5-6 f from oversize (1.07 for headlines, 1.45 for props), never from zero |
| camera creep | the set scales ≈ 1 → 1.07 and drifts ≈ 21 px across the beat |
| punch-in on the key word | 1 → 1.06-1.08 in 5 f, back over 24 f |
| counter | steps every frame for 8-18 f and lands exactly on the value |
| star burst | in 3 f from 0.55, out over 5 f from 9 f |
| keyword typing (CTA) | 4 f per letter, a burst on the last letter |
| the end | last line + 12 f, still moving |
**One accent per beat** (a burst OR a punch OR confetti). **Cuts ride the voice:** never move a cut to let a move finish —
start the next shot already moving. **Typing only where something really types** (a chat box, the comment box).
**Nothing holds:** a reel's motion energy measures 4.0-7.2 /255 (look.py); below ~3 needs moving content, not doodles.

## 5. The frame (1080 × 1920)
| band | y | what lives there |
|---|---|---|
| platform top UI | 0-250 | nothing of ours |
| headline | 270-370 | the beat's claim (one per shot) |
| hero zone | 400-1300 | one hero object per beat |
| floor line | ≈ 1400 | the presenter's feet / the set's floor |
| captions / key words | 1322-1472, x 140-940 | clear of the right rail |
| platform bottom UI | 1536-1920 | no text of ours |
| right rail | x > 940 for y 864-1536 | no text, keep the presenter out too |
Type on a phone: UI / proof text ≥ 0.02 H (≈ 38 px). One hero per frame.

## 6. Sets and the presenter (translated from walls and the mascot)
- **A new set every beat** (reelmaxxing changes the wall colour every beat; here the set changes: cream cove, halftone,
  blush, red stripes, dark red, blue). Never the same set twice in a row; every set is dressed (furniture, plants, light),
  never a flat swatch.
- **The presenter appears in most beats but never pinned:** never the same place AND the same pose/prop in 3 consecutive
  shots. Give it a role per beat (who is it in this beat — the explainer, the one who suffered, the winner) and one or two
  acting verbs (nod, lean, gesture, turn to the hero object).
- **Mixing looks:** one strong 3D hero beat inside a 2D-graphic reel is right ("spend 3D once"); here the whole reel is
  3D, so spend the strongest camera move once.

## 7. Metaphor bank (claim → literal prop)
it's new → a breaking tag / ribbon · it takes long → a spinning clock, day to night · it's fast → a stopwatch tick ·
you'll learn → a light bulb, a graduation cap · rejection → red crosses · quality → a shield, a seal · reviewers → a row of
desks · fixing → red marker circles → green ticks · free → a crossed-out price tag · easy setup → one link pasted in a
real box · an audit → a magnifier over a board · a plan / week → a checklist sheet · experience → a pinned note.
Avoid the name's first association.

## 8. Sound
VO + a music bed to the last frame, ducked under the voice; 2-4 SFX on pops and the keyword; mix to **-14 LUFS**
(true peak ≤ -1 dBTP). No licensed track → a synthesised bed (reelmaxxing `music_bed.py`).

## 9. Gates (a FAIL is fixed, never argued)
| gate | what | here |
|---|---|---|
| R1 hook | first shot owns frame 0, has its headline, first key word by frame 6, first beat ≤ 4 s | `npm run lint` |
| R2 one claim | one headline per shot, ≤ 7 words, no two shots saying the same | `npm run lint` |
| R3 cadence | 12-45 s; beats median 1.8-4.0 s, none > 5.5 s | `npm run lint` |
| R5 presenter | never same set + same pose in 3 consecutive shots | `npm run lint` |
| R6 CTA | last shot has the keyword typed, 1.5-3.5 s, ≤ 25 % of the film | `npm run lint` |
| R7 sets | consecutive shots never share a set | `npm run lint` |
| F1-F5 | 1080×1920, 24-60 fps, H.264 + AAC · -14 ±1 LUFS · no silence > 0.4 s · frame 0 moves · 12-45 s | reelmaxxing `reel_check.py` on the MP4 |
| G look | motion energy, no dead frames, safe-zone sheet, cover frame | `reel_check.py` (look.py) |
Then look: describe every sheet frame in one sentence (the hero, does the type say the claim, is the presenter acting).
Fix order: untrue → the idea → beat connections → hierarchy → timing → finish → sound.

## 10. Deliver
`final.mp4`, the cover (2-4 huge words of the hook, one accent, the sharpest frame, inside the 3:4 grid crop), the post
caption (line 1 the hook in other words; line 2 `Comment "KEYWORD" and I'll DM you …`; one line of value; 3-5 hashtags),
the DM reply, and **NOTE.md**: the offer and keyword, each beat and what it buys, what is real vs illustrative, the gate
lines quoted, what you would still improve.
