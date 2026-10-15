// Make web-sized JPEG copies of every image the site references, from the
// full-resolution Framer export. Re-run after editing src/content/work-media.ts.
// Output: public/img/<id>.jpg, longest side 1400px, progressive, 4:2:0, q80.
// Uses ImageMagick (`magick`) when present; macOS `sips` is the fallback and
// produces files three to four times larger, so install ImageMagick if you can.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = "public/framer/canvas/images";
const OUT = "public/img";
const MAX = 1400;
mkdirSync(OUT, { recursive: true });
const media = readFileSync("src/content/work-media.ts", "utf8");
const ids = [...new Set([...media.matchAll(/img\("([^"]+)"\)/g)].map((m) => m[1]))];
const files = readdirSync(SRC);

const hasMagick = (() => {
  try {
    execFileSync("magick", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();
if (!hasMagick) console.warn("ImageMagick not found; falling back to sips (larger files).");

let made = 0;
for (const id of ids) {
  const src = files.find((f) => f.startsWith(id + "."));
  if (!src) { console.warn("missing source for", id); continue; }
  const out = path.join(OUT, `${id}.jpg`);
  if (existsSync(out)) continue;
  const input = path.join(SRC, src);
  if (hasMagick) {
    execFileSync("magick", [input, "-auto-orient", "-resize", `${MAX}x${MAX}>`, "-strip", "-interlace", "JPEG", "-sampling-factor", "4:2:0", "-quality", "80", out], { stdio: "ignore" });
  } else {
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "72", "-Z", String(MAX), input, "--out", out], { stdio: "ignore" });
  }
  made++;
}
console.log(`${ids.length} referenced, ${made} written to ${OUT}${hasMagick ? "" : " (sips)"}`);
