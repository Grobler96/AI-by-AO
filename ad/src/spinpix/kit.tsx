import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame } from "remotion";
import { SP, chunky, glowBox, neon, round } from "../theme-spinpix";
import films from "./spinpix.json";
import voiceDurations from "../voice-durations.json";

/* Shared parts for the SpinPix UK videos: backdrop, neon type, wordmark, end card, captions, confetti, flashes. */

export const FPS = 30;
export const DURATION = 15 * FPS;
export const spinpixFilms = films;

export type Film = (typeof films)[number] & { caption?: Record<string, string>; captionOff?: string[]; marks: Record<string, unknown> };
export const film = (id: string) => (films.find((f) => f.id === id) ?? films[0]) as Film;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ez = Easing.bezier(0.76, 0, 0.24, 1);
export const outBack = Easing.out(Easing.back(1.7));
/** 0 -> 1 -> 0 window, in seconds */
export const win = (t: number, a: number, b: number, c: number, d: number) => interpolate(t, [a, b, c, d], [0, 1, 1, 0], clamp);
/** a spring that starts at `at` seconds */
export const pop = (f: number, at: number, damping = 11, stiffness = 140) => spring({ frame: f - at * FPS, fps: FPS, config: { damping, stiffness } });
export const useT = () => useCurrentFrame() / FPS;

/* ---------- atmosphere: dark stage, neon haze, bokeh, sparkles ---------- */
export const Stage: React.FC<{ drift?: number; beat?: number; children?: React.ReactNode }> = ({ drift = 0, beat = 0, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: SP.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 15% 20%, rgba(34,196,255,${0.22 + beat * 0.12}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 88% 70%, rgba(255,45,155,${0.26 + beat * 0.14}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(60% 35% at 50% 105%, rgba(155,77,255,.35), transparent 75%)" }} />
      <Lights />
      <Bokeh drift={drift} />
      {children}
      <Sparkles />
    </AbsoluteFill>
  );
};

/* sweeping stage light beams from the top corners, like the flyer */
const Lights: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.5 }}>
      {[0, 1, 2, 3].map((i) => {
        const left = i < 2;
        const a = (left ? 28 : -28) + Math.sin(f / 40 + i * 1.7) * 12 + (i % 2 ? 9 : -9);
        const c = i % 2 ? SP.pink : SP.blue;
        return <div key={i} style={{ position: "absolute", top: -200, left: left ? 60 + i * 60 : 960 - (i - 2) * 60, width: 90, height: 2400, transformOrigin: "50% 0", transform: `rotate(${a}deg)`, background: `linear-gradient(180deg, ${c}, transparent 70%)`, filter: "blur(22px)", opacity: 0.55 }} />;
      })}
    </AbsoluteFill>
  );
};

const Bokeh: React.FC<{ drift: number }> = ({ drift }) => {
  const f = useCurrentFrame();
  const cols = [SP.pink, SP.blue, SP.violet, SP.hot];
  return (
    <AbsoluteFill>
      {Array.from({ length: 26 }).map((_, i) => {
        const depth = 0.3 + random(`bd${i}`) * 0.7;
        const s = 30 + random(`bs${i}`) * 140 * depth;
        const x = ((random(`bx${i}`) * 1400 + drift * depth * 1.6 + 1400 * 50) % 1400) - 160;
        const y = (random(`by${i}`) * 2200 - f * (0.4 + depth * 0.9) + 2200 * 10) % 2200 - 140;
        const tw = 0.5 + 0.5 * Math.sin(f / (18 + random(`bt${i}`) * 30) + i);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle, ${cols[i % 4]}cc, ${cols[i % 4]}33 55%, transparent 70%)`, filter: `blur(${(1 - depth) * 8 + 2}px)`, opacity: (0.18 + 0.32 * tw) * depth }} />;
      })}
    </AbsoluteFill>
  );
};

export const Star: React.FC<{ x: number; y: number; size: number; color?: string; opacity?: number; rot?: number }> = ({ x, y, size, color = "#fff", opacity = 1, rot = 0 }) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity, transform: `rotate(${rot}deg)`, filter: `drop-shadow(0 0 ${size / 6}px ${color})`, overflow: "visible" }}>
    <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10Z" fill={color} />
  </svg>
);

const Sparkles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const period = 50 + Math.floor(random(`sp${i}`) * 60);
        const ph = ((f + random(`so${i}`) * period) % period) / period;
        const o = Math.sin(ph * Math.PI) ** 3;
        const cyc = Math.floor((f + random(`so${i}`) * period) / period);
        return <Star key={i} x={random(`sx${i}-${cyc}`) * 1080} y={random(`sy${i}-${cyc}`) * 1920} size={18 + random(`ss${i}`) * 34} color={i % 3 === 0 ? "#bfefff" : i % 3 === 1 ? "#ffd1ef" : "#fff"} opacity={o} rot={ph * 90} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- neon type ---------- */
/** Chunky neon headline. `on` = seconds it switches on (with a little flicker). */
export const Neon: React.FC<{ children: React.ReactNode; on: number; color?: string; size?: number; top: number; font?: string; off?: number; tilt?: number }> = ({ children, on, color = SP.pink, size = 120, top, font = chunky, off = 99, tilt = -4 }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < on || t > off) return null;
  const d = t - on;
  const flick = d < 0.35 ? [1, 0.2, 1, 0.4, 1, 1][Math.floor(d * 17) % 6] : 0.92 + 0.08 * Math.sin(f / 3);
  const s = pop(f, on, 9, 170);
  const out = interpolate(t, [off - 0.2, off], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily: font, fontSize: size, lineHeight: 1.05, color: "#fff", textShadow: neon(color, 1.1), opacity: flick * out, transform: `rotate(${tilt}deg) scale(${0.6 + 0.4 * Math.min(s, 1.1)})`, letterSpacing: 1 }}>
      {children}
    </div>
  );
};

/** Gradient-filled chunky text with a neon halo (the flyer's "QR CODES" look). */
export const GradText: React.FC<{ children: React.ReactNode; size: number; grad?: string; glow?: string; style?: React.CSSProperties }> = ({ children, size, grad = SP.grad, glow = SP.pink, style }) => (
  <span style={{ fontFamily: chunky, fontSize: size, lineHeight: 1, background: `${grad}`, WebkitBackgroundClip: "text", color: "transparent", filter: `drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px ${glow}) drop-shadow(0 6px 0 rgba(40,0,60,.9))`, ...style }}>{children}</span>
);

/* ---------- the SpinPix UK wordmark (type only, no logo artwork) ---------- */
export const Wordmark: React.FC<{ at: number; top: number; scale?: number }> = ({ at, top, scale = 1 }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 8, 130);
  const uk = pop(f, at + 0.25, 10, 160);
  if (f < at * FPS - 1) return null;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", transform: `scale(${scale * Math.min(s, 1.2)}) rotate(-5deg)`, opacity: Math.min(s, 1) }}>
      <GradText size={190}>SPINPIX</GradText>
      <div style={{ marginTop: -18, fontFamily: chunky, fontSize: 92, color: "#fff", textShadow: neon(SP.pink, 1), transform: `scale(${Math.min(uk, 1.15)})`, opacity: Math.min(uk, 1) }}>UK</div>
    </div>
  );
};

/* ---------- call-to-action pill ---------- */
export const Cta: React.FC<{ at: number; top: number; label: string; press?: number }> = ({ at, top, label, press }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = pop(f, at, 9, 150);
  if (t < at) return null;
  const pulse = 1 + 0.03 * Math.sin((t - at) * 7);
  const pressed = press !== undefined && t > press && t < press + 0.2 ? 0.92 : 1;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${Math.min(s, 1.15) * pulse * pressed})`, opacity: Math.min(s, 1) }}>
      <div style={{ fontFamily: round, fontWeight: 700, fontSize: 66, color: "#fff", padding: "30px 76px", borderRadius: 999, background: SP.gradPink, border: "4px solid #ffd1ef", boxShadow: `${glowBox(SP.pink, 1.3)}, 0 20px 60px rgba(0,0,0,.5)`, textShadow: "0 2px 0 rgba(80,0,50,.5)" }}>{label} →</div>
    </div>
  );
};

/** Phone number and website line under the CTA. */
export const Contact: React.FC<{ at: number; top: number }> = ({ at, top }) => {
  const t = useT();
  const o = interpolate(t, [at, at + 0.4], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: o, transform: `translateY(${(1 - o) * 30}px)` }}>
      <div style={{ fontFamily: round, fontWeight: 700, fontSize: 60, color: "#fff", textShadow: neon(SP.blue, 0.7) }}>📞 07985 732238</div>
      <div style={{ fontFamily: round, fontWeight: 600, fontSize: 42, color: SP.muted, marginTop: 8 }}>spinpixuk.co.uk · West Yorkshire · UK-wide</div>
    </div>
  );
};

/* ---------- photo flash + viewfinder ---------- */
export const Flashes: React.FC<{ at: number[]; strength?: number }> = ({ at, strength = 0.85 }) => {
  const t = useT();
  const o = at.reduce((m, a) => (t >= a && t < a + 0.35 ? Math.max(m, (1 - (t - a) / 0.35) ** 2) : m), 0);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fff, #ffe9f7 60%, #ffd1ef)", opacity: o * strength, mixBlendMode: "screen" }} />;
};

export const Viewfinder: React.FC<{ opacity: number; label?: string }> = ({ opacity, label = "REC" }) => {
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  const c = (x: number, y: number, r: number) => <div style={{ position: "absolute", left: x, top: y, width: 90, height: 90, borderTop: "6px solid #fff", borderLeft: "6px solid #fff", transform: `rotate(${r}deg)`, opacity: 0.85 }} />;
  return (
    <AbsoluteFill style={{ opacity }}>
      {c(60, 120, 0)}{c(930, 120, 90)}{c(930, 1440, 180)}{c(60, 1440, 270)}
      <div style={{ position: "absolute", top: 140, left: 180, fontFamily: round, fontWeight: 700, fontSize: 40, color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#ff3355", opacity: Math.floor(f / 15) % 2 ? 1 : 0.25, boxShadow: "0 0 18px #ff3355" }} />{label}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- confetti ---------- */
/** Burst of confetti from (x, y). `el` is seconds since the burst (pass a slowed clock for slow motion). */
export const Confetti: React.FC<{ x: number; y: number; el: number; n?: number; seed?: string; power?: number }> = ({ x, y, el, n = 70, seed = "c", power = 1 }) => {
  if (el < 0 || el > 6) return null;
  const cols = [SP.pink, SP.blue, SP.violet, "#ffe14d", "#fff", SP.green];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = -Math.PI / 2 + (random(`${seed}a${i}`) - 0.5) * 2.4;
        const v = (700 + random(`${seed}v${i}`) * 1100) * power;
        const drag = 1.8;
        const k = (1 - Math.exp(-drag * el)) / drag;
        const px = x + Math.cos(a) * v * k + Math.sin(el * 3 + i) * 30;
        const py = y + Math.sin(a) * v * k + 260 * el * el * 0.5 + 120 * el;
        const w = 14 + random(`${seed}w${i}`) * 14;
        const spin = el * (300 + random(`${seed}r${i}`) * 600);
        const o = interpolate(el, [0, 0.05, 4, 6], [0, 1, 1, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: w, height: w * (i % 3 ? 0.45 : 1), borderRadius: i % 3 ? 3 : "50%", background: cols[i % cols.length], transform: `rotate(${spin}deg) scaleX(${Math.cos(spin / 40)})`, opacity: o, boxShadow: i % 5 === 0 ? `0 0 12px ${cols[i % cols.length]}` : "none" }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- a party guest, made of shapes ---------- */
export const Guest: React.FC<{ x: number; y: number; h: number; color?: string; turn?: number; arms?: [number, number]; hair?: boolean; opacity?: number }> = ({ x, y, h, color = SP.pink, turn = 0, arms = [20, -20], hair = true, opacity = 1 }) => {
  const u = h / 100;
  const side = Math.cos(turn); // 1 = facing us, 0 = side on, -1 = back
  const sx = 0.55 + 0.45 * Math.abs(side);
  const body = `linear-gradient(${90 + Math.sin(turn) * 70}deg, #1a0c2c, ${color} 55%, #ffd1ef)`;
  return (
    <div style={{ position: "absolute", left: x - 25 * u, top: y - h, width: 50 * u, height: h, opacity }}>
      <div style={{ position: "absolute", left: "50%", top: 0, transform: `translateX(-50%) scaleX(${0.85 + 0.15 * sx})` }}>
        <div style={{ width: 22 * u, height: 24 * u, borderRadius: "50%", background: `radial-gradient(circle at ${50 + Math.sin(turn) * 30}% 35%, #ffe3d2, #c98b74 75%)`, boxShadow: `0 0 ${10 * u}px ${color}` }} />
        {hair && <div style={{ position: "absolute", left: -2 * u, top: -3 * u, width: 26 * u, height: 16 * u, borderRadius: `${13 * u}px ${13 * u}px ${6 * u}px ${6 * u}px`, background: "#2a1240", opacity: side < -0.2 ? 1 : 0.95, transform: side < -0.2 ? `scaleY(1.6) translateY(${4 * u}px)` : "none" }} />}
      </div>
      {[0, 1].map((k) => (
        <div key={k} style={{ position: "absolute", left: `calc(50% + ${(k ? 1 : -1) * 16 * u * sx}px)`, top: 30 * u, width: 8 * u, height: 34 * u, borderRadius: 4 * u, background: color, transformOrigin: "50% 4%", transform: `rotate(${arms[k]}deg)`, filter: "brightness(1.1)" }} />
      ))}
      <div style={{ position: "absolute", left: "50%", top: 26 * u, width: 36 * u * sx, height: 44 * u, marginLeft: -18 * u * sx, borderRadius: `${14 * u}px ${14 * u}px ${6 * u}px ${6 * u}px`, background: body, boxShadow: `0 0 ${18 * u}px ${color}88` }} />
      {[0, 1].map((k) => (
        <div key={k} style={{ position: "absolute", left: `calc(50% + ${(k ? 2 : -10) * u * sx}px)`, top: 68 * u, width: 9 * u * sx + 2, height: 32 * u, borderRadius: 4 * u, background: "#1e1033" }} />
      ))}
    </div>
  );
};

/* ---------- phone frame ---------- */
export const PhoneFrame: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; children?: React.ReactNode; glow?: string; opacity?: number; scale?: number }> = ({ x, y, w, h, rot = 0, children, glow = SP.violet, opacity = 1, scale = 1 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: w * 0.13, border: `${Math.max(6, w * 0.02)}px solid #2a1a40`, background: "linear-gradient(180deg,#120a22,#1d0d36 60%,#0e0819)", boxShadow: `0 0 0 2px #5b3d85, 0 0 80px ${glow}88, 0 40px 100px rgba(0,0,0,.6)`, overflow: "hidden", transform: `rotate(${rot}deg) scale(${scale})`, opacity }}>
    <div style={{ position: "absolute", top: w * 0.03, left: "50%", width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: 999, background: "#050309", zIndex: 5 }} />
    {children}
  </div>
);

/* ---------- captions: word by word, timed to each voice line ---------- */
const durs = voiceDurations as Record<string, Record<string, number>>;
const spoken = (s: string) => s.replace(/\[\[([A-Z])\]\] \[\[([A-Z])\]\]/g, "$1$2").replace(/\[\[([A-Z])\]\]/g, "$1");

/** When each word starts, as a fraction of the line: longer words take longer, and punctuation adds a pause. */
const wordStarts = (words: string[]) => {
  const w = words.map((x) => x.replace(/[^\w£]/g, "").length + 1.5 + (/[.,!?]$/.test(x) ? 2.2 : 0));
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  return w.map((x) => { const s = acc / total; acc += x; return s; });
};

export const SpinCaptions: React.FC<{ id: string; bottom?: number; size?: number }> = ({ id, bottom = 170, size = 80 }) => {
  const t = useT();
  const fl = film(id);
  const voice = fl.voice as Record<string, string>;
  const starts = fl.voiceStart as Record<string, number>;
  const k = Object.keys(voice).find((key) => t >= starts[key] - 0.05 && t < starts[key] + (durs[id]?.[key] ?? 2) + 0.35);
  if (!k || fl.captionOff?.includes(k)) return null;
  const s = starts[k];
  const d = durs[id]?.[k] ?? 2;
  const words = (fl.caption?.[k] ?? spoken(voice[k])).split(" ");
  const ws = wordStarts(words);
  const p = (t - s) / d;
  const cur = Math.max(0, ws.filter((x) => x <= p).length - 1);
  const fadeIn = interpolate(t, [s - 0.05, s + 0.08], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 480, background: "linear-gradient(180deg,transparent,rgba(7,5,12,.85))" }} />
      <div style={{ position: "relative", width: 960, textAlign: "center", fontFamily: round, fontWeight: 700, fontSize: size, lineHeight: 1.15, color: "#fff", opacity: fadeIn, transform: `translateY(${(1 - fadeIn) * 20}px)` }}>
        {words.map((w, i) => {
          const on = i === cur;
          const popIn = interpolate(p - ws[i], [0, 0.06], [0.7, 1], clamp);
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: i <= cur ? 1 : 0.3, color: on ? "#fff" : i < cur ? "#ffe3f4" : "#fff", textShadow: on ? neon(SP.pink, 0.9) : "0 4px 24px rgba(0,0,0,.8)", transform: on ? `scale(${1.08 * popIn}) rotate(-2deg)` : "none" }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Soundtrack: React.FC<{ id: string }> = ({ id }) => <Audio src={staticFile(`audio/${id}.wav`)} />;
