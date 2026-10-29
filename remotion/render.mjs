#!/usr/bin/env node
// editormaxxing's render pass: bundle the comp once with the job folder as its public dir, then render check stills or
// the final MP4.
//
//   node render.mjs --job <job-dir> --plan <plan.json> --still 1.2,3.4 [--out-dir <dir>] [--scale 0.5]
//   node render.mjs --job <job-dir> --plan <plan.json> --out <out.mp4> [--range 0.5-3.5] [--scale 0.5] [--concurrency 4] [--crf 16]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
  return acc;
}, []));
const die = (m) => { console.error(m); process.exit(1); };
if (!args.job || !args.plan) die('usage: render.mjs --job <dir> --plan <plan.json> (--still 1.2,3.4 | --out out.mp4)');

const job = path.resolve(args.job);
const track = JSON.parse(fs.readFileSync(path.join(job, 'track.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.resolve(args.plan), 'utf8'));
const clampEnd = (v) => Math.min(Number(v ?? 1e9), track.duration);
const scenes = (raw.scenes ?? []).map((s) => ({ ...s, start: Number(s.start ?? 0), end: clampEnd(s.end) }))
  .sort((a, b) => a.start - b.start);
const effects = (raw.effects ?? []).map((e) => ({ ...e, start: Number(e.start ?? 0), end: clampEnd(e.end) }));
if (!track.placeholder && !fs.existsSync(path.join(job, 'person.webm'))) die(`no person.webm in ${job}: track the clip first (see SKILL.md)`);
const room = !track.placeholder && fs.existsSync(path.join(job, 'room.mp4')) ? 'room.mp4' : null;   // the clean plate, for set "footage"
const inputProps = { track, scenes, effects, audio: raw.audio ?? null, motion: raw.motion ?? 'refined', room };

const t0 = Date.now();
const secs = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;
process.stdout.write('Bundling... ');
const serveUrl = await bundle({ entryPoint: path.join(here, 'src/index.ts'), publicDir: job, onProgress: () => {} });
console.log(secs());
const chromiumOptions = { gl: 'angle' };
const browserExecutable = args.browser ?? process.env.EMX_BROWSER ?? null;
const scale = Number(args.scale ?? 1);
const composition = await selectComposition({ serveUrl, id: 'Gloss', inputProps, chromiumOptions, browserExecutable });

if (args.still) {
  const outDir = path.resolve(args['out-dir'] ?? path.join(job, 'check'));
  fs.mkdirSync(outDir, { recursive: true });
  for (const tok of String(args.still).split(',')) {
    const s = Number(tok);
    const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(s * composition.fps)));
    const output = path.join(outDir, `${s.toFixed(2)}.png`);
    await renderStill({ composition, serveUrl, output, frame, inputProps, chromiumOptions, browserExecutable, scale, imageFormat: 'png',
      onBrowserLog: (l) => { console.log(`  [browser ${l.type}] ${l.text.slice(0, 300)}`); } });
    console.log('saved', output, secs());
  }
} else {
  const out = path.resolve(args.out ?? path.join(job, 'out.mp4'));
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: out, inputProps, chromiumOptions, browserExecutable, scale,
    frameRange: args.range ? String(args.range).split('-').map((v, i) => Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(Number(v) * composition.fps) - i))) : undefined,
    crf: Number(args.crf ?? 16), pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 94,
    concurrency: Number(args.concurrency ?? Math.max(1, Math.min(8, Math.floor(os.cpus().length / 2)))),
    muted: !track.audio && !raw.audio,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`  ${p * 10}% ${secs()}`); } },
  });
  console.log('Done:', out, secs());
}
