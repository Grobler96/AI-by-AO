import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame } from "remotion";
import { RV, body, glow, head } from "../theme-rave";
import films from "./rave.json";

/* Rave advert for United Sounds Event 3 (Beaverworks, Leeds). Intro riser -> three rooms (bassline 138, house 126, harder 170 bpm)
   -> finale with the date, venue and tickets. Every timing is read from rave.json; the audio script reads the same marks. */
export const RAVE_ID = "rave-leeds";
export const raveFilm = films[0];
const M = raveFilm.marks;
const BPM = raveFilm.bpm;
export const RAVE_FPS = 30;
export const RAVE_FRAMES = raveFilm.seconds * RAVE_FPS;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const pop = (f: number, at: number, damping = 10, stiffness = 200) => spring({ frame: f - at * RAVE_FPS, fps: RAVE_FPS, config: { damping, stiffness } });

/* ---------- the beat: which section we're in and how far into the current beat ---------- */
type Sec = { k: "bass" | "house" | "harder" | "finale"; from: number; to: number; bpm: number };
const SECS: Sec[] = [
  { k: "bass", from: M.drop, to: M.house, bpm: BPM.bass },
  { k: "house", from: M.house, to: M.harder, bpm: BPM.house },
  { k: "harder", from: M.harder, to: M.finale, bpm: BPM.harder },
  { k: "finale", from: M.finale, to: raveFilm.seconds, bpm: BPM.finale },
];
const beatInfo = (t: number) => {
  const s = SECS.find((x) => t >= x.from && t < x.to);
  if (!s) return { s: null as Sec | null, idx: 0, ph: 0, pulse: 0 };
  const x = (t - s.from) / (60 / s.bpm);
  const idx = Math.floor(x), ph = x - idx;
  return { s, idx, ph, pulse: Math.exp(-ph * 5) };
};

const PAL: Record<string, string[]> = {
  intro: [RV.uv, "#ffffff"],
  bass: [RV.lime, RV.cyan],
  house: [RV.orange, "#ff3d9a"],
  harder: [RV.red, RV.uv],
  finale: [RV.lime, RV.uv, RV.orange, RV.cyan],
};

/* ---------- lights ---------- */
const Lasers: React.FC<{ t: number; pal: string[]; n: number; speed: number; spread: number }> = ({ t, pal, n, speed, spread }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen" }}>
    {Array.from({ length: n }).map((_, i) => {
      const side = i % 2 ? 1 : -1;
      const a = side * (14 + spread * 0.5) + Math.sin(t * speed + i * 1.9) * spread;
      const c = pal[i % pal.length];
      return <div key={i} style={{ position: "absolute", top: -120, left: 540 + side * (60 + (i % 3) * 40), width: 5 + (i % 3) * 3, height: 2500, transformOrigin: "50% 0", transform: `rotate(${a}deg)`, background: `linear-gradient(180deg, ${c}, ${c}00 85%)`, boxShadow: `0 0 24px ${c}`, opacity: 0.75 }} />;
    })}
  </AbsoluteFill>
);

const Haze: React.FC<{ c: string; k: number }> = ({ c, k }) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(75% 40% at 50% 85%, ${c}${Math.round(90 * k).toString(16).padStart(2, "0")}, transparent 70%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.65))" }} />
  </>
);

/* ---------- the crowd: silhouettes with hands in the air ---------- */
const Crowd: React.FC<{ t: number; pulse: number; rows?: number; top?: number; alpha?: number }> = ({ t, pulse, top = 1560, alpha = 1 }) => (
  <AbsoluteFill style={{ opacity: alpha, pointerEvents: "none" }}>
    {[0, 1].map((row) =>
      Array.from({ length: row ? 13 : 9 }).map((_, i) => {
        const per = row ? 13 : 9;
        const x = ((i + 0.5 + (random(`cx${row}${i}`) - 0.5) * 0.5) / per) * 1200 - 60;
        const s = row ? 0.8 : 1.15;
        const y = top + (row ? 0 : 90) + Math.abs(Math.sin(t * 7 + i * 2.1)) * -22 * (0.5 + pulse) + 0;
        const raise = 150 + Math.sin(t * 6 + i) * 25 + pulse * 12;
        const col = row ? "#0d0716" : "#000";
        return (
          <div key={`${row}-${i}`} style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "50% 100%" }}>
            {[-1, 1].map((sd) => (
              <div key={sd} style={{ position: "absolute", left: sd * 34 - 7, top: 70, width: 14, height: 170, borderRadius: 8, background: col, transformOrigin: "50% 100%", transform: `rotate(${sd * (raise - (i % 3 === 0 ? 40 : 0)) * 0.35}deg)` }} />
            ))}
            <div style={{ position: "absolute", left: -38, top: 100, width: 76, height: 700, borderRadius: "38px 38px 0 0", background: col }} />
            <div style={{ position: "absolute", left: -29, top: 36, width: 58, height: 66, borderRadius: "50%", background: col }} />
          </div>
        );
      })
    )}
  </AbsoluteFill>
);

/* ---------- type ---------- */
const Chroma: React.FC<{ children: React.ReactNode; size: number; color?: string; shift?: number; style?: React.CSSProperties }> = ({ children, size, color = "#fff", shift = 4, style }) => (
  <div style={{ fontFamily: head, fontSize: size, lineHeight: 0.95, color, textShadow: `${shift}px 0 ${RV.red}cc, ${-shift}px 0 ${RV.cyan}cc, 0 0 30px ${color}55`, letterSpacing: 2, ...style }}>{children}</div>
);

/** "UNITED / SOUNDS" slamming in letter by letter */
const Title: React.FC<{ t: number; f: number; at: number; top: number; size: number; out?: number }> = ({ t, f, at, top, size, out = 99 }) => {
  if (t < at || t > out) return null;
  const d = t - at;
  const jit = d < 0.7 ? (random(`tj${Math.floor(f / 2)}`) - 0.5) * 2 * (0.7 - d) * 30 : 0;
  const fade = 1 - ramp(t, out - 0.2, out);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: fade, transform: `translateX(${jit}px) scale(${1 + (out - t < 0.3 ? (0.3 - (out - t)) * 0.8 : 0)})` }}>
      {["UNITED", "SOUNDS"].map((w, li) => (
        <div key={w} style={{ display: "flex", justifyContent: "center", height: size * 0.98 }}>
          {w.split("").map((ch, i) => {
            const s = Math.min(pop(f, at + li * 0.25 + i * 0.05, 9, 220), 1.15);
            return <span key={i} style={{ display: "inline-block", fontFamily: head, fontSize: size, lineHeight: 0.98, color: "#fff", transform: `scale(${lerp(3, 1, Math.min(s, 1))})`, opacity: Math.min(s * 1.4, 1), textShadow: `${5 + (1 - Math.min(s, 1)) * 30}px 0 ${RV.red}cc, ${-5 - (1 - Math.min(s, 1)) * 30}px 0 ${RV.cyan}cc, 0 0 40px ${RV.uv}`, margin: "0 3px" }}>{ch}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

const Badge: React.FC<{ f: number; at: number; top: number; text: string; size?: number; rot?: number; bg?: string }> = ({ f, at, top, text, size = 130, rot = -5, bg = RV.lime }) => {
  const s = Math.min(pop(f, at, 8, 220), 1.15);
  if (f < at * RAVE_FPS) return null;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `rotate(${rot}deg) scale(${s})` }}>
      <div style={{ fontFamily: head, fontSize: size, color: "#000", background: bg, padding: "6px 44px 0", boxShadow: `0 0 50px ${bg}, 10px 10px 0 ${RV.uv}`, transform: "skewX(-8deg)" }}>{text}</div>
    </div>
  );
};

const Tape: React.FC<{ t: number; y: number; text: string; bg: string; color?: string; rot?: number; dir?: number; size?: number }> = ({ t, y, text, bg, color = "#000", rot = -3, dir = 1, size = 52 }) => {
  const unit = `${text}   ✦   `;
  const w = unit.length * size * 0.44;
  const x = -((t * 260 * dir) % w);
  return (
    <div style={{ position: "absolute", left: -100, right: -100, top: y, height: size * 1.5, background: bg, transform: `rotate(${rot}deg)`, overflow: "hidden", boxShadow: `0 0 40px ${bg}88`, display: "flex", alignItems: "center" }}>
      <div style={{ whiteSpace: "nowrap", fontFamily: head, fontSize: size, color, transform: `translateX(${dir > 0 ? x : x - w}px)`, letterSpacing: 2, paddingTop: 4 }}>{unit.repeat(10)}</div>
    </div>
  );
};

/* ---------- the three rooms ---------- */
const ROOMS = {
  bass: { name: "BASSLINE", sub: "360 BAR", color: RV.lime, rows: ["CAM UKG B2B JAE DEPZ", "HEELEY · JAMIE DORRINGTON", "KATIE · LORCAN WELDON", "DJ DT"] },
  house: { name: "HOUSE", sub: "THE RETREAT", color: RV.orange, rows: ["MARC LEAF", "DAN JAMES B2B MARK HODGSON", "RAZ B2B STUPPY", "DJ MC · RILEY MAY"] },
  harder: { name: "HARDER", sub: "THE LOUNGE", color: RV.red, rows: ["TINDLE · SQUIDGE", "DOLLA · SCOTTY", "SUBVISIONS · EBZ · PALMER", "MCS  E-LL · KIRK-E · TS1 · SHAPER"] },
} as const;

const BassViz: React.FC<{ t: number; pulse: number; lt: number }> = ({ t, pulse }) => (
  <AbsoluteFill>
    {Array.from({ length: 30 }).map((_, i) => {
      const h = 60 + 330 * Math.abs(Math.sin(t * 3.4 + i * 0.55)) * (0.45 + 0.55 * pulse + 0.2 * Math.sin(t * 9 + i));
      return <div key={i} style={{ position: "absolute", left: 20 + i * 34, bottom: 1920 - 990, width: 22, height: h, background: i % 2 ? RV.lime : RV.cyan, boxShadow: `0 0 18px ${i % 2 ? RV.lime : RV.cyan}`, borderRadius: 4, opacity: 0.85 }} />;
    })}
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {[0, 1].map((k) => {
        const pts: string[] = [];
        for (let x = 0; x <= 1080; x += 10) pts.push(`${x},${760 + Math.sin(x * 0.014 + t * 9 + k) * (60 + 90 * Math.abs(Math.sin(t * 6.9))) * (k ? 0.6 : 1)}`);
        return <polyline key={k} points={pts.join(" ")} fill="none" stroke={k ? "#fff" : RV.lime} strokeWidth={k ? 3 : 9} style={{ filter: `drop-shadow(0 0 12px ${RV.lime})` }} />;
      })}
    </svg>
  </AbsoluteFill>
);

const HouseViz: React.FC<{ t: number; pulse: number; lt: number }> = ({ t, pulse, lt }) => (
  <AbsoluteFill>
    {[0, 1, 2, 3].map((i) => {
      const p = ((lt * 0.9 + i * 0.25) % 1);
      return <div key={i} style={{ position: "absolute", left: 540 - 120 - p * 460, top: 780 - 120 - p * 460, width: 240 + p * 920, height: 240 + p * 920, borderRadius: "50%", border: `5px solid ${i % 2 ? "#ff3d9a" : RV.orange}`, opacity: (1 - p) * 0.8 }} />;
    })}
    {/* disco ball */}
    <div style={{ position: "absolute", left: 540 - 190 * (1 + pulse * 0.05), top: 780 - 190 * (1 + pulse * 0.05), width: 380 * (1 + pulse * 0.05), height: 380 * (1 + pulse * 0.05), borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff, #c9c9d8 35%, #55556a 75%, #1a1a26)", boxShadow: `0 0 90px ${RV.orange}, 0 0 200px #ff3d9a88`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 3px, transparent 3px 26px), repeating-linear-gradient(90deg, rgba(0,0,0,.55) 0 3px, transparent 3px 26px)", transform: `translateX(${(t * 90) % 26}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: `conic-gradient(from ${t * 120}deg, rgba(255,255,255,.55), transparent 18%, rgba(255,90,31,.5) 40%, transparent 60%, rgba(255,61,154,.45) 80%, rgba(255,255,255,.55))`, mixBlendMode: "overlay" }} />
    </div>
    {Array.from({ length: 16 }).map((_, i) => {
      const a = i * 0.39 + t * 0.7 * (i % 2 ? 1 : -1);
      return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * 470 - 12, top: 780 + Math.sin(a) * 250 - 12, width: 24, height: 24, background: i % 2 ? "#fff" : RV.orange, boxShadow: `0 0 18px ${RV.orange}`, transform: `rotate(${a * 90}deg)`, opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 5 + i)) }} />;
    })}
  </AbsoluteFill>
);

const HarderViz: React.FC<{ t: number; f: number; pulse: number }> = ({ f, pulse }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2, 3].map((b) => {
        const seed = `${b}-${Math.floor(f / 2)}`;
        let x = 150 + b * 260 + (random(`bx${seed}`) - 0.5) * 80, y = 520;
        const pts = [`${x},${y}`];
        for (let k = 0; k < 9; k++) { x += (random(`x${seed}${k}`) - 0.5) * 150; y += 55 + random(`y${seed}${k}`) * 30; pts.push(`${x},${y}`); }
        const c = b % 2 ? RV.uv : RV.red;
        return <polyline key={b} points={pts.join(" ")} fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="bevel" style={{ filter: `drop-shadow(0 0 10px ${c}) drop-shadow(0 0 26px ${c})` }} opacity={0.55 + 0.45 * pulse} />;
      })}
    </svg>
    {Array.from({ length: 14 }).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: ((random(`hs${i}`) * 1500 - f * (30 + random(`hv${i}`) * 40)) % 1500 + 1500) % 1500 - 200, top: 560 + random(`hy${i}`) * 440, width: 260 + random(`hw${i}`) * 300, height: 4, background: `linear-gradient(90deg, transparent, ${i % 2 ? RV.red : RV.uv}, transparent)` }} />
    ))}
  </AbsoluteFill>
);

const Room: React.FC<{ k: "bass" | "house" | "harder"; t: number; f: number; pulse: number }> = ({ k, t, f, pulse }) => {
  const R = ROOMS[k];
  const sec = SECS.find((s) => s.k === k)!;
  const lt = t - sec.from;
  const beat = 60 / sec.bpm;
  const s = Math.min(pop(f, sec.from, 8, 260), 1.15);
  const flick = lt < 0.4 ? [1, 0.3, 1, 0.5, 1][Math.floor(lt * 14) % 5] : 1;
  const shake = k === "harder" ? (random(`sh${f}`) - 0.5) * 10 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(70% 38% at 50% 35%, ${R.color}33, transparent 75%)` }} />
      {k === "bass" && <BassViz t={t} pulse={pulse} lt={lt} />}
      {k === "house" && <HouseViz t={t} pulse={pulse} lt={lt} />}
      {k === "harder" && <HarderViz t={t} f={f} pulse={pulse} />}
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, textAlign: "center", transform: `scale(${lerp(2.2, 1, Math.min(s, 1)) * (1 + pulse * 0.03)}) translateX(${shake}px)`, opacity: flick * Math.min(s * 1.5, 1) }}>
        <Chroma size={k === "house" ? 330 : 270} color={R.color} shift={7} style={{ textShadow: `7px 0 ${RV.red}cc, -7px 0 ${RV.cyan}cc, ${glow(R.color, 0.8)}` }}>{R.name}</Chroma>
      </div>
      <div style={{ position: "absolute", top: k === "house" ? 530 : 470, left: 0, right: 0, textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 46, letterSpacing: 14, color: "#fff", opacity: ramp(lt, 0.15, 0.35), paddingLeft: 14 }}>{R.sub}</div>
      {R.rows.map((r, i) => {
        const at = sec.from + 0.35 + i * beat * (k === "harder" ? 1.5 : 1);
        const p = Math.min(pop(f, at, 12, 240), 1.1);
        if (t < at) return null;
        return <div key={i} style={{ position: "absolute", top: 1030 + i * 88, left: 0, right: 0, textAlign: "center", fontFamily: head, fontSize: r.startsWith("MCS") ? 54 : 74, color: i % 2 ? "#fff" : R.color, letterSpacing: 2, textShadow: `0 4px 0 rgba(0,0,0,.8), 0 0 24px ${R.color}66`, transform: `scale(${lerp(1.4, 1, Math.min(p, 1))})`, opacity: Math.min(p * 1.5, 1) }}>{r.replace("MCS  ", "MC'S  ")}</div>;
      })}
    </AbsoluteFill>
  );
};

/* ---------- finale ---------- */
const Finale: React.FC<{ t: number; f: number; pulse: number }> = ({ t, f, pulse }) => {
  const s = Math.min(pop(f, M.finale, 9, 200), 1.1);
  const line = (at: number, top: number, size: number, color: string, text: string, extra?: React.CSSProperties) => {
    if (t < at) return null;
    const p = Math.min(pop(f, at, 10, 230), 1.1);
    return <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily: head, fontSize: size, lineHeight: 1, color, opacity: Math.min(p * 1.6, 1), transform: `scale(${lerp(1.5, 1, Math.min(p, 1))})`, textShadow: `0 5px 0 rgba(0,0,0,.7), 0 0 36px ${color}77`, ...extra }}>{text}</div>;
  };
  const tick = t >= M.ticket ? 1 + 0.04 * Math.sin((t - M.ticket) * 9) : 1;
  return (
    <AbsoluteFill>
      <Tape t={t} y={95} text="BASSLINE ✦ HOUSE ✦ HARDER" bg={RV.uv} color="#fff" rot={2} dir={-1} size={44} />
      <div style={{ position: "absolute", top: 215, left: 0, right: 0, textAlign: "center", transform: `scale(${lerp(2.6, 1, Math.min(s, 1))})`, opacity: Math.min(s * 1.6, 1) }}>
        <Chroma size={215} shift={6} style={{ textShadow: `6px 0 ${RV.red}cc, -6px 0 ${RV.cyan}cc, ${glow(RV.uv, 0.9)}` }}>UNITED<br />SOUNDS</Chroma>
      </div>
      <Badge f={f} at={M.finale + 0.45} top={675} text="EVENT 3" size={96} />
      {line(M.date, 850, 250, RV.lime, "SAT 5 DEC", { textShadow: `0 6px 0 rgba(0,0,0,.7), ${glow(RV.lime, 0.8)}` })}
      {line(M.date + 0.2, 1095, 100, "#fff", "2026", { letterSpacing: 24, paddingLeft: 24 })}
      {line(M.venue, 1190, 150, "#fff", "BEAVERWORKS")}
      {t >= M.venue + 0.15 && <div style={{ position: "absolute", top: 1345, left: 0, right: 0, textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 52, color: RV.cyan, letterSpacing: 4, textShadow: `0 0 24px ${RV.cyan}88` }}>LEEDS · LS10 1AD</div>}
      {line(M.times, 1405, 112, RV.orange, "6PM – 2AM", { textShadow: `0 5px 0 rgba(0,0,0,.7), ${glow(RV.orange, 0.7)}` })}
      {t >= M.ticket && (
        <div style={{ position: "absolute", top: 1560, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${Math.min(pop(f, M.ticket, 9, 220), 1.1) * tick}) rotate(-2deg)` }}>
          <div style={{ fontFamily: head, fontSize: 84, color: "#000", background: RV.lime, padding: "10px 54px 0", boxShadow: `${glow(RV.lime, 0.9)}, 10px 10px 0 ${RV.uv}`, transform: "skewX(-8deg)" }}>TICKETS ON SKIDDLE</div>
        </div>
      )}
      {t >= M.small && (
        <div style={{ position: "absolute", top: 1705, left: 0, right: 0, textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 32, color: "#fff", letterSpacing: 2, opacity: ramp(t, M.small, M.small + 0.4), textShadow: "0 2px 8px #000" }}>
          OVER 18'S · BRING ID<br /><span style={{ fontWeight: 500, color: RV.muted }}>weareunitedsounds@yahoo.com</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const RaveAd: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / RAVE_FPS;
  const { s, pulse } = beatInfo(t);
  const key = s ? s.k : "intro";
  const pal = PAL[key];
  // strobing: ramps up through the intro, flickers on every kick in the harder room
  const introStrobe = t > 2.2 && t < M.drop ? (Math.floor(t * (8 + (t - 2.2) * 24)) % 2 ? 0.5 * ramp(t, 2.2, M.drop) : 0) : 0;
  const strobe = key === "harder" ? 0.18 * pulse + (Math.floor(f / 2) % 2 ? 0.05 : 0) : key === "bass" ? 0.06 * pulse : key === "house" ? 0.05 * pulse : key === "finale" ? 0.07 * pulse : 0;
  const hit = (at: number) => (t >= at && t < at + 0.4 ? Math.pow(1 - (t - at) / 0.4, 2) : 0);
  const flash = Math.max(hit(M.drop), hit(M.house) * 0.5, hit(M.harder) * 0.7, hit(M.finale), ramp(t, M.drop - 0.12, M.drop) * (t < M.drop ? 1 : 0));
  const shakeAmp = key === "harder" ? 16 * pulse : key === "bass" ? 6 * pulse : key === "finale" ? 8 * pulse : 0;
  const bigShake = hit(M.drop) * 40 + hit(M.finale) * 30;
  const amp = shakeAmp + bigShake;
  const sx = (random(`sx${f}`) - 0.5) * 2 * amp, sy = (random(`sy${f}`) - 0.5) * 2 * amp;
  const laserN = key === "intro" ? Math.round(2 + 6 * ramp(t, 0.1, 2.2)) : key === "harder" ? 12 : 8;
  const speed = key === "harder" ? 3.4 : key === "intro" ? 1.2 : 1.8;
  const showCrowd = t >= M.drop;
  const showTape = t >= M.drop && t < M.finale;
  const introOut = t >= M.drop - 0.02;
  return (
    <AbsoluteFill style={{ background: RV.bg }}>
      <Audio src={staticFile(`audio/${RAVE_ID}.wav`)} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${1 + (amp > 0 ? 0.015 : 0)})` }}>
        <Lasers t={t} pal={pal} n={laserN} speed={speed} spread={key === "harder" ? 40 : 28} />
        <Haze c={pal[0]} k={0.6 + 0.4 * pulse} />
        {s && s.k !== "finale" && <Room k={s.k} t={t} f={f} pulse={pulse} />}
        {showCrowd && <Crowd t={t} pulse={pulse} top={s?.k === "finale" ? 1760 : 1560} alpha={s?.k === "finale" ? 0.85 : 1} />}
        {s && s.k === "finale" && <Finale t={t} f={f} pulse={pulse} />}
        {showTape && <Tape t={t} y={1425} text="SAT 5 DEC 2026 ✦ BEAVERWORKS LEEDS ✦ 6PM–2AM" bg={RV.lime} rot={-3} />}
        {s && s.k !== "finale" && (
          <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: head, fontSize: 58, color: "#fff", letterSpacing: 6 }}>
            UNITED SOUNDS <span style={{ color: RV.lime }}>· EVENT 3</span>
          </div>
        )}
        {!introOut && (
          <>
            <Title t={t} f={f} at={M.title} top={420} size={310} out={M.drop} />
            <Badge f={f} at={M.event} top={1130} text="EVENT 3" size={140} />
            {t > M.event + 0.3 && t < M.drop && (
              <div style={{ position: "absolute", top: 1380, left: 0, right: 0, textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 44, letterSpacing: 10, color: "#fff", paddingLeft: 10 }}>BASSLINE · HOUSE · HARDER</div>
            )}
          </>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: Math.min(1, Math.max(strobe, introStrobe, flash)), mixBlendMode: "screen", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
