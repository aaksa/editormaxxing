"""Sound design: synthesized effects cued from the plan, mixed under the voice.

Every sound is made by ffmpeg from a formula or seeded noise, so it is the same on every run, needs no sample library and
carries no licence. The cues come from the plan: each cut gets its transition sound, each effect its entry sound (an
effect can say "sfx": "none" or name another one). The voice stays on top: the effects bus sits ~14 dB under it, an
optional music bed is ducked by the voice, and the mix is normalised to -14 LUFS (the reference's measured loudness).
"""
import os, subprocess

SR = 48000
# name: (ffmpeg source, length s). aevalsrc expressions are pure functions of t; noise is seeded.
SOUNDS = {
    'pop':     ("aevalsrc='0.9*sin(2*PI*t*(620+2600*exp(-38*t)))*exp(-22*t)':d=0.16", 0.16),
    'tick':    ("aevalsrc='0.6*sin(2*PI*2300*t)*exp(-110*t)':d=0.05", 0.05),
    'impact':  ("aevalsrc='0.95*sin(2*PI*t*(42+95*exp(-14*t)))*exp(-4.5*t)+0.25*sin(2*PI*t*(160+300*exp(-30*t)))*exp(-18*t)':d=0.8", 0.8),
    'shimmer': ("aevalsrc='(0.22*sin(2*PI*3150*t)+0.16*sin(2*PI*4720*t)+0.1*sin(2*PI*6300*t))*(1-exp(-40*t))*exp(-3.2*t)*(0.75+0.25*sin(2*PI*14*t))':d=0.9", 0.9),
    'whoosh':  ("anoisesrc=color=pink:seed=7:d=0.5,bandpass=f=1100:width_type=o:w=2.2,volume='pow(sin(PI*t/0.5),3)*2.6':eval=frame", 0.5),
    'whoosh_lo': ("anoisesrc=color=brown:seed=11:d=0.6,lowpass=f=700,volume='pow(sin(PI*t/0.6),2)*3.2':eval=frame", 0.6),
    'swell':   ("anoisesrc=color=pink:seed=3:d=0.45,highpass=f=2500,volume='pow(t/0.45,3)*2.2':eval=frame", 0.45),
    'paper':   ("anoisesrc=color=white:seed=21:d=0.45,bandpass=f=3200:width_type=o:w=1.5,tremolo=f=22:d=0.8,volume='sin(PI*t/0.45)*1.4':eval=frame", 0.45),
    # the refined palette: longer, softer, airier
    'air':     ("anoisesrc=color=pink:seed=5:d=0.95,highpass=f=180,lowpass=f=1600,volume='pow(sin(PI*t/0.95),2)*2.4':eval=frame", 0.95),
    'soft_pop': ("aevalsrc='0.7*sin(2*PI*t*(420+900*exp(-20*t)))*exp(-13*t)':d=0.3", 0.3),
    'chime':   ("aevalsrc='0.32*(sin(2*PI*880*t)+0.55*sin(2*PI*1320*t)+0.25*sin(2*PI*1760*t))*exp(-3.6*t)*(1-exp(-90*t))':d=1.3", 1.3),
    'flutter': ("anoisesrc=color=white:seed=33:d=0.9,bandpass=f=2600:width_type=o:w=1.8,tremolo=f=9:d=0.7,volume='pow(sin(PI*t/0.9),2)*1.2':eval=frame", 0.9),
}

# what each cut and each effect sounds like, and when (seconds after its start; lists give several hits)
CUT = {'whip': ('whoosh', -0.18), 'zoom': ('whoosh', -0.2), 'bloom': ('swell', -0.42), 'iris': ('whoosh_lo', -0.1), 'cut': None,
       'glide': ('air', -0.32), 'depth': ('air', -0.36), 'curtain': ('whoosh', -0.4),
       'flare': ('swell', -0.42), 'spin': ('whoosh', -0.28), 'slats': ('air', -0.05), 'push': ('impact', -0.05), 'flood': ('whoosh_lo', -0.3)}
# the refined mode swaps the punchy hits for their softer cousins
SOFTER = {'pop': 'soft_pop', 'paper': 'flutter', 'whoosh': 'air'}
FX = {
    'mega-word': [('impact', 0.22)], 'gloss-word': [('pop', 0.08)], 'ribbon': [('whoosh', 0.0)], 'icon-3d': [('pop', 0.06)],
    'paper-card': [('paper', 0.0)], 'headline': [('tick', 0.05)], 'arc-text': [('pop', 0.1)], 'name-title': [('whoosh', 0.0)],
    'title-card': [('shimmer', 0.05)], 'punch': [('impact', 0.0)], 'magnifier': [('whoosh_lo', 0.0)], 'torn-note': [('paper', 0.0)],
    'paper-3d': [('flutter', 0.0)], 'glass-word': [('shimmer', 0.1)],
}


def cues(plan, fps):
    refined = plan.get('motion', 'refined') == 'refined'
    tempo = 1.8 if refined else 1.0          # effects run on a slower clock in the refined mode: their hits move with it
    soft = (lambda n: SOFTER.get(n, n)) if refined else (lambda n: n)
    out = []
    for i, s in enumerate(plan.get('scenes', [])):
        kind = s.get('in', 'glide' if refined else 'whip') if i > 0 else 'cut'
        c = CUT.get(kind)
        if c: out.append((c[0], s['start'] + c[1], 0.8 if refined else 1.0))
    for e in plan.get('effects', []):
        name = e.get('sfx')
        if name == 'none': continue
        hits = [(name, 0.05)] if name else list(FX.get(e['fx'], []))
        if e['fx'] == 'stack-lines' and isinstance(e.get('times'), str):
            hits += [('tick', (float(t) - e['start']) / tempo + 0.04) for t in e['times'].split('|') if t]
        if e['fx'] == 'big-number':      # the counter ticks while it runs and lands with an impact (18 frames)
            hits += [('tick', (2 + k * 2) / fps) for k in range(9)] + [('impact', 20 / fps)]
        if e['fx'] == 'headline' and isinstance(e.get('times'), str):
            hits += [('tick', (float(t) - e['start']) / tempo + 0.04) for t in e['times'].split('|') if t]
        if e['fx'] == 'cta-pill' and e.get('press') is not None:
            hits.append(('chime', (float(e['press']) - e['start']) / tempo + 0.05))
        if e['fx'] == 'headline' and e.get('cta') and e.get('press') is not None:
            hits.append(('chime', (float(e['press']) - e['start']) / tempo + 0.05))
        for n, dt in hits:
            n = soft(n)
            g = (0.8 if n in ('tick', 'pop', 'soft_pop') else 1.0) * (0.7 if refined and n == 'impact' else 1.0)
            if n in SOUNDS: out.append((n, e['start'] + dt * tempo, g))
    return sorted((n, max(0.0, t), g) for n, t, g in out)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: raise SystemExit(f'emx: ffmpeg failed:\n{r.stderr[-800:]}')
    return r


def make_sounds(folder):
    os.makedirs(folder, exist_ok=True)
    for name, (src, d) in SOUNDS.items():
        out = os.path.join(folder, f'{name}.wav')
        if not os.path.exists(out):
            run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', src, '-t', str(d), '-ar', str(SR), '-ac', '1',
                 '-af', 'afade=t=out:st=%f:d=%f' % (max(0, d - 0.03), 0.03), out])


def mix(job, plan, duration, voice, music=None, sfx_db=-14.0, music_db=-22.0):
    """Writes <job>/mix.wav (voice + effects + optional ducked music, -14 LUFS) and returns the cue list."""
    folder = os.path.join(job, 'sfx'); make_sounds(folder)
    fps = plan.get('fps', 30)
    cl = cues(plan, fps)
    ins, parts = ['-i', voice], []
    for k, (name, t, g) in enumerate(cl):
        ins += ['-i', os.path.join(folder, f'{name}.wav')]
        ms = int(round(t * 1000))
        pan = 'pan=stereo|c0=c0|c1=c0' if name != 'whoosh' else ('pan=stereo|c0=0.9*c0|c1=0.5*c0' if k % 2 else 'pan=stereo|c0=0.5*c0|c1=0.9*c0')
        parts.append(f'[{k + 1}:a]{pan},adelay={ms}|{ms},volume={g}[s{k}]')
    graph = parts[:]
    graph.append('[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad[v]')
    if cl:
        graph.append(''.join(f'[s{k}]' for k in range(len(cl))) + f'amix=inputs={len(cl)}:normalize=0,volume={sfx_db}dB[fx]')
    bus = '[v][fx]' if cl else '[v]'
    n = 2 if cl else 1
    if music:
        ins += ['-stream_loop', '-1', '-i', music]
        mi = len(cl) + 1
        graph.append(f'[{mi}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={music_db}dB[mu0]')
        graph.append('[v]asplit[v][key]')
        graph.append('[mu0][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[mu]')
        bus += '[mu]'; n += 1
    graph.append(f'{bus}amix=inputs={n}:normalize=0:duration=first,atrim=0:{duration},loudnorm=I=-14:TP=-1.5:LRA=11[out]')
    out = os.path.join(job, 'mix.wav')
    run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(graph), '-map', '[out]', '-ar', str(SR), out])
    return cl
