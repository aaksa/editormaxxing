#!/usr/bin/env python3
"""Word timings for a job: <job>/words.json = [{"w": "hoki", "start": 10.71, "end": 11.02, "line": 3}, ...].

  words.py <job> [--model small] [--lang id]

The audio is the job's voice.wav (placeholder) or source.mp4 (a real clip). faster-whisper's word timestamps come from
cross-attention + DTW: good to ~1-2 frames on clean speech. When the job has lines.json (the script), its text is the
decoder's prompt, so the words come out spelled as written, and every word is tagged with the line it falls in.
"""
import json, os, re, sys


def to_script(words, lines):
    """Align the transcript to the known script: every matched word takes the script's spelling and its line, and is
    clamped into that line's measured span (Whisper's DTW timing slips most at sentence boundaries)."""
    import difflib, re
    norm = lambda t: re.sub(r"[^\w']", '', t.lower())
    script = [(norm(t), t, l) for l in lines for t in l['text'].split()]
    a, b = [norm(w['w']) for w in words], [x[0] for x in script]
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                words[i1 + k]['w'] = script[j1 + k][1]; words[i1 + k]['line'] = script[j1 + k][2]['i']
    for w in words:
        line = next((l for l in lines if l['i'] == w.get('line')), None)
        if line is None:      # unmatched (a number said as words, a mishearing): the line its middle falls in
            mid = (w['start'] + w['end']) / 2
            line = min(lines, key=lambda l: 0 if l['start'] <= mid <= l['end'] else min(abs(mid - l['start']), abs(mid - l['end'])))
            w['line'] = line['i']
        w['start'] = round(min(max(w['start'], line['start']), line['end'] - 0.05), 3)
        w['end'] = round(min(max(w['end'], w['start'] + 0.05), line['end']), 3)
    return words


def main(argv):
    model_name = 'small'; lang = 'id'
    args = []
    i = 0
    while i < len(argv):
        if argv[i] == '--model': model_name = argv[i + 1]; i += 2
        elif argv[i] == '--lang': lang = argv[i + 1]; i += 2
        else: args.append(argv[i]); i += 1
    if not args: sys.exit(__doc__)
    job = os.path.abspath(args[0])
    audio = next((os.path.join(job, n) for n in ('voice.wav', 'source.mp4') if os.path.exists(os.path.join(job, n))), None)
    if not audio: sys.exit(f'no voice.wav or source.mp4 in {job}')
    lines = json.load(open(os.path.join(job, 'lines.json'))) if os.path.exists(os.path.join(job, 'lines.json')) else []
    prompt = ' '.join(l['text'] for l in lines)[:800] or None

    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segs, _ = model.transcribe(audio, language=lang, word_timestamps=True, initial_prompt=prompt, vad_filter=False,
                               condition_on_previous_text=False)
    words = []
    for s in segs:
        for w in s.words or []:
            text = w.word.strip()
            if not text: continue
            words.append({'w': text, 'start': round(w.start, 3), 'end': round(w.end, 3)})
    if lines: words = to_script(words, lines)
    json.dump(words, open(os.path.join(job, 'words.json'), 'w'), indent=0, ensure_ascii=False)
    print(f'{len(words)} words -> {os.path.join(job, "words.json")}')
    print(' '.join(f'{w["w"]}@{w["start"]:.2f}' for w in words[:40]), '...' if len(words) > 40 else '')


if __name__ == '__main__':
    main(sys.argv[1:])
