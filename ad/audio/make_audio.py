"""Builds public/audio/<ad id>.wav: synthesized music + sound effects + the voiceover in vo/<ad id>/.
Timings match src/Ad.tsx (30fps, 13s). Run: python make_audio.py [ad id | all]   (needs numpy + scipy)"""
import json, sys, wave, os
HERE = os.path.dirname(os.path.abspath(__file__))
ADS = json.load(open(os.path.join(HERE, "..", "src", "ads.json")))
AD_IDS = [a["id"] for a in ADS] if len(sys.argv) < 2 or sys.argv[1] == "all" else [sys.argv[1]]
import numpy as np
from scipy.signal import lfilter, butter, resample_poly

SR = 44100
DUR = 13.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
T = np.arange(N) / SR


def lp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)

def put(buf, x, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    x = x[: N - i] if i >= 0 else x[-i:]
    i = max(i, 0)
    buf[i : i + len(x)] += x * gain

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def tone(f, dur, a=0.005, d=0.2, wave_="sine"):
    t = np.arange(int(SR * dur)) / SR
    ph = 2 * np.pi * f * t if np.isscalar(f) else 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) if wave_ == "sine" else (2 * ((ph / (2 * np.pi)) % 1) - 1)
    return s * env(len(t), a, d)

def add(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[: len(x)] += x
    return o

def noise(dur):
    return rng.standard_normal(int(SR * dur))

sfx = np.zeros(N)
music = np.zeros(N)

sfx = np.zeros(N)
music = np.zeros(N)


def build(ad):
    sfx = np.zeros(N)
    music = np.zeros(N)
    # ---------- sound effects ----------
    # phone ring (0-1.3s): two double-bursts
    for t0 in ((0.12, 0.62) if ad["call"]["ring"] else ()):
        t = np.arange(int(SR * 0.42)) / SR
        r = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 22 * t)))
        put(sfx, r * np.minimum(t / 0.01, 1) * np.minimum((0.42 - t) / 0.02, 1), t0, 0.16)
    if not ad["call"]["ring"]:   # soft two-tone notification instead of a ring
        for t0, f in ((0.15, 988), (0.33, 1319)):
            put(sfx, add(tone(f, 0.6, 0.004, 0.16), 0.3 * tone(f * 2, 0.4, 0.004, 0.08)), t0, 0.22)
    # missed-call thud + descending blip (1.33s)
    put(sfx, tone(np.linspace(190, 48, int(SR * 0.45)), 0.45, 0.002, 0.14), 1.33, 0.9)
    put(sfx, tone(np.concatenate([np.full(int(SR * .09), 523.), np.full(int(SR * .2), 392.)]), 0.29, 0.003, 0.12), 1.38, 0.18)
    # typing clicks (2.63-3.8s) and highlight pop
    segs = ad["type"]["segs"]
    n_chars = sum(len(g["t"]) for g in segs)
    pre_hl = sum(len(g["t"]) for g in segs[: next(i for i, g in enumerate(segs) if g.get("hl"))])
    type_end = 2.63 + n_chars / 27.0
    for k, t0 in enumerate(np.arange(2.63, type_end, 0.074)):
        c = hp(noise(0.012), 2500) * env(int(SR * 0.012), 0.0005, 0.003)
        put(sfx, c, t0, 0.22 * (0.7 + 0.5 * rng.random()))
    put(sfx, tone(np.linspace(380, 1000, int(SR * 0.12)), 0.12, 0.003, 0.05), (79 + pre_hl / 0.9) / 30, 0.3)
    # soft sparkle on "while you were asleep"
    for j, f in enumerate((1568, 1976, 2349)):
        put(sfx, tone(f, 0.5, 0.004, 0.14), 5.2 + j * 0.07, 0.07)
    # cards: whoosh + ding
    for t0, f in ((6.3, 1175), (6.8, 1568), (7.25, 1760)):
        w = bp(noise(0.3), 400, 4000) * np.sin(np.linspace(0, np.pi, int(SR * 0.3))) ** 2
        put(sfx, w, t0 - 0.12, 0.5)
        put(sfx, add(tone(f, 0.9, 0.003, 0.22), 0.4 * tone(f * 2, 0.6, 0.003, 0.12)), t0 + 0.05, 0.2)
    # riser into the glitch (7.6-9.0)
    rl = int(SR * 1.4)
    rise = hp(noise(1.4), 800) * np.linspace(0, 1, rl) ** 2
    saw = tone(np.linspace(180, 1500, rl) ** 1.0, 1.4, 0.3, 5, "saw") * np.linspace(0, 1, rl) ** 2
    put(sfx, rise, 7.6, 0.28); put(sfx, lp(saw, 3000), 7.6, 0.14)
    # glitch bursts (8.87-9.2): bit-crushed stabs
    for t0 in (8.87, 8.93, 9.0, 9.08):
        g = noise(0.05); g = np.round(g * 3) / 3
        put(sfx, bp(g, 600, 7000) * env(len(g), 0.001, 0.03), t0, 0.5)
    # impact on "Meet" (9.0s)
    bl = int(SR * 1.6)
    put(sfx, tone(np.concatenate([np.linspace(120, 42, int(SR * .35)), np.full(bl - int(SR * .35), 42.)]), 1.6, 0.002, 0.55), 9.0, 1.0)
    put(sfx, lp(noise(1.8), 5000) * env(int(SR * 1.8), 0.002, 0.45), 9.0, 0.45)
    # logo shimmer (10.4s) and CTA ding (12.0s)
    for j, f in enumerate((784, 988, 1175, 1480, 1976, 2637)):
        put(sfx, tone(f, 1.1, 0.004, 0.3), 10.4 + j * 0.06, 0.09)
    put(sfx, bp(noise(0.7), 1500, 9000) * np.sin(np.linspace(0, np.pi, int(SR * 0.7))) ** 2, 10.3, 0.2)
    put(sfx, add(tone(1319, 1.2, 0.003, 0.3), 0.5 * tone(2637, 0.8, 0.003, 0.15)), 12.0, 0.25)

    # ---------- music (120 bpm, A minor) ----------
    beat = 0.5
    def midi(n): return 440 * 2 ** ((n - 69) / 12)
    chords = [(57, 60, 64), (53, 57, 60), (48, 55, 60), (55, 59, 62)]  # Am F C G
    sh = [x["id"] for x in ADS].index(ad["id"])  # rotate the progression so each ad sounds a little different
    chords = chords[sh:] + chords[:sh]
    bars = int(np.ceil(DUR / (4 * beat)))
    for b in range(bars):
        t0 = b * 4 * beat
        ch = chords[b % 4]
        open_ = min(1.0, 0.35 + t0 / 9.0) if t0 < 9.0 else 1.0
        for n in ch:
            for det in (-0.12, 0.0, 0.12):
                pad = tone(midi(n) * (1 + det * 0.01), 2.3, 0.35, 1.4, "saw")
                put(music, lp(pad, 700 + 3500 * open_ ** 2), t0, 0.035 * (1.4 if t0 >= 9.0 else 1.0))
        root = midi(ch[0] - 12)
        drop = t0 >= 8.9
        # bass: 8ths on the drop
        for s in range(8 if drop else 0):
            put(music, lp(tone(root, 0.24, 0.004, 0.11, "saw"), 420), t0 + s * beat / 2, 0.30)
        # plucked arpeggio from 2.0s, louder on the drop
        if t0 >= 2.0:
            for s in range(8):
                n = ch[s % 3] + 12 * (s // 3 % 2)
                put(music, lp(tone(midi(n + 12), 0.3, 0.003, 0.09, "saw"), 5000), t0 + s * beat / 2, 0.075 if not drop else 0.12)

    def kick():
        return tone(np.concatenate([np.linspace(150, 48, int(SR * .12)), np.full(int(SR * .2), 48.)]), 0.32, 0.001, 0.09)
    def hat(open_=False):
        return hp(noise(0.12), 7000) * env(int(SR * 0.12), 0.0005, 0.05 if open_ else 0.015)
    def clap():
        return bp(noise(0.2), 1000, 3500) * env(int(SR * 0.2), 0.001, 0.07)

    for k in range(int(DUR / beat)):
        t = k * beat
        if t >= 4.5 and t < 8.9:
            put(music, hat(), t + beat / 2, 0.05)           # light hats in the build
            if t >= 6.5: put(music, kick(), t, 0.5)
        if t >= 8.9 and t < 12.6:
            put(music, kick(), t, 0.85)
            put(music, hat(True), t + beat / 2, 0.11)
            put(music, hat(), t + beat / 4, 0.05); put(music, hat(), t + 3 * beat / 4, 0.05)
            if k % 2 == 1: put(music, clap(), t, 0.3)
    # final chord hit at 12.5s
    for n in (57, 60, 64, 69):
        put(music, lp(tone(midi(n), 0.9, 0.003, 0.35, "saw"), 3500), 12.5, 0.07)

    # ---------- voiceover ----------
    def load_vo(name):
        with wave.open(os.path.join(HERE, "vo", ad["id"], name + ".wav")) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
            sr = w.getframerate()
        x = resample_poly(x, SR, sr)
        x = hp(x, 90)
        x = np.tanh(x * 2.2) / np.tanh(2.2)          # gentle compression
        x = x / np.max(np.abs(x)) * 0.85
        # light room reverb so the voice sits in the mix instead of sounding pasted on
        n = int(SR * 0.28)
        ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.07))
        ir = lp(ir, 5000)
        wet = np.convolve(x, ir / np.sqrt(np.sum(ir ** 2)))[: len(x)]
        return (x + 0.12 * wet) / 1.0

    vo = np.zeros(N)
    for name, t0 in (("a", 0.3), ("b", 2.5), ("c", 5.15), ("d", 6.75), ("e", 9.6), ("f", 11.3)):
        put(vo, load_vo(name), t0)

    # duck music + sfx under the voice
    e = lp(np.abs(vo), 6)
    e = np.clip(e / (np.percentile(e, 98) + 1e-9), 0, 1)
    duck = 1 - 0.5 * e
    mix = (music * duck * 0.9 + sfx * (1 - 0.25 * e) + vo * 1.15)

    # fades and master
    mix *= np.minimum(T / 0.15, 1) * np.minimum((DUR - T) / 0.8, 1)
    mix = np.tanh(mix * 1.1)
    mix = mix / np.max(np.abs(mix)) * 0.89

    # stereo: tiny haas widening on music, centre everything else
    L = mix
    R = mix.copy()
    wide = np.roll(music * duck * 0.9, int(SR * 0.011)) - music * duck * 0.9
    L = L - 0.12 * wide; R = R + 0.12 * wide
    st = np.stack([L, R], 1)
    st = st / max(1, np.max(np.abs(st)) / 0.89)

    out = os.path.join(HERE, "..", "public", "audio", ad["id"] + ".wav")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print("wrote", os.path.normpath(out), f"{DUR}s")



for _id in AD_IDS:
    build(next(a for a in ADS if a["id"] == _id))
