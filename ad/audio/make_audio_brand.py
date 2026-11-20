"""Builds public/audio/brand-film.wav: score + sound design + the voiceover in vo/brand-film/.
Every event is timed from the marks in src/stories.json, the same ones the animation in src/BrandFilm.tsx uses.
Run: python make_audio_brand.py   (needs numpy + scipy)"""
import json, os, wave
HERE = os.path.dirname(os.path.abspath(__file__))
FILM = next(s for s in json.load(open(os.path.join(HERE, "..", "src", "stories.json"))) if s["id"] == "brand-film")
MK = FILM["marks"]
M1, M2, M3, M4, M5 = MK["morph"]
import numpy as np
from scipy.signal import lfilter, butter, resample_poly

SR = 44100
DUR = 38.5
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

def midi(n): return 440 * 2 ** ((n - 69) / 12)
def pluck(n, dur=1.2, d=0.35, bright=2500):
    f = midi(n); t = np.arange(int(SR * dur)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return lp(x, bright) * env(len(t), 0.004, d)
def bell(n, dur=1.6, d=0.5):
    f = midi(n); t = np.arange(int(SR * dur)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.2) + 0.25 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / 0.08)
    return x * env(len(t), 0.003, d)
def hann(n): return np.sin(np.linspace(0, np.pi, n)) ** 2
def whoosh(t0, dur, lo, hi, g=0.3):
    put(sfx, bp(noise(dur), lo, hi) * hann(int(SR * dur)), t0, g)
def riser(t0, dur, g=0.25, lo=1200):
    n = int(SR * dur)
    put(sfx, hp(noise(dur), lo) * np.linspace(0, 1, n) ** 2.2, t0, g)
    put(sfx, tone(np.linspace(180, 1800, n), dur, dur * 0.6, 9) * np.linspace(0, 1, n) ** 2, t0, g * 0.5)
def thud(t0, g=0.5, f0=120, f1=42):
    put(sfx, tone(np.concatenate([np.linspace(f0, f1, int(SR * .15)), np.full(int(SR * .45), float(f1))]), 0.6, 0.002, 0.2), t0, g)
def pop(t0, f0=600, f1=1500, g=0.16):
    put(sfx, tone(np.linspace(f0, f1, int(SR * 0.07)), 0.07, 0.002, 0.03), t0, g)
def click(t0, g=0.2):
    put(sfx, hp(noise(0.012), 2500) * env(int(SR * 0.012), 0.0005, 0.004), t0, g)
def ping(t0, n, g=0.13, dur=1.0, d=0.25):
    put(sfx, bell(n, dur, d), t0, g)
def impact(t0, g=0.8):
    thud(t0, g, 130, 38)
    put(sfx, lp(noise(1.6), 6000) * env(int(SR * 1.6), 0.002, 0.4), t0, g * 0.45)

# ============ A. the intro: spark, orb, chaos, absorb (0 - 5.2s) ============
for n in (45, 52):
    put(music, lp(tone(midi(n), 5.6, 1.6, 4.0, "saw"), 280), 0.0, 0.17)
put(sfx, tone(np.linspace(400, 2400, int(SR * 0.4)), 0.4, 0.05, 0.3), 0.25, 0.1)
for n in (57, 60, 64, 71):                                                 # the orb blooms
    put(music, lp(tone(midi(n), 3.4, 1.4, 2.0, "saw"), 2200), 0.6, 0.06)
for k, n in enumerate((69, 72, 76, 81, 88)):
    ping(2.1 + k * 0.08, n, 0.1, 1.6, 0.5)
t_ = 1.4                                                                    # the words frenzy
while t_ < 3.5:
    click(t_, 0.07); t_ += max(0.05, 0.35 * (1 - (t_ - 1.4) / 2.2) ** 1.5 + 0.05)
for t0 in np.arange(2.4, 4.4, 0.55):
    thud(t0, 0.2 + 0.1 * (t0 - 2.4), 90, 45)
riser(3.3, 1.1, 0.3, 800)
impact(MK["absorb"], 0.9)
for k, n in enumerate((81, 84, 88, 93)):
    ping(MK["absorb"] + 0.05 + k * 0.05, n, 0.1, 2.0, 0.6)

# ============ B. the services (5.2 - 31s): one steady beat, new colours per scene ============
bpm = 104; beat = 60 / bpm; bar = 4 * beat
B0 = 6.35
prog = [(57, (57, 60, 64)), (53, (53, 57, 60)), (48, (48, 55, 60)), (55, (55, 59, 62))]   # Am F C G
t_bar = M1; bi = 0
while t_bar < 31.0:
    root, ch = prog[bi % 4]
    for n in ch:
        for det in (-0.12, 0.0, 0.12):
            put(music, lp(tone(midi(n) * (1 + det * 0.01), bar * 1.1, 0.25, 1.3, "saw"), 2400), t_bar, 0.03)
    if t_bar >= B0 - 0.1:
        for s_ in range(8):
            put(music, lp(tone(midi(root - 12), 0.26, 0.004, 0.12, "saw"), 380), t_bar + s_ * beat / 2, 0.22)
        for s_ in range(8):
            nn = ch[s_ % 3] + 12 * (1 + (s_ // 3) % 2 + (1 if t_bar >= M2 else 0))
            put(music, pluck(nn, 0.5, 0.18, 4500), t_bar + s_ * beat / 2 + beat / 4, 0.06 if t_bar < M2 else 0.085)
    t_bar += bar; bi += 1
def kick(): return tone(np.concatenate([np.linspace(140, 46, int(SR * .12)), np.full(int(SR * .2), 46.)]), 0.32, 0.001, 0.09)
def hat(o=False): return hp(noise(0.12), 7000) * env(int(SR * 0.12), 0.0005, 0.05 if o else 0.015)
def clap(): return bp(noise(0.2), 1000, 3500) * env(int(SR * 0.2), 0.001, 0.07)
k = 0
while True:
    t = B0 + k * beat
    if t > 36.6: break
    if not (29.9 <= t < 31.0):
        put(music, kick(), t, 0.5)
        put(music, hat(True), t + beat / 2, 0.07)
        if k % 2 == 1 and t >= M1 + 1.4: put(music, clap(), t, 0.2)
        if t >= M3: put(music, hat(), t + beat / 4, 0.04); put(music, hat(), t + 3 * beat / 4, 0.04)
    k += 1
rng2 = np.random.default_rng(3)                                             # sequencer blips for the automation scene
for k in range(int((M4 - 0.3 - M3 - 1.0) / (beat / 4))):
    if rng2.random() < 0.55:
        put(music, lp(tone(midi(int(rng2.choice([76, 79, 81, 84, 88]))), 0.16, 0.002, 0.05, "saw"), 5200), M3 + 1.0 + k * beat / 4, 0.05)

# --- morphs: every shape change gets a whoosh + a shockwave thump
for m, rise in ((M1, 0.6), (M2, 0.8), (M3, 0.8), (M4, 0.8), (M5, 1.0)):
    riser(m - rise, rise, 0.16, 1500)
    whoosh(m - 0.05, 1.2, 250, 6500, 0.38)
    thud(m, 0.55)
    ping(m + 0.9, 84 if m != M5 else 79, 0.07, 1.4, 0.4)

# --- phone: the AI receptionist
for t0 in (5.55, 5.95):
    tt = np.arange(int(SR * 0.3)) / SR
    r = (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 22 * tt)))
    put(sfx, r * np.minimum(tt / 0.01, 1) * np.minimum((0.3 - tt) / 0.02, 1), t0, 0.08)
click(MK["phone"]["call"], 0.3); pop(MK["phone"]["call"] + 0.05, 500, 900, 0.18)
pop(MK["phone"]["caller"], 500, 900, 0.14); pop(MK["phone"]["ai"], 700, 1500, 0.16)
for t0 in np.arange(MK["phone"]["ai"] + 0.1, MK["phone"]["booked"] - 0.2, 0.035):   # live typing under the AI's reply
    click(t0, 0.05)
for k, n in enumerate((84, 88, 91, 96)):
    ping(MK["phone"]["booked"] + k * 0.07, n, 0.14, 1.4, 0.4)

# --- chat: bubbles, typing dots, send/receive
c1, typing, a1, c2, a2, chips, press = MK["chat"]
for t0, up in ((c1, True), (c2, True), (a1, False), (a2, False)):
    if up: pop(t0, 700, 1700, 0.15); whoosh(t0 - 0.03, 0.2, 1500, 7000, 0.12)
    else: ping(t0 + 0.02, 83, 0.1, 0.8, 0.2); pop(t0, 500, 1100, 0.12)
for t0 in list(np.arange(typing, a1, 0.2)) + list(np.arange(c2 + 0.3, a2, 0.2)):
    pop(t0, 900, 1000, 0.05)
pop(chips, 600, 1400, 0.14)
click(press - 0.1, 0.25)
for k, n in enumerate((79, 84, 88, 91)):
    ping(press + k * 0.07, n, 0.14, 1.4, 0.4)

# --- workflow: nodes pop in, wires zip, pulses fly, ticks land
for k, t0 in enumerate((M3 + 1.3, M3 + 1.5, M3 + 1.7, M3 + 1.9, M3 + 2.1)):
    pop(t0, 400 + 120 * k, 900 + 200 * k, 0.17); whoosh(t0, 0.35, 900, 5000, 0.12)
for k, p0 in enumerate(MK["pulses"]):
    n = int(SR * 0.55)
    put(sfx, tone(np.linspace(300, 2000, n), 0.55, 0.05, 0.6) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * np.arange(n) / SR))), p0, 0.12)
    ping(p0 + 0.5, (76, 79, 83, 86, 88)[k], 0.16, 1.2, 0.3)
t_done = MK["pulses"][-1] + 0.6
for n in (60, 64, 67, 72, 76):
    put(music, lp(tone(midi(n), 2.0, 0.02, 0.9, "saw"), 3800), t_done, 0.06)
impact(t_done, 0.35)
whoosh(M4 - 0.3, 0.8, 200, 5000, 0.25)                                       # the nodes collapse into the hub

# --- web: the site builds itself
W = MK["web"]
whoosh(M4 + 1.0, 0.5, 800, 7000, 0.15)
for t0 in np.arange(W["type"], W["type"] + 1.15, 0.075):
    click(t0, 0.13)
thud(W["image"], 0.3, 100, 55); whoosh(W["image"] - 0.1, 0.5, 400, 4500, 0.2)
pop(W["cta"], 500, 1300, 0.17)
for k in range(3): pop(W["cta"] + 0.2 + k * 0.18, 400, 900, 0.1)
click(W["click"], 0.35); click(W["click"] + 0.06, 0.2); pop(W["click"] + 0.1, 800, 1800, 0.14)
for k, t0 in enumerate(W["toasts"]):
    whoosh(t0 - 0.1, 0.35, 1500, 8000, 0.14)
    ping(t0, (86, 88, 91)[k], 0.17, 1.2, 0.3); ping(t0 + 0.12, (93, 95, 98)[k], 0.1, 1.0, 0.25)

# ============ C. the finale (31s on): major key, the logo ============
F = MK["finale"]
impact(M5 + 1.4, 0.85)
for n in (60, 64, 67, 72):
    put(music, lp(tone(midi(n), 2.0, 0.01, 0.8, "saw"), 3500), M5 + 1.4, 0.08)
fprog = [(48, (60, 64, 67)), (43, (59, 62, 67)), (45, (57, 60, 64)), (41, (57, 60, 65))]   # C G Am F
t_bar = 31.0; bi = 0
while t_bar < DUR:
    root, ch = fprog[bi % 4]
    for n in ch:
        for det in (-0.12, 0.0, 0.12):
            put(music, lp(tone(midi(n) * (1 + det * 0.01), bar * 1.1, 0.3, 1.5, "saw"), 3600), t_bar, 0.04)
    for s_ in range(8):
        put(music, lp(tone(midi(root), 0.26, 0.004, 0.12, "saw"), 400), t_bar + s_ * beat / 2, 0.2)
        put(music, pluck(ch[s_ % 3] + 12 * (1 + (s_ // 3) % 2), 0.5, 0.2, 5200), t_bar + s_ * beat / 2 + beat / 4, 0.085)
    t_bar += bar; bi += 1
for i_, n in enumerate((72, 79, 76, 84)):
    ping(F["tokens"] + i_ * 0.12, n, 0.13, 1.2, 0.3); pop(F["tokens"] + i_ * 0.12, 500, 1200, 0.1)
riser(F["merge"] - 0.1, 0.4, 0.3, 1000)
impact(F["logo"], 0.9)
for k, n in enumerate((72, 76, 79, 84, 88, 91, 96)):
    ping(F["logo"] + 0.05 + k * 0.06, n, 0.12, 2.4, 0.7)
whoosh(F["logo"] - 0.1, 0.9, 1500, 9000, 0.2)
for k, n in enumerate((84, 88)):
    ping(F["cta"] + k * 0.1, n, 0.17, 1.4, 0.4)

# ---------- voiceover ----------
def load_vo(name):
    with wave.open(os.path.join(HERE, "vo", FILM["id"], name + ".wav")) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        sr = w.getframerate()
    x = hp(resample_poly(x, SR, sr), 90)
    x = np.tanh(x * 2.2) / np.tanh(2.2)
    x = x / np.max(np.abs(x)) * 0.85
    n = int(SR * 0.28)
    ir = lp(rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.07)), 5000)
    wet = np.convolve(x, ir / np.sqrt(np.sum(ir ** 2)))[: len(x)]
    return x + 0.12 * wet

vo = np.zeros(N)
for key, t0 in FILM["voiceStart"].items():
    put(vo, load_vo(key), t0)

e = lp(np.abs(vo), 6)
e = np.clip(e / (np.percentile(e, 98) + 1e-9), 0, 1)
duck = 1 - 0.5 * e
mix = music * duck * 0.95 + sfx * (1 - 0.25 * e) + vo * 1.15
mix *= np.minimum(T / 0.4, 1) * np.minimum((DUR - T) / 1.4, 1)
mix = np.tanh(mix * 1.1)
mix = mix / np.max(np.abs(mix)) * 0.89

wide = np.roll(music * duck * 0.95, int(SR * 0.011)) - music * duck * 0.95
st = np.stack([mix - 0.12 * wide, mix + 0.12 * wide], 1)
st = st / max(1, np.max(np.abs(st)) / 0.89)

out = os.path.join(HERE, "..", "public", "audio", FILM["id"] + ".wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote", os.path.normpath(out), f"{DUR}s")
