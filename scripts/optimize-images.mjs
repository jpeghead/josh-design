// Make web-sized JPEG copies of every image the site references, from the
// full-resolution Framer export. Uses macOS `sips`; re-run after editing
// src/content/work-media.ts. Output: public/img/<id>.jpg (max 1600px, q78).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = "public/framer/canvas/images";
const OUT = "public/img";
mkdirSync(OUT, { recursive: true });
const media = readFileSync("src/content/work-media.ts", "utf8");
const ids = [...new Set([...media.matchAll(/img\("([^"]+)"\)/g)].map((m) => m[1]))];
const files = readdirSync(SRC);
let made = 0;
for (const id of ids) {
  const src = files.find((f) => f.startsWith(id + "."));
  if (!src) { console.warn("missing source for", id); continue; }
  const out = path.join(OUT, `${id}.jpg`);
  if (existsSync(out)) continue;
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "78", "-Z", "1600", path.join(SRC, src), "--out", out], { stdio: "ignore" });
  made++;
}
console.log(`${ids.length} referenced, ${made} written to ${OUT}`);
