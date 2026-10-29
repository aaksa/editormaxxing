// Fonts for real 3D text: a TTF -> the typeface JSON three's FontLoader reads, cut to the Latin glyphs a reel uses.
//   node ttf2json.mjs <in.ttf> <out.json>
import fs from 'node:fs';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
const [src, dst] = process.argv.slice(2);
const buf = fs.readFileSync(src);
const json = new TTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const keep = new Set([...' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz{|}~’“”–—…×→✓·']);
json.glyphs = Object.fromEntries(Object.entries(json.glyphs).filter(([ch]) => keep.has(ch)));
fs.writeFileSync(dst, JSON.stringify(json));
console.log(dst, Object.keys(json.glyphs).length, 'glyphs', (fs.statSync(dst).size / 1024).toFixed(0), 'KB');
