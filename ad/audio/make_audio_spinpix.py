"""Builds public/audio/<id>.wav for the SpinPix UK videos: a bouncy 120 bpm party beat, sound effects
(camera shutters, flashes, whooshes, confetti pops, UI taps) and the voiceover in vo/<id>/.
Every effect is timed from the marks in src/spinpix/spinpix.json, the same ones the animation uses.
Usage: python make_audio_spinpix.py [id | all]   (needs numpy + scipy)"""
import json, os, sys, wave
import numpy as np
from scipy.signal import butter, lfilter, resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
FILMS = json.load(open(os.path.join(HERE, "..", "src", "spinpix", "spinpix.json")))
SR = 44100
DUR = 15.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM


def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def hann(n): return np.sin(np.linspace(0, np.pi, n)) ** 2


class Mix:
    def __init__(self, seed):
        self.music = np.zeros(N); self.sfx = np.zeros(N); self.vo = np.zeros(N)
        self.rng = np.random.default_rng(seed)

    def noise(self, dur): return self.rng.standard_normal(int(SR * dur))

    def put(self, buf, x, t0, gain=1.0):
        i = int(t0 * SR)
        if i >= N or i + len(x) <= 0: return
        if i < 0: x = x[-i:]; i = 0
        x = x[: N - i]
        buf[i: i + len(x)] += x * gain

    def tone(self, f, dur, a=0.005, d=0.2, shape="sine"):
        n = int(SR * dur); t = np.arange(n) / SR
        ph = 2 * np.pi * f * t if np.isscalar(f) else 2 * np.pi * np.cumsum(f[:n]) / SR
        s = np.sin(ph) if shape == "sine" else (2 * ((ph / (2 * np.pi)) % 1) - 1) if shape == "saw" else np.sign(np.sin(ph))
        return s * env(n, a, d)

    # ---------------- instruments ----------------
    def kick(self, t, g=0.75):
        n = int(SR * 0.35)
        f = np.concatenate([np.linspace(160, 50, int(SR * 0.09)), np.full(n - int(SR * 0.09), 50.0)])
        x = self.tone(f, 0.35, 0.001, 0.13)
        x[: int(SR * 0.004)] += hp(self.noise(0.004), 2000) * 0.4
        self.put(self.music, np.tanh(x * 1.6), t, g)

    def clap(self, t, g=0.3):
        x = np.zeros(int(SR * 0.25))
        for k, o in enumerate((0, 0.011, 0.022)):
            b = bp(self.noise(0.25), 900, 4200) * env(int(SR * 0.25), 0.001, 0.012 if k < 2 else 0.09)
            x[int(o * SR):] += b[: len(x) - int(o * SR)]
        self.put(self.music, x, t, g)

    def hat(self, t, g=0.07, open_=False):
        self.put(self.music, hp(self.noise(0.2), 7500) * env(int(SR * 0.2), 0.0005, 0.07 if open_ else 0.018), t, g)

    def bass(self, t, n, dur=0.22, g=0.3):
        f = midi(n)
        x = self.tone(f, dur, 0.003, dur * 0.7, "saw") + 0.6 * self.tone(f / 2, dur, 0.003, dur * 0.7, "sine")
        self.put(self.music, lp(x, 900), t, g)

    def stab(self, t, notes, dur=0.3, g=0.06, bright=4200):
        x = sum(self.tone(midi(n) * (1 + d), dur, 0.003, dur * 0.45, "saw") for n in notes for d in (-0.004, 0.004))
        self.put(self.music, lp(x, bright), t, g)

    def pad(self, t, notes, dur, g=0.03, bright=2600):
        x = sum(self.tone(midi(n) * (1 + d), dur, dur * 0.3, dur * 1.2, "saw") for n in notes for d in (-0.006, 0, 0.006))
        self.put(self.music, lp(x, bright) * hann(len(x)) ** 0.3, t, g)

    def pluck(self, t, n, g=0.07, d=0.14):
        f = midi(n); tt = np.arange(int(SR * 0.4)) / SR
        x = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt) + 0.15 * np.sin(6 * np.pi * f * tt)
        self.put(self.music, x * env(len(tt), 0.002, d), t, g)

    # ---------------- sound effects ----------------
    def click(self, t, g=0.25):
        self.put(self.sfx, hp(self.noise(0.008), 2500) * env(int(SR * 0.008), 0.0003, 0.002), t, g)

    def shutter(self, t, g=0.5):
        """camera shutter: sharp click, mirror thunk, second click"""
        self.click(t, g)
        self.put(self.sfx, bp(self.noise(0.05), 700, 3000) * env(int(SR * 0.05), 0.001, 0.012), t + 0.012, g * 0.8)
        self.click(t + 0.06, g * 0.7)
        self.put(self.sfx, bp(self.noise(0.03), 1500, 5000) * env(int(SR * 0.03), 0.001, 0.008), t + 0.065, g * 0.5)

    def flash(self, t, g=0.18):
        """flash: rising charge whine then a bright 'fwip'"""
        n = int(SR * 0.25)
        self.put(self.sfx, self.tone(np.linspace(2500, 6500, n), 0.25, 0.2, 0.08) * np.linspace(0, 1, n), t - 0.25, g * 0.3)
        self.put(self.sfx, hp(self.noise(0.18), 3000) * env(int(SR * 0.18), 0.001, 0.05), t, g)

    def whoosh(self, t, dur=0.5, lo=300, hi=6000, g=0.3):
        n = int(SR * dur)
        x = self.noise(dur)
        sweep = np.linspace(lo, hi, n)
        y = np.zeros(n)
        for k in range(0, n, 2048):  # sweep a band-pass through the noise
            c = sweep[min(k, n - 1)]
            y[k:k + 2048] = bp(x[max(0, k - 512):k + 2048], max(80, c * 0.5), min(SR / 2 - 200, c * 1.6))[-len(y[k:k + 2048]):]
        self.put(self.sfx, y * hann(n), t - dur * 0.6, g)

    def riser(self, t_end, dur, g=0.25):
        n = int(SR * dur)
        self.put(self.sfx, hp(self.noise(dur), 1500) * np.linspace(0, 1, n) ** 2.5, t_end - dur, g)
        self.put(self.sfx, self.tone(np.geomspace(200, 1600, n), dur, dur * 0.7, 9, "saw") * np.linspace(0, 1, n) ** 2 * 0.3, t_end - dur, g * 0.6)

    def thud(self, t, g=0.6, f0=140, f1=40):
        n1 = int(SR * 0.12)
        f = np.concatenate([np.linspace(f0, f1, n1), np.full(int(SR * 0.5), float(f1))])
        self.put(self.sfx, self.tone(f, 0.62, 0.001, 0.18), t, g)

    def impact(self, t, g=0.8):
        self.thud(t, g, 150, 36)
        self.put(self.sfx, lp(self.noise(1.4), 7000) * env(int(SR * 1.4), 0.002, 0.35), t, g * 0.35)

    def pop(self, t, f0=500, f1=1400, g=0.18):
        self.put(self.sfx, self.tone(np.linspace(f0, f1, int(SR * 0.06)), 0.06, 0.001, 0.025), t, g)

    def ping(self, t, n, g=0.12, d=0.3):
        f = midi(n); tt = np.arange(int(SR * 1.2)) / SR
        x = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2.76 * f * tt) * np.exp(-tt / 0.15) + 0.2 * np.sin(2 * np.pi * 5.4 * f * tt) * np.exp(-tt / 0.06)
        self.put(self.sfx, x * env(len(tt), 0.002, d), t, g)

    def sparkle(self, t, g=0.07, n=7, base=84):
        for k in range(n):
            self.ping(t + k * 0.045, base + [0, 4, 7, 12, 16, 19, 24][k % 7], g, 0.25)

    def confetti(self, t, g=0.5, rustle=1.6, slow=1.0):
        """party popper: crack + thump, then paper rustle as it falls"""
        self.put(self.sfx, bp(self.noise(0.06), 500, 5000) * env(int(SR * 0.06), 0.0005, 0.012), t, g)
        self.thud(t, g * 0.5, 220, 70)
        n = int(SR * rustle)
        dens = (self.rng.random(n) < 0.004 / slow).astype(float)
        crackle = lfilter([1], [1, -0.6], dens * self.rng.standard_normal(n))
        r = hp(crackle + 0.15 * self.noise(rustle), 2500 if slow == 1 else 1200)
        self.put(self.sfx, r * np.exp(-np.arange(n) / (SR * rustle * 0.45)) * np.minimum(np.arange(n) / (SR * 0.05), 1), t + 0.03, g * 0.35)

    def tap(self, t, g=0.3):
        self.put(self.sfx, self.tone(np.linspace(1800, 900, int(SR * 0.03)), 0.03, 0.0005, 0.01), t, g)
        self.click(t, g * 0.4)

    def success(self, t, g=0.14):
        for k, n in enumerate((76, 80, 83, 88)):
            self.ping(t + k * 0.08, n, g, 0.35)

    def neon_buzz(self, t, dur=0.4, g=0.08):
        n = int(SR * dur); tt = np.arange(n) / SR
        x = np.sign(np.sin(2 * np.pi * 100 * tt)) * (0.5 + 0.5 * (self.rng.random(n) > 0.3))
        self.put(self.sfx, lp(x, 1800) * np.exp(-tt / (dur * 0.5)), t, g)

    def vwoom(self, t, g=0.3, down=True):
        """tape slow-down / speed-up for slow motion"""
        n = int(SR * 0.7)
        f = np.geomspace(300, 60, n) if down else np.geomspace(60, 300, n)
        self.put(self.sfx, lp(self.tone(f, 0.7, 0.01, 0.5, "saw"), 1200), t, g)

    # ---------------- the beat ----------------
    PROG = [(52, (64, 68, 71)), (59, (63, 66, 71)), (49, (61, 64, 68)), (57, (61, 64, 69))]  # E B C#m A

    def beat(self, start, end, intensity=lambda t: 1.0, halftime=lambda t: False):
        """four-on-the-floor party beat from start to end; intensity 0..1 thins it out (0.3 = filtered intro)"""
        k = 0
        while True:
            t = start + k * BEAT
            if t >= end - 0.01: break
            bar, b = divmod(k, 4)
            root, ch = self.PROG[(bar // 2) % 4]
            it = intensity(t)
            if halftime(t):
                if b == 0: self.kick(t, 0.6); self.bass(t, root - 12, BEAT * 2, 0.25)
                if b == 2: self.clap(t, 0.25)
                if b == 0: self.pad(t, ch, BEAT * 4.2, 0.035, 900)
                k += 1; continue
            if it >= 0.5 or b == 0: self.kick(t, 0.7 * max(it, 0.6))
            if it >= 0.6 and b in (1, 3): self.clap(t, 0.28)
            if it >= 0.3:
                self.hat(t + BEAT / 2, 0.08 * it, open_=True)
            if it >= 0.8:
                self.hat(t + BEAT / 4, 0.035); self.hat(t + 3 * BEAT / 4, 0.035)
            # bouncy octave bass on the off-beats
            if it >= 0.4:
                self.bass(t + BEAT / 2, root - 12 + (12 if b % 2 else 0), 0.2, 0.26 * it)
            # chord stabs on the "and"s, pluck arpeggio on top
            if it >= 0.5:
                self.stab(t + BEAT / 2, ch, 0.22, 0.05 * it, 2000 + 3500 * it)
            else:
                if b == 0: self.pad(t, ch, BEAT * 4.1, 0.03, 900 + 1200 * it)
            if it >= 0.9:
                for s in range(2):
                    self.pluck(t + s * BEAT / 2 + BEAT / 4, ch[(k * 2 + s) % 3] + 12, 0.045)
            k += 1

    # ---------------- voice ----------------
    def voice(self, fid, starts):
        for key, t0 in starts.items():
            path = os.path.join(HERE, "vo", fid, key + ".wav")
            with wave.open(path) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
                sr = w.getframerate()
            x = hp(resample_poly(x, SR, sr), 100)
            x = np.tanh(x * 2.5) / np.tanh(2.5)                # a little bite so it sits on top of the beat
            x = x / np.max(np.abs(x)) * 0.85
            n = int(SR * 0.22)
            ir = lp(self.rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.05)), 6000)
            x = x + 0.1 * np.convolve(x, ir / np.sqrt(np.sum(ir ** 2)))[: len(x)]
            self.put(self.vo, x, t0)

    def write(self, fid):
        T = np.arange(N) / SR
        # voice envelope: opens fast, lets go slowly, so the music stays down for the whole line
        talk = (lp(np.abs(self.vo), 12) > 0.01).astype(float)
        hold = int(SR * 0.12)
        talk = np.convolve(talk, np.ones(hold), "same") > 0
        e = np.clip(lp(talk.astype(float), 6), 0, 1)
        # sidechain pump from the kick feel (every beat) plus ducking under the voice
        pump = 1 - 0.25 * np.exp(-((T % BEAT) / 0.09))
        music = self.music * pump * (1 - 0.68 * e)
        # take the vocal range out of the music while she talks, so the words cut through
        scoop = music - 0.6 * e * bp(music, 900, 4000)
        mix = scoop * 0.8 + self.sfx * (1 - 0.55 * e) + self.vo * 1.6
        mix *= np.minimum(T / 0.05, 1) * np.minimum((DUR - T) / 0.6, 1)
        mix = np.tanh(mix * 0.9)
        mix = mix / np.max(np.abs(mix)) * 0.84
        wide = np.roll(scoop, int(SR * 0.012)) - scoop
        st = np.stack([mix - 0.1 * wide, mix + 0.1 * wide], 1)
        st = st / max(1, np.max(np.abs(st)) / 0.84)
        out = os.path.join(HERE, "..", "public", "audio", fid + ".wav")
        with wave.open(out, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((st * 32767).astype(np.int16).tobytes())
        print("wrote", os.path.normpath(out))


# ================= the four videos =================
def spin360(m, M):
    m.beat(0.0, M["spin"], intensity=lambda t: 0.3 + 0.2 * (t / M["spin"]))                       # filtered intro
    m.beat(M["spin"], DUR, intensity=lambda t: 0.85 if t < M["slowmo"] else 1.0,
           halftime=lambda t: M["slowmo"] <= t < M["slowEnd"] + 0.4)
    m.whoosh(M["drop"] + 0.05, 0.5, 4000, 300, 0.35); m.thud(M["drop"] + 0.08, 0.7)
    m.flash(M["pose"]); m.shutter(M["pose"], 0.55)
    m.riser(M["spin"], 0.8, 0.22); m.impact(M["spin"], 0.5)
    for k in range(5):                                                                              # the orbit
        m.whoosh(M["spin"] + 0.45 + k * 0.5, 0.7, 250, 3000, 0.16)
    m.vwoom(M["slowmo"] - 0.1, 0.35)
    m.flash(M["slowmo"], 0.15); m.shutter(M["slowmo"], 0.4)
    m.confetti(M["slowmo"] + 0.02, 0.6, rustle=3.0, slow=3)
    m.pad(M["slowmo"], (64, 71, 76, 80), M["slowEnd"] - M["slowmo"], 0.035, 1800)
    m.riser(M["logo"], 1.0, 0.3); m.vwoom(M["slowEnd"], 0.2, down=False)
    m.impact(M["logo"], 0.85); m.flash(M["logo"], 0.12); m.shutter(M["logo"] + 0.02, 0.4); m.sparkle(M["logo"] + 0.1)
    m.ping(M["tagline"], 83, 0.1); m.neon_buzz(M["fun"]); m.pop(M["fun"], 400, 1200, 0.2); m.sparkle(M["fun"] + 0.1, 0.06)
    m.pop(M["cta"], 500, 1500, 0.2); m.ping(M["cta"] + 0.05, 88, 0.12)

def quiz(m, M):
    m.beat(0.0, 2.6, intensity=lambda t: 0.45)
    m.beat(2.6 - (2.6 % BEAT) + 0, DUR, intensity=lambda t: 0.75 if t < M["cal"] else (0.6 if t < M["free"] else 1.0))
    m.whoosh(0.35, 0.6, 3000, 300, 0.25)
    for t in (M["tapWed"], M["tapProm"], M["tapDate"], M["press"]): m.tap(t, 0.35)
    for t in (M["resWed"] - 0.25, M["back"] - 0.25, M["resProm"] - 0.25, M["cal"] - 0.25): m.whoosh(t + 0.3, 0.35, 1200, 6000, 0.15)
    m.sparkle(M["resWed"], 0.08); m.shutter(M["resWed"] + 0.05, 0.3)
    m.sparkle(M["resProm"], 0.08, base=86); m.shutter(M["resProm"] + 0.05, 0.3)
    m.riser(M["free"], 0.5, 0.15)
    m.success(M["free"], 0.16); m.confetti(M["free"], 0.45)
    m.whoosh(M["quote"], 0.6, 300, 5000, 0.3); m.impact(M["quote"] + 0.05, 0.5); m.sparkle(M["quote"] + 0.1, 0.06)
    m.confetti(M["press"] + 0.03, 0.45); m.ping(M["press"] + 0.05, 88, 0.12)

def montage(m, M):
    cuts = M["cuts"]
    m.riser(cuts[0], 0.5, 0.25)
    m.beat(cuts[0], M["end"], intensity=lambda t: 1.0)
    m.beat(M["end"], DUR, intensity=lambda t: 0.9 if t < M["cta"] else 1.0)
    for i, c in enumerate(cuts):
        # cut sounds land just ahead of the cut, so they don't mask the first consonant of each word
        m.whoosh(c - 0.05, 0.3, 600, 7000, 0.14)
        if i < 4: m.shutter(c - 0.07, 0.4); m.flash(c - 0.04, 0.1)
        else: m.pop(c - 0.06, 400, 1300, 0.13)
    m.confetti(cuts[3] + BEAT, 0.3, 1.0)
    m.sparkle(cuts[4] + 0.6, 0.05)             # magic mirror shimmer
    m.ping(cuts[5] + 0.1, 91, 0.1)             # selfie pod ring light
    m.whoosh(cuts[6] + 0.3, 0.6, 200, 2500, 0.2)  # 360 spin
    m.shutter(cuts[7] + 0.15, 0.4); m.shutter(cuts[7] + 0.45, 0.3)  # classic booth strip
    for k in range(7): m.pop(cuts[8] + k * 0.06, 300 + 80 * k, 900 + 150 * k, 0.12)  # props hop in
    m.impact(M["end"], 0.8); m.flash(M["end"], 0.12); m.sparkle(M["end"] + 0.1)
    m.neon_buzz(M["end"] + 1.5); m.pop(M["end"] + 1.5, 400, 1200, 0.18)
    m.pop(M["cta"] - 0.06, 500, 1500, 0.16); m.ping(M["cta"] + 0.9, 88, 0.1)

def qr(m, M):
    m.beat(0.0, M["card"] + 0.2, intensity=lambda t: 0.85 if t > 1.0 else 0.5)
    m.beat(M["card"] + 0.2 - ((M["card"] + 0.2) % BEAT) + BEAT, M["price"], intensity=lambda t: 0.6 if t < M["fly"][0] else 0.9)
    m.beat(M["price"], DUR, intensity=lambda t: 1.0)
    for t in M["phones"]: m.pop(t, 300, 800, 0.1)
    for t in M["flashes"]: m.flash(t, 0.12); m.shutter(t, 0.35)
    m.whoosh(M["card"], 0.6, 4000, 400, 0.28); m.thud(M["card"] + 0.15, 0.4)
    m.whoosh(M["scan"] + 0.1, 0.5, 300, 3000, 0.2)
    for k in range(3): m.ping(M["scan"] + 0.15 + k * 0.15, 93, 0.04, 0.05)                      # scanner beeps
    m.success(M["lock"], 0.12); m.pop(M["open"], 500, 1300, 0.16)
    for k, t in enumerate(M["fly"]):
        m.whoosh(t + 0.35, 0.45, 800, 7000, 0.12); m.ping(t + 0.5, [76, 80, 83, 88, 92, 95][k], 0.08, 0.2)
    for k in range(15): m.pop(M["grid"] + (k % 3) * 0.05 + (k // 3) * 0.08, 600, 1500, 0.06)
    m.riser(M["price"], 0.7, 0.25); m.impact(M["price"], 0.85); m.confetti(M["price"] + 0.02, 0.55)
    m.success(M["price"] + 0.1, 0.12); m.sparkle(M["price"] + 0.8, 0.05)
    m.pop(M["cta"], 500, 1500, 0.2); m.ping(M["cta"] + 0.05, 88, 0.12)

BUILD = {"spinpix-360": spin360, "spinpix-quiz": quiz, "spinpix-montage": montage, "spinpix-qr": qr}

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for i, fl in enumerate(FILMS):
        if which not in ("all", fl["id"]): continue
        m = Mix(seed=11 + i)
        BUILD[fl["id"]](m, fl["marks"])
        m.voice(fl["id"], fl["voiceStart"])
        m.write(fl["id"])
