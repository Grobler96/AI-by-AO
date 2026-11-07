// Renders stills across a video's timeline and tiles them into one contact sheet: out/stills/<id>.jpg
// Usage: node scripts/stills.mjs <id> [seconds,seconds,...]   (default: every second)
// Set BROWSER to a Chrome/Chromium headless shell path if Remotion can't download its own.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [id, list] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.BROWSER || null;
const comp = await selectComposition({ serveUrl, id, browserExecutable });
const secs = list ? list.split(",").map(Number) : Array.from({ length: Math.floor(comp.durationInFrames / comp.fps) }, (_, i) => i + 0.5);
const dir = `out/stills/${id}`;
mkdirSync(dir, { recursive: true });
const files = [];
for (const s of secs) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(s * comp.fps));
  const output = `${dir}/${String(frame).padStart(4, "0")}.jpg`;
  await renderStill({ composition: comp, serveUrl, frame, output, imageFormat: "jpeg", browserExecutable, scale: 0.5 });
  files.push(output);
}
const cols = Math.min(5, files.length);
execSync(`ffmpeg -y -loglevel error ${files.map((f) => `-i ${f}`).join(" ")} -filter_complex "${files.map((_, i) => `[${i}]drawtext=text='${secs[i]}s':x=12:y=12:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";")};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, () => "w0").join("+") : "0"}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, () => "h0").join("+") : "0"}`).join("|")}:fill=black" -q:v 3 out/stills/${id}.jpg`);
console.log(`out/stills/${id}.jpg`);
