import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { toPdf } from "./export";
import { resumeFontCss } from "./fonts";
import { renderResumeHtml } from "./render";
import type { Resume } from "./types";

/**
 * Page images of the exact PDF that would be sent, rasterized with poppler's
 * pdftoppm (Homebrew) and cached beside the PDF under a hash of the résumé
 * data, so the preview is the file, not an approximation of it.
 */
export async function resumePages(r: Resume): Promise<{ dir: string; count: number; hash: string }> {
  // hash the rendered HTML, so a change to the renderer re-rasterizes as surely as a change to the data
  const hash = createHash("sha1").update(renderResumeHtml(r.data, { template: r.template })).digest("hex").slice(0, 10);
  const pdf = await toPdf(r);
  const dir = dirname(pdf);
  const stamp = join(dir, `.pages-${hash}`);
  if (!existsSync(stamp)) {
    for (const f of readdirSync(dir)) if (/^page-\d+\.png$/.test(f) || f.startsWith(".pages-")) execFileSync("rm", ["-f", join(dir, f)]);
    execFileSync("/opt/homebrew/bin/pdftoppm", ["-png", "-r", "120", pdf, join(dir, "page")]);
    // pdftoppm names page-1.png or page-01.png depending on count; normalize
    for (const f of readdirSync(dir)) {
      const m = f.match(/^page-0*(\d+)\.png$/);
      if (m && f !== `page-${m[1]}.png`) execFileSync("mv", [join(dir, f), join(dir, `page-${m[1]}.png`)]);
    }
    writeFileSync(stamp, new Date().toISOString());
  }
  const count = readdirSync(dir).filter((f) => /^page-\d+\.png$/.test(f)).length;
  return { dir, count, hash };
}

export function pagePng(dir: string, n: number): Buffer | null {
  const f = join(dir, `page-${n}.png`);
  return existsSync(f) ? readFileSync(f) : null;
}

/**
 * A small first-page image of this résumé in a given template, for the
 * picker. Rendered straight from HTML (no save), cached by content hash.
 */
export async function thumbnail(r: Resume, template: string): Promise<Buffer> {
  const html = renderResumeHtml(r.data, { fontCss: resumeFontCss(), template });
  const hash = createHash("sha1").update(html).digest("hex").slice(0, 10);
  const dir = join(dirname(await toPdf(r)), "thumbs");
  const file = join(dir, `${template}-${hash}.png`);
  if (existsSync(file)) return readFileSync(file);
  execFileSync("mkdir", ["-p", dir]);
  for (const f of readdirSync(dir)) if (f.startsWith(`${template}-`)) execFileSync("rm", ["-f", join(dir, f)]);
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = join(dir, `${template}-${hash}.pdf`);
    await page.pdf({ path: pdf, format: "Letter", printBackground: true, preferCSSPageSize: true });
    execFileSync("/opt/homebrew/bin/pdftoppm", ["-png", "-r", "40", "-f", "1", "-l", "1", "-singlefile", pdf, join(dir, `${template}-${hash}`)]);
    execFileSync("rm", ["-f", pdf]);
  } finally {
    await browser.close();
  }
  return readFileSync(file);
}
