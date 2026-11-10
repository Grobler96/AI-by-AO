import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { SP, chunky, glowBox, neon, round } from "../theme-spinpix";
import { Confetti, Contact, Cta, FPS, Flashes, Neon, SpinCaptions, Soundtrack, Stage, Star, Wordmark, clamp, ez, film, pop } from "./kit";

/* "One place": a premium, minimal concept ad for SpinPix UK as a whole business.
   Thin line -> tangled supplier nodes -> hush -> loading ring -> neon orb + name -> prompt box -> burst of cards -> end card.
   Every timing comes from the marks in spinpix.json (the audio reads the same ones). */
const ID = "spinpix-brand";
const fl = film(ID);
const M = fl.marks as Record<string, number>;
const PROMPT = (fl as unknown as { prompt: string }).prompt;

const CX = 540, CY = 960;
const O = { x: 40, y: CY }; // where the line splits into branches

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const rampEz = (t: number, a: number, b: number) => ez(ramp(t, a, b));
const mixCol = (p: number) => `rgb(255,${Math.round(lerp(92, 51, p))},${Math.round(lerp(192, 85, p))})`;

/* ---------- the supplier nodes ---------- */
type Node = { x: number; y: number; label: string; color: string; ph: number };
const NODES: Node[] = [
  { x: 770, y: 470, label: "booth hire quote", color: SP.blue, ph: 0 },
  { x: 290, y: 610, label: "magic mirror?", color: SP.hot, ph: 1 },
  { x: 800, y: 780, label: "props", color: SP.violet, ph: 2 },
  { x: 250, y: 1150, label: "prints", color: SP.blue, ph: 3 },
  { x: 790, y: 1180, label: "guest gallery", color: SP.hot, ph: 4 },
  { x: 340, y: 1400, label: "deposit", color: SP.violet, ph: 5 },
];
const DATE: Node = { x: 650, y: 1490, label: "Is my date free?", color: "#ff3355", ph: 6 };
const TANGLE: [number, number][] = [[0, 4], [1, 3], [2, 5], [3, 0], [4, 1], [5, 2]];
const DATE_LINKS = [3, 4, 5, 0];

const chaosAmt = (t: number) => (t < M.chaos ? 0 : Math.pow(ramp(t, M.chaos, M.hush - 0.2), 1.4));
const jit = (i: number, k: number, t: number) => (random(`j${i}-${k}-${Math.floor(t * FPS / 2)}`) - 0.5) * 2;

const nodePos = (n: Node, t: number) => {
  const C = chaosAmt(t);
  const h = rampEz(t, M.hush, M.ring - 0.3);
  const x = n.x + C * (jit(n.ph, 0, t) * 26 + Math.sin(t * 5 + n.ph) * 14);
  const y = n.y + C * (jit(n.ph, 1, t) * 26 + Math.cos(t * 4 + n.ph) * 14);
  return { x: lerp(x, CX, h), y: lerp(y, CY, h) };
};

const curve = (a: { x: number; y: number }, b: { x: number; y: number }, t: number, i: number, wob: number) => {
  const c1x = a.x + (b.x - a.x) * 0.45, c2x = a.x + (b.x - a.x) * 0.55;
  const c1y = a.y + Math.sin(t * 3 + i) * wob * 260 + (i % 2 ? 90 : -90) * (1 - wob);
  const c2y = b.y + Math.cos(t * 4 + i * 1.7) * wob * 320;
  return `M${a.x},${a.y} C${c1x},${c1y} ${c2x},${c2y} ${b.x},${b.y}`;
};

const Line: React.FC<{ d: string; o: number; color: string; p?: number; w?: number }> = ({ d, o, color, p = 1, w = 2.5 }) => (
  <>
    <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w * 4} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={o * 0.18} />
    <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={o} />
  </>
);

/** the thin line: draws across, ripples into a waveform, then hands over to the branches */
const Wave: React.FC<{ t: number }> = ({ t }) => {
  const draw = rampEz(t, M.line, M.line + 1.0);
  const amp = rampEz(t, M.line + 0.9, M.split) * 30;
  const fade = 1 - ramp(t, M.split, M.split + 0.5);
  const x1 = lerp(0, 1080, draw);
  const pts: string[] = [];
  for (let x = 0; x <= x1; x += 8) {
    const env = Math.sin((x / 1080) * Math.PI);
    const y = CY + Math.sin(x * 0.035 + t * 9) * amp * env * (0.6 + 0.4 * Math.sin(x * 0.011 - t * 3));
    pts.push(`${x},${y.toFixed(1)}`);
  }
  if (pts.length < 2) return null;
  const d = "M" + pts.join(" L");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={SP.pink} strokeWidth={14} opacity={0.2 * fade} strokeLinecap="round" />
      <path d={d} fill="none" stroke={SP.hot} strokeWidth={2.5} opacity={fade} strokeLinecap="round" />
      {draw < 1 && <circle cx={x1} cy={CY} r={7} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${SP.pink})` }} opacity={fade} />}
    </svg>
  );
};

const Pill: React.FC<{ x: number; y: number; label: string; color: string; o: number; scale?: number; blink?: boolean; hot?: boolean }> = ({ x, y, label, color, o, scale = 1, blink, hot }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${scale})`, opacity: o, display: "flex", alignItems: "center", gap: 14, padding: "14px 28px 14px 22px", borderRadius: 999, background: hot ? "rgba(70,6,22,.85)" : "rgba(22,12,40,.82)", border: `2px solid ${hot ? "#ff3355" : "rgba(255,255,255,.28)"}`, boxShadow: hot ? `0 0 ${blink ? 46 : 14}px #ff3355` : `0 0 22px ${color}44`, fontFamily: round, fontWeight: 600, fontSize: 34, color: hot ? "#ffd5dc" : SP.muted, whiteSpace: "nowrap" }}>
    <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, boxShadow: `0 0 14px ${color}` }} />{label}
  </div>
);

const Network: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.split - 0.1 || t > M.ring) return null;
  const C = chaosAmt(t);
  const h = rampEz(t, M.hush, M.ring - 0.3);
  const linesO = 1 - ramp(t, M.hush, M.hush + 0.25);
  const col = mixCol(C);
  const O1 = { x: O.x + 40, y: O.y };
  const dateIn = rampEz(t, M.chaos, M.chaos + 0.7);
  const dp = nodePos(DATE, t);
  const blink = Math.floor(t * 5) % 2 === 0;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* the trunk the branches grow from */}
        <Line d={`M0,${CY} L${O1.x},${CY}`} o={linesO} color={col} />
        {NODES.map((n, i) => {
          const s = M.split + i * 0.18;
          return <Line key={i} d={curve(O1, nodePos(n, t), t, i, C)} o={linesO * (0.85 - 0.2 * C)} color={col} p={rampEz(t, s, s + 1.0)} />;
        })}
        {TANGLE.map(([a, b], i) => (
          <Line key={`t${i}`} d={curve(nodePos(NODES[a], t), nodePos(NODES[b], t), t + 2, i + 7, 0.4 + C * 0.9)} o={linesO * C * 0.7} color={col} p={rampEz(t, M.chaos + 0.2 + i * 0.35, M.chaos + 1.0 + i * 0.35)} w={2} />
        ))}
        {DATE_LINKS.map((a, i) => (
          <Line key={`d${i}`} d={curve(nodePos(NODES[a], t), dp, t + 4, i + 3, 0.6 + C)} o={linesO * dateIn} color="#ff3355" p={rampEz(t, M.chaos, M.chaos + 0.9)} w={2.5} />
        ))}
      </svg>
      {NODES.map((n, i) => {
        const p = nodePos(n, t);
        const s = M.split + i * 0.18 + 0.6;
        const o = ramp(t, s, s + 0.25);
        const label = 1 - ramp(t, M.hush, M.hush + 0.2);
        return (
          <React.Fragment key={i}>
            <Pill x={p.x} y={p.y} label={n.label} color={n.color} o={o * label} scale={0.85 + 0.15 * o} />
            <Dot x={p.x} y={p.y} color={n.color} o={o * (1 - label)} />
          </React.Fragment>
        );
      })}
      {t >= M.chaos && (
        <>
          <Pill x={dp.x} y={dp.y} label={DATE.label} color={DATE.color} hot blink={blink} o={dateIn * (blink ? 1 : 0.55) * (1 - ramp(t, M.hush, M.hush + 0.2))} scale={0.8 + 0.25 * dateIn} />
          <Dot x={dp.x} y={dp.y} color="#ff3355" o={ramp(t, M.hush, M.hush + 0.2) * dateIn} />
        </>
      )}
      {/* a dark, mid-air hush before the ring */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,92,192,${0.5 * h}), transparent ${10 + 30 * h}%)` }} />
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ x: number; y: number; color: string; o: number; r?: number }> = ({ x, y, color, o, r = 8 }) =>
  o <= 0 ? null : <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: "#fff", boxShadow: `0 0 18px ${color}, 0 0 40px ${color}`, opacity: o }} />;

/** extra dots flying in to the centre for the hush */
const Particles: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.hush || t > M.ring + 0.3) return null;
  return (
    <AbsoluteFill>
      {Array.from({ length: 40 }).map((_, i) => {
        const sx = random(`px${i}`) * 1080, sy = random(`py${i}`) * 1920;
        const d = random(`pd${i}`) * 0.25;
        const p = ez(ramp(t, M.hush + d, M.hush + d + 0.6));
        const o = ramp(t, M.hush, M.hush + 0.1) * (1 - ramp(t, M.hush + d + 0.5, M.hush + d + 0.65));
        return <Dot key={i} x={lerp(sx, CX, p)} y={lerp(sy, CY, p)} color={i % 2 ? SP.pink : SP.blue} o={o} r={4 + random(`pr${i}`) * 4} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- loading ring and orb ---------- */
const LoadingRing: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.ring - 0.1 || t > M.bloom + 0.6) return null;
  const inO = ramp(t, M.ring - 0.1, M.ring + 0.2);
  const out = ramp(t, M.bloom, M.bloom + 0.5);
  const prog = rampEz(t, M.ring + 0.1, M.bloom - 0.05);
  const R = 130;
  const rot = (t - M.ring) * 260;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: inO * (1 - out), transform: `scale(${1 + out * 0.9})`, transformOrigin: `${CX}px ${CY}px` }}>
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={SP.blue} /><stop offset="0.5" stopColor={SP.violet} /><stop offset="1" stopColor={SP.pink} /></linearGradient>
      </defs>
      <g transform={`rotate(${rot} ${CX} ${CY})`}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={4} strokeDasharray="3 16" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#rg)" strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - 0.08 - prog * 0.92} style={{ filter: `drop-shadow(0 0 14px ${SP.violet})` }} />
      </g>
      <circle cx={CX} cy={CY} r={6 + prog * 10} fill="#fff" style={{ filter: `drop-shadow(0 0 16px ${SP.pink})` }} />
    </svg>
  );
};

/** where the orb is, and how big, at time t */
const orbState = (t: number) => {
  const travel = rampEz(t, M.prompt - 0.1, M.prompt + 0.75);
  const lift = rampEz(t, M.name - 0.3, M.name + 0.4);
  const x = lerp(CX, 878, travel);
  const y = lerp(lerp(CY, 860, lift), 1150, travel);
  const d = lerp(300, 112, travel);
  return { x, y, d };
};

const Orb: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  if (t < M.bloom || t > M.burst + 0.7) return null;
  const s = Math.max(0, pop(f, M.bloom, 9, 110));
  const st = orbState(t);
  const press = t > M.send && t < M.send + 0.22 ? 0.84 : 1;
  const blast = rampEz(t, M.burst, M.burst + 0.6);
  const d = st.d * Math.min(s, 1.15) * press * (1 + blast * 2.2) * (1 + 0.03 * Math.sin(t * 5));
  const o = 1 - ramp(t, M.burst + 0.05, M.burst + 0.35);
  const btn = ramp(t, M.prompt + 0.4, M.prompt + 0.9);
  const burst = ramp(t, M.bloom, M.bloom + 0.12) * (1 - ramp(t, M.bloom + 0.12, M.bloom + 0.7));
  const spin = t * 50;
  return (
    <>
      {/* bloom shockwave */}
      {t < M.bloom + 0.9 && <div style={{ position: "absolute", left: CX - 200 - (t - M.bloom) * 700, top: CY - 200 - (t - M.bloom) * 700, width: 400 + (t - M.bloom) * 1400, height: 400 + (t - M.bloom) * 1400, borderRadius: "50%", border: `4px solid ${SP.hot}`, opacity: Math.max(0, 1 - (t - M.bloom) / 0.9) * 0.6 }} />}
      <div style={{ position: "absolute", left: st.x - d / 2, top: st.y - d / 2, width: d, height: d, borderRadius: "50%", opacity: o, background: `radial-gradient(circle at 38% 32%, #fff 0, #ffd1ef 9%, ${SP.hot} 30%, ${SP.violet} 62%, ${SP.blue} 100%)`, boxShadow: `0 0 ${d * 0.18}px ${SP.hot}, 0 0 ${d * 0.5}px ${SP.violet}, 0 0 ${d * 1.1}px ${SP.blue}66, inset 0 0 ${d * 0.2}px #fff8`, filter: `brightness(${1 + burst * 0.8})` }}>
        <div style={{ position: "absolute", inset: "6%", borderRadius: "50%", background: `conic-gradient(from ${spin}deg, transparent, ${SP.blue}aa, transparent 40%, ${SP.pink}aa 60%, transparent)`, filter: "blur(10px)", mixBlendMode: "screen", opacity: 0.8 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: round, fontWeight: 700, fontSize: d * 0.5, color: "#fff", opacity: btn, textShadow: "0 2px 10px rgba(60,0,80,.6)" }}>↑</div>
      </div>
    </>
  );
};

/* ---------- the name ---------- */
const Name: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.name || t > M.prompt + 0.4) return null;
  const inO = ramp(t, M.name, M.name + 0.8);
  const out = 1 - ramp(t, M.prompt - 0.1, M.prompt + 0.3);
  return (
    <div style={{ position: "absolute", top: 1070, left: 0, right: 0, textAlign: "center", fontFamily: round, fontWeight: 500, fontSize: 96, color: "#fff", letterSpacing: `${lerp(0.55, 0.3, inO)}em`, paddingLeft: "0.3em", opacity: inO * out, textShadow: `0 0 30px ${SP.violet}88`, transform: `translateY(${(1 - inO) * 12}px)` }}>
      SpinPix <span style={{ color: SP.hot }}>UK</span>
    </div>
  );
};

/* ---------- blurred neon dancefloor backdrop ---------- */
const Floor: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", left: "50%", top: 880, width: 1800, height: 1300, transform: "translateX(-50%) perspective(900px) rotateX(62deg)", display: "grid", gridTemplateColumns: "repeat(9,1fr)", gridTemplateRows: "repeat(7,1fr)", gap: 8 }}>
    {Array.from({ length: 63 }).map((_, i) => {
      const r = Math.floor(i / 9), c = i % 9;
      const v = 0.5 + 0.5 * Math.sin(t * 3.2 + r * 0.9 + c * 1.3);
      const col = [SP.pink, SP.blue, SP.violet][(r + c) % 3];
      return <div key={i} style={{ background: col, opacity: 0.2 + 0.7 * v, borderRadius: 10, boxShadow: `0 0 30px ${col}` }} />;
    })}
  </div>
);

const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const o = ramp(t, M.prompt - 0.4, M.prompt + 0.4);
  if (o <= 0) return null;
  const blur = interpolate(t, [M.burst, M.burst + 0.5], [18, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        <Stage drift={t * 40}><Floor t={t} /></Stage>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(7,5,12,${lerp(0.18, 0.15, ramp(t, M.burst, M.burst + 0.5))})` }} />
    </AbsoluteFill>
  );
};

/* ---------- the prompt box ---------- */
const PromptBox: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  if (t < M.prompt || t > M.burst + 0.5) return null;
  const s = Math.min(pop(f, M.prompt, 13, 120), 1.05);
  const out = 1 - rampEz(t, M.burst, M.burst + 0.3);
  const n = Math.floor(interpolate(t, [M.type, M.typeEnd], [0, PROMPT.length], clamp));
  const typed = PROMPT.slice(0, n);
  const typing = t >= M.type && t < M.send;
  const cursor = (typing || t < M.type) && Math.floor(t * 2.4) % 2 === 0;
  const sent = t >= M.send;
  return (
    <div style={{ opacity: Math.min(s, 1) * out, transform: `scale(${(0.94 + 0.06 * Math.min(s, 1)) * (1 + (1 - out) * 0.15)})`, transformOrigin: `${CX}px 1000px` }}>
      <div style={{ position: "absolute", top: 730, left: 0, right: 0, textAlign: "center", fontFamily: round, fontWeight: 500, fontSize: 64, color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,.6)" }}>What's the occasion?</div>
      <div style={{ position: "absolute", left: 90, top: 850, width: 900, height: 380, borderRadius: 48, background: "rgba(16,9,32,.6)", backdropFilter: "blur(24px)", border: "2px solid rgba(255,255,255,.28)", boxShadow: `0 0 ${sent ? 70 : 34}px ${SP.violet}${sent ? "cc" : "66"}, 0 30px 80px rgba(0,0,0,.5)` }}>
        <div style={{ position: "absolute", left: 48, top: 44, right: 48, fontFamily: round, fontWeight: 500, fontSize: 50, lineHeight: 1.3, color: typed || typing ? "#fff" : "rgba(255,255,255,.4)" }}>
          {typed || (typing ? "" : "Describe your event…")}
          <span style={{ display: "inline-block", width: 4, height: 54, marginLeft: 4, verticalAlign: -8, background: SP.hot, opacity: cursor ? 1 : 0 }} />
        </div>
        <div style={{ position: "absolute", left: 48, bottom: 40, display: "flex", gap: 14 }}>
          {["📅 Date", "👥 Guests"].map((c) => (
            <div key={c} style={{ fontFamily: round, fontWeight: 600, fontSize: 30, color: SP.muted, padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,.2)" }}>{c}</div>
          ))}
        </div>
      </div>
      {/* tap ripple on the send button */}
      {t >= M.send && t < M.send + 0.6 && <div style={{ position: "absolute", left: 878 - 56 - (t - M.send) * 220, top: 1150 - 56 - (t - M.send) * 220, width: 112 + (t - M.send) * 440, height: 112 + (t - M.send) * 440, borderRadius: "50%", border: `4px solid ${SP.hot}`, opacity: 1 - (t - M.send) / 0.6 }} />}
    </div>
  );
};

/* ---------- the burst of cards ---------- */
const CARDS = [
  { label: "Magic Mirror", icon: "🪞", a: SP.hot, b: SP.violet },
  { label: "360 Spin", icon: "🌀", a: SP.blue, b: SP.violet },
  { label: "Selfie Pod", icon: "🤳", a: SP.pink, b: SP.hot },
  { label: "Classic Booth", icon: "📸", a: SP.violet, b: SP.blue },
  { label: "Prom Night", icon: "🪩", a: SP.violet, b: SP.pink },
  { label: "Corporate", icon: "💼", a: SP.blue, b: "#2a6bff" },
  { label: "Props Table", icon: "🎩", a: SP.pink, b: SP.violet },
  { label: "QR Gallery", icon: "📲", a: SP.green, b: SP.blue },
];

const Cards: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.burst) return null;
  const d = t - M.burst;
  const dim = rampEz(t, M.end - 0.2, M.end + 0.4);
  const list = CARDS.map((c, i) => {
    const Rx = i % 2 ? 330 : 440, Ry = i % 2 ? 560 : 700;
    const ang = (i / CARDS.length) * Math.PI * 2 + 0.35 + d * 0.3 + Math.sin(i * 3.1) * 0.1;
    const r = (1 - Math.exp(-8 * d)) * (1 + 1.25 * Math.exp(-2.2 * d));
    const x = CX + Math.cos(ang) * Rx * r;
    const y = CY - 40 + Math.sin(ang) * Ry * r;
    const depth = Math.sin(ang); // + = near the camera
    const sc = (0.78 + 0.2 * depth) * Math.min(1, 0.4 + d * 4) * (1 - 0.12 * dim);
    const spin = (i % 2 ? 1 : -1) * 420 * Math.exp(-3 * d) + Math.cos(ang) * 10;
    return { c, i, x, y, depth, sc, spin };
  }).sort((a, b) => a.depth - b.depth);
  return (
    <AbsoluteFill>
      {list.map(({ c, i, x, y, sc, spin, depth }) => (
        <div key={i} style={{ position: "absolute", left: x - 150, top: y - 200, width: 300, height: 400, borderRadius: 38, transform: `rotate(${spin}deg) scale(${sc})`, opacity: lerp(1, 0.3, dim), filter: dim > 0 && depth < 0 ? `blur(${2 * dim}px)` : undefined, background: `linear-gradient(155deg, ${c.a}, ${c.b})`, border: "3px solid rgba(255,255,255,.7)", boxShadow: `0 0 40px ${c.a}99, 0 24px 60px rgba(0,0,0,.45)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontSize: 140, lineHeight: 1, filter: "drop-shadow(0 8px 12px rgba(0,0,0,.35))" }}>{c.icon}</div>
          <div style={{ fontFamily: round, fontWeight: 700, fontSize: 42, color: "#fff", textShadow: "0 3px 14px rgba(40,0,60,.7)", textAlign: "center", lineHeight: 1.05 }}>{c.label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const StarFlash: React.FC<{ t: number }> = ({ t }) => {
  const d = t - M.burst;
  if (d < 0 || d > 0.5) return null;
  const p = d / 0.5;
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #fff, rgba(255,230,247,.7) 40%, transparent 75%)", opacity: Math.pow(1 - p, 3) * 0.9 }} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${CX} ${CY}) rotate(${p * 40}) scale(${(120 + p * 900) / 20})`} opacity={1 - Math.pow(p, 2.5)}>
          <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10Z" fill="#fff" />
        </g>
      </svg>
    </>
  );
};

export const OnePlace: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const endShade = rampEz(t, M.end - 0.2, M.end + 0.5);
  const sp = ramp(t, M.line, M.line + 0.9) * (1 - ramp(t, M.split + 0.2, M.split + 0.8));
  return (
    <AbsoluteFill style={{ background: SP.bg }}>
      <Soundtrack id={ID} />
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% 50%, rgba(155,77,255,${0.12 * ramp(t, M.ring, M.bloom)}), transparent 70%)` }} />
      <Backdrop t={t} />
      <Wave t={t} />
      {sp > 0 && <Star x={CX} y={CY} size={50 + 24 * Math.sin(t * 8)} opacity={sp} rot={t * 60} />}
      <Network t={t} />
      <Particles t={t} />
      <LoadingRing t={t} />
      <Name t={t} />
      <PromptBox t={t} f={f} />
      <Orb t={t} f={f} />
      <Cards t={t} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 55% at 50% 42%, rgba(7,5,12,${0.78 * endShade}), rgba(7,5,12,${0.3 * endShade}))` }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 45%, rgba(7,5,12,${0.7 * endShade}) 75%)` }} />
      <StarFlash t={t} />
      <Flashes at={[M.burst]} strength={0.5} />
      <Confetti x={CX} y={CY} el={t - M.burst - 0.03} n={110} seed="b" power={1.5} />
      <Wordmark at={M.end} top={330} scale={0.88} />
      {[[190, 470, 60], [880, 560, 44], [830, 330, 34]].map(([x, y, s], i) => t > M.end + 0.15 * i && <Star key={i} x={x} y={y} size={s} opacity={Math.max(0, Math.sin((t - M.end - 0.15 * i) * 3.2)) ** 2} rot={t * 40} />)}
      <Neon on={M.end + 0.35} top={780} size={74} color={SP.blue} font={round} off={99}>Capture the moment.</Neon>
      <Neon on={M.fun} top={900} size={140} color={SP.pink}>Spin the<br />fun.</Neon>
      <Cta at={M.cta} top={1290} label="Check my date" />
      <Contact at={M.cta + 0.3} top={1480} />
      <SpinCaptions id={ID} subtle bottom={150} />
    </AbsoluteFill>
  );
};
