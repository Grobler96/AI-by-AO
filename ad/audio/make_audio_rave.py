"""Builds public/audio/rave-leeds.wav for the United Sounds rave advert (src/rave/rave.json).
Intro riser -> bassline room (138 bpm, wobble bass, 2-step) -> house room (126 bpm, piano stabs) -> harder room (170 bpm, hoover stabs, distorted kick)
-> finale (140 bpm, everything together). Effects are timed from the marks in rave.json, the same ones the animation uses.
Reuses the mixer and instruments from make_audio_spinpix.py.   Usage: python make_audio_rave.py   (needs numpy + scipy)"""
import json, os, wave
import numpy as np
import make_audio_spinpix as sp
from make_audio_spinpix import SR, bp, env, hann, hp, lp, midi

HERE = sp.HERE
FILM = json.load(open(os.path.join(HERE, "..", "src", "rave", "rave.json")))[0]
M, BPM = FILM["marks"], FILM["bpm"]
DUR = float(FILM["seconds"])
sp.DUR = DUR
sp.N = int(SR * DUR)
N = sp.N


class RaveMix(sp.Mix):
    def __init__(self, seed):
        super().__init__(seed)
        self.kicks = []          # every kick time, for the sidechain pump

    def kick(self, t, g=0.75):
        self.kicks.append(t); super().kick(t, g)

    def hardkick(self, t, g=0.8):
        """distorted hardcore kick"""
        self.kicks.append(t)
        n1 = int(SR * 0.07)
        f = np.concatenate([np.linspace(260, 52, n1), np.full(int(SR * 0.3), 52.0)])
        x = np.tanh(self.tone(f, 0.37, 0.001, 0.16) * 3.5)
        x[: int(SR * 0.004)] += hp(self.noise(0.004), 1500) * 0.5
        self.put(self.music, x, t, g)

    def snare(self, t, g=0.3):
        n = int(SR * 0.2)
        x = bp(self.noise(0.2), 1500, 9000) * env(n, 0.001, 0.07) + 0.6 * self.tone(190, 0.2, 0.001, 0.05)
        self.put(self.music, x, t, g)

    def wobble(self, t, n, dur, rate, g=0.32):
        """bassline wobble: saw + sub, low-pass opened and closed by an LFO"""
        f = midi(n); nn = int(SR * dur); tt = np.arange(nn) / SR
        x = self.tone(f, dur, 0.004, dur * 0.8, "saw") + self.tone(f * 1.005, dur, 0.004, dur * 0.8, "saw")
        m = 0.5 + 0.5 * np.sin(2 * np.pi * rate * tt - np.pi / 2)
        y = lp(x, 260) * (1 - m) + lp(x, 2600) * m
        y = np.tanh(y * 1.8) + 0.8 * self.tone(f / 2, dur, 0.004, dur * 0.8)
        self.put(self.music, y * np.minimum(tt / 0.004, 1) * np.minimum((dur - tt) / 0.02, 1), t, g)

    def hoover(self, t, n, dur=0.3, g=0.1):
        """the classic hardcore 'hoover': stacked detuned saws that swoop down onto the note"""
        nn = int(SR * dur); tt = np.arange(nn) / SR
        f = midi(n) * (1 + 0.55 * np.exp(-tt / 0.045))
        x = sum(self.tone(f * (1 + d), dur, 0.003, dur * 0.7, "saw") for d in (-0.014, -0.007, 0.0, 0.007, 0.014))
        self.put(self.music, np.tanh(lp(x, 3600) * 0.9), t, g)

    def piano(self, t, notes, dur=0.28, g=0.06):
        """rave piano stab"""
        x = sum(self.tone(midi(nn), dur, 0.002, dur * 0.5, "sine") + 0.4 * self.tone(midi(nn) * 2, dur, 0.002, dur * 0.25, "sine") + 0.25 * self.tone(midi(nn), dur, 0.002, dur * 0.3, "saw") for nn in notes)
        self.put(self.music, lp(x, 4500), t, g)

    def airhorn(self, t, g=0.16):
        for k, (o, d) in enumerate(((0, 0.22), (0.3, 0.22), (0.6, 0.9))):
            nn = int(SR * d); tt = np.arange(nn) / SR
            x = 0
            for note in (69, 73, 76):
                f = midi(note) * (1 + 0.008 * np.sin(2 * np.pi * 6 * tt))
                x = x + self.tone(f, d, 0.01, d * 0.9, "saw")
            self.put(self.sfx, lp(x, 3500) * np.minimum((d - tt) / 0.05, 1), t + o, g)

    def zap(self, t, g=0.12):
        """laser zap"""
        n = int(SR * 0.25)
        self.put(self.sfx, self.tone(np.geomspace(5000, 300, n), 0.25, 0.001, 0.08, "saw") * 0.5, t, g)

    def write(self, fid):
        T = np.arange(N) / SR
        talk = (lp(np.abs(self.vo), 12) > 0.01).astype(float)
        talk = np.convolve(talk, np.ones(int(SR * 0.12)), "same") > 0
        e = np.clip(lp(talk.astype(float), 6), 0, 1)
        pump = np.ones(N)
        for kt in self.kicks:                      # sidechain: music dips on every kick at that section's own tempo
            i = int(kt * SR)
            if i >= N: continue
            seg = np.arange(min(int(SR * 0.25), N - i)) / SR
            pump[i: i + len(seg)] *= 1 - 0.28 * np.exp(-seg / 0.08)
        music = self.music * pump * (1 - 0.85 * e)
        scoop = music - 0.6 * e * bp(music, 900, 4000)
        mix = scoop * 0.75 + self.sfx * (1 - 0.75 * e) + self.vo * 2.2
        mix *= np.minimum(T / 0.03, 1) * np.minimum((DUR - T) / 0.5, 1)
        mix = np.tanh(mix * 0.95)
        mix = mix / np.max(np.abs(mix)) * 0.84
        wide = np.roll(scoop, int(SR * 0.012)) - scoop
        st = np.stack([mix - 0.1 * wide, mix + 0.1 * wide], 1)
        st = st / max(1, np.max(np.abs(st)) / 0.84)
        out = os.path.join(HERE, "..", "public", "audio", fid + ".wav")
        with wave.open(out, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((st * 32767).astype(np.int16).tobytes())
        print("wrote", os.path.normpath(out))


ROOTS = [33, 29, 31, 28]                      # A F G E (midi), the bassline / finale bass notes
AM, F, G = (57, 60, 64), (53, 57, 60), (55, 59, 62)
BASS_PAT = [(0, 3, 0), (3, 2, 0), (6, 2, 12), (8, 2, 0), (10, 3, 0), (13, 1, 7), (14, 2, 5)]   # (16th, length in 16ths, interval)
HOOVER_PAT = [0, 3, 6, 8, 11, 14]             # the 3-3-2 rhythm
HOOVER_NOTES = [69, 69, 72, 69, 67, 64]


def groove(m, kind, start, end, bpm):
    beat = 60 / bpm; s16 = beat / 4
    nbars = int(round((end - start) / (beat * 4)))
    for bar in range(nbars):
        b0 = start + bar * beat * 4
        root = ROOTS[bar % 4]
        last = bar == nbars - 1
        for i in range(16):
            t = b0 + i * s16
            if kind == "bass":
                if i in (0, 7, 10): m.kick(t, 0.78)
                if i in (4, 12): m.clap(t, 0.3)
                if i % 4 == 2: m.hat(t, 0.09, True)
                elif i % 2 == 0: m.hat(t, 0.04)
                else: m.hat(t + 0.1 * s16, 0.025)
                if i in (2, 5, 11): m.stab(t, AM if bar % 2 == 0 else F, 0.16, 0.05, 3000)
            elif kind == "house":
                if i % 4 == 0: m.kick(t, 0.8)
                if i in (4, 12): m.clap(t, 0.3)
                if i % 4 == 2: m.hat(t, 0.1, True)
                else: m.hat(t, 0.03)
                if i % 4 == 2: m.bass(t, root if (i // 4) % 2 == 0 else root + 12, s16 * 3, 0.3)
                if i in (0, 3, 6, 10, 12): m.piano(t, (57, 60, 64, 67) if bar % 2 == 0 else (53, 57, 60, 64), 0.3, 0.06)
            elif kind == "harder":
                if i % 4 == 0: m.hardkick(t, 0.85)
                if i in (4, 12): m.clap(t, 0.3)
                if i % 4 == 2: m.hat(t, 0.1, True); m.bass(t, root, s16 * 3, 0.3)
                elif i % 2 == 1: m.hat(t, 0.04)
                if i in HOOVER_PAT: m.hoover(t, HOOVER_NOTES[HOOVER_PAT.index(i)], s16 * 2.5, 0.09)
                if i in (0, 6, 12): m.piano(t, AM if bar % 2 == 0 else G, 0.22, 0.05)
                if last: m.snare(t, 0.1 + 0.3 * i / 15)                      # snare roll into the finale
            elif kind == "finale":
                if i % 4 == 0: m.kick(t, 0.85)
                if i in (4, 12): m.clap(t, 0.32)
                if i % 4 == 2: m.hat(t, 0.1, True)
                elif i % 2 == 0: m.hat(t, 0.035)
                for (pi, pl, iv) in BASS_PAT:
                    if pi == i: m.wobble(t, root + iv, s16 * pl * 0.95, bpm / 60 * 2, 0.26)
                if i in HOOVER_PAT: m.hoover(t, HOOVER_NOTES[HOOVER_PAT.index(i)], s16 * 2.5, 0.075)
                if i in (0, 3, 8, 11): m.piano(t, (AM, F, G, AM)[bar % 4], 0.22, 0.05)
        if kind == "bass":
            for (pi, pl, iv) in BASS_PAT:
                m.wobble(b0 + pi * s16, root + iv, s16 * pl * 0.95, bpm / 60 * 2, 0.34)


def build():
    m = RaveMix(seed=77)
    # ---- intro: dark drone, heartbeat kick, riser and an accelerating snare roll, then a beat of silence before the drop
    E1 = midi(28)
    m.drone(0.0, M["drop"] - 0.1, [E1, E1 * 1.5, E1 * 2.38], lambda t: np.clip(t / 2.5, 0, 1) * (1 - np.clip((t - (M["drop"] - 0.2)) / 0.1, 0, 1)), 0.12, 420)
    m.riser(M["drop"] - 0.1, 2.9, 0.34)
    for k in range(6): m.kick(1.2 + k * 0.42, 0.2 + 0.08 * k)
    t = 2.2; gap = 0.2
    while t < M["drop"] - 0.12:
        m.snare(t, 0.1 + 0.3 * (t - 2.2) / 0.9); t += gap; gap = max(0.05, gap * 0.82)
    m.zap(M["title"], 0.14); m.thud(M["title"], 0.5, 120, 40); m.zap(M["title"] + 0.3, 0.1)
    m.impact(M["event"], 0.45); m.sparkle(M["event"] + 0.05, 0.05)
    # ---- the drop and the three rooms
    m.impact(M["drop"], 0.95); m.flash(M["drop"], 0.2); m.whoosh(M["drop"] + 0.1, 0.6, 400, 7000, 0.25)
    groove(m, "bass", M["drop"], M["house"], BPM["bass"])
    groove(m, "house", M["house"], M["harder"], BPM["house"])
    groove(m, "harder", M["harder"], M["finale"], BPM["harder"])
    groove(m, "finale", M["finale"], DUR, BPM["finale"])
    for key in ("house", "harder"):                                  # each room change: riser in, impact + zap on the downbeat
        m.riser(M[key], 0.5, 0.18); m.impact(M[key], 0.55); m.zap(M[key], 0.12)
    m.airhorn(M["harder"] + 1.6, 0.14)
    m.riser(M["finale"], 1.0, 0.3); m.impact(M["finale"], 1.0); m.flash(M["finale"], 0.22); m.airhorn(M["finale"] + 0.05, 0.16)
    m.sparkle(M["finale"] + 0.1, 0.07, 7, 84)
    # lineup rows land on the beat in every room
    for key, nm, rows in (("drop", "bass", 4), ("house", "house", 4), ("harder", "harder", 4)):
        beat = 60 / BPM[nm]
        for i in range(rows):
            m.pop(M[key] + 0.35 + i * beat * (1.5 if nm == "harder" else 1), 600 + 80 * i, 1400 + 100 * i, 0.12)
    # finale details
    m.impact(M["date"], 0.5); m.thud(M["venue"], 0.5); m.pop(M["venue"] + 0.15, 500, 1500, 0.15)
    m.pop(M["times"], 500, 1500, 0.2); m.impact(M["times"], 0.3)
    m.pop(M["ticket"], 400, 1800, 0.25); m.sparkle(M["ticket"] + 0.05, 0.1, 7, 86); m.ping(M["ticket"] + 0.1, 91, 0.1, 0.5)
    m.pop(M["small"], 700, 1400, 0.1)
    m.voice(FILM["id"], FILM["voiceStart"])
    m.write(FILM["id"])


if __name__ == "__main__":
    build()
