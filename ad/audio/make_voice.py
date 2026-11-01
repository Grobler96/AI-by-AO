"""Generates the voiceover lines for an ad with Kokoro (pip install kokoro-onnx soundfile).
Reads the lines from ../src/ads.json and writes vo/<ad id>/a.wav ... f.wav.
Usage: python make_voice.py [ad id | all] [voice]   (default: all ads, voice af_heart)
Model files (kokoro-v1.0.int8.onnx, voices-v1.0.bin) come from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0)."""
import json, os, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

here = os.path.dirname(os.path.abspath(__file__))
ads = json.load(open(os.path.join(here, "..", "src", "ads.json")))
which = sys.argv[1] if len(sys.argv) > 1 else "all"
voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
model_dir = os.environ.get("KOKORO_DIR", ".")
k = Kokoro(os.path.join(model_dir, "kokoro-v1.0.int8.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))
lang = "en-us" if voice.startswith("a") else "en-gb"

# The letter "A" is read as the word "a", so spelled-out letters like [[A]] get explicit phonemes.
LETTERS = {"A": "ˈeɪ", "M": "ˈɛm", "O": "ˈoʊ", "I": "ˈaɪ"}
# longest each line may run so it fits its scene (seconds)
MAX = {"a": 2.4, "b": 2.65, "c": 1.6, "d": 2.8, "e": 1.9, "f": 1.6}

def to_phonemes(text):
    parts = re.split(r"(\[\[[A-Z]\]\])", text)
    out = []
    for p in parts:
        m = re.fullmatch(r"\[\[([A-Z])\]\]", p)
        if m: out.append(LETTERS[m.group(1)])
        elif p.strip(): out.append(k.tokenizer.phonemize(p.strip(), lang))
    return " ".join(out)

for ad in ads:
    if which not in ("all", ad["id"]): continue
    outdir = os.path.join(here, "vo", ad["id"]); os.makedirs(outdir, exist_ok=True)
    for key, text in ad["voice"].items():
        spelled = "[[" in text
        t = to_phonemes(text) if spelled else text
        sp = 1.08
        while True:
            s, sr = k.create(t, voice=voice, speed=sp, lang=lang, is_phonemes=spelled)
            idx = np.where(np.abs(s) > 0.01)[0]
            s = s[max(idx[0] - int(.02 * sr), 0): idx[-1] + int(.06 * sr)]
            if len(s) / sr <= MAX[key] or sp > 1.5: break
            sp += 0.04
        sf.write(os.path.join(outdir, f"{key}.wav"), s, sr)
        print(ad["id"], key, f"{len(s)/sr:.2f}s (max {MAX[key]}) x{sp:.2f}", text)
