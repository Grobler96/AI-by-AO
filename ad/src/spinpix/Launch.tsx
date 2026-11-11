import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { SP, neon, round } from "../theme-spinpix";
import { Contact, Cta, FPS, Flashes, Neon, Soundtrack, Wordmark, clamp, ez, film } from "./kit";

/* SpinPix UK launch film: seven Veo 3 clips (public/clips/spinpix-launch) cut on the 120 bpm grid, graded and finished here
   with kinetic labels, light leaks, film grain and the end card. All timings are in spinpix.json (the audio reads them too). */
const ID = "spinpix-launch";
const M = film(ID).marks as Record<string, number>;

const PAYOFF_END = 22.95; // the payoff clip ends here; its last frame is then held
type Shot = { file: string; from: number; to: number; src: number; rate?: number; push: [number, number]; origin?: string };
const SHOTS: Shot[] = [
  { file: "spark", from: 0, to: M.drop, src: 2.0, push: [1.05, 1.16] },
  { file: "team-mirror", from: M.drop, to: M.cut3, src: 0.2, push: [1.03, 1.13] },
  { file: "spin360", from: M.cut3, to: M.cut4, src: 1.5, push: [1.22, 1.4], origin: "50% 58%" },
  { file: "selfie", from: M.cut4, to: M.cut5, src: 1.9, push: [1.03, 1.11] },
  { file: "prints", from: M.cut5, to: M.cut6, src: 0.4, push: [1.04, 1.12] },
  { file: "props", from: M.cut6, to: M.cut8, src: 2.2, push: [1.04, 1.12] },
  { file: "payoff", from: M.cut8, to: PAYOFF_END, src: 1.5, rate: 1.6, push: [1.0, 1.0] },
];
const CLIP_END = 7.8; // last usable second of every 7.9 s clip
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);

const Grade: React.FC<{ s: Shot }> = ({ s }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const dur = s.to - s.from;
  const p = Math.min(1, t / dur);
  const punch = s.from > 0 ? 0.1 * Math.exp(-t * 12) : 0;       // a quick zoom punch on every cut
  const scale = s.push[0] + (s.push[1] - s.push[0]) * p + punch;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: s.origin ?? "50% 50%", filter: "contrast(1.08) saturate(1.12) brightness(1.02)" }}>
      <OffthreadVideo src={staticFile(`clips/spinpix-launch/${s.file}.mp4`)} startFrom={Math.round(s.src * FPS)} playbackRate={s.rate ?? 1} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

/** Film finishing: vignette, drifting pink light leak, grain */
const Finish: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const g = Math.floor(f / 2) % 5;
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 48%, transparent 58%, rgba(5,2,12,.6))" }} />
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.55, background: `linear-gradient(105deg, transparent ${30 + 12 * Math.sin(t * 0.7)}%, rgba(255,92,192,.16) ${48 + 12 * Math.sin(t * 0.7)}%, transparent ${66 + 12 * Math.sin(t * 0.7)}%)` }} />
      <AbsoluteFill style={{ opacity: 0.1, mixBlendMode: "overlay", transform: `translate(${(random(`gx${g}`) - 0.5) * 140}px, ${(random(`gy${g}`) - 0.5) * 140}px) scale(1.2)`, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }} />
    </>
  );
};

/** Kinetic label: wipes in left to right with a neon underline, then out. One or two lines, each sized to fit the screen. */
const Label: React.FC<{ at: number; dur: number; lines: string[]; bottom?: number }> = ({ at, dur, lines, bottom = 330 }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < at || t > at + dur) return null;
  const a = ez(ramp(t, at, at + 0.4));
  const out = 1 - ramp(t, at + dur - 0.25, at + dur);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{ display: "inline-block" }}>
        <div style={{ clipPath: `inset(0 ${(1 - a) * 100}% 0 0)` }}>
          {lines.map((l) => (
            <div key={l} style={{ fontFamily: round, fontWeight: 700, fontSize: Math.min(82, 940 / (l.length * 0.76)), lineHeight: 1.12, letterSpacing: "0.14em", paddingLeft: "0.14em", color: "#fff", textShadow: `${neon(SP.pink, 0.5)}, 0 4px 20px rgba(0,0,0,.7)`, whiteSpace: "nowrap", textAlign: "center" }}>{l}</div>
          ))}
        </div>
        <div style={{ height: 6, marginTop: 12, borderRadius: 4, background: SP.grad, boxShadow: `0 0 18px ${SP.pink}`, transform: `scaleX(${a})`, transformOrigin: "0 50%" }} />
      </div>
    </div>
  );
};

export const Launch: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const dim = ramp(t, M.name - 0.6, M.name + 0.2);
  const lastSrcFrame = Math.floor(CLIP_END * FPS);
  return (
    <AbsoluteFill style={{ background: SP.bg }}>
      <Soundtrack id={ID} />
      {SHOTS.map((s) => (
        <Sequence key={s.file} from={Math.round(s.from * FPS)} durationInFrames={Math.round((s.to - s.from) * FPS)}>
          <Grade s={s} />
        </Sequence>
      ))}
      {/* hold the final glowing-screen frame under the end card */}
      <Sequence from={Math.round(PAYOFF_END * FPS)}>
        <Freeze frame={0}>
          <AbsoluteFill style={{ transform: "scale(1)", filter: "contrast(1.08) saturate(1.12)" }}>
            <OffthreadVideo src={staticFile("clips/spinpix-launch/payoff.mp4")} startFrom={lastSrcFrame} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
          </AbsoluteFill>
        </Freeze>
      </Sequence>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 62%, rgba(7,5,12,.55))" }} />
      <Finish />
      <Flashes at={[M.drop, M.cut3, M.cut4, M.cut5, M.cut6]} strength={0.45} />
      <Flashes at={[M.name - 0.05]} strength={0.85} />
      <Label at={M.drop + 0.5} dur={1.9} lines={["MAGIC MIRROR"]} />
      <Label at={M.drop + 2.6} dur={2.3} lines={["FAMILY-RUN TEAM"]} />
      <Label at={M.cut3 + 0.3} dur={2.4} lines={["360 SPIN"]} />
      <Label at={M.cut4 + 0.2} dur={2.1} lines={["SELFIE POD"]} />
      <Label at={M.cut5 + 0.2} dur={2.1} lines={["PRINTS · GALLERIES"]} />
      <Label at={M.cut6 + 0.2} dur={2.1} lines={["PROPS"]} />
      <Label at={M.cut8 + 0.3} dur={1.6} lines={["SERVING FROM", "WEST YORKSHIRE"]} />
      {/* end card: the glowing screen darkens to violet under the wordmark */}
      <AbsoluteFill style={{ background: `radial-gradient(75% 48% at 50% 38%, rgba(105,18,120,${0.93 * dim}), rgba(8,3,18,${0.985 * dim}))` }} />
      <Wordmark at={M.name} top={330} scale={0.88} />
      <Neon on={M.tag1} top={780} size={74} color={SP.blue} font={round}>Capture the moment.</Neon>
      <Neon on={M.tag2} top={900} size={140} color={SP.pink}>Spin the<br />fun.</Neon>
      <Cta at={M.cta} top={1290} label="Check my date" />
      <Contact at={M.contact} top={1480} sub="spinpixuk.co.uk · West Yorkshire" />
    </AbsoluteFill>
  );
};
