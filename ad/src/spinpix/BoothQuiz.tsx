import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SP, chunky, glowBox, neon, round } from "../theme-spinpix";
import { Confetti, Contact, Cta, FPS, Flashes, Guest, PhoneFrame, SpinCaptions, Soundtrack, Stage, Star, Wordmark, clamp, film, pop } from "./kit";

/* "Find your booth": a quiz on a phone picks the Magic Mirror for a wedding and the 360 Spin for a prom,
   then the date picker says the date is free. */
const ID = "spinpix-quiz";
const M = film(ID).marks as Record<string, number>;

const PW = 760, PH = 1360, PX = 540, PY = 790;
const CHIPS = [
  { icon: "💍", label: "Wedding" },
  { icon: "🎓", label: "Prom" },
  { icon: "🎉", label: "Party" },
  { icon: "💼", label: "Work event" },
];
const chipPos = (i: number) => ({ x: 50 + (i % 2) * 340, y: 420 + Math.floor(i / 2) * 300 });
const DATE = 12; // Saturday 12 June 2027
const FIRST_DOW = 1; // 1 June 2027 is a Tuesday (Mon-first grid: index 1)
const cell = (d: number) => { const k = d - 1 + FIRST_DOW; return { x: 40 + (k % 7) * 97, y: 500 + Math.floor(k / 7) * 100 }; };

/* where the fingertip is (phone-local coordinates), keyed by seconds */
const FINGER: [number, number, number][] = [
  [1.6, 900, 1500], [M.tapWed - 0.05, chipPos(0).x + 150, chipPos(0).y + 130], [M.tapWed + 0.4, chipPos(0).x + 170, chipPos(0).y + 170],
  [M.back + 0.1, chipPos(1).x + 140, chipPos(1).y + 180], [M.tapProm - 0.02, chipPos(1).x + 150, chipPos(1).y + 130], [M.tapProm + 0.5, 600, 1200],
  [M.tapDate - 0.6, 600, 1100], [M.tapDate - 0.03, cell(DATE).x + 48, cell(DATE).y + 45], [M.tapDate + 0.6, 700, 1250],
];
const fingerAt = (t: number) => {
  if (t <= FINGER[0][0]) return { x: FINGER[0][1], y: FINGER[0][2] };
  for (let i = 0; i < FINGER.length - 1; i++) {
    const [t0, x0, y0] = FINGER[i], [t1, x1, y1] = FINGER[i + 1];
    if (t <= t1) { const e = Easing.inOut(Easing.cubic); return { x: interpolate(t, [t0, t1], [x0, x1], { easing: e }), y: interpolate(t, [t0, t1], [y0, y1], { easing: e }) }; }
  }
  const l = FINGER[FINGER.length - 1]; return { x: l[1], y: l[2] };
};
const TAPS = [M.tapWed, M.tapProm, M.tapDate];

const Finger: React.FC<{ t: number }> = ({ t }) => {
  const p = fingerAt(t);
  const tap = TAPS.find((a) => t >= a && t < a + 0.45);
  const k = tap !== undefined ? (t - tap) / 0.45 : 0;
  const o = interpolate(t, [1.5, 1.9, M.quote - 0.4, M.quote], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: p.x - 45, top: p.y - 45, width: 90, height: 90, opacity: o }}>
      {tap !== undefined && <div style={{ position: "absolute", left: 45 - 45 - k * 60, top: 45 - 45 - k * 60, width: 90 + k * 120, height: 90 + k * 120, borderRadius: "50%", border: `5px solid ${SP.hot}`, opacity: 1 - k }} />}
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.35)", border: "4px solid #fff", transform: `scale(${tap !== undefined && k < 0.3 ? 0.8 : 1})`, boxShadow: "0 0 24px rgba(255,255,255,.6)" }} />
    </div>
  );
};

/* ---------- screens ---------- */
const Header: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
    <div style={{ fontFamily: chunky, fontSize: 40, background: SP.grad, WebkitBackgroundClip: "text", color: "transparent" }}>SPINPIX <span style={{ color: "#fff", WebkitTextFillColor: "#fff" }}>UK</span></div>
    <div style={{ fontFamily: round, fontWeight: 600, fontSize: 30, color: SP.muted, marginTop: 4, letterSpacing: 2 }}>{title}</div>
  </div>
);

const Question: React.FC<{ t: number; picked: number | null }> = ({ t, picked }) => (
  <AbsoluteFill>
    <Header title="BOOTH FINDER  ✨" />
    <div style={{ position: "absolute", top: 230, left: 50, right: 50, fontFamily: round, fontWeight: 700, fontSize: 64, lineHeight: 1.1, color: "#fff" }}>What are you celebrating?</div>
    {CHIPS.map((c, i) => {
      const p = chipPos(i);
      const on = picked === i;
      const enter = interpolate(t, [0.5 + i * 0.1, 0.8 + i * 0.1], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
      return (
        <div key={i} style={{ position: "absolute", left: p.x, top: p.y, width: 310, height: 260, borderRadius: 44, background: on ? SP.gradPink : "rgba(255,255,255,.08)", border: `4px solid ${on ? "#ffd1ef" : "rgba(255,255,255,.18)"}`, boxShadow: on ? glowBox(SP.pink, 1.2) : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `scale(${enter * (on ? 1.05 : 1)})` }}>
          <div style={{ fontSize: 100 }}>{c.icon}</div>
          <div style={{ fontFamily: round, fontWeight: 700, fontSize: 44, color: "#fff" }}>{c.label}</div>
        </div>
      );
    })}
    <div style={{ position: "absolute", top: 1060, left: 50, right: 50, height: 14, borderRadius: 7, background: "rgba(255,255,255,.1)" }}>
      <div style={{ width: "50%", height: "100%", borderRadius: 7, background: SP.grad }} />
    </div>
  </AbsoluteFill>
);

const MirrorArt: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "relative", width: 300, height: 480 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "150px 150px 24px 24px", border: "10px solid #ffd1ef", boxShadow: glowBox(SP.pink, 1.5), background: "linear-gradient(160deg, rgba(255,255,255,.35), rgba(155,77,255,.25) 40%, rgba(34,196,255,.25))", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -80, top: -40 + ((f * 6) % 700), width: 500, height: 70, background: "rgba(255,255,255,.35)", transform: "rotate(-30deg)", filter: "blur(6px)" }} />
      <Guest x={150} y={470} h={330} color={SP.violet} arms={[150, -40]} />
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: round, fontWeight: 700, fontSize: 36, color: "#fff", textShadow: neon(SP.pink, 0.6) }}>Strike a pose!</div>
    </div>
    <Star x={20} y={60} size={50} opacity={0.5 + 0.5 * Math.sin(f / 5)} />
    <Star x={290} y={200} size={36} opacity={0.5 + 0.5 * Math.cos(f / 6)} color="#ffd1ef" />
  </div>
);

const SpinArt: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "relative", width: 420, height: 480 }}>
    <div style={{ position: "absolute", left: 30, top: 370, width: 360, height: 100, borderRadius: "50%", border: `8px solid ${SP.pink}`, boxShadow: glowBox(SP.pink, 1.3), background: "#2a1048" }} />
    <Guest x={210} y={415} h={360} color={SP.blue} turn={f / 8} arms={[150, -150]} />
    <div style={{ position: "absolute", left: 50, top: 160, width: 320, height: 90, borderRadius: "50%", border: "5px solid #fff", boxShadow: glowBox(SP.violet, 1.3), transform: `rotate(${10 * Math.sin(f / 8)}deg)` }} />
  </div>
);

const Result: React.FC<{ t: number; at: number; name: string; perfect: string; art: React.ReactNode }> = ({ t, at, name, perfect, art }) => {
  const f = Math.round(t * FPS);
  const s = pop(f, at, 10, 150);
  return (
    <AbsoluteFill>
      <Header title="YOUR MATCH  💖" />
      <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${Math.min(s, 1.1)})` }}>{art}</div>
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", fontFamily: chunky, fontSize: 84, color: "#fff", textShadow: neon(SP.pink, 1), transform: `scale(${pop(f, at + 0.15, 9, 170)})` }}>{name}</div>
      <div style={{ position: "absolute", top: 890, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(t, [at + 0.4, at + 0.7], [0, 1], clamp) }}>
        <div style={{ fontFamily: round, fontWeight: 700, fontSize: 40, color: "#fff", padding: "16px 36px", borderRadius: 999, background: "rgba(255,255,255,.1)", border: `3px solid ${SP.blue}`, boxShadow: glowBox(SP.blue, 0.6) }}>{perfect}</div>
      </div>
      <div style={{ position: "absolute", top: 1060, left: 50, right: 50, height: 14, borderRadius: 7, background: "rgba(255,255,255,.1)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 7, background: SP.grad }} />
      </div>
    </AbsoluteFill>
  );
};

const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const picked = t >= M.tapDate;
  const free = pop(Math.round(t * FPS), M.free, 9, 160);
  return (
    <AbsoluteFill>
      <Header title="CHECK MY DATE  📅" />
      <div style={{ position: "absolute", top: 240, left: 50, fontFamily: round, fontWeight: 700, fontSize: 60, color: "#fff" }}>Pick your date</div>
      <div style={{ position: "absolute", top: 330, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: round, fontWeight: 700, fontSize: 44, color: "#fff" }}><span style={{ color: SP.muted }}>‹</span>June 2027<span style={{ color: SP.muted }}>›</span></div>
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} style={{ position: "absolute", top: 420, left: 40 + i * 97, width: 96, textAlign: "center", fontFamily: round, fontWeight: 600, fontSize: 30, color: SP.muted }}>{d}</div>)}
      {Array.from({ length: 30 }).map((_, i) => {
        const d = i + 1, c = cell(d), on = picked && d === DATE;
        const weekend = (d - 1 + FIRST_DOW) % 7 >= 5;
        return (
          <div key={d} style={{ position: "absolute", left: c.x, top: c.y, width: 90, height: 90, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: round, fontWeight: 700, fontSize: 38, color: on ? "#fff" : weekend ? "#ffd1ef" : "#e9e0f5", background: on ? SP.gradPink : "transparent", boxShadow: on ? glowBox(SP.pink, 1.2) : "none", transform: on ? `scale(${Math.min(pop(Math.round(t * FPS), M.tapDate, 8, 200), 1.15)})` : "none" }}>{d}</div>
        );
      })}
      {t >= M.free && (
        <div style={{ position: "absolute", top: 1060, left: 40, right: 40, padding: "30px 30px", borderRadius: 36, background: "rgba(61,255,168,.14)", border: `4px solid ${SP.green}`, boxShadow: glowBox(SP.green, 0.8), transform: `scale(${Math.min(free, 1.1)})`, opacity: Math.min(free, 1), textAlign: "center" }}>
          <div style={{ fontFamily: round, fontWeight: 700, fontSize: 52, color: SP.green, textShadow: neon(SP.green, 0.5) }}>Your date is free ✓</div>
          <div style={{ fontFamily: round, fontWeight: 600, fontSize: 34, color: "#fff", marginTop: 6 }}>Saturday 12 June 2027</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** slide screens left as the quiz moves on */
const Slide: React.FC<{ from: number; to: number; t: number; children: React.ReactNode }> = ({ from, to, t, children }) => {
  if (t < from - 0.3 || t > to + 0.3) return null;
  const x = interpolate(t, [from - 0.3, from, to, to + 0.3], [PW, 0, 0, -PW], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>{children}</AbsoluteFill>;
};

export const BoothQuiz: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const rise = pop(f, 0.1, 15, 80);
  const leave = interpolate(t, [M.quote - 0.3, M.quote + 0.2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const picked = t >= M.tapWed && t < M.back ? 0 : t >= M.tapProm ? 1 : null;
  return (
    <AbsoluteFill>
      <Soundtrack id={ID} />
      <Stage>
        <PhoneFrame x={PX} y={PY + (1 - rise) * 900 + leave * 2300} w={PW} h={PH} rot={(1 - rise) * 8 - 1.5 + Math.sin(t * 0.9) * 1} glow={SP.pink}>
          {/* question twice: once for the wedding, once for the prom */}
          {t < M.resWed + 0.3 && <Slide from={-1} to={M.resWed} t={t}><Question t={t} picked={picked} /></Slide>}
          {t < M.back + 0.1 && <Slide from={M.resWed} to={M.back} t={t}><Result t={t} at={M.resWed} name="MAGIC MIRROR" perfect="💍 Perfect for weddings" art={<MirrorArt f={f} />} /></Slide>}
          {t >= M.back - 0.3 && t < M.resProm + 0.3 && (
            <AbsoluteFill style={{ transform: `translateX(${interpolate(t, [M.back - 0.3, M.back, M.resProm, M.resProm + 0.3], [-PW, 0, 0, -PW], { ...clamp, easing: Easing.inOut(Easing.cubic) })}px)` }}><Question t={9} picked={picked} /></AbsoluteFill>
          )}
          <Slide from={M.resProm} to={M.cal} t={t}><Result t={t} at={M.resProm} name="360 SPIN" perfect="🎓 Perfect for proms & leavers" art={<SpinArt f={f} />} /></Slide>
          <Slide from={M.cal} to={99} t={t}><Calendar t={t} /></Slide>
          <Finger t={t} />
        </PhoneFrame>
      </Stage>
      <Confetti x={540} y={1000} el={t - M.free} seed="free" n={80} />
      <Flashes at={[M.resWed, M.resProm]} strength={0.35} />
      <Wordmark at={M.quote} top={300} />
      <Cta at={M.quote + 0.2} top={830} label="Get a quote" press={M.press} />
      <Confetti x={540} y={900} el={t - M.press} seed="press" n={60} power={0.8} />
      <Contact at={M.quote + 0.5} top={1030} />
      <SpinCaptions id={ID} />
    </AbsoluteFill>
  );
};
