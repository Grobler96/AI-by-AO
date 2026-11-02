"""Builds public/audio/night-shift.wav: a calmer, cinematic score + sound effects + the voiceover in vo/night-shift/.
Timings match src/PhoneStory.tsx (30fps, 18.5s). Run: python make_audio_story.py   (needs numpy + scipy)"""
import json, os, wave
HERE = os.path.dirname(os.path.abspath(__file__))
STORY = json.load(open(os.path.join(HERE, "..", "src", "stories.json")))[0]
DURS = json.load(open(os.path.join(HERE, "..", "src", "voice-durations.json")))[STORY["id"]]
import numpy as np
from scipy.signal import lfilter, butter, resample_poly

SR = 44100
DUR = 18.5
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

# ---------- score: A. the quiet night (0 - 8.5s) ----------
ambience = lp(noise(DUR), 400) * 0.02                                   # room tone
put(music, ambience * np.minimum(T / 1.0, 1), 0, 1.0)
for n, t0 in ((45, 0.0), (52, 0.0)):                                    # low A + E drone
    put(music, lp(tone(midi(n), 8.6, 1.5, 4.0, "saw"), 260), t0, 0.16)
for k, t0 in enumerate(np.arange(0.5, 6.9, 0.9)):                       # clock-like soft ticks
    put(sfx, hp(noise(0.02), 3000) * env(int(SR * 0.02), 0.0005, 0.006), t0, 0.05)
notes = [69, 76, 72, 79, 69, 74, 72, 76]
for k, t0 in enumerate(np.arange(0.9, 6.9, 0.8)):                        # sparse minor plucks, getting busier
    put(music, pluck(notes[k % len(notes)], 1.4, 0.4), t0, 0.05 + 0.012 * k)
for k, t0 in enumerate(np.arange(4.0, 6.9, 0.55)):                       # heartbeat builds the tension
    put(music, tone(np.linspace(90, 45, int(SR * .2)), 0.2, 0.002, 0.07), t0, 0.25 + 0.06 * k)
    put(music, tone(np.linspace(80, 42, int(SR * .2)), 0.2, 0.002, 0.07), t0 + 0.2, 0.18 + 0.05 * k)
rl = int(SR * 2.9)
put(sfx, hp(noise(2.9), 1500) * np.linspace(0, 1, rl) ** 2.4, 4.0, 0.12)   # riser

# phone arrives: wake glow, then a buzz + two-note ping per notification
put(sfx, tone(np.linspace(260, 880, int(SR * 0.9)), 0.9, 0.3, 0.5), 0.45, 0.05)
for k, t0 in enumerate((2.4, 3.2, 4.0, 4.8, 5.6)):
    for off in (0.0, 0.17):
        tt = np.arange(int(SR * 0.11)) / SR
        buz = np.sign(np.sin(2 * np.pi * 150 * tt)) * 0.5 + np.sin(2 * np.pi * 75 * tt)
        put(sfx, lp(buz, 700) * np.minimum(tt / 0.01, 1) * np.minimum((0.11 - tt) / 0.02, 1), t0 + off, 0.32)
    put(sfx, add(bell(76 + k, 0.8, 0.14), 0.7 * bell(83 + k, 0.8, 0.14)), t0 + 0.04, 0.12)

# ---------- B. asleep (6.9 - 8.5s): everything drops away ----------
put(sfx, tone(np.linspace(520, 130, int(SR * 1.4)), 1.4, 0.05, 0.8), 6.9, 0.12)
put(sfx, lp(noise(1.5), 900) * np.sin(np.linspace(0, np.pi, int(SR * 1.5))) ** 2, 6.9, 0.07)   # a slow breath out
put(sfx, lp(tone(midi(40), 1.5, 0.2, 2.0), 300), 6.9, 0.2)

# ---------- C. the AI wakes up (8.5 - 14.9s): warm beat, bright chords ----------
rl = int(SR * 0.35)
put(sfx, hp(noise(0.35), 2500) * np.linspace(0, 1, rl) ** 2, 8.15, 0.2)                     # inhale
sl = int(SR * 1.0)
put(sfx, bp(noise(1.0), 300, 7000) * np.sin(np.linspace(0, np.pi, sl)) ** 2, 8.5, 0.45)      # the sweep
for n in (60, 64, 67, 74):                                                                  # chord swell
    put(music, lp(tone(midi(n), 2.6, 0.12, 1.2, "saw"), 3200), 8.5, 0.07)
put(sfx, tone(np.concatenate([np.linspace(110, 40, int(SR * .3)), np.full(int(SR * 1.0), 40.)]), 1.3, 0.002, 0.45), 8.5, 0.7)

bpm = 100; beat = 60 / bpm; bar = 4 * beat
prog = [(57, (57, 60, 64)), (53, (53, 57, 60)), (48, (48, 55, 60)), (55, (55, 59, 62)), (57, (57, 60, 64))]   # Am F C G Am
for b, (root, ch) in enumerate(prog):
    t0 = 8.5 + b * bar
    if t0 >= DUR: break
    for n in ch:
        for det in (-0.12, 0.0, 0.12):
            put(music, lp(tone(midi(n) * (1 + det * 0.01), bar * 1.1, 0.25, 1.3, "saw"), 2600), t0, 0.035)
    for s_ in range(8):
        put(music, lp(tone(midi(root - 12), 0.26, 0.004, 0.12, "saw"), 380), t0 + s_ * beat / 2, 0.24)
    for s_ in range(8):
        nn = ch[s_ % 3] + 12 * (1 + (s_ // 3) % 2)
        put(music, pluck(nn, 0.5, 0.18, 4500), t0 + s_ * beat / 2 + beat / 4, 0.07)
def kick(): return tone(np.concatenate([np.linspace(140, 46, int(SR * .12)), np.full(int(SR * .2), 46.)]), 0.32, 0.001, 0.09)
def hat(o=False): return hp(noise(0.12), 7000) * env(int(SR * 0.12), 0.0005, 0.05 if o else 0.015)
def clap(): return bp(noise(0.2), 1000, 3500) * env(int(SR * 0.2), 0.001, 0.07)
for k in range(int((17.6 - 8.5) / beat)):
    t = 8.5 + k * beat
    put(music, kick(), t, 0.55)
    if k >= 2: put(music, hat(True), t + beat / 2, 0.08)
    if k % 2 == 1 and k >= 3: put(music, clap(), t, 0.22)

# each notification gets handled: card flip + rising chime
for k, t0 in enumerate((9.3, 9.75, 10.2, 10.65, 11.1)):
    put(sfx, bp(noise(0.18), 500, 6000) * np.sin(np.linspace(0, np.pi, int(SR * 0.18))) ** 2, t0, 0.35)
    for j, n in enumerate((84 + [0, 2, 4, 7, 9][k], 91 + [0, 2, 4, 7, 9][k])):
        put(sfx, bell(n, 1.0, 0.25), t0 + 0.12 + j * 0.07, 0.13)

# ---------- D. morning (12.4 - 14.9s) ----------
ticks = 12.4
while ticks < 13.5:
    put(sfx, hp(noise(0.015), 2500) * env(int(SR * 0.015), 0.0005, 0.005), ticks, 0.18)
    ticks += max(0.025, 0.24 * (1 - (ticks - 12.4) / 1.1) ** 1.6 + 0.025)
tl = int(SR * 1.1)
put(sfx, tone(np.linspace(180, 2200, tl), 1.1, 0.2, 2.0) * np.linspace(0.2, 1, tl) ** 2, 12.4, 0.1)
put(sfx, hp(noise(1.1), 2000) * np.linspace(0, 1, tl) ** 3, 12.4, 0.12)
for k, n in enumerate((79, 84, 88, 91, 96)):                              # sunrise alarm chime
    put(sfx, bell(n, 1.8, 0.6), 13.5 + k * 0.1, 0.15)
for k, t0 in enumerate((13.7, 14.0, 14.3, 14.6)):                         # booked-job pings
    put(sfx, add(bell(88 + 2 * k, 0.9, 0.2), 0.5 * bell(95 + 2 * k, 0.9, 0.2)), t0, 0.15)

# ---------- E. the brand (14.9s on) ----------
for k, n in enumerate((72, 76, 79, 84, 88, 91)):
    put(sfx, bell(n, 2.2, 0.6), 14.9 + k * 0.06, 0.12)
put(sfx, bp(noise(0.8), 1500, 9000) * np.sin(np.linspace(0, np.pi, int(SR * 0.8))) ** 2, 14.8, 0.22)
put(sfx, add(bell(84, 1.6, 0.5), 0.5 * bell(96, 1.2, 0.3)), 17.2, 0.16)
for n in (60, 64, 67, 72):
    put(music, lp(tone(midi(n), 1.4, 0.003, 0.5, "saw"), 3500), 17.6, 0.07)

# duck the score a bit more during the quiet, "asleep" beat
dip = np.interp(T, [6.8, 7.2, 8.3, 8.5], [1.0, 0.45, 0.45, 1.0])
music *= dip

# ---------- voiceover ----------
def load_vo(name):
    with wave.open(os.path.join(HERE, "vo", STORY["id"], name + ".wav")) as w:
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
for key, t0 in STORY["voiceStart"].items():
    put(vo, load_vo(key), t0)

e = lp(np.abs(vo), 6)
e = np.clip(e / (np.percentile(e, 98) + 1e-9), 0, 1)
duck = 1 - 0.5 * e
mix = music * duck * 0.95 + sfx * (1 - 0.25 * e) + vo * 1.15
mix *= np.minimum(T / 0.4, 1) * np.minimum((DUR - T) / 1.0, 1)
mix = np.tanh(mix * 1.1)
mix = mix / np.max(np.abs(mix)) * 0.89

wide = np.roll(music * duck * 0.95, int(SR * 0.011)) - music * duck * 0.95
st = np.stack([mix - 0.12 * wide, mix + 0.12 * wide], 1)
st = st / max(1, np.max(np.abs(st)) / 0.89)

out = os.path.join(HERE, "..", "public", "audio", STORY["id"] + ".wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote", os.path.normpath(out), f"{DUR}s")
