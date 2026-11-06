import { continueRender, delayRender, staticFile } from "remotion";

// SpinPix UK palette and type, for the client videos in src/spinpix/. The AI by AO ads keep using theme.ts.
// Fonts are bundled in public/fonts so renders don't need network access.
export const chunky = "Bungee"; // headlines, the wordmark
export const round = "Fredoka"; // captions, UI, body

const faces: [string, string, string][] = [
  [chunky, "400", "bungee-latin-400-normal.woff2"],
  [round, "500", "fredoka-latin-500-normal.woff2"],
  [round, "600", "fredoka-latin-600-normal.woff2"],
  [round, "700", "fredoka-latin-700-normal.woff2"],
];
const handle = delayRender("spinpix fonts");
Promise.all(
  faces.map(([family, weight, file]) => new FontFace(family, `url(${staticFile("fonts/" + file)})`, { weight }).load().then((f) => document.fonts.add(f)))
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

export const SP = {
  bg: "#07050c",
  bg2: "#120a22",
  text: "#fff4fb",
  muted: "#c3b2d6",
  pink: "#ff2d9b",
  hot: "#ff5cc0",
  blue: "#22c4ff",
  violet: "#9b4dff",
  green: "#3dffa8",
  grad: "linear-gradient(110deg,#22c4ff,#9b4dff 48%,#ff2d9b)",
  gradPink: "linear-gradient(110deg,#ff5cc0,#ff2d9b 55%,#9b4dff)",
};

/** Neon glow text-shadow in a colour. */
export const neon = (c: string, k = 1) => `0 0 ${6 * k}px #fff, 0 0 ${14 * k}px ${c}, 0 0 ${34 * k}px ${c}, 0 0 ${70 * k}px ${c}`;
/** Neon glow box-shadow in a colour. */
export const glowBox = (c: string, k = 1) => `0 0 ${10 * k}px ${c}, 0 0 ${36 * k}px ${c}, inset 0 0 ${18 * k}px ${c}`;
