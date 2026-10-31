import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled in public/fonts so renders don't need network access.
export const disp = "Space Grotesk";
export const mono = "JetBrains Mono";

const faces: [string, string, string][] = [
  [disp, "500", "space-grotesk-latin-500-normal.woff2"],
  [disp, "700", "space-grotesk-latin-700-normal.woff2"],
  [mono, "500", "jetbrains-mono-latin-500-normal.woff2"],
];
const handle = delayRender("fonts");
Promise.all(
  faces.map(([family, weight, file]) => new FontFace(family, `url(${staticFile("fonts/" + file)})`, { weight }).load().then((f) => document.fonts.add(f)))
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

// Same palette as aibyao.com
export const C = {
  bg: "#04050d",
  bg2: "#080b1a",
  text: "#eef2ff",
  muted: "#8b95b3",
  cyan: "#38e1ff",
  violet: "#8b5cf6",
  pink: "#ff4fd8",
  lime: "#7dffb2",
  grad: "linear-gradient(115deg,#38e1ff,#8b5cf6 55%,#ff4fd8)",
};
