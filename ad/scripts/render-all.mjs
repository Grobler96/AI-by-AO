// Renders every ad in src/ads.json, src/stories.json and src/spinpix/spinpix.json and src/rave/rave.json to out/aibyao-<id>.mp4 (SpinPix and rave ones to out/<id>.mp4), or just the ids passed as arguments.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ids = process.argv.length > 2 ? process.argv.slice(2) : ["src/ads.json", "src/stories.json", "src/spinpix/spinpix.json", "src/rave/rave.json"].flatMap((f) => JSON.parse(readFileSync(f, "utf8")).map((a) => a.id));
for (const id of ids) {
  execSync(`npx remotion render src/index.ts ${id} out/${id.startsWith("spinpix-") || id.startsWith("rave-") ? id : "aibyao-" + id}.mp4 --crf=18 --audio-codec=aac${process.env.BROWSER ? ` --browser-executable=${process.env.BROWSER}` : ""}`, { stdio: "inherit" });
}
