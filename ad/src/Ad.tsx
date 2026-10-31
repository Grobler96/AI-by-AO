import React from "react";
import { AbsoluteFill, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, disp, mono } from "./theme";

export const FPS = 30;
export const DURATION = 13 * FPS;

const HOOK = "What if your missed calls turned into booked jobs?";

/* ---------- helpers ---------- */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Fade a scene in and out over its local timeline. */
const Scene: React.FC<{ len: number; children: React.ReactNode; fadeIn?: number; fadeOut?: number }> = ({ len, children, fadeIn = 6, fadeOut = 6 }) => {
  const f = useCurrentFrame();
  const o = fadeOut > 0
    ? interpolate(f, [0, fadeIn, len - fadeOut, len], [0, 1, 1, 0], clamp)
    : interpolate(f, [0, fadeIn], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Pill: React.FC<{ children: React.ReactNode; size?: number; pop?: number }> = ({ children, size = 96, pop = 1 }) => (
  <span
    style={{
      display: "inline-block",
      background: C.grad,
      color: "#04050d",
      padding: `0 ${size * 0.22}px`,
      margin: `0 ${size * 0.06}px`,
      borderRadius: size * 0.28,
      transform: `scale(${pop})`,
      boxShadow: "0 0 60px rgba(139,92,246,.55)",
    }}
  >
    {children}
  </span>
);

/* ---------- background ---------- */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const orb = (x: number, y: number, c: string, s: number, ph: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(f / 40 + ph) * 90,
        top: y + Math.cos(f / 50 + ph) * 110,
        width: s,
        height: s,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${c} 0%, transparent 68%)`,
        filter: "blur(30px)",
        opacity: 0.55,
        transform: "translate(-50%,-50%)",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg,${C.bg},${C.bg2})` }}>
      {orb(180, 500, "rgba(56,225,255,.5)", 900, 0)}
      {orb(930, 1000, "rgba(139,92,246,.55)", 1000, 2)}
      {orb(300, 1600, "rgba(255,79,216,.4)", 800, 4)}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(f * 0.8) % 90}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- pinned hook, like the reference ad ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 70,
        right: 70,
        background: "#fff",
        color: "#0b0e1e",
        fontFamily: disp,
        fontWeight: 700,
        fontSize: 54,
        lineHeight: 1.18,
        padding: "34px 40px",
        borderRadius: 30,
        transform: `translateY(${(1 - s) * -160}px) scale(${0.9 + 0.1 * s})`,
        opacity: s,
        boxShadow: "0 20px 80px rgba(0,0,0,.45)",
      }}
    >
      {HOOK}
    </div>
  );
};

/* ---------- scene 1: the missed call ---------- */
const MissedCall: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f - 6, fps, config: { damping: 11, stiffness: 140 } });
  const ringing = f < 40;
  const shake = ringing ? Math.sin(f * 1.9) * 9 * (1 - f / 50) : 0;
  const missed = f >= 40;
  const flip = spring({ frame: f - 40, fps, config: { damping: 12 } });
  const pulse = (i: number) => {
    const p = ((f - i * 12) % 36) / 36;
    return { scale: 1 + p * 1.6, o: ringing && f > 0 ? 0.5 * (1 - p) : 0 };
  };
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 260 }}>
      <div style={{ position: "relative", transform: `scale(${enter}) rotate(${shake}deg)` }}>
        {[0, 1, 2].map((i) => {
          const p = pulse(i);
          return <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 60, border: `4px solid ${C.cyan}`, transform: `scale(${p.scale})`, opacity: p.o }} />;
        })}
        <div
          style={{
            width: 800,
            padding: "56px 60px",
            borderRadius: 60,
            background: "rgba(255,255,255,.06)",
            border: `2px solid ${missed ? "rgba(255,79,100,.8)" : "rgba(255,255,255,.18)"}`,
            backdropFilter: "blur(20px)",
            fontFamily: disp,
            color: C.text,
            boxShadow: missed ? "0 0 90px rgba(255,79,100,.35)" : "0 0 90px rgba(56,225,255,.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <div style={{ width: 130, height: 130, borderRadius: "50%", background: missed ? "#ff4f64" : C.grad, display: "grid", placeItems: "center", fontSize: 64, transform: `scale(${missed ? 0.9 + 0.1 * flip : 1})` }}>
              {missed ? "✕" : "📞"}
            </div>
            <div>
              <div style={{ fontSize: 64, fontWeight: 700 }}>{missed ? "Missed call" : "Incoming call…"}</div>
              <div style={{ fontFamily: mono, fontSize: 38, color: C.muted, marginTop: 8 }}>02:14 am · Unknown</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- scene 2: kinetic typing ---------- */
type Seg = { t: string; hl?: boolean };
const Typed: React.FC<{ segs: Seg[]; start: number; size: number; cps?: number }> = ({ segs, start, size, cps = 1.1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let n = Math.max(0, Math.floor((f - start) * cps));
  const total = segs.reduce((a, s) => a + s.t.length, 0);
  const done = n >= total;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{ fontFamily: disp, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: C.text, textAlign: "center" }}>
      {segs.map((s, i) => {
        const take = Math.min(n, s.t.length);
        n -= take;
        const text = s.t.slice(0, take);
        if (!take) return null;
        const pop = s.hl ? spring({ frame: f - start - 2, fps, config: { damping: 9, stiffness: 160 } }) : 1;
        return s.hl ? (
          <Pill key={i} size={size} pop={Math.min(1.08, 0.7 + 0.38 * pop)}>{text}</Pill>
        ) : (
          <span key={i}>{text}</span>
        );
      })}
      <span style={{ display: "inline-block", width: size * 0.07, height: size * 0.9, marginLeft: 8, verticalAlign: "-0.1em", background: C.cyan, opacity: done && !blink ? 0 : 1 }} />
    </div>
  );
};

const TypeScene: React.FC = () => {
  const f = useCurrentFrame();
  const l2 = interpolate(f, [58, 74], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "260px 70px 0" }}>
      <Typed segs={[{ t: "You just got " }, { t: "booked", hl: true }, { t: " a job at 2am" }]} start={4} size={92} cps={0.9} />
      <div style={{ marginTop: 70, textAlign: "center", fontFamily: disp, fontWeight: 500, fontSize: 64, color: C.muted, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)` }}>
        …while you were asleep 😴
      </div>
    </AbsoluteFill>
  );
};

/* ---------- scene 3: floating UI cards ---------- */
const UiCard: React.FC<{ delay: number; x: number; y: number; rot: number; accent: string; icon: string; title: string; sub: string }> = ({ delay, x, y, rot, accent, icon, title, sub }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 10, stiffness: 120 } });
  const bob = Math.sin((f + delay * 3) / 14) * 12;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: 760,
        padding: "38px 44px",
        borderRadius: 44,
        background: "rgba(14,18,40,.82)",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 70px ${accent}55`,
        fontFamily: disp,
        color: C.text,
        display: "flex",
        gap: 34,
        alignItems: "center",
        opacity: s,
        transform: `scale(${s}) rotate(${rot * s}deg)`,
      }}
    >
      <div style={{ fontSize: 76, width: 120, height: 120, borderRadius: 30, display: "grid", placeItems: "center", background: `${accent}26` }}>{icon}</div>
      <div>
        <div style={{ fontSize: 54, fontWeight: 700 }}>{title}</div>
        <div style={{ fontFamily: mono, fontSize: 34, color: C.muted, marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
};

const Cards: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top: 400, width: "100%", textAlign: "center", fontFamily: disp, fontWeight: 700, fontSize: 70, color: C.text }}>
      AI handles it <Pill size={70}>instantly</Pill>
    </div>
    <UiCard delay={4} x={60} y={620} rot={-3} accent={C.cyan} icon="📞" title="AI picked up" sub="Quote booked · Thu 9am" />
    <UiCard delay={18} x={260} y={940} rot={3} accent={C.violet} icon="💬" title="Chatbot replied" sub="Lead qualified in 12s" />
    <UiCard delay={32} x={90} y={1260} rot={-2} accent={C.pink} icon="🧾" title="Invoice sent ✓" sub="Paid before you woke up" />
  </AbsoluteFill>
);

/* ---------- glitch wipe ---------- */
const Glitch: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 3, 9], [0, 0.55, 0], clamp);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const h = 40 + random(`h${i}`) * 220;
        const y = random(`y${i}`) * 1920;
        const x = (random(`x${i}-${f}`) - 0.5) * 900 * (1 - f / 10);
        const col = [C.cyan, C.pink, C.violet][i % 3];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: "100%", height: h, background: col, opacity: 0.7 }} />;
      })}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

/* ---------- "Meet" ---------- */
const Meet: React.FC = () => {
  const f = useCurrentFrame();
  const blur = interpolate(f, [0, 14], [60, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sc = interpolate(f, [0, 36], [1.35, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 330, background: C.grad, WebkitBackgroundClip: "text", color: "transparent", filter: `blur(${blur}px)`, transform: `scale(${sc})`, letterSpacing: -10 }}>
        Meet
      </div>
    </AbsoluteFill>
  );
};

/* ---------- logo reveal ---------- */
const LogoMark: React.FC<{ size: number }> = ({ size }) => {
  const f = useCurrentFrame();
  const cols = [C.cyan, C.violet, C.pink];
  return (
    <div style={{ width: size, height: size, position: "relative", perspective: 900 }}>
      <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transform: `rotateX(-20deg) rotateY(${f * 4}deg)` }}>
        {cols.map((c, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, border: `${size * 0.05}px solid ${c}`, borderRadius: size * 0.27, boxShadow: `0 0 ${size * 0.4}px ${c}99, inset 0 0 ${size * 0.25}px ${c}55`, transform: `rotateY(${i * 60}deg)` }} />
        ))}
      </div>
    </div>
  );
};

const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f, fps, config: { damping: 11, stiffness: 100 } });
  const name = spring({ frame: f - 14, fps, config: { damping: 14 } });
  const tag = interpolate(f, [30, 46], [0, 1], clamp);
  const cta = spring({ frame: f - 48, fps, config: { damping: 9, stiffness: 140 } });
  const glow = 0.6 + 0.4 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 50 }}>
      <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -90}deg)` }}>
        <LogoMark size={300} />
      </div>
      <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 150, color: C.text, opacity: name, transform: `translateY(${(1 - name) * 60}px)`, letterSpacing: -3 }}>
        AI by <span style={{ background: C.grad, WebkitBackgroundClip: "text", color: "transparent" }}>AO</span>
      </div>
      <div style={{ fontFamily: disp, fontWeight: 500, fontSize: 46, color: C.muted, textAlign: "center", lineHeight: 1.5, opacity: tag, padding: "0 90px" }}>
        Business automation · AI phone callers
        <br />
        Chatbots · Web design
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: disp,
          fontWeight: 700,
          fontSize: 62,
          color: "#04050d",
          background: C.grad,
          padding: "34px 80px",
          borderRadius: 999,
          transform: `scale(${cta})`,
          boxShadow: `0 0 ${90 * glow}px rgba(139,92,246,.8)`,
        }}
      >
        Book a free demo →
      </div>
      <div style={{ fontFamily: mono, fontSize: 42, color: C.cyan, opacity: tag }}>aibyao.com · Leeds, UK</div>
    </AbsoluteFill>
  );
};

/* ---------- timeline ---------- */
export const Ad: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Background />
      {f < 8.9 * FPS && <Hook />}
      <Sequence from={0} durationInFrames={80}><Scene len={80}><MissedCall /></Scene></Sequence>
      <Sequence from={75} durationInFrames={115}><Scene len={115}><TypeScene /></Scene></Sequence>
      <Sequence from={185} durationInFrames={85}><Scene len={85} fadeOut={3}><Cards /></Scene></Sequence>
      <Sequence from={266} durationInFrames={10}><Glitch /></Sequence>
      <Sequence from={272} durationInFrames={50}><Scene len={50} fadeIn={2} fadeOut={8}><Meet /></Scene></Sequence>
      <Sequence from={312} durationInFrames={DURATION - 312}><Scene len={DURATION - 312} fadeIn={8} fadeOut={0}><Reveal /></Scene></Sequence>
    </AbsoluteFill>
  );
};
