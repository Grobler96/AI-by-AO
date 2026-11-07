import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { SP, glowBox, round } from "../theme-spinpix";
import { Confetti, Contact, Cta, FPS, Flashes, Guest, Neon, SpinCaptions, Soundtrack, Stage, Viewfinder, Wordmark, clamp, film, pop, win } from "./kit";

/* "360 Spin": a guest steps onto the platform, the camera orbits, slow motion and confetti, then "Spin the fun." */
const ID = "spinpix-360";
const M = film(ID).marks as Record<string, number>;

/** camera speed around the platform (turns per second) */
const speed = (t: number) =>
  t < M.spin ? 0 :
  t < M.slowmo ? interpolate(t, [M.spin, M.spin + 0.8, M.slowmo - 0.3, M.slowmo], [0, 0.55, 0.55, 0.14], { easing: Easing.inOut(Easing.quad) }) :
  t < M.slowEnd ? 0.12 :
  interpolate(t, [M.slowEnd, M.logo], [0.12, 1.4], clamp) * (t < M.logo + 0.4 ? 1 : 0.18);
/** how fast time runs for falling confetti (slow motion between slowmo and slowEnd) */
const timeRate = (t: number) => (t >= M.slowmo && t < M.slowEnd ? 0.22 : 1);

const integrate = (rate: (t: number) => number, f: number) => {
  let a = 0;
  for (let k = 0; k < f; k++) a += rate(k / FPS) / FPS;
  return a;
};

const CX = 540, FLOOR = 1190;

const Platform: React.FC<{ theta: number; y: number; scale: number; glow: number }> = ({ theta, y, scale, glow }) => {
  const W = 720 * scale, H = 190 * scale;
  const lights = Array.from({ length: 16 }).map((_, i) => {
    const a = (i / 16) * Math.PI * 2 + theta * Math.PI * 2;
    return { x: CX + Math.cos(a) * W / 2 * 0.86, y: y + Math.sin(a) * H / 2 * 0.86, front: Math.sin(a), i };
  });
  return (
    <>
      {/* light cone up from the platform */}
      <div style={{ position: "absolute", left: CX - W / 2, top: y - 760 * scale, width: W, height: 760 * scale, background: `linear-gradient(0deg, rgba(255,45,155,${0.28 * glow}), transparent)`, clipPath: "polygon(0 100%, 100% 100%, 82% 0, 18% 0)", filter: "blur(8px)" }} />
      <div style={{ position: "absolute", left: CX - W / 2, top: y - H / 2 + 26 * scale, width: W, height: H, borderRadius: "50%", background: "#1a0b2c", boxShadow: "0 30px 60px rgba(0,0,0,.7)" }} />
      <div style={{ position: "absolute", left: CX - W / 2, top: y - H / 2, width: W, height: H, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 40%, #3a1a5c, #1a0b2c 70%)", border: `${7 * scale}px solid ${SP.pink}`, boxShadow: glowBox(SP.pink, glow * 1.4) }} />
      <div style={{ position: "absolute", left: CX - W * 0.36, top: y - H * 0.36, width: W * 0.72, height: H * 0.72, borderRadius: "50%", border: `${4 * scale}px solid ${SP.blue}`, boxShadow: glowBox(SP.blue, glow) }} />
      {lights.map((l) => <div key={l.i} style={{ position: "absolute", left: l.x - 7, top: l.y - 7, width: 14 * scale, height: 14 * scale, borderRadius: "50%", background: l.i % 2 ? "#fff" : SP.blue, opacity: 0.35 + 0.65 * (l.front + 1) / 2, boxShadow: `0 0 16px ${l.i % 2 ? SP.pink : SP.blue}` }} />)}
    </>
  );
};

/** neon tubes around the venue: they slide past as the camera orbits, so you feel the move */
const Venue: React.FC<{ theta: number; opacity: number }> = ({ theta, opacity }) => (
  <AbsoluteFill style={{ opacity }}>
    {Array.from({ length: 12 }).map((_, i) => {
      const a = ((i + 0.5) / 12) * Math.PI * 2 - theta * Math.PI * 2;
      const depth = Math.cos(a); // 1 = straight behind the guest
      if (depth < -0.1) return null;
      const x = CX + Math.sin(a) * 1150;
      const s = 0.55 + 0.45 * depth;
      const c = [SP.pink, SP.blue, SP.violet][i % 3];
      return <div key={i} style={{ position: "absolute", left: x - 12 * s, top: 420 - 120 * s, width: 24 * s, height: 900 * s, borderRadius: 20, background: "#fff", boxShadow: `0 0 20px ${c}, 0 0 60px ${c}, 0 0 120px ${c}`, opacity: 0.25 + 0.6 * depth, filter: `blur(${(1 - depth) * 4}px)` }} />;
    })}
  </AbsoluteFill>
);

const SpeedLines: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  if (v < 0.25) return null;
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, (v - 0.25) * 2) * 0.6 }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const y = random(`sl${i}`) * 1920;
        const x = ((random(`slx${i}`) * 2400 - f * 90 * v) % 2400 + 2400) % 2400 - 600;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 300 + random(`sw${i}`) * 400, height: 4, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${i % 2 ? SP.pink : SP.blue}, transparent)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** the glowing halo ring that circles the guest */
const HaloRing: React.FC<{ theta: number; y: number; scale: number; o: number }> = ({ theta, y, scale, o }) => {
  const W = 620 * scale;
  const tilt = 12 * Math.sin(theta * Math.PI * 2);
  return <div style={{ position: "absolute", left: CX - W / 2, top: y - 80 * scale, width: W, height: 160 * scale, borderRadius: "50%", border: `${6 * scale}px solid #fff`, boxShadow: `${glowBox(SP.violet, 1.4)}, 0 0 80px ${SP.pink}`, transform: `rotate(${tilt}deg)`, opacity: o }} />;
};

export const Spin360: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const theta = integrate(speed, f);
  const v = speed(t);
  const slowClock = integrate(timeRate, f) - integrate(timeRate, Math.round(M.slowmo * FPS));
  const drop = pop(f, M.drop, 9, 170);
  const posed = pop(f, M.pose, 10, 200);
  const ending = interpolate(t, [M.slowEnd, M.logo + 0.3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const away = interpolate(t, [M.tagline - 0.3, M.tagline + 0.3], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  // the whole set shrinks under the wordmark for the end card
  const sc = 1 - 0.32 * ending;
  const floorY = FLOOR + 40 * ending + 1500 * away;
  const guestH = 600 * sc;
  const groove = t > M.spin ? Math.sin(t * 5) : 0;
  const armsUp: [number, number] = [interpolate(posed, [0, 1], [18, 150]) + groove * 12, interpolate(posed, [0, 1], [-18, -150]) - groove * 12];
  const vf = win(t, M.spin + 0.1, M.spin + 0.4, M.slowEnd, M.slowEnd + 0.2);
  return (
    <AbsoluteFill>
      <Soundtrack id={ID} />
      <Stage drift={-theta * 900}>
        <Venue theta={theta} opacity={interpolate(t, [0.2, 1], [0, 1], clamp) * (1 - ending)} />
        <SpeedLines v={v} />
        <Platform theta={theta} y={floorY} scale={sc} glow={0.8 + 0.4 * Math.sin(f / 6) + (t > M.drop && t < M.drop + 0.4 ? 1 : 0)} />
        {/* landing shockwave */}
        {t > M.drop && t < M.drop + 0.8 && (() => { const p = (t - M.drop) / 0.8; return <div style={{ position: "absolute", left: CX - 400 - p * 300, top: floorY - 110 - p * 80, width: 800 + p * 600, height: 220 + p * 160, borderRadius: "50%", border: `6px solid ${SP.blue}`, opacity: 1 - p }} />; })()}
        <HaloRing theta={theta} y={floorY - guestH * 0.55} scale={sc} o={interpolate(t, [M.spin, M.spin + 0.6], [0, 0.9], clamp) * (1 - away)} />
        <Guest x={CX} y={floorY - 10 * sc - (1 - Math.min(drop, 1)) * 1300} h={guestH * (t < M.drop + 0.25 ? 1 - 0.08 * Math.sin(Math.min(1, (t - M.drop) / 0.25) * Math.PI) * (t > M.drop ? 1 : 0) : 1)} turn={-theta * Math.PI * 2} arms={armsUp} color={SP.pink} opacity={t < M.drop ? 0 : 1} />
        {/* front half of the halo ring passes in front of the guest */}
        <div style={{ clipPath: "inset(50% 0 0 0)", position: "absolute", inset: 0 }}><HaloRing theta={theta} y={floorY - guestH * 0.55} scale={sc} o={interpolate(t, [M.spin, M.spin + 0.6], [0, 0.9], clamp) * (1 - away)} /></div>
      </Stage>
      <Confetti x={250} y={-60} el={slowClock} seed="l" power={0.7} />
      <Confetti x={830} y={-60} el={slowClock} seed="r" power={0.7} />
      <Confetti x={540} y={floorY - 300} el={slowClock - 0.02} seed="m" n={50} power={1.1} />
      <Viewfinder opacity={vf} label={t >= M.slowmo ? "SLOW-MO  ·  360°" : "REC  ·  360°"} />
      {t >= M.slowmo && t < M.slowEnd && <div style={{ position: "absolute", top: 135, right: 190, fontFamily: round, fontWeight: 700, fontSize: 40, color: SP.blue, opacity: vf }}>0.25×</div>}
      <Flashes at={[M.pose, M.slowmo, M.logo]} />
      <Wordmark at={M.logo} top={230} />
      <Neon on={M.tagline} top={760} size={74} color={SP.blue} font={round}>Capture the moment.</Neon>
      <Neon on={M.fun} top={880} size={150} color={SP.pink}>Spin the<br />fun.</Neon>
      <Cta at={M.cta} top={1250} label="Check my date" />
      <Contact at={M.cta + 0.3} top={1440} />
      <SpinCaptions id={ID} />
    </AbsoluteFill>
  );
};
