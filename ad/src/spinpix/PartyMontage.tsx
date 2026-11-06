import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { SP, chunky, glowBox, neon, round } from "../theme-spinpix";
import { Contact, Cta, FPS, Flashes, Guest, Neon, SpinCaptions, Soundtrack, Stage, Star, Wordmark, clamp, film, pop } from "./kit";

/* Party montage: beat-synced cuts through the events, then the hero shape morphs booth to booth, then the end card. */
const ID = "spinpix-montage";
const fl = film(ID);
const M = fl.marks as { cuts: number[]; end: number; cta: number };
const BEAT = 60 / (fl as unknown as { bpm: number }).bpm;

const EVENTS = [
  { word: "WEDDINGS", icons: ["💍", "🥂", "💐", "🤍"], color: SP.pink, tint: "rgba(255,45,155,.35)" },
  { word: "PROM NIGHT", icons: ["🎓", "👗", "🪩", "✨"], color: SP.violet, tint: "rgba(155,77,255,.4)" },
  { word: "PARTIES", icons: ["🎈", "🎂", "🎉", "🥳"], color: SP.blue, tint: "rgba(34,196,255,.35)" },
  { word: "WORK EVENTS", icons: ["💼", "🏆", "🥂", "🎤"], color: SP.hot, tint: "rgba(255,92,192,.35)" },
];
/* hero shape for each booth: width, height, corner radius (top / bottom), y centre */
const BOOTHS = [
  { name: "MAGIC MIRROR", w: 460, h: 820, rt: 230, rb: 30, y: 840, color: SP.pink },
  { name: "SELFIE POD", w: 340, h: 760, rt: 170, rb: 170, y: 820, color: SP.blue },
  { name: "360 SPIN", w: 760, h: 210, rt: 105, rb: 105, y: 1120, color: SP.violet },
  { name: "CLASSIC BOOTH", w: 600, h: 780, rt: 40, rb: 40, y: 850, color: SP.hot },
  { name: "PROPS TABLE", w: 820, h: 90, rt: 30, rb: 30, y: 1080, color: SP.blue },
];
const B0 = M.cuts[4]; // booths start

const lerpBooth = (t: number) => {
  const i = Math.max(0, Math.min(BOOTHS.length - 1, Math.floor(t - B0)));
  const a = BOOTHS[Math.max(0, i - 1)], b = BOOTHS[i];
  const p = interpolate(t - (B0 + i), [0, 0.28], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const mix = (k: "w" | "h" | "rt" | "rb" | "y") => a[k] + (b[k] - a[k]) * (i === 0 ? 1 : p);
  return { i, p, w: mix("w"), h: mix("h"), rt: mix("rt"), rb: mix("rb"), y: mix("y"), color: b.color };
};

/** 1 on every beat, decaying */
const beatPulse = (t: number) => {
  if (t < M.cuts[0]) return 0;
  const ph = ((t - M.cuts[0]) % BEAT) / BEAT;
  return Math.exp(-ph * 6);
};

const EventScene: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const e = EVENTS[i];
  const st = M.cuts[i];
  const d = t - st;
  const f = Math.round(t * FPS);
  const s = pop(f, st, 8, 220);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 45%, ${e.tint}, transparent 75%)` }} />
      {/* dancing guests along the bottom */}
      {Array.from({ length: 7 }).map((_, k) => {
        const bounce = Math.abs(Math.sin((t * Math.PI) / BEAT + k)) * 30;
        const cols = [SP.pink, SP.blue, SP.violet, SP.hot];
        return <Guest key={k} x={90 + k * 150} y={1640 - bounce + (k % 2) * 50} h={400 + (k % 3) * 50} color={cols[(k + i) % 4]} arms={[120 + 40 * Math.sin(t * 8 + k), -120 - 40 * Math.cos(t * 8 + k)]} turn={(k - 3) * 0.2} />;
      })}
      {e.icons.map((ic, k) => {
        const ang = (k / 4) * Math.PI * 2 + d * 1.5 + i;
        const r = 340 + 40 * Math.sin(d * 6 + k);
        return <div key={k} style={{ position: "absolute", left: 540 + Math.cos(ang) * r - 70, top: 640 + Math.sin(ang) * r * 0.75 - 70, fontSize: 130, transform: `scale(${Math.min(pop(f, st + k * 0.06, 8, 200), 1.2)}) rotate(${Math.sin(d * 5 + k) * 15}deg)`, filter: `drop-shadow(0 0 24px ${e.color})` }}>{ic}</div>;
      })}
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: chunky, fontSize: e.word.length > 9 ? 120 : 150, color: "#fff", textShadow: neon(e.color, 1.2), transform: `scale(${Math.min(s, 1.15) * (1 + 0.04 * beatPulse(t))}) rotate(-5deg)`, lineHeight: 1 }}>{e.word}</div>
    </AbsoluteFill>
  );
};

/* the inside of each booth, cross-faded during the morph */
const BoothInside: React.FC<{ i: number; t: number; w: number; h: number }> = ({ i, t, w, h }) => {
  const f = Math.round(t * FPS);
  if (i === 0) return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(255,255,255,.3), rgba(155,77,255,.3) 45%, rgba(34,196,255,.25))" }}>
      <div style={{ position: "absolute", left: -100, top: -100 + ((f * 14) % 1000), width: 700, height: 90, background: "rgba(255,255,255,.4)", transform: "rotate(-30deg)", filter: "blur(8px)" }} />
      <Guest x={w / 2} y={h - 30} h={h * 0.6} color={SP.violet} arms={[150, -40]} />
      <div style={{ position: "absolute", top: h * 0.12, width: "100%", textAlign: "center", fontFamily: round, fontWeight: 700, fontSize: 46, color: "#fff", textShadow: neon(SP.pink, 0.7) }}>Smile! 3… 2… 1…</div>
    </AbsoluteFill>
  );
  if (i === 1) return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#1d0d36,#120a22)" }}>
      <div style={{ position: "absolute", left: w / 2 - 110, top: 60, width: 220, height: 220, borderRadius: "50%", border: "18px solid #fff", boxShadow: glowBox(SP.blue, 1.6) }} />
      <div style={{ position: "absolute", left: w / 2 - 28, top: 142, width: 56, height: 56, borderRadius: "50%", background: "#0a0612", border: `6px solid ${SP.blue}` }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 340, height: h - 420, borderRadius: 30, background: SP.grad, opacity: 0.75 }}>
        <Guest x={(w - 80) / 2 - 60} y={h - 440} h={260} color={SP.pink} arms={[150, -30]} />
        <Guest x={(w - 80) / 2 + 60} y={h - 440} h={240} color={SP.blue} arms={[30, -150]} />
      </div>
    </AbsoluteFill>
  );
  if (i === 2) return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a1a5c, #1a0b2c 70%)" }}>
      {Array.from({ length: 14 }).map((_, k) => { const a = (k / 14) * Math.PI * 2 + t * 4; return <div key={k} style={{ position: "absolute", left: w / 2 + Math.cos(a) * w * 0.42 - 8, top: h / 2 + Math.sin(a) * h * 0.38 - 8, width: 16, height: 16, borderRadius: "50%", background: k % 2 ? "#fff" : SP.blue, opacity: 0.4 + 0.6 * (Math.sin(a) + 1) / 2 }} />; })}
    </AbsoluteFill>
  );
  if (i === 3) return (
    <AbsoluteFill style={{ background: "#1a0b2c" }}>
      <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", fontFamily: chunky, fontSize: 70, color: "#fff", textShadow: neon(SP.hot, 0.9) }}>PHOTOS</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 150, bottom: 0, background: "repeating-linear-gradient(90deg, #c3166f 0 40px, #8d0e52 40px 80px)", borderRadius: "20px 20px 0 0" }} />
      <div style={{ position: "absolute", left: w / 2 - 70, top: 260, width: 140, height: 100, borderRadius: 20, background: "#0a0612", border: `5px solid ${SP.blue}`, boxShadow: glowBox(SP.blue, 0.8) }}>
        <div style={{ position: "absolute", left: 40, top: 20, width: 50, height: 50, borderRadius: "50%", border: "6px solid #fff" }} />
      </div>
      <div style={{ position: "absolute", left: w / 2 - 90, top: 420, width: 180, height: 240, background: "#fff", padding: 10, boxSizing: "border-box", transform: `rotate(${-6 + 3 * Math.sin(t * 6)}deg) translateY(${interpolate(t - (B0 + 3), [0.2, 0.7], [-200, 0], clamp)}px)`, boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
        {[0, 1].map((k) => <div key={k} style={{ height: 105, marginBottom: 10, background: k ? SP.gradPink : SP.grad }} />)}
      </div>
    </AbsoluteFill>
  );
  return <AbsoluteFill style={{ background: "linear-gradient(180deg,#ff5cc0,#9b4dff)" }} />;
};

const PROPS = ["🕶️", "🎩", "👑", "🥸", "💋", "🦄", "🎀"];

const BoothScene: React.FC<{ t: number }> = ({ t }) => {
  const b = lerpBooth(t);
  const f = Math.round(t * FPS);
  const pulse = 1 + 0.035 * beatPulse(t);
  const label = BOOTHS[b.i];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% 50%, ${b.color}55, transparent 75%)` }} />
      <div style={{ position: "absolute", left: 540 - b.w / 2, top: b.y - b.h / 2, width: b.w, height: b.h, borderRadius: `${b.rt}px ${b.rt}px ${b.rb}px ${b.rb}px`, border: `10px solid #fff`, boxShadow: `${glowBox(b.color, 1.6)}, 0 0 120px ${b.color}`, overflow: "hidden", transform: `scale(${pulse})`, background: "#1a0b2c" }}>
        <AbsoluteFill style={{ opacity: b.p }}><BoothInside i={b.i} t={t} w={b.w} h={b.h} /></AbsoluteFill>
      </div>
      {b.i === 2 && <Guest x={540} y={1130} h={560 * Math.min(1, b.p)} color={SP.pink} turn={t * 6} arms={[150, -150]} />}
      {b.i === 4 && PROPS.map((p, k) => {
        const s = pop(f, B0 + 4 + k * 0.06, 8, 220);
        const hop = Math.abs(Math.sin((t * Math.PI) / BEAT + k)) * 50;
        return <div key={k} style={{ position: "absolute", left: 130 + k * 120 - 55, top: 940 - hop - (k % 2) * 60, fontSize: 110, transform: `scale(${Math.min(s, 1.2)}) rotate(${Math.sin(t * 7 + k) * 14}deg)`, filter: `drop-shadow(0 0 20px ${SP.pink})` }}>{p}</div>;
      })}
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: chunky, fontSize: 110, color: "#fff", textShadow: neon(label.color, 1.1), transform: `scale(${Math.min(pop(f, B0 + b.i, 8, 220), 1.15)}) rotate(-4deg)` }}>{label.name}</div>
      {Array.from({ length: 6 }).map((_, k) => <Star key={k} x={540 + Math.cos(k + t * 2) * (b.w / 2 + 60)} y={b.y + Math.sin(k * 2 + t * 2) * (b.h / 2 + 40)} size={40} opacity={0.5 + 0.5 * Math.sin(t * 8 + k)} />)}
    </AbsoluteFill>
  );
};

export const PartyMontage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const bp = beatPulse(t);
  const idx = M.cuts.filter((c) => t >= c).length - 1;
  const zoom = 1 + 0.06 * bp * (t < M.end ? 1 : 0.3);
  const shake = t < M.end ? Math.sin(f * 2.3) * 6 * bp : 0;
  const ready = t < M.cuts[0];
  return (
    <AbsoluteFill>
      <Soundtrack id={ID} />
      <Stage beat={bp}>
        <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${shake}px)` }}>
          {ready && <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", fontFamily: chunky, fontSize: 130, color: "#fff", textShadow: neon(SP.pink, 1), transform: `scale(${0.6 + t})` }}>READY?</div>}
          {idx >= 0 && idx < 4 && <EventScene i={idx} t={t} />}
          {t >= B0 && t < M.end && <BoothScene t={t} />}
        </AbsoluteFill>
        {/* colour wipe on every cut */}
        {M.cuts.map((c, k) => { const d = t - c; if (d < 0 || d > 0.18) return null; return <AbsoluteFill key={k} style={{ background: [SP.pink, SP.blue, SP.violet][k % 3], opacity: (1 - d / 0.18) * 0.55, mixBlendMode: "screen" }} />; })}
      </Stage>
      <Flashes at={[...M.cuts.slice(0, 4).map((c) => c + 0.02), M.end]} strength={0.6} />
      {t >= M.end && <>
        <Wordmark at={M.end} top={280} />
        <Neon on={M.end + 1.2} top={760} size={70} color={SP.blue} font={round}>Capture the moment.</Neon>
        <Neon on={M.end + 1.5} top={850} size={110} color={SP.pink}>Spin the fun.</Neon>
        <Cta at={M.cta} top={1060} label="Check my date" />
        <Contact at={M.cta + 0.3} top={1250} />
        {Array.from({ length: 8 }).map((_, k) => <Star key={k} x={random(`es${k}`) * 1080} y={200 + random(`ey${k}`) * 1100} size={50} opacity={0.5 + 0.5 * Math.sin(t * 4 + k)} />)}
      </>}
      <SpinCaptions id={ID} size={t < M.end ? 92 : 76} />
    </AbsoluteFill>
  );
};
