#!/usr/bin/env python3
"""editormaxxing: one entry point for the whole pipeline (standard library only).

  emx.py setup                                     install the Remotion project once (prints READY)
  emx.py list                                      the effects, sets and shots, with their options
  emx.py placeholder <job> [--script lines.txt] [--voice Damayanti] [--seconds 20] [--gap 0.25]
                                                   a job with no footage: the stand-in character plays the person.
                                                   With a script (one spoken line per line), macOS `say` voices it,
                                                   lines.json gets every line's start/end and the mouth follows the voice.
                                                   --fps 24 by default (the reference's frame rate).
  emx.py reframe <video> <out.mp4> [--x 0.5] [--follow 0]
                                                   a landscape (or square) clip -> a 1080x1920 source: a generous crop around
                                                   the person, scaled to the width and padded above, so nothing of them is cut
                                                   (the shots then frame them by their face). --follow px/s drifts the crop.
  emx.py track <video> <job>                       your own clip: cut-out + face path, via facecammaxxing's track pass
  emx.py words <job> [--model small] [--lang id]   word timings (words.json) with faster-whisper, for "w:word" anchors
  emx.py check <job> <plan.json> [--at 1.2,3.4]    stills (default: the middle of every scene) + one contact sheet
  emx.py render <job> <plan.json> [--out out.mp4] [--draft] [--range 0.5-3.5] [--music bed.mp3] [--no-sfx]
                                                   resolves anchors, mixes voice + sound effects (-14 LUFS), renders,
                                                   then writes the timeline and the QC report next to the video
  emx.py timeline <job> <plan.json>                the shot-by-shot timeline (markdown) only
  emx.py qc <job> <plan.json> <video.mp4>          the quality-control report on a rendered file only
"""
import array, glob, json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plan as planlib, report, sound  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REMOTION = os.path.join(ROOT, 'remotion')
FCM_ROOT = os.path.expanduser('~/.claude/skills/facecammaxxing')
FPS, W, H = 24, 1080, 1920


def die(msg):
    sys.exit(f'emx: {msg}')


def node22():
    cands = [shutil.which('node')] + sorted(glob.glob(os.path.expanduser('~/.nvm/versions/node/v*/bin/node')), reverse=True)
    for n in cands:
        if not n: continue
        try:
            v = subprocess.run([n, '-p', 'process.versions.node'], capture_output=True, text=True).stdout.strip()
            if int(v.split('.')[0]) >= 22: return n
        except Exception: pass
    die('Node 22 or newer is needed (https://nodejs.org, or nvm install 22).')


def flag(args, name, default=None):
    if name in args:
        i = args.index(name)
        val = args[i + 1] if i + 1 < len(args) and not args[i + 1].startswith('--') else True
        del args[i:i + (2 if val is not True else 1)]
        return val
    return default


def run(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode: die(f'failed: {" ".join(map(str, cmd))}')
    return r


# ---------------------------------------------------------------- setup / list
def setup(_):
    node = node22()
    npm = os.path.join(os.path.dirname(node), 'npm')
    env = {**os.environ, 'PATH': os.path.dirname(node) + os.pathsep + os.environ['PATH']}
    if not os.path.isdir(os.path.join(REMOTION, 'node_modules')):
        run([npm, 'install', '--no-audit', '--no-fund'], cwd=REMOTION, env=env)
    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool): die(f'{tool} is needed (brew install ffmpeg)')
    print('READY')


def effects():
    """Names, descriptions and options read straight from the Remotion sources, so the list is always current."""
    out = {}
    for f in sorted(glob.glob(os.path.join(REMOTION, 'src', 'fx', '*.tsx'))):
        src = open(f).read()
        for m in re.finditer(r"^\s+'?([a-z0-9-]+)'?: \{\n\s+desc: [`']([^`']*)[`'],\n\s+options: '([^']*)'", src, re.M):
            out[m.group(1)] = (m.group(2), m.group(3))
    return out


def list_(_):
    for name, (desc, opts) in effects().items():
        print(f'{name:12s} {desc}\n{"":12s} options: {opts}\n')
    print('sets:  studio | halftone | blush | stripes | dark | footage (your clip\'s own room)')
    print('shots: wide | mid | close | none (no person)      cuts: whip (default) | bloom | cut')


# ---------------------------------------------------------------- placeholder job
def pcm(path, rate=16000):
    """Mono 16-bit samples of any audio file, through ffmpeg."""
    raw = run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(rate), '-f', 's16le', '-'], capture_output=True).stdout
    a = array.array('h'); a.frombytes(raw)
    return a


def mouth_curve(samples, rate, frames, fps):
    """Per-frame loudness 0..1: RMS per frame, normalised to the 95th percentile, a little smoothing, a noise gate."""
    hop = rate / fps
    rms = []
    for i in range(frames):
        seg = samples[int(i * hop):int((i + 1) * hop)]
        rms.append((sum(x * x for x in seg) / len(seg)) ** 0.5 if len(seg) else 0.0)
    ref = sorted(rms)[int(len(rms) * 0.95)] or 1.0
    v = [min(1.0, r / ref) for r in rms]
    sm = [(v[max(0, i - 1)] + 2 * v[i] + v[min(len(v) - 1, i + 1)]) / 4 for i in range(len(v))]
    return [round(0 if x < 0.08 else x, 3) for x in sm]


def placeholder(args):
    script = flag(args, '--script'); voice = flag(args, '--voice', 'Damayanti')
    seconds = float(flag(args, '--seconds', 0) or 0); gap = float(flag(args, '--gap', 0.25)); rate = flag(args, '--rate')
    fps = int(flag(args, '--fps', FPS))
    if not args: die('usage: emx.py placeholder <job> [--script lines.txt] [--voice Damayanti] [--seconds 20]')
    job = os.path.abspath(args[0]); os.makedirs(job, exist_ok=True)
    lines, mouth, audio = [], [], False
    if script:
        if not shutil.which('say'): die('the voice needs macOS `say`; on another system pass --seconds and add your own voice.wav')
        texts = [l.strip() for l in open(script) if l.strip() and not l.startswith('#')]
        tmp = os.path.join(job, '_say'); os.makedirs(tmp, exist_ok=True)
        parts, t = [], 0.3
        silence = os.path.join(tmp, 'gap.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=48000:cl=mono', '-t', str(gap), silence])
        lead = os.path.join(tmp, 'lead.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=48000:cl=mono', '-t', '0.3', lead])
        parts.append(lead)
        for i, text in enumerate(texts):
            aiff, wav = os.path.join(tmp, f'{i}.aiff'), os.path.join(tmp, f'{i}.wav')
            run(['say', '-v', voice, *(['-r', str(rate)] if rate else []), '-o', aiff, text])
            run(['ffmpeg', '-v', 'error', '-y', '-i', aiff, '-ac', '1', '-ar', '48000', wav])
            d = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
            lines.append({'i': i, 'text': text, 'start': round(t, 3), 'end': round(t + d, 3)})
            parts += [wav, silence]; t += d + gap
        listfile = os.path.join(tmp, 'list.txt')
        open(listfile, 'w').write(''.join(f"file '{p}'\n" for p in parts))
        voice_wav = os.path.join(job, 'voice.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'pcm_s16le', voice_wav])
        shutil.rmtree(tmp)
        seconds = max(seconds, t + 0.6)
        frames = int(round(seconds * fps))
        mouth = mouth_curve(pcm(voice_wav), 16000, frames, fps)
        audio = True
        json.dump(lines, open(os.path.join(job, 'lines.json'), 'w'), indent=1, ensure_ascii=False)
    seconds = seconds or 10.0
    frames = int(round(seconds * fps))
    track = {'fps': fps, 'width': W, 'height': H, 'frames': frames, 'duration': round(frames / fps, 3), 'audio': audio,
             'placeholder': True, 'mouth': mouth, 'face': [], 'top': []}
    json.dump(track, open(os.path.join(job, 'track.json'), 'w'))
    print(f'placeholder job: {job}  ({track["duration"]} s{", voiced" if audio else ""})')
    for l in lines: print(f'  {l["start"]:6.2f}-{l["end"]:6.2f}  {l["text"]}')


# ---------------------------------------------------------------- real footage, via facecammaxxing
def fcm(cmd, args):
    py = os.path.join(FCM_ROOT, '.venv', 'bin', 'python')
    if not os.path.exists(py):
        die(f'tracking a real clip uses facecammaxxing. Set it up once:\n  {FCM_ROOT}/scripts/setup.sh   (or: python3 {FCM_ROOT}/scripts/fcm.py setup)')
    run([py, os.path.join(FCM_ROOT, 'scripts', 'fcm.py'), cmd, *args])


def reframe(args):
    x = float(flag(args, '--x', 0.5)); follow = float(flag(args, '--follow', 0))
    if len(args) < 2: die('usage: emx.py reframe <video> <out.mp4> [--x 0.5] [--follow 0]')
    src, out = args[0], args[1]
    info = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', src],
                          capture_output=True, text=True).stdout)['streams'][0]
    w, h = info['width'], info['height']
    if h / w >= 1.7:      # already vertical: just scale to 1080x1920
        vf = f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1'
    else:                 # a crop ~1.05x as wide as tall around the person, scaled to the width; the space above is filled
        cw = min(w, int(h * 1.05) // 2 * 2)        # with the frame's own top strip (above the head), mirrored, stretched and
        x0 = max(0, min(w - cw, int(w * x - cw / 2)))   # blurred: the room continues upward, no flat band in "footage" sets
        sh = int(round(cw and h * W / cw)) // 2 * 2
        strip = max(16, int(sh * 0.08) // 2 * 2)
        vf = (f"crop={cw}:{h}:'min({w - cw},max(0,{x0}+{follow}*t))':0,scale={W}:{sh}:flags=lanczos,split[fg][s];"
              f"[s]crop={W}:{strip}:0:0,vflip,scale={W}:{H - sh},boxblur=24:2[top];"
              f"[top][fg]vstack,setsar=1")
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', out])
    print('reframed:', out)


def track(args):
    if len(args) < 2: die('usage: emx.py track <video> <job>')
    fcm('track', args)
    t = json.load(open(os.path.join(args[1], 'track.json')))
    t['placeholder'] = False
    json.dump(t, open(os.path.join(args[1], 'track.json'), 'w'))


# ---------------------------------------------------------------- check / render
def render_js(job, plan, extra):
    node = node22()
    env = {**os.environ, 'PATH': os.path.dirname(node) + os.pathsep + os.environ['PATH']}
    if not os.path.isdir(os.path.join(REMOTION, 'node_modules')): die('run `emx.py setup` first')
    run([node, os.path.join(REMOTION, 'render.mjs'), '--job', job, '--plan', plan, *extra], cwd=REMOTION, env=env)


def check(args):
    at = flag(args, '--at')
    if len(args) < 2: die('usage: emx.py check <job> <plan.json> [--at 1.2,3.4]')
    job = os.path.abspath(args[0])
    p, plan = resolved(job, os.path.abspath(args[1]))
    if not at:
        dur = json.load(open(os.path.join(job, 'track.json')))['duration']
        ts = [round(min(s.get('end', dur), dur) * 0.35 + s.get('start', 0) * 0.65, 2) for s in p.get('scenes', [])] or [dur / 2]
        at = ','.join(map(str, ts))
    out = os.path.join(job, 'check', os.path.splitext(os.path.basename(args[1]))[0])
    shutil.rmtree(out, ignore_errors=True)
    render_js(job, plan, ['--still', at, '--out-dir', out, '--scale', '0.5'])
    pngs = sorted(glob.glob(os.path.join(out, '*.png')), key=lambda f: float(os.path.basename(f)[:-4]))
    cols = min(6, len(pngs)); rows = (len(pngs) + cols - 1) // cols
    sheet = os.path.join(out, 'sheet.jpg')
    inputs = sum([['-i', p] for p in pngs], [])
    pad = [f'[{i}:v]scale=270:-1[v{i}]' for i in range(len(pngs))]
    blanks = cols * rows - len(pngs)
    for b in range(blanks): pad.append(f'color=c=black:s=270x480[b{b}]')
    labels = ''.join(f'[v{i}]' for i in range(len(pngs))) + ''.join(f'[b{b}]' for b in range(blanks))
    layout = '|'.join(f'{c * 270}_{r * 480}' for r in range(rows) for c in range(cols))
    graph = ';'.join(pad) + f';{labels}xstack=inputs={cols * rows}:layout={layout}' if cols * rows > 1 else '[0:v]scale=270:-1'   # xstack needs 2+
    run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-frames:v', '1', sheet])
    print('sheet:', sheet)


def render(args):
    out = flag(args, '--out'); draft = flag(args, '--draft'); rng = flag(args, '--range')
    music = flag(args, '--music'); nosfx = flag(args, '--no-sfx')
    if len(args) < 2: die('usage: emx.py render <job> <plan.json> [--out out.mp4] [--draft] [--range a-b] [--music bed.mp3] [--no-sfx]')
    job = os.path.abspath(args[0])
    tr = json.load(open(os.path.join(job, 'track.json')))
    p, _ = resolved(job, os.path.abspath(args[1]))
    voice = next((os.path.join(job, n) for n in ('voice.wav', 'source.mp4') if os.path.exists(os.path.join(job, n))), None)
    cl = []
    if voice and tr.get('audio'):
        cl = sound.mix(job, {**p, 'effects': [] if nosfx else p.get('effects', []), 'scenes': p.get('scenes', []) if not nosfx else []},
                       tr['duration'], voice, music=os.path.abspath(music) if music else None)
        print(f'mix: voice + {len(cl)} sound cues{" + music" if music else ""} -> {os.path.join(job, "mix.wav")} (-14 LUFS)')
    p, plan = resolved(job, os.path.abspath(args[1]), audio='mix.wav' if voice and tr.get('audio') else None)
    video = os.path.abspath(out or os.path.join(job, 'out.mp4'))
    extra = ['--out', video]
    if draft: extra += ['--scale', '0.5']
    if rng: extra += ['--range', rng]
    render_js(job, plan, extra)
    base = os.path.splitext(video)[0]
    report.timeline(p, job, base + '_timeline.md', cl)
    if not draft and not rng:
        issues = report.qc(video, p, tr, base + '_qc.md', base + '_qc.jpg')
        print('timeline:', base + '_timeline.md')
        print('qc:', base + '_qc.md', '(all automated checks pass)' if not issues else f'({len(issues)} to fix: ' + '; '.join(issues) + ')')


def words(args):
    py = os.path.join(ROOT, '.venv', 'bin', 'python')
    if not os.path.exists(py): die('word timings need the skill venv: run  emx.py setup')
    run([py, os.path.join(ROOT, 'scripts', 'words.py'), *args])


def resolved(job, plan_path, audio=None):
    """The plan with speech anchors turned into seconds, saved next to the job for the renderer."""
    p = planlib.resolve(plan_path, job)
    p['fps'] = json.load(open(os.path.join(job, 'track.json')))['fps']
    for i, e in enumerate(p.get('effects', [])):      # cutaway media is copied into the job, where the page can load it
        src = e.get('src')
        if src and not src.startswith('media/'):
            path = os.path.join(os.path.dirname(plan_path), os.path.expanduser(src))
            if not os.path.isfile(path): die(f'broll file not found: {path}')
            os.makedirs(os.path.join(job, 'media'), exist_ok=True)
            e['src'] = f'media/{i}_{os.path.basename(path)}'
            shutil.copyfile(path, os.path.join(job, e['src']))
    if audio: p['audio'] = audio
    out = os.path.join(job, 'plan.resolved.json')
    json.dump(p, open(out, 'w'), indent=1, ensure_ascii=False)
    return p, out


def timeline_(args):
    if len(args) < 2: die('usage: emx.py timeline <job> <plan.json>')
    job = os.path.abspath(args[0]); p, _ = resolved(job, os.path.abspath(args[1]))
    print('timeline:', report.timeline(p, job, os.path.join(job, 'timeline.md')))


def qc_(args):
    if len(args) < 3: die('usage: emx.py qc <job> <plan.json> <video.mp4>')
    job = os.path.abspath(args[0]); p, _ = resolved(job, os.path.abspath(args[1]))
    tr = json.load(open(os.path.join(job, 'track.json')))
    base = os.path.splitext(os.path.abspath(args[2]))[0]
    issues = report.qc(os.path.abspath(args[2]), p, tr, base + '_qc.md', base + '_qc.jpg')
    print('qc:', base + '_qc.md', '(all checks pass)' if not issues else f'({len(issues)} to fix)')


CMDS = {'setup': setup, 'list': list_, 'placeholder': placeholder, 'reframe': reframe, 'track': track, 'words': words,
        'check': check, 'render': render, 'timeline': timeline_, 'qc': qc_}

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in CMDS: print(__doc__); sys.exit(1)
    CMDS[sys.argv[1]](sys.argv[2:])
