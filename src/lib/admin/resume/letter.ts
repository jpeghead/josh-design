import { resumeFontCss } from "./fonts";
import { templateById } from "./templates";
import type { Profile } from "./profile";
import type { Posting } from "../types";

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** The cover letter set like the résumé: same faces, same template's name treatment, one page. */
export function renderLetterHtml(text: string, profile: Profile, job: Posting, template?: string): string {
  const t = templateById(template);
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(profile.name)} — Cover letter</title>
<style>
  ${resumeFontCss()}
  @page { size: Letter; margin: 0.9in 1in; }
  body { margin: 0; font-family: "Geist", -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #141414; }
  h1 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 26pt; line-height: 1; letter-spacing: -0.015em; margin: 0; }
  .contact { font-size: 8.8pt; color: #666; margin: 4pt 0 0; }
  header { padding-bottom: 9pt; border-bottom: 0.7pt solid #141414; margin-bottom: 18pt; }
  .meta { font-size: 9pt; color: #555; margin: 0 0 14pt; }
  p { margin: 0 0 10pt; }
  .sign { margin-top: 18pt; }
  ${t.css}
</style></head><body>
<header>
  <h1>${esc(profile.name)}</h1>
  <p class="contact">${esc([profile.location, profile.email, profile.phone, profile.links[0]?.url.replace(/^https?:\/\//, "") ?? ""].filter(Boolean).join("  ·  "))}</p>
</header>
<p class="meta">${esc(date)} · ${esc(job.title)}, ${esc(job.company)}</p>
${text.split(/\n\s*\n/).map((para) => `<p>${esc(para.trim())}</p>`).join("")}
</body></html>`;
}
