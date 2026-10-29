"""Resolve a plan's speech anchors into clip seconds.

Any `start`, `end`, `press` or `times` entry may be a number or an anchor on the voice:
  "w:hoki"        the start of the word "hoki" (first time it is said)      "we:hoki"   its end
  "w:kami@2"      the second "kami"                                          "w:hoki+0.2" / "w:hoki-0.1"  shifted
  "l:3" / "le:3"  the start / end of spoken line 3 (lines.json, 0-based)
An effect's `start` on a word lands LEAD frames before it (arrive just before the word, not on it); line anchors are exact,
so an effect can start precisely on a cut.
"""
import json, os, re

LEAD_FRAMES = 2
ANCHOR = re.compile(r'^(w|we|l|le):([^@+\-]+?)(?:@(\d+))?([+\-][\d.]+)?$')
norm = lambda s: re.sub(r"[^\w']", '', s.lower())


class Anchors:
    def __init__(self, job):
        p = lambda n: os.path.join(job, n)
        self.words = json.load(open(p('words.json'))) if os.path.exists(p('words.json')) else []
        self.lines = json.load(open(p('lines.json'))) if os.path.exists(p('lines.json')) else []
        self.fps = json.load(open(p('track.json')))['fps']

    def at(self, v, lead=False):
        if isinstance(v, (int, float)) or v is None: return v
        s = str(v).strip()
        try: return float(s)
        except ValueError: pass
        m = ANCHOR.match(s)
        if not m: raise SystemExit(f'emx: bad time "{s}" (use a number, w:word, we:word, l:N or le:N)')
        kind, key, nth, shift = m.group(1), m.group(2), int(m.group(3) or 1), float(m.group(4) or 0)
        if kind in ('w', 'we'):
            if not self.words: raise SystemExit(f'emx: "{s}" needs word times: run  emx.py words <job>  first')
            hits = [w for w in self.words if norm(w['w']) == norm(key)]
            if len(hits) < nth: raise SystemExit(f'emx: the word "{key}" (#{nth}) is not in words.json')
            t = hits[nth - 1]['start' if kind == 'w' else 'end']
        else:
            line = next((l for l in self.lines if l['i'] == int(key)), None)
            if not line: raise SystemExit(f'emx: line {key} is not in lines.json')
            t = line['start' if kind == 'l' else 'end']
        t += shift
        if lead and kind == 'w': t -= LEAD_FRAMES / self.fps
        return round(max(0.0, t), 3)


def resolve(plan_path, job):
    """The plan with every anchor turned into seconds (scenes keep exact cut times; effects get the lead)."""
    plan = json.load(open(plan_path))
    A = Anchors(job)
    for s in plan.get('scenes', []):
        for k in ('start', 'end'):
            if k in s: s[k] = A.at(s[k])
    for e in plan.get('effects', []):
        if 'start' in e: e['start'] = A.at(e['start'], lead=True)
        if 'end' in e: e['end'] = A.at(e['end'])
        if 'press' in e: e['press'] = A.at(e['press'])          # a CTA pill's press lands on its word, exactly
        if isinstance(e.get('times'), str) and e['times']:
            e['times'] = '|'.join(str(A.at(x.strip(), lead=True)) for x in e['times'].split('|'))
    return plan
