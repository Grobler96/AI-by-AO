import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, disp, mono } from "./theme";
import { LogoMark } from "./Ad";
import { Captions, stories } from "./PhoneStory";

export const BRAND_FPS = 30;
export const BRAND_DURATION = Math.round(38.5 * BRAND_FPS);

type Marks = {
  morph: number[]; absorb: number;
  phone: { call: number; caller: number; ai: number; booked: number };
  chat: number[]; pulses: number[];
  web: { type: number; image: number; cta: number; click: number; toasts: number[] };
  finale: { tokens: number; merge: number; logo: number; cta: number };
};
const M = (stories.find((s) => s.id === "brand-film") as unknown as { marks: Marks }).marks;
const [M1, M2, M3, M4, M5] = M.morph;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = Easing.bezier(0.76, 0, 0.24, 1);
const win = (t: number, a: number, b: number, c: number, d: number) => interpolate(t, [a, b, c, d], [0, 1, 1, 0], clamp);

/** Piecewise animation through [seconds, value] keys, eased between keys. */
const track = (f: number, keys: [number, number][]) => {
  const t = f / BRAND_FPS;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) return interpolate(t, [t0, t1], [v0, v1], { easing: ez });
  }
  return keys[keys.length - 1][1];
};

/* the hero shape: orb -> phone -> chat window -> workflow hub -> browser -> orb */
const heroW = (f: number) => track(f, [[0, 380], [M1, 380], [M1 + 1.2, 470], [M2, 470], [M2 + 1.2, 880], [M3, 880], [M3 + 1.2, 190], [M4, 190], [M4 + 1.2, 940], [M5, 940], [M5 + 1.4, 380], [60, 380]]);
const heroH = (f: number) => track(f, [[0, 380], [M1, 380], [M1 + 1.2, 900], [M2, 900], [M2 + 1.2, 1000], [M3, 1000], [M3 + 1.2, 190], [M4, 190], [M4 + 1.2, 1160], [M5, 1160], [M5 + 1.4, 380], [60, 380]]);
const heroR = (f: number) => track(f, [[0, 190], [M1, 190], [M1 + 1.2, 90], [M2, 90], [M2 + 1.2, 64], [M3, 64], [M3 + 1.2, 60], [M4, 60], [M4 + 1.2, 40], [M5, 40], [M5 + 1.4, 190], [60, 190]]);
const heroY = (f: number) => track(f, [[0, 780], [M1, 780], [M1 + 1.2, 880], [M2 + 1.2, 880], [M3, 880], [M3 + 1.2, 820], [M4, 820], [M4 + 1.2, 860], [M5, 860], [M5 + 1.4, 740], [60, 740]]);
const sphereOp = (f: number) => track(f, [[0, 1], [M1 + 0.5, 1], [M1 + 1.2, 0], [M3 + 0.2, 0], [M3 + 1.0, 1], [M4 + 0.5, 1], [M4 + 1.2, 0], [M5 + 0.3, 0], [M5 + 1.0, 1], [60, 1]]);
const lightOp = (f: number) => track(f, [[0, 0], [M4 + 0.7, 0], [M4 + 1.2, 1], [M5, 1], [M5 + 0.5, 0], [60, 0]]);
const orbState = (f: number) => track(f, [[0, 1], [M1, 1], [M1 + 0.7, 0], [M5 + 0.6, 0], [M5 + 1.4, 1], [60, 1]]);

const Sphere: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 32% 26%, #ffffff 0%, #38e1ff 16%, #6f7bff 46%, #8b5cf6 68%, #3a1670 100%)", boxShadow: "inset -30px -40px 80px rgba(20,5,60,.55)" }} />
);

/* ---------- atmosphere ---------- */
const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS;
  const glow = (c: string, a: number, b: number, cc: number, d: number, y = 880) => (
    <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% ${y / 19.2}%, ${c}, transparent 70%)`, opacity: win(t, a, b, cc, d) }} />
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#03040c,#070a1f 60%,#0d0a28)" }}>
      {glow("rgba(139,92,246,.35)", -1, 0, 5.2, 6.4, 780)}
      {glow("rgba(56,225,255,.30)", 5.6, 6.6, 10.6, 11.6)}
      {glow("rgba(139,92,246,.42)", 11.4, 12.4, 16.4, 17.4)}
      {glow("rgba(56,225,255,.26)", 17.2, 18.2, 22.8, 23.8)}
      {glow("rgba(255,79,216,.32)", 23.6, 24.6, 29.2, 30.2)}
      {glow("rgba(139,92,246,.40)", 30.0, 31.0, 40, 41, 740)}
      {Array.from({ length: 36 }).map((_, i) => {
        const y = (random(`y${i}`) * 2200 - f * (0.25 + random(`v${i}`) * 0.6) + 2200) % 2000;
        return <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1080, top: y, width: 3 + random(`s${i}`) * 4, height: 3 + random(`s${i}`) * 4, borderRadius: "50%", background: "#cfe9ff", opacity: 0.12 + 0.25 * Math.abs(Math.sin(f / 30 + i)) }} />;
      })}
    </AbsoluteFill>
  );
};

const Shockwave: React.FC<{ at: number; color?: string }> = ({ at, color = "rgba(56,225,255,.85)" }) => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS - at;
  if (t < 0 || t > 1.1) return null;
  const p = interpolate(t, [0, 1.1], [0, 1], { easing: Easing.out(Easing.cubic) });
  const s = 160 + p * 1500;
  return <div style={{ position: "absolute", left: 540 - s / 2, top: heroY(f) - s / 2, width: s, height: s, borderRadius: "50%", border: `${6 - 4 * p}px solid ${color}`, opacity: (1 - p) * 0.9 }} />;
};

/* ---------- 0. chaos around the orb ---------- */
const WORDS = ["Calls", "Emails", "Quotes", "Invoices", "Follow-ups", "Bookings", "Admin", "Leads"];
const Chaos: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS;
  if (t < 1 || t > M.absorb + 0.1) return null;
  const spin = interpolate(t, [1, 3.6, M.absorb], [0, 1, 1.5], clamp);
  const suck = interpolate(t, [3.5, M.absorb], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const speed = 0.02 + 0.06 * Math.pow(interpolate(t, [1, 3.6], [0, 1], clamp), 2);
  let ang = 0;
  for (let k = 0; k < f; k++) ang += 0.02 + 0.06 * Math.pow(interpolate(k / BRAND_FPS, [1, 3.6], [0, 1], clamp), 2);
  void speed; void spin;
  return (
    <AbsoluteFill>
      {WORDS.map((w, i) => {
        const a = ang + (i / WORDS.length) * Math.PI * 2;
        const rx = (470 + (i % 3) * 60) * (1 - suck), ry = (230 + (i % 2) * 90) * (1 - suck);
        const x = 540 + Math.cos(a) * rx, y = 780 + Math.sin(a) * ry * 1.25 + Math.sin(a * 2 + i) * 18;
        const depth = (Math.sin(a) + 1) / 2;
        const fade = interpolate(t, [1 + i * 0.16, 1.5 + i * 0.16], [0, 1], clamp);
        return (
          <div key={w} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${(0.7 + depth * 0.6) * (1 - suck * 0.9)}) rotate(${Math.sin(a) * 8}deg)`, opacity: fade * (0.45 + depth * 0.55) * (1 - suck * 0.4), fontFamily: i % 2 ? mono : disp, fontWeight: 700, fontSize: 52, color: i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.pink : C.text, textShadow: "0 0 30px currentColor", filter: `blur(${(1 - depth) * 2.5}px)` }}>
            {w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 1. phone: the AI voice ---------- */
const Typed: React.FC<{ text: string; start: number; cps?: number }> = ({ text, start, cps = 26 }) => {
  const t = useCurrentFrame() / BRAND_FPS;
  return <>{text.slice(0, Math.max(0, Math.floor((t - start) * cps)))}</>;
};

const PhoneContent: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / BRAND_FPS;
  const op = win(t, M1 + 1.0, M1 + 1.4, M2 - 0.5, M2 - 0.1);
  if (op <= 0) return null;
  const speaking = (t > M.phone.ai && t < M.phone.booked - 0.3) || (t > M.phone.call + 0.3 && t < M.phone.caller + 1.6) ? 1 : 0.15;
  const secs = Math.max(0, Math.floor(t - M.phone.call));
  const booked = spring({ frame: f - M.phone.booked * fps, fps, config: { damping: 8, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 470, height: 900, marginLeft: -235, marginTop: -450, opacity: op }}>
      <div style={{ position: "absolute", top: 44, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 22, color: C.cyan, letterSpacing: 3 }}>AI RECEPTIONIST</div>
      <div style={{ position: "absolute", top: 82, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 28, color: C.text }}>00:{String(secs).padStart(2, "0")}</div>
      <div style={{ position: "absolute", top: 200, left: 0, width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        {Array.from({ length: 23 }).map((_, i) => {
          const mid = 1 - Math.abs(i - 11) / 12;
          const h = 14 + 200 * mid * speaking * (0.35 + 0.65 * Math.abs(Math.sin(f / 5 + i * 0.7) * Math.cos(f / 11 + i * 0.31)));
          return <div key={i} style={{ width: 11, height: h, borderRadius: 8, background: C.grad, boxShadow: "0 0 18px rgba(139,92,246,.7)" }} />;
        })}
      </div>
      <Bubble t={t} at={M.phone.caller} side="right" text="Hi, my boiler's packed in…" top={520} />
      <Bubble t={t} at={M.phone.ai} side="left" text="Of course. I can get an engineer to you Thursday at 9. Shall I book it?" top={610} ai />
      <div style={{ position: "absolute", top: 805, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(booked, 1), transform: `scale(${0.5 + 0.5 * Math.min(booked, 1.2)})` }}>
        <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 30, color: "#04050d", background: C.lime, padding: "10px 28px", borderRadius: 999, boxShadow: "0 0 40px rgba(125,255,178,.6)" }}>✓ BOOKED · THU 9AM</div>
      </div>
    </div>
  );
};

const Bubble: React.FC<{ t: number; at: number; side: "left" | "right"; text: string; top: number; ai?: boolean }> = ({ t, at, side, text, top, ai }) => {
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  return (
    <div style={{ position: "absolute", top, [side]: 14, width: 380, padding: "18px 24px", borderRadius: 30, background: ai ? C.grad : "rgba(255,255,255,.12)", color: ai ? "#04050d" : C.text, fontFamily: disp, fontWeight: 700, fontSize: 28, lineHeight: 1.22, opacity: Math.min(p, 1), transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: side === "left" ? "left top" : "right top", boxShadow: ai ? "0 0 40px rgba(139,92,246,.45)" : "none" }}>
      <Typed text={text} start={at} cps={ai ? 30 : 26} />
    </div>
  );
};

const RingRipples: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS;
  const op = win(t, M.phone.call, M.phone.call + 0.3, M2 - 0.6, M2 - 0.2);
  if (op <= 0) return null;
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3].map((k) => {
        const p = ((t - M.phone.call - k * 0.55) % 2.2 + 2.2) % 2.2 / 2.2;
        const w = 470 + p * 520, h = 900 + p * 520;
        return <div key={k} style={{ position: "absolute", left: 540 - w / 2, top: heroY(f) - h / 2, width: w, height: h, borderRadius: 90 + p * 220, border: `3px solid ${C.cyan}`, opacity: (1 - p) * 0.45 * op }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- 2. chat window ---------- */
const ChatContent: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS;
  const op = win(t, M2 + 1.0, M2 + 1.4, M3 - 0.5, M3 - 0.1);
  if (op <= 0) return null;
  const [c1, typing, a1, c2, a2, chips, press] = M.chat;
  const pop = (at: number) => interpolate(t, [at, at + 0.28], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
  const msg = (at: number, side: "l" | "r", text: string, top: number, ai = false) => t < at ? null : (
    <div style={{ position: "absolute", top, [side === "l" ? "left" : "right"]: 36, maxWidth: 600, padding: "26px 34px", borderRadius: 40, background: ai ? C.grad : "rgba(255,255,255,.13)", color: ai ? "#04050d" : C.text, fontFamily: disp, fontWeight: 700, fontSize: 38, lineHeight: 1.2, opacity: Math.min(pop(at), 1), transform: `scale(${0.6 + 0.4 * pop(at)})`, transformOrigin: side === "l" ? "left top" : "right top", boxShadow: ai ? "0 0 50px rgba(139,92,246,.4)" : "none" }}>{text}</div>
  );
  const dots = t >= typing && t < a1;
  const dots2 = t >= c2 + 0.3 && t < a2;
  const confirm = pop(press);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 880, height: 1000, marginLeft: -440, marginTop: -500, opacity: op }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, borderBottom: "1.5px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", gap: 22, padding: "0 40px" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: "radial-gradient(circle at 32% 26%, #fff 0%, #38e1ff 18%, #8b5cf6 70%)", boxShadow: "0 0 30px rgba(139,92,246,.7)" }} />
        <div>
          <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 36, color: C.text }}>AI by AO</div>
          <div style={{ fontFamily: mono, fontSize: 22, color: C.lime }}>● online now</div>
        </div>
      </div>
      {msg(c1, "r", "Do you do emergency callouts?", 160)}
      {dots && <TypingDots top={330} t={t} />}
      {msg(a1, "l", "Yes, 24/7. What's happening?", 330, true)}
      {msg(c2, "r", "Burst pipe in the kitchen!", 480)}
      {dots2 && <TypingDots top={640} t={t} />}
      {msg(a2, "l", "On it. Dave can be with you in 45 minutes.", 640, true)}
      {t >= chips && t < press && (
        <div style={{ position: "absolute", top: 860, left: 36, display: "flex", gap: 22, opacity: Math.min(pop(chips), 1) }}>
          <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 36, padding: "20px 40px", borderRadius: 999, border: `3px solid ${C.cyan}`, color: C.cyan, transform: t > press - 0.2 ? "scale(.94)" : "none" }}>Book now</div>
          <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 36, padding: "20px 40px", borderRadius: 999, border: "3px solid rgba(255,255,255,.3)", color: C.muted }}>Call me</div>
        </div>
      )}
      {t >= press && (
        <div style={{ position: "absolute", top: 850, left: 36, right: 36, padding: "26px 34px", borderRadius: 34, background: "rgba(125,255,178,.15)", border: `3px solid ${C.lime}`, fontFamily: disp, fontWeight: 700, fontSize: 38, color: C.lime, opacity: Math.min(confirm, 1), transform: `scale(${0.8 + 0.2 * confirm})` }}>
          ✓ Booked · Dave arriving 3:45pm
        </div>
      )}
    </div>
  );
};

const TypingDots: React.FC<{ top: number; t: number }> = ({ top, t }) => (
  <div style={{ position: "absolute", top, left: 36, padding: "26px 34px", borderRadius: 40, background: "rgba(255,255,255,.13)", display: "flex", gap: 12 }}>
    {[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: C.text, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - i * 0.9)), transform: `translateY(${-8 * Math.max(0, Math.sin(t * 9 - i * 0.9))}px)` }} />)}
  </div>
);

/* ---------- 3. automation: the workflow ---------- */
type Pt = { x: number; y: number };
const HUB: Pt = { x: 540, y: 820 };
const NODES: { p: Pt; icon: string; label: string; at: number }[] = [
  { p: { x: 210, y: 540 }, icon: "📞", label: "New enquiry", at: M3 + 1.3 },
  { p: { x: 870, y: 540 }, icon: "📝", label: "Quote sent", at: M3 + 1.5 },
  { p: { x: 870, y: 1100 }, icon: "🧾", label: "Invoice sent", at: M3 + 1.7 },
  { p: { x: 540, y: 1300 }, icon: "🔔", label: "Follow-up set", at: M3 + 1.9 },
  { p: { x: 210, y: 1100 }, icon: "📋", label: "Lead saved", at: M3 + 2.1 },
];
const wireFor = (i: number): [Pt, Pt, Pt, Pt] => {
  const a = i === 0 ? NODES[0].p : HUB, b = i === 0 ? HUB : NODES[i].p;
  const horiz = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
  const c1 = horiz ? { x: a.x + (b.x - a.x) * 0.55, y: a.y } : { x: a.x, y: a.y + (b.y - a.y) * 0.55 };
  const c2 = horiz ? { x: a.x + (b.x - a.x) * 0.45, y: b.y } : { x: b.x, y: a.y + (b.y - a.y) * 0.45 };
  return [a, c1, c2, b];
};
const bez = ([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y };
};

const Workflow: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / BRAND_FPS;
  const collapse = interpolate(t, [M4 - 0.2, M4 + 0.6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const vis = (1 - collapse) * (t > M3 + 1 ? 1 : 0);
  if (vis <= 0) return null;
  const order = [0, 1, 2, 3, 4];
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {order.map((i) => {
          const w = wireFor(i);
          const grow = interpolate(t, [NODES[i].at, NODES[i].at + 0.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const d = `M${w[0].x},${w[0].y} C${w[1].x},${w[1].y} ${w[2].x},${w[2].y} ${w[3].x},${w[3].y}`;
          const lit = interpolate(t, [M.pulses[i], M.pulses[i] + 0.6], [0, 1], clamp);
          return (
            <g key={i}>
              <path d={d} stroke="rgba(255,255,255,.14)" strokeWidth={5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow} strokeLinecap="round" />
              <path d={d} stroke={C.cyan} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow} strokeLinecap="round" opacity={0.25 + 0.75 * lit} style={{ filter: "drop-shadow(0 0 10px rgba(56,225,255,.9))" }} />
            </g>
          );
        })}
        {order.map((i) => {
          const w = wireFor(i);
          const p = (t - M.pulses[i]) / 0.55;
          if (p < 0 || p > 1) return null;
          const pt = bez(w, interpolate(p, [0, 1], [0, 1], { easing: Easing.inOut(Easing.quad) }));
          return <circle key={i} cx={pt.x} cy={pt.y} r={16} fill="#fff" style={{ filter: "drop-shadow(0 0 18px #38e1ff) drop-shadow(0 0 36px #8b5cf6)" }} />;
        })}
      </svg>
      {NODES.map((n, i) => {
        const s = spring({ frame: f - n.at * fps, fps, config: { damping: 11, stiffness: 120 } });
        const x = HUB.x + (n.p.x - HUB.x) * Math.min(s, 1.04) + (HUB.x - n.p.x) * collapse;
        const y = HUB.y + (n.p.y - HUB.y) * Math.min(s, 1.04) + (HUB.y - n.p.y) * collapse;
        const done = interpolate(t, [M.pulses[i] + 0.5, M.pulses[i] + 0.8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
        return (
          <div key={i} style={{ position: "absolute", left: x - 100, top: y - 100, width: 200, height: 200, opacity: Math.min(s, 1), transform: `scale(${(0.4 + 0.6 * Math.min(s, 1)) * (1 - collapse * 0.6)})` }}>
            <div style={{ width: 200, height: 200, borderRadius: 56, background: "rgba(14,18,40,.88)", border: `3px solid ${done > 0.5 ? C.lime : "rgba(255,255,255,.22)"}`, boxShadow: done > 0.5 ? "0 0 60px rgba(125,255,178,.35)" : "0 0 40px rgba(139,92,246,.3)", display: "grid", placeItems: "center", fontSize: 90 }}>{n.icon}</div>
            <div style={{ position: "absolute", top: 214, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 28, color: C.text, whiteSpace: "nowrap", left: "50%", transform: "translateX(-50%)" }}>{n.label}</div>
            <div style={{ position: "absolute", top: -18, right: -18, width: 62, height: 62, borderRadius: "50%", background: C.lime, color: "#04050d", display: "grid", placeItems: "center", fontSize: 38, fontWeight: 700, transform: `scale(${done})`, boxShadow: "0 0 30px rgba(125,255,178,.8)" }}>✓</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 32, letterSpacing: 4, color: t > M.pulses[4] + 0.6 ? C.lime : C.cyan }}>
        {t > M.pulses[4] + 0.6 ? "✓ ALL TASKS COMPLETE" : <>● WORKFLOW RUNNING{".".repeat(Math.floor(t * 3) % 4)}</>}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 4. website builds itself ---------- */
const CURSOR_KEYS: [number, number, number][] = [[M4 + 0.9, 880, 1120], [M.web.type - 0.2, 640, 500], [M.web.type + 1.0, 640, 495], [M.web.image - 0.05, 700, 420], [M.web.image + 0.5, 790, 470], [M.web.cta - 0.05, 220, 600], [M.web.click, 230, 575], [M.web.click + 1.6, 520, 900]];
const cursorAt = (t: number): Pt => {
  if (t <= CURSOR_KEYS[0][0]) return { x: CURSOR_KEYS[0][1], y: CURSOR_KEYS[0][2] };
  for (let i = 0; i < CURSOR_KEYS.length - 1; i++) {
    const [t0, x0, y0] = CURSOR_KEYS[i], [t1, x1, y1] = CURSOR_KEYS[i + 1];
    if (t <= t1) return { x: interpolate(t, [t0, t1], [x0, x1], { easing: ez }), y: interpolate(t, [t0, t1], [y0, y1], { easing: ez }) };
  }
  const l = CURSOR_KEYS[CURSOR_KEYS.length - 1];
  return { x: l[1], y: l[2] };
};

const WebContent: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / BRAND_FPS;
  const op = win(t, M4 + 0.9, M4 + 1.3, M5 - 0.5, M5 - 0.1);
  if (op <= 0) return null;
  const rise = (at: number) => interpolate(t, [at, at + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cur = cursorAt(t);
  const press = spring({ frame: f - M.web.click * fps, fps, config: { damping: 9, stiffness: 220 } });
  const clicked = t >= M.web.click;
  const sel = interpolate(t, [M.web.type - 0.15, M.web.type + 0.1, M.web.type + 1.1, M.web.type + 1.3], [0, 1, 1, 0], clamp);
  const headline = "Your next customer starts here.";
  const typed = headline.slice(0, Math.max(0, Math.floor((t - M.web.type) * 28)));
  const DARK = "#0b0e1e";
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 940, height: 1160, marginLeft: -470, marginTop: -580, opacity: op }}>
      <div style={{ height: 84, background: "#e4e8fb", display: "flex", alignItems: "center", gap: 14, padding: "0 28px" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: c }} />)}
        <div style={{ marginLeft: 24, flex: 1, height: 46, borderRadius: 23, background: "#f6f8ff", fontFamily: mono, fontSize: 24, color: "#6b7290", display: "flex", alignItems: "center", padding: "0 24px" }}>🔒 yourbusiness.co.uk</div>
      </div>
      <div style={{ position: "absolute", top: 84, left: 0, right: 0, height: 96, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px", opacity: rise(M4 + 1.1), transform: `translateY(${(1 - rise(M4 + 1.1)) * -30}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 46, height: 46, borderRadius: 14, background: C.grad }} /><div style={{ fontFamily: disp, fontWeight: 700, fontSize: 32, color: DARK }}>Your Brand</div></div>
        <div style={{ fontFamily: mono, fontSize: 24, color: "#5b6385", display: "flex", gap: 30 }}><span>Services</span><span>Work</span><span>Contact</span></div>
      </div>
      <div style={{ position: "absolute", top: 220, left: 50, width: 560, fontFamily: disp, fontWeight: 700, fontSize: 82, lineHeight: 1.04, color: DARK, letterSpacing: -2, minHeight: 260 }}>
        {typed}
        {sel > 0 && <div style={{ position: "absolute", left: -12, top: -10, right: -12, bottom: -10, border: "3px solid #4f6bff", opacity: sel }}>{[[-8, -8], [552, -8], [-8, 262], [552, 262]].map(([x, y], i) => <div key={i} style={{ position: "absolute", left: x, top: y, width: 14, height: 14, background: "#fff", border: "3px solid #4f6bff" }} />)}</div>}
      </div>
      <div style={{ position: "absolute", top: 520, left: 50, width: 540, fontFamily: disp, fontWeight: 500, fontSize: 32, lineHeight: 1.3, color: "#5b6385", opacity: rise(M.web.cta - 0.5) }}>Fast, beautiful sites built to turn visitors into enquiries.</div>
      <div style={{ position: "absolute", top: 640, left: 50, padding: "26px 52px", borderRadius: 999, background: C.grad, fontFamily: disp, fontWeight: 700, fontSize: 40, color: "#04050d", opacity: rise(M.web.cta), transform: `scale(${clicked ? 1 - 0.06 * Math.min(press, 1) * (t < M.web.click + 0.25 ? 1 : 0) : 1})`, boxShadow: "0 18px 50px rgba(139,92,246,.45)" }}>Get a free quote →</div>
      {clicked && t < M.web.click + 0.8 && <div style={{ position: "absolute", left: 230 - 60 * (t - M.web.click) * 6, top: 695 - 60 * (t - M.web.click) * 6, width: 120 * (t - M.web.click) * 6 + 10, height: 120 * (t - M.web.click) * 6 + 10, borderRadius: "50%", border: "4px solid rgba(79,107,255,.8)", opacity: 1 - (t - M.web.click) / 0.8 }} />}
      <div style={{ position: "absolute", top: 210, right: 40, width: 270, height: 440, borderRadius: 40, overflow: "hidden", opacity: rise(M.web.image), transform: `translateY(${(1 - rise(M.web.image)) * 80}px) scale(${0.9 + 0.1 * rise(M.web.image)})`, background: "linear-gradient(180deg,#ffb36b,#ff4fd8 55%,#8b5cf6)" }}>
        <div style={{ position: "absolute", left: 60, top: 70, width: 150, height: 150, borderRadius: "50%", background: "#fff3c4", boxShadow: "0 0 60px #fff3c4" }} />
        <div style={{ position: "absolute", left: -60, top: 300, width: 300, height: 300, borderRadius: "50%", background: "#3a1670" }} />
        <div style={{ position: "absolute", left: 100, top: 340, width: 300, height: 300, borderRadius: "50%", background: "#24104d" }} />
      </div>
      <div style={{ position: "absolute", top: 770, left: 40, right: 40, display: "flex", gap: 24 }}>
        {[["⚡", "Fast"], ["🔎", "Found on Google"], ["📅", "Books jobs"]].map(([ic, tx], i) => (
          <div key={tx} style={{ flex: 1, height: 250, borderRadius: 34, background: "#fff", boxShadow: "0 16px 50px rgba(60,70,140,.18)", padding: "36px 28px", opacity: rise(M.web.cta + 0.2 + i * 0.18), transform: `translateY(${(1 - rise(M.web.cta + 0.2 + i * 0.18)) * 60}px)` }}>
            <div style={{ fontSize: 64 }}>{ic}</div>
            <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 34, color: DARK, marginTop: 14, lineHeight: 1.1 }}>{tx}</div>
          </div>
        ))}
      </div>
      {M.web.toasts.map((at, i) => {
        const p = spring({ frame: f - at * fps, fps, config: { damping: 12, stiffness: 140 } });
        const txt = ["📅  New booking · Thu 9am", "💬  New enquiry · quote request", "📞  Call booked · Fri 8am"][i];
        return <div key={i} style={{ position: "absolute", right: 30, top: 190 + i * 112, width: 520, padding: "22px 30px", borderRadius: 28, background: DARK, color: "#fff", fontFamily: disp, fontWeight: 700, fontSize: 31, boxShadow: "0 20px 60px rgba(0,0,0,.35)", opacity: Math.min(p, 1), transform: `translateX(${(1 - Math.min(p, 1)) * 600}px)`, borderLeft: `8px solid ${C.lime}` }}>{txt}</div>;
      })}
      <div style={{ position: "absolute", left: cur.x, top: cur.y, transform: "translate(-4px,-4px)", pointerEvents: "none" }}>
        <svg width="40" height="40" viewBox="0 0 24 24"><path d="M3 2l17 8-7 2-3 7z" fill="#fff" stroke="#0b0e1e" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        <div style={{ position: "absolute", left: 30, top: 34, padding: "6px 16px", borderRadius: 999, background: C.grad, color: "#04050d", fontFamily: mono, fontSize: 22, fontWeight: 500, whiteSpace: "nowrap" }}>AI by AO</div>
      </div>
    </div>
  );
};

/* ---------- 5. finale ---------- */
const TOKENS = ["📞", "💬", "⚙️", "🌐"];
const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / BRAND_FPS;
  if (t < M.finale.tokens - 0.3) return null;
  const merge = interpolate(t, [M.finale.merge, M.finale.logo], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const logo = spring({ frame: f - M.finale.logo * fps, fps, config: { damping: 9, stiffness: 110 } });
  const name = spring({ frame: f - (M.finale.logo + 0.25) * fps, fps, config: { damping: 14 } });
  const tag = interpolate(t, [M.finale.logo + 0.7, M.finale.logo + 1.2], [0, 1], clamp);
  const cta = spring({ frame: f - M.finale.cta * fps, fps, config: { damping: 9, stiffness: 140 } });
  const glow = 0.6 + 0.4 * Math.sin(f / 6);
  return (
    <AbsoluteFill>
      {t < M.finale.logo + 0.1 && TOKENS.map((e, i) => {
        const enter = spring({ frame: f - (M.finale.tokens + i * 0.12) * fps, fps, config: { damping: 12, stiffness: 90 } });
        const a = (f / BRAND_FPS) * 1.1 + (i / TOKENS.length) * Math.PI * 2;
        const r = 360 * (1 - merge) * Math.min(enter, 1);
        return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r - 70, top: 740 + Math.sin(a) * r * 0.62 - 70, width: 140, height: 140, borderRadius: "50%", background: "rgba(14,18,40,.85)", border: "3px solid rgba(255,255,255,.28)", display: "grid", placeItems: "center", fontSize: 70, opacity: Math.min(enter, 1) * (1 - merge * 0.5), transform: `scale(${1 - merge * 0.7})`, boxShadow: "0 0 50px rgba(139,92,246,.5)" }}>{e}</div>;
      })}
      <div style={{ position: "absolute", left: 540 - 150, top: 740 - 150, opacity: Math.min(logo, 1), transform: `scale(${logo})`, filter: "drop-shadow(0 0 40px rgba(139,92,246,.8))" }}><LogoMark size={300} /></div>
      <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", fontFamily: disp, fontWeight: 700, fontSize: 150, color: C.text, letterSpacing: -3, opacity: Math.min(name, 1), transform: `translateY(${(1 - Math.min(name, 1)) * 60}px)` }}>
        AI by <span style={{ background: C.grad, WebkitBackgroundClip: "text", color: "transparent" }}>AO</span>
      </div>
      <div style={{ position: "absolute", top: 1160, width: "100%", textAlign: "center", fontFamily: disp, fontWeight: 500, fontSize: 48, color: C.muted, opacity: tag }}>One partner. Every part of your business.</div>
      <div style={{ position: "absolute", top: 1290, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${cta})`, opacity: Math.min(cta, 1) }}>
        <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 62, color: "#04050d", background: C.grad, padding: "34px 80px", borderRadius: 999, boxShadow: `0 0 ${90 * glow}px rgba(139,92,246,.8)` }}>Book your free demo →</div>
      </div>
      <div style={{ position: "absolute", top: 1450, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 42, color: C.cyan, opacity: Math.min(cta, 1) }}>aibyao.com · Leeds, UK</div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */
export const BrandFilm: React.FC<{ storyId: string }> = ({ storyId }) => {
  const f = useCurrentFrame();
  const t = f / BRAND_FPS;
  const w = heroW(f), h = heroH(f), r = heroR(f), y = heroY(f);
  const sp = sphereOp(f), lp = lightOp(f), os = orbState(f);
  const intro = spring({ frame: f - 0.6 * BRAND_FPS, fps: BRAND_FPS, config: { damping: 12, stiffness: 60 } });
  const absorbPulse = t > M.absorb - 0.1 && t < M.absorb + 0.6 ? 1 + 0.2 * Math.sin(((t - M.absorb + 0.1) / 0.7) * Math.PI) : 1;
  const breathe = 1 + 0.025 * Math.sin(f / 12) * os;
  const hideForFinale = t >= M.finale.logo ? interpolate(t, [M.finale.logo, M.finale.logo + 0.15], [1, 0], clamp) : 1;
  const heroScale = (t < 3 ? Math.min(intro, 1.02) : 1) * absorbPulse * breathe;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile(`audio/${storyId}.wav`)} />
      <Backdrop />
      {/* planet ring, behind */}
      <div style={{ position: "absolute", left: 540 - 330, top: y - 95, width: 660, height: 190, borderRadius: "50%", border: "5px solid #ff4fd8", transform: `rotate(-14deg) scale(${heroScale})`, opacity: os * 0.8 * hideForFinale, boxShadow: "0 0 30px rgba(255,79,216,.5)" }} />
      {t < 0.6 && <div style={{ position: "absolute", left: 540 - 5, top: 780 - 5, width: 10, height: 10, borderRadius: "50%", background: "#fff", boxShadow: "0 0 30px 10px #38e1ff", opacity: interpolate(t, [0.1, 0.5], [0, 1], clamp) }} />}
      <RingRipples />
      <div style={{ position: "absolute", left: 540 - w / 2, top: y - h / 2, width: w, height: h, borderRadius: r, overflow: "hidden", transform: `scale(${heroScale})`, opacity: t < 0.6 ? 0 : hideForFinale, boxShadow: sp > 0.5 ? "0 0 140px rgba(139,92,246,.55)" : "0 0 120px rgba(139,92,246,.35), 0 40px 100px rgba(0,0,0,.5)", border: sp > 0.9 ? "none" : "10px solid #1b2147", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#070b22,#150b3b 70%,#0a0e28)", opacity: 1 - sp }} />
        <div style={{ position: "absolute", inset: 0, background: "#f2f4ff", opacity: lp }} />
        <div style={{ position: "absolute", inset: 0, opacity: sp }}><Sphere /></div>
        <PhoneContent />
        <ChatContent />
        <WebContent />
      </div>
      {/* planet ring, in front of the lower half of the orb */}
      <div style={{ position: "absolute", left: 540 - 330, top: y - 95, width: 660, height: 190, borderRadius: "50%", border: "5px solid #ff4fd8", transform: `rotate(-14deg) scale(${heroScale})`, opacity: os * 0.9 * hideForFinale, clipPath: "inset(52% 0 0 0)" }} />
      <Chaos />
      <Workflow />
      {[M.absorb, ...M.morph].map((at, i) => <Shockwave key={i} at={at} color={i % 2 ? "rgba(255,79,216,.8)" : "rgba(56,225,255,.85)"} />)}
      <Shockwave at={M.finale.logo} color="rgba(139,92,246,.9)" />
      <Finale />
      <Captions storyId={storyId} />
    </AbsoluteFill>
  );
};
