import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, disp, mono } from "./theme";
import { Reveal } from "./Ad";
import storiesJson from "./stories.json";
import voiceDurations from "./voice-durations.json";

export const STORY_FPS = 30;
export const STORY_DURATION = Math.round(18.5 * STORY_FPS);
export const stories = storiesJson;

const sec = (s: number) => Math.round(s * STORY_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

/* ---------- timeline (seconds) ---------- */
const ARRIVE = [2.4, 3.2, 4.0, 4.8, 5.6].map(sec);       // notifications land
const SLEEP = sec(6.9);                                    // "and you're fast asleep"
const SWEEP = sec(8.5);                                    // the AI light sweeps through
const FLIP = [9.3, 9.75, 10.2, 10.65, 11.1].map(sec);      // each notification is handled
const MORNING = sec(12.4);                                 // time-lapse to 7am
const ALARM = sec(13.5);
const ROWS = [13.7, 14.0, 14.3, 14.6].map(sec);            // booked jobs appear
const END = sec(14.9);                                     // brand reveal

const NOTIFS = [
  { icon: "📞", app: "MISSED CALL", body: "Dave · boiler's packed in", rTitle: "ANSWERED · 1 RING", rBody: "Repair booked · Thu 9am" },
  { icon: "💬", app: "WHATSAPP", body: "“Do you do emergency callouts?”", rTitle: "REPLIED · 3 SECONDS", rBody: "Yes, 24/7 · visit booked" },
  { icon: "✉️", app: "EMAIL", body: "Kitchen refit · quote request", rTitle: "QUOTE SENT", rBody: "Itemised · sent in 40s" },
  { icon: "🌐", app: "WEBSITE CHAT", body: "“How much for a full rewire?”", rTitle: "LEAD CAPTURED", rBody: "Price sent · call booked" },
  { icon: "📞", app: "MISSED CALL", body: "Sarah · leaking tap", rTitle: "ANSWERED · 1 RING", rBody: "Visit booked · Fri 8am" },
];
const JOBS = [
  ["THU 9AM", "Boiler repair"],
  ["FRI 8AM", "Leaking tap"],
  ["TUE 10AM", "Rewire quote call"],
  ["WED 7AM", "Emergency callout"],
];

const PHONE_W = 820;
const PHONE_H = 1500;
const BORDER = 12;
const INNER_W = PHONE_W - BORDER * 2;

/* ---------- background: night sky that turns to dawn ---------- */
const Sky: React.FC = () => {
  const f = useCurrentFrame();
  const dawn = interpolate(f, [MORNING, ALARM], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#03040c,#0a1030 70%,#120a2e)" }}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 18% 12%, rgba(56,225,255,.28), transparent 70%)", opacity: 1 - dawn }} />
      {Array.from({ length: 46 }).map((_, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (20 + random(`t${i}`) * 30) + i));
        return (
          <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1080, top: random(`y${i}`) * 900, width: 3 + random(`s${i}`) * 4, height: 3 + random(`s${i}`) * 4, borderRadius: "50%", background: "#cfe9ff", opacity: tw * 0.7 * (1 - dawn) }} />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 50% 100%, rgba(255,150,90,.65), rgba(255,79,216,.25) 55%, transparent 80%)", opacity: dawn }} />
    </AbsoluteFill>
  );
};

/* ---------- phone shell ---------- */
const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: f, fps, config: { damping: 18, stiffness: 70 } });
  // buzz right after every notification lands
  const buzz = ARRIVE.reduce((a, t) => {
    const d = f - t;
    return d >= 0 && d < 14 ? a + Math.sin(d * 2.6) * 11 * (1 - d / 14) : a;
  }, 0);
  const cam = interpolate(f, [0, SLEEP, SWEEP, END], [1, 1.07, 1.02, 1.1], clamp);
  const tiltY = Math.sin(f / 70) * 3;
  const out = interpolate(f, [END - 14, END + 6], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ perspective: 1600, opacity: out, transform: `scale(${cam})` }}>
      <div
        style={{
          position: "absolute",
          left: (1080 - PHONE_W) / 2 + buzz,
          top: 150 + (1 - rise) * 260,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 120,
          border: `${BORDER}px solid #1b2147`,
          background: "linear-gradient(180deg,#070b22,#150b3b 65%,#0a0e28)",
          boxShadow: "0 0 140px rgba(139,92,246,.35), 0 40px 120px rgba(0,0,0,.6)",
          overflow: "hidden",
          opacity: rise,
          transform: `rotateY(${tiltY}deg) rotateX(${(1 - rise) * 18}deg)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const fmt = (m: number) => `${Math.floor(m / 60) % 12 || 12}:${String(Math.floor(m % 60)).padStart(2, "0")}`;

/* ---------- one notification, with its "handled" back face ---------- */
const Notif: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = NOTIFS[i];
  const enter = spring({ frame: f - ARRIVE[i], fps, config: { damping: 11, stiffness: 150 } });
  const flip = interpolate(f, [FLIP[i], FLIP[i] + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const leave = interpolate(f, [MORNING, MORNING + 14], [1, 0], clamp);
  if (f < ARRIVE[i] - 1) return null;
  const face: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: 40, padding: "0 34px", display: "flex", alignItems: "center", gap: 28, backfaceVisibility: "hidden" };
  return (
    <div style={{ position: "absolute", left: 28, top: 410 + i * 172, width: INNER_W - 56, height: 150, perspective: 1200, opacity: Math.min(enter, 1) * leave, transform: `translateY(${(1 - enter) * -90 - (1 - leave) * 40}px) scale(${0.92 + 0.08 * Math.min(enter, 1)})` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateX(${flip * 180}deg)` }}>
        <div style={{ ...face, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.18)", backdropFilter: "blur(14px)" }}>
          <div style={{ width: 84, height: 84, borderRadius: 24, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontSize: 46 }}>{n.icon}</div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 24, color: C.muted, letterSpacing: 1 }}>{n.app} · NOW</div>
            <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 35, color: C.text, marginTop: 4, lineHeight: 1.15 }}>{n.body}</div>
          </div>
        </div>
        <div style={{ ...face, transform: "rotateX(180deg)", background: "linear-gradient(115deg,rgba(56,225,255,.22),rgba(139,92,246,.28) 55%,rgba(255,79,216,.22))", border: "2px solid rgba(125,255,178,.8)", boxShadow: "0 0 50px rgba(125,255,178,.3)" }}>
          <div style={{ width: 84, height: 84, borderRadius: 24, background: C.grad, display: "grid", placeItems: "center", fontSize: 50, color: "#04050d", fontWeight: 700 }}>✓</div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 24, color: C.lime, letterSpacing: 1 }}>{n.rTitle}</div>
            <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 35, color: C.text, marginTop: 4, lineHeight: 1.15 }}>{n.rBody}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- lock screen ---------- */
const LockScreen: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wake = spring({ frame: f - 14, fps, config: { damping: 20, stiffness: 80 } });
  const minutes = interpolate(f, [MORNING, ALARM], [134, 420], { ...clamp, easing: Easing.in(Easing.quad) });
  const t = f < MORNING ? "2:14" : fmt(minutes);
  const arrived = ARRIVE.filter((a) => f >= a).length;
  const handled = FLIP.filter((a) => f >= a + 8).length;
  const showHandled = f >= FLIP[0];
  const lockOut = interpolate(f, [MORNING, MORNING + 12], [1, 0], clamp);
  const sleepDim = interpolate(f, [SLEEP, SLEEP + 18, SWEEP - 6, SWEEP + 6], [0, 0.55, 0.55, 0], clamp);
  const pillScale = spring({ frame: f - (showHandled ? FLIP[0] : ARRIVE[0]), fps, config: { damping: 12 } });
  const sweepY = interpolate(f, [SWEEP, SWEEP + 26], [-520, 1900], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: wake }}>
      <div style={{ opacity: lockOut }}>
        <div style={{ position: "absolute", top: 64, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 30, color: C.muted, letterSpacing: 3 }}>SUNDAY 2 NOVEMBER</div>
        <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center", fontFamily: disp, fontWeight: 700, fontSize: 230, color: C.text, letterSpacing: -6, lineHeight: 1.1 }}>
          {t}<span style={{ fontSize: 56, letterSpacing: 0, marginLeft: 14, color: C.muted }}>AM</span>
        </div>
        {arrived > 0 && (
          <div style={{ position: "absolute", top: 330, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${0.6 + 0.4 * Math.min(pillScale, 1.15)})` }}>
            <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 34, padding: "12px 34px", borderRadius: 999, color: showHandled ? "#04050d" : "#fff", background: showHandled ? C.grad : "#ff4f64", boxShadow: showHandled ? "0 0 50px rgba(139,92,246,.7)" : "0 0 40px rgba(255,79,100,.55)" }}>
              {showHandled ? `✓ ${handled} of ${NOTIFS.length} handled by AI` : `${arrived} new ${arrived === 1 ? "enquiry" : "enquiries"}`}
            </div>
          </div>
        )}
        {NOTIFS.map((_, i) => <Notif key={i} i={i} />)}
        {/* "asleep" dimming and floating Zs */}
        <AbsoluteFill style={{ background: "#02030a", opacity: sleepDim }} />
        {f >= SLEEP && f < SWEEP + 6 &&
          [0, 1, 2].map((k) => {
            const p = ((f - SLEEP - k * 14) % 56) / 56;
            return <div key={k} style={{ position: "absolute", left: 690 + k * 26 + p * 30, top: 175 - p * 130, fontFamily: disp, fontWeight: 700, fontSize: 50 + k * 18, color: C.cyan, opacity: Math.sin(p * Math.PI) * 0.9 * (f < SWEEP - 6 ? 1 : 0.3) }}>z</div>;
          })}
        {/* the AI light sweep */}
        {f >= SWEEP && f < SWEEP + 30 && (
          <div style={{ position: "absolute", left: -200, width: INNER_W + 400, height: 520, top: sweepY, transform: "rotate(-9deg)", background: "linear-gradient(180deg,transparent,rgba(56,225,255,.55) 35%,rgba(139,92,246,.75) 55%,rgba(255,79,216,.5) 75%,transparent)", filter: "blur(18px)", mixBlendMode: "screen" }} />
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- morning: booked jobs ---------- */
const Morning: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vis = interpolate(f, [MORNING + 16, MORNING + 34], [0, 1], clamp);
  const minutes = interpolate(f, [MORNING, ALARM], [134, 420], { ...clamp, easing: Easing.in(Easing.quad) });
  const t = fmt(minutes);
  const booked = ROWS.filter((r) => f >= r).length;
  const settle = spring({ frame: f - ALARM, fps, config: { damping: 8, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <div style={{ position: "absolute", top: 64, width: "100%", textAlign: "center", fontFamily: mono, fontSize: 30, color: "#ffd9b8", letterSpacing: 3 }}>MONDAY 3 NOVEMBER ☀️</div>
      <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center", fontFamily: disp, fontWeight: 700, fontSize: 230, color: C.text, letterSpacing: -6, lineHeight: 1.1, transform: `scale(${f >= ALARM ? 1 + (settle - 1) * 0.06 : 1})` }}>
        {f >= ALARM ? "7:00" : t}<span style={{ fontSize: 56, letterSpacing: 0, marginLeft: 14, color: "#ffd9b8" }}>AM</span>
      </div>
      <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center" }}>
        <span style={{ fontFamily: disp, fontWeight: 700, fontSize: 250, lineHeight: 1, background: C.grad, WebkitBackgroundClip: "text", color: "transparent" }}>{booked}</span>
        <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 48, color: C.text, marginTop: -6 }}>jobs booked while you slept</div>
      </div>
      {JOBS.map(([when, what], i) => {
        const s = spring({ frame: f - ROWS[i], fps, config: { damping: 12, stiffness: 160 } });
        return (
          <div key={i} style={{ position: "absolute", left: 40, top: 780 + i * 150, width: INNER_W - 80, height: 120, borderRadius: 34, padding: "0 34px", display: "flex", alignItems: "center", gap: 28, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)", opacity: Math.min(s, 1), transform: `translateX(${(1 - s) * 140}px)` }}>
            <div style={{ fontFamily: mono, fontSize: 28, color: "#04050d", background: C.grad, padding: "8px 18px", borderRadius: 16, fontWeight: 500 }}>{when}</div>
            <div style={{ fontFamily: disp, fontWeight: 700, fontSize: 40, color: C.text, flex: 1 }}>{what}</div>
            <div style={{ fontSize: 40, color: C.lime }}>✓</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- captions timed to the voiceover ---------- */
const spoken = (t: string) => t.replace(/\[\[A\]\] \[\[O\]\]/g, "AO").replace(/\[\[([A-Z])\]\]/g, "$1");

const Captions: React.FC = () => {
  const f = useCurrentFrame() / STORY_FPS;
  const story = stories[0];
  const keys = Object.keys(story.voice) as (keyof typeof story.voice)[];
  const k = keys.find((key) => {
    const s = (story.voiceStart as Record<string, number>)[key];
    const d = (voiceDurations as Record<string, Record<string, number>>)[story.id]?.[key] ?? 2;
    return f >= s - 0.05 && f < s + d + 0.3;
  });
  if (!k) return null;
  const s = (story.voiceStart as Record<string, number>)[k];
  const d = (voiceDurations as Record<string, Record<string, number>>)[story.id]?.[k] ?? 2;
  const words = spoken(story.voice[k]).split(" ");
  const cur = Math.min(words.length - 1, Math.max(0, Math.floor(((f - s) / (d * 0.95)) * words.length)));
  const fadeIn = interpolate(f, [s - 0.05, s + 0.1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 520, background: "linear-gradient(180deg,transparent,rgba(3,4,12,.82))" }} />
      <div style={{ position: "relative", width: 920, textAlign: "center", fontFamily: disp, fontWeight: 700, fontSize: 82, lineHeight: 1.18, color: C.text, opacity: fadeIn, transform: `translateY(${(1 - fadeIn) * 24}px)`, textShadow: "0 6px 30px rgba(0,0,0,.7)" }}>
        {words.map((w, i) => (
          <span key={i} style={{ display: "inline-block", marginRight: 22, opacity: i <= cur ? 1 : 0.28, ...(i === cur ? { background: C.grad, WebkitBackgroundClip: "text", color: "transparent", transform: "scale(1.06)" } : {}) }}>{w}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */
export const PhoneStory: React.FC<{ storyId: string }> = ({ storyId }) => {
  const id = stories.find((s) => s.id === storyId)?.id ?? stories[0].id;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile(`audio/${id}.wav`)} />
      <Sky />
      <Phone>
        <LockScreen />
        <Morning />
      </Phone>
      <Sequence from={END} durationInFrames={STORY_DURATION - END}>
        <AbsoluteFill style={{ opacity: interpolate(useCurrentFrame(), [0, 14], [0, 1], clamp) }}>
          <Reveal />
        </AbsoluteFill>
      </Sequence>
      <Captions />
    </AbsoluteFill>
  );
};
