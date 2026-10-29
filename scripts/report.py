"""The paperwork a production needs: a shot-by-shot timeline from the (resolved) plan, and a quality-control report
measured on the rendered file itself (not on the source code or a preview)."""
import json, os, re, subprocess

SHOT_WORDS = {'wide': 'wide, seated full body', 'mid': 'as shot', 'close': 'close, face below centre', 'none': 'no person'}


def _words_between(words, a, b):
    return ' '.join(w['w'] for w in words if a - 0.05 <= (w['start'] + w['end']) / 2 < b)


def timeline(plan, job, out_path, cues=None):
    words = json.load(open(os.path.join(job, 'words.json'))) if os.path.exists(os.path.join(job, 'words.json')) else []
    L = ['# Shot-by-shot timeline', '', f'Job: `{job}`  ·  generated from the resolved plan (all times in clip seconds).', '']
    for i, s in enumerate(plan.get('scenes', [])):
        a, b = s['start'], s['end']
        L += [f'## Shot {i + 1:02d} · {a:.2f}–{b:.2f} s ({b - a:.2f} s)', '']
        said = _words_between(words, a, b)
        if said: L.append(f'- **Said:** {said}')
        L.append(f'- **Set / shot:** {s.get("set", "studio")} · {SHOT_WORDS.get(s.get("shot", "mid"), s.get("shot"))}'
                 f'{" · sticker" if s.get("sticker") else ""} · slow push {s.get("push", 0.035) * 100:.1f} %')
        L.append(f'- **Cut in:** {s.get("in", "whip") if i else "cut (first shot)"}')
        fx = [e for e in plan.get('effects', []) if e['start'] < b - 0.01 and e['end'] > a + 0.01]
        for e in fx:
            opts = ', '.join(f'{k}={v}' for k, v in e.items() if k not in ('fx', 'start', 'end', 'buys'))
            L.append(f'- **{e["fx"]}** {e["start"]:.2f}–{e["end"]:.2f}: {opts}' + (f'  \n  *buys:* {e["buys"]}' if e.get('buys') else ''))
        if cues:
            sc = [f'{n}@{t:.2f}' for n, t, _ in cues if a - 0.5 <= t < b - 0.5]
            if sc: L.append(f'- **Sound:** {", ".join(sc)}')
        L.append('')
    open(out_path, 'w').write('\n'.join(L))
    return out_path


def _probe(path, entries, stream='v:0'):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', stream, '-show_entries', entries, '-of', 'json', path],
                       capture_output=True, text=True)
    return json.loads(r.stdout or '{}')


def _filter_log(path, vf=None, af=None):
    cmd = ['ffmpeg', '-hide_banner', '-nostats', '-i', path]
    cmd += ['-vf', vf, '-an'] if vf else ['-af', af, '-vn']
    return subprocess.run(cmd + ['-f', 'null', '-'], capture_output=True, text=True).stderr


def qc(video, plan, track, out_path, sheet_path):
    v = _probe(video, 'stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt:format=duration')
    a = _probe(video, 'stream=codec_name,sample_rate,channels,duration', 'a:0')
    vs = (v.get('streams') or [{}])[0]; as_ = (a.get('streams') or [{}])[0]
    dur = float(v.get('format', {}).get('duration', 0))
    num, den = map(int, vs.get('r_frame_rate', '0/1').split('/'))
    fps = num / den if den else 0
    rows, issues = [], []
    def check(name, ok, detail):
        rows.append(f'| {name} | {"pass" if ok else "**FAIL**"} | {detail} |')
        if not ok: issues.append(f'{name}: {detail}')
    check('Resolution', (vs.get('width'), vs.get('height')) == (track['width'], track['height']), f'{vs.get("width")}×{vs.get("height")}')
    check('Frame rate', abs(fps - track['fps']) < 0.01, f'{fps:g} fps (plan {track["fps"]})')
    nf = int(vs.get('nb_frames', 0) or 0)
    check('Frame count', abs(nf - track['frames']) <= 1, f'{nf} frames (expected {track["frames"]})')
    check('Codec', vs.get('codec_name') == 'h264' and vs.get('pix_fmt') == 'yuv420p', f'{vs.get("codec_name")} {vs.get("pix_fmt")}')
    ad = float(as_.get('duration', 0) or 0)
    check('Audio present / in sync', bool(as_) and abs(ad - dur) < 2 / max(fps, 1), f'{as_.get("codec_name")} {as_.get("sample_rate")} Hz, '
          f'audio {ad:.3f} s vs video {dur:.3f} s')
    blk = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', _filter_log(video, vf='blackdetect=d=0.04:pic_th=0.97'))
    # an iris cut opens from the dark on purpose (16 frames): black inside that window is the design, not a gap
    irises = [s_['start'] for i, s_ in enumerate(plan.get('scenes', [])) if i and s_.get('in') == 'iris']
    meant = [(x, y) for x, y in blk if any(t - 0.1 <= float(x) and float(y) <= t + 16 / max(fps, 1) + 0.15 for t in irises)]
    blk = [b_ for b_ in blk if b_ not in meant]
    check('No unintended black frames', not blk, ', '.join(f'{x}–{y}' for x, y in blk) or
          ('none' + (f' (iris opening from black at {", ".join(f"{x}–{y}" for x, y in meant)}, by design)' if meant else '')))
    frz = re.findall(r'freeze_start: ([\d.]+)', _filter_log(video, vf='freezedetect=n=0.0008:d=0.6'))
    check('No frozen stretch > 0.6 s', not frz, ', '.join(frz) or 'none')
    lo = _filter_log(video, af='ebur128=peak=true')
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', lo); TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', lo)
    li = float(I[-1]) if I else 0; tp = float(TP[-1]) if TP else 0
    check('Loudness', -15.5 <= li <= -12.5, f'{li:.1f} LUFS integrated (target -14)')
    check('True peak', tp <= -0.9, f'{tp:.1f} dBTP (ceiling -1)')
    # plan lint: scenes tile the film, effects sit inside the film
    sc = plan.get('scenes', [])
    gaps = [f'{x["end"]:.2f}→{y["start"]:.2f}' for x, y in zip(sc, sc[1:]) if abs(x['end'] - y['start']) > 0.02]
    check('Scenes tile the timeline', not gaps, ', '.join(gaps) or f'{len(sc)} scenes, no gaps/overlaps')
    long_ = [e['fx'] for e in plan.get('effects', []) if e['end'] - e['start'] < 0.3]
    check('No effect shorter than 0.3 s', not long_, ', '.join(long_) or 'ok')
    # frames from the real output, one per shot, for the eye
    ts = [round(s['start'] * 0.4 + s['end'] * 0.6, 2) for s in sc] or [dur / 2]
    sel = '+'.join(f'eq(n\\,{int(t * fps)})' for t in ts)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', f"select='{sel}',scale=216:-1,tile={min(7, len(ts))}x{(len(ts) + 6) // 7}",
                    '-frames:v', '1', '-vsync', 'vfr', sheet_path], capture_output=True)
    L = ['# Quality-control report', '', f'File: `{video}`  ·  measured with ffprobe / ffmpeg on the rendered output.', '',
         '| Check | Result | Detail |', '|---|---|---|', *rows, '',
         f'Frames from the output, one per shot ({", ".join(f"{t:.2f}" for t in ts)} s): `{sheet_path}`', '',
         '## Automated verdict', '', ('All checks pass.' if not issues else 'Fix:\n' + '\n'.join(f'- {x}' for x in issues)), '',
         '## Eye review (fill in after watching at real speed)', '',
         '- Hero per shot, and what it proves:', '- Words readable on a phone:', '- Anything over the face / at the edge / in a platform zone:',
         '- Remaining limitations:', '']
    open(out_path, 'w').write('\n'.join(L))
    return issues
