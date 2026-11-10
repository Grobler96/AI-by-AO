import { continueRender, delayRender, staticFile } from "remotion";

// Palette and type for the rave advert in src/rave/ (acid lime, UV purple, orange on black). Separate from the AI by AO and SpinPix themes.
export const head = "Anton"; // big condensed rave headlines
export const body = "Space Grotesk"; // small print, captions

const faces: [string, string, string][] = [
  [head, "400", "anton-latin-400-normal.woff2"],
  [body, "500", "space-grotesk-latin-500-normal.woff2"],
  [body, "700", "space-grotesk-latin-700-normal.woff2"],
];
const handle = delayRender("rave fonts");
Promise.all(faces.map(([family, weight, file]) => new FontFace(family, `url(${staticFile("fonts/" + file)})`, { weight }).load().then((f) => document.fonts.add(f))))
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

export const RV = {
  bg: "#050308",
  lime: "#c8ff00",
  uv: "#8a2bff",
  orange: "#ff5a1f",
  cyan: "#19f0ff",
  red: "#ff1f4b",
  white: "#ffffff",
  muted: "#b9b3c9",
};
export const glow = (c: string, k = 1) => `0 0 ${8 * k}px ${c}, 0 0 ${28 * k}px ${c}, 0 0 ${64 * k}px ${c}`;
