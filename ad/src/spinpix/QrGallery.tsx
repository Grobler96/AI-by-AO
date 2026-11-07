import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { SP, chunky, glowBox, neon, round } from "../theme-spinpix";
import { Confetti, Contact, Cta, FPS, Flashes, GradText, Guest, PhoneFrame, SpinCaptions, Soundtrack, Stage, Star, Wordmark, clamp, film, pop } from "./kit";
import qr from "./qr.json";

/* QR guest gallery (£35): guests' phones go up, they scan the table card, photos fly into one private gallery. */
const ID = "spinpix-qr";
const M = film(ID).marks as { phones: number[]; flashes: number[]; card: number; scan: number; lock: number; open: number; fly: number[]; grid: number; price: number; cta: number };

/** A real QR code for https://spinpixuk.co.uk */
export const QrCode: React.FC<{ size: number }> = ({ size }) => {
  const n = qr.length, q = size / (n + 2);
  return (
    <svg width={size} height={size} style={{ background: "#fff", borderRadius: q }}>
      {qr.flatMap((row, y) => row.split("").map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={(x + 1) * q} y={(y + 1) * q} width={q + 0.3} height={q + 0.3} fill="#0a0612" /> : null)))}
    </svg>
  );
};

/** a party photo, made of shapes */
const Photo: React.FC<{ seed: number; w: number; h: number; video?: boolean }> = ({ seed, w, h, video }) => {
  const g = [SP.grad, SP.gradPink, "linear-gradient(140deg,#22c4ff,#3dffa8)", "linear-gradient(140deg,#ffe14d,#ff2d9b)", "linear-gradient(140deg,#9b4dff,#22c4ff)"][seed % 5];
  const n = 1 + (seed % 3);
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.08, background: g, overflow: "hidden" }}>
      {Array.from({ length: n }).map((_, k) => <Guest key={k} x={w * (k + 1) / (n + 1)} y={h * 1.02} h={h * (0.72 - k * 0.05)} color={["#2a1240", "#1a0b2c", "#3a1a5c"][k]} arms={[k % 2 ? 150 : 20, k % 2 ? -20 : -150]} hair={false} />)}
      <Star x={w * 0.8} y={h * 0.2} size={w * 0.22} />
      {video && <div style={{ position: "absolute", left: w / 2 - w * 0.14, top: h / 2 - w * 0.14, width: w * 0.28, height: w * 0.28, borderRadius: "50%", background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", color: "#fff", fontSize: w * 0.14 }}>▶</div>}
    </div>
  );
};

/* ---------- 1. the dancefloor: phones up, flashes ---------- */
const Crowd: React.FC<{ t: number; out: number }> = ({ t, out }) => {
  const f = Math.round(t * FPS);
  const cols = [SP.pink, SP.blue, SP.violet, SP.hot, SP.blue];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 + out * 0.3})` }}>
      {M.phones.map((at, k) => {
        const x = 140 + k * 200, s = pop(f, at, 11, 120);
        const flash = M.flashes.some((a, j) => j % M.phones.length === k && t >= a && t < a + 0.25);
        return (
          <React.Fragment key={k}>
            <Guest x={x} y={1700 + (k % 2) * 60} h={560} color={cols[k]} arms={[160 - 30 * Math.min(s, 1), -150 + 20 * Math.sin(t * 4 + k)]} turn={Math.PI} />
            <PhoneFrame x={x + 40} y={1050 - 260 * Math.min(s, 1.05) + (k % 2) * 60} w={170} h={330} rot={-8 + k * 4} glow={cols[k]} opacity={Math.min(s, 1)}>
              <div style={{ position: "absolute", inset: 14, top: 40, borderRadius: 14, overflow: "hidden" }}>
                {t > M.flashes[k] + 0.1 ? <Photo seed={k} w={130} h={260} video={k === 2} /> : <div style={{ width: "100%", height: "100%", background: "#2a1240" }} />}
              </div>
              {flash && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.9 }} />}
            </PhoneFrame>
            {flash && <div style={{ position: "absolute", left: x + 40 - 120, top: 790 - 120 + (k % 2) * 60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,#fff,rgba(255,255,255,0) 70%)" }} />}
          </React.Fragment>
        );
      })}
      {/* little "shared" hearts float up after the first round of photos */}
      {t > 2.9 && Array.from({ length: 10 }).map((_, k) => {
        const p = ((t - 2.9 - k * 0.22) % 1.6) / 1.6;
        if (t - 2.9 - k * 0.22 < 0) return null;
        return <div key={k} style={{ position: "absolute", left: 140 + (k % 5) * 200 + 40 + Math.sin(p * 8 + k) * 20, top: 700 - p * 500, fontSize: 60, opacity: Math.sin(p * Math.PI) }}>{["💖", "📸", "🎥", "✨"][k % 4]}</div>;
      })}
    </AbsoluteFill>
  );
};

/* ---------- 2. the table card ---------- */
const TableCard: React.FC<{ t: number; y: number; scale: number; o: number }> = ({ t, y, scale, o }) => (
  <div style={{ position: "absolute", left: 540 - 320, top: y, width: 640, height: 860, transform: `scale(${scale}) perspective(1400px) rotateX(8deg)`, opacity: o, borderRadius: 40, background: "linear-gradient(180deg,#1d0d36,#0e0819)", border: `5px solid ${SP.violet}`, boxShadow: `${glowBox(SP.violet, 1.2)}, 0 50px 120px rgba(0,0,0,.6)`, textAlign: "center" }}>
    <div style={{ marginTop: 50 }}><GradText size={74}>SPINPIX</GradText></div>
    <div style={{ fontFamily: round, fontWeight: 700, fontSize: 52, color: "#fff", lineHeight: 1.1, marginTop: 24, textShadow: neon(SP.blue, 0.4) }}>Scan to upload your<br />photos & videos</div>
    <div style={{ marginTop: 40, display: "inline-block", padding: 18, borderRadius: 30, boxShadow: glowBox(SP.pink, 1.2 + 0.4 * Math.sin(t * 6)), border: `5px solid ${SP.pink}` }}><QrCode size={380} /></div>
  </div>
);

/* ---------- 3. the phone: scan, upload, gallery ---------- */
const UploadScreen: React.FC<{ t: number }> = ({ t }) => {
  const f = Math.round(t * FPS);
  const sent = M.fly.filter((a) => t >= a + 0.4).length;
  return (
    <AbsoluteFill style={{ padding: "110px 44px 0" }}>
      <div style={{ textAlign: "center" }}><GradText size={58}>SPINPIX</GradText></div>
      <div style={{ textAlign: "center", fontFamily: round, fontWeight: 700, fontSize: 46, color: "#fff", marginTop: 16 }}>Online Gallery Upload</div>
      <div style={{ textAlign: "center", fontSize: 110, marginTop: 20, filter: `drop-shadow(0 0 20px ${SP.blue})`, transform: `translateY(${-8 * Math.abs(Math.sin(t * 5))}px)` }}>☁️</div>
      {[["🖼️", "Upload Photos"], ["▶️", "Upload Videos"], ["🎥", "Record & Upload"]].map(([ic, l], k) => (
        <div key={l} style={{ marginTop: 26, padding: "26px 30px", borderRadius: 28, border: `4px solid ${k === 0 && t > M.fly[0] - 0.3 ? SP.pink : SP.blue}`, boxShadow: glowBox(k === 0 && t > M.fly[0] - 0.3 ? SP.pink : SP.blue, 0.6), fontFamily: round, fontWeight: 700, fontSize: 42, color: "#fff", display: "flex", gap: 24, alignItems: "center", transform: `scale(${Math.min(pop(f, M.open + 0.1 + k * 0.1, 10, 180), 1)})` }}><span>{ic}</span>{l}</div>
      ))}
      {t > M.fly[0] - 0.2 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: round, fontWeight: 600, fontSize: 34, color: sent === M.fly.length ? SP.green : SP.muted, textAlign: "center" }}>{sent === M.fly.length ? "✓ 6 of 6 uploaded" : `Uploading ${Math.min(sent + 1, 6)} of 6…`}</div>
          <div style={{ marginTop: 14, height: 16, borderRadius: 8, background: "rgba(255,255,255,.12)" }}><div style={{ width: `${(sent / 6) * 100}%`, height: "100%", borderRadius: 8, background: SP.grad }} /></div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const ScanScreen: React.FC<{ t: number }> = ({ t }) => {
  const lock = interpolate(t, [M.lock - 0.2, M.lock], [0, 1], clamp);
  const box = 420 - 60 * lock;
  const ok = t >= M.lock;
  return (
    <AbsoluteFill style={{ background: "#120a22" }}>
      <div style={{ position: "absolute", left: "50%", top: "48%", transform: `translate(-50%,-50%) scale(${1 + 0.06 * Math.sin(t * 3)}) rotate(${(1 - lock) * 4}deg)` }}><QrCode size={300} /></div>
      {[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y], k) => (
        <div key={k} style={{ position: "absolute", left: `calc(50% + ${(x ? 1 : -1) * box / 2}px - ${x ? 70 : 0}px)`, top: `calc(48% + ${(y ? 1 : -1) * box / 2}px - ${y ? 70 : 0}px)`, width: 70, height: 70, borderTop: !y ? `10px solid ${ok ? SP.green : "#fff"}` : "none", borderBottom: y ? `10px solid ${ok ? SP.green : "#fff"}` : "none", borderLeft: !x ? `10px solid ${ok ? SP.green : "#fff"}` : "none", borderRight: x ? `10px solid ${ok ? SP.green : "#fff"}` : "none", borderRadius: 14 }} />
      ))}
      {!ok && <div style={{ position: "absolute", left: "15%", right: "15%", top: `${35 + 26 * ((t * 1.4) % 1)}%`, height: 6, background: SP.pink, boxShadow: glowBox(SP.pink, 1) }} />}
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: round, fontWeight: 700, fontSize: 38, color: "#fff", padding: "16px 32px", borderRadius: 999, background: ok ? "rgba(61,255,168,.2)" : "rgba(255,255,255,.12)", border: `3px solid ${ok ? SP.green : "transparent"}` }}>{ok ? "✓ SpinPix Gallery" : "Scanning…"}</span>
      </div>
    </AbsoluteFill>
  );
};

const GalleryScreen: React.FC<{ t: number }> = ({ t }) => {
  const f = Math.round(t * FPS);
  return (
    <AbsoluteFill style={{ padding: "100px 30px 0" }}>
      <div style={{ fontFamily: round, fontWeight: 700, fontSize: 46, color: "#fff" }}>Our Wedding 💍</div>
      <div style={{ fontFamily: round, fontWeight: 600, fontSize: 28, color: SP.muted, marginTop: 4 }}>🔒 Private · 248 photos & videos · 6 months</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 24 }}>
        {Array.from({ length: 15 }).map((_, k) => {
          const s = pop(f, M.grid + (k % 3) * 0.05 + Math.floor(k / 3) * 0.08, 12, 170);
          return <div key={k} style={{ transform: `scale(${Math.min(s, 1.06)})`, opacity: Math.min(s, 1) }}><Photo seed={k + 3} w={210} h={210} video={k % 5 === 2} /></div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const QrGallery: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const crowdOut = interpolate(t, [M.card - 0.3, M.card + 0.3], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const card = pop(f, M.card, 12, 110);
  const phoneIn = pop(f, M.scan, 13, 100);
  const toPrice = interpolate(t, [M.price - 0.4, M.price + 0.1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  // the phone slides up in front of the card, then takes over the frame
  const phoneBig = interpolate(t, [M.open - 0.2, M.open + 0.4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cardO = Math.min(card, 1) * (1 - phoneBig);
  const phoneY = interpolate(phoneIn, [0, 1], [2600, 1350]) + (820 - 1350) * phoneBig + toPrice * 1800;
  const phoneScale = 0.62 + 0.38 * phoneBig;
  return (
    <AbsoluteFill>
      <Soundtrack id={ID} />
      <Stage>
        {t < M.card + 0.4 && <Crowd t={t} out={crowdOut} />}
        {t >= M.card - 0.1 && cardO > 0.01 && <TableCard t={t} y={130 + (1 - Math.min(card, 1)) * -700} scale={0.95 + 0.05 * Math.min(card, 1)} o={cardO} />}
        {t >= M.scan - 0.1 && t < M.price + 0.2 && (
          <PhoneFrame x={540} y={phoneY} w={760} h={1360} scale={phoneScale} rot={(1 - phoneBig) * -6} glow={SP.pink}>
            {t < M.open ? <ScanScreen t={t} /> : t < M.grid ? <UploadScreen t={t} /> : <GalleryScreen t={t} />}
          </PhoneFrame>
        )}
        {/* photos fly from the phone up into the cloud */}
        {M.fly.map((at, k) => {
          const p = interpolate(t, [at, at + 0.55], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          if (p <= 0 || p >= 1) return null;
          const x = 540 + (k - 2.5) * 70 * (1 - p), y = 1150 - p * 980;
          return <div key={k} style={{ position: "absolute", left: x - 70, top: y - 70, transform: `scale(${1 - 0.6 * p}) rotate(${(k - 2.5) * 10 * (1 - p)}deg)`, opacity: 1 - p * 0.6, filter: `drop-shadow(0 0 20px ${SP.pink})` }}><Photo seed={k} w={140} h={140} video={k === 3} /></div>;
        })}
      </Stage>
      <Flashes at={[...M.flashes, M.price]} strength={0.4} />
      {t >= M.price && <>
        <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", transform: `scale(${Math.min(pop(f, M.price, 7, 170), 1.15)}) rotate(-5deg)` }}>
          <div style={{ fontFamily: chunky, fontSize: 110, color: "#fff", textShadow: neon(SP.blue, 1) }}>ONLY</div>
          <GradText size={330} grad={SP.gradPink}>£35</GradText>
        </div>
        <div style={{ position: "absolute", top: 830, left: 0, right: 0, textAlign: "center", fontFamily: round, fontWeight: 700, fontSize: 48, color: "#fff", opacity: interpolate(t, [M.price + 0.6, M.price + 1], [0, 1], clamp) }}>All your guests' memories in one place</div>
        <Confetti x={540} y={520} el={t - M.price} seed="price" n={80} />
      </>}
      <Wordmark at={M.price + 0.8} top={40} scale={0.55} />
      <Cta at={M.cta} top={1000} label="Get a quote" />
      <Contact at={M.cta + 0.3} top={1190} />
      <SpinCaptions id={ID} />
    </AbsoluteFill>
  );
};
