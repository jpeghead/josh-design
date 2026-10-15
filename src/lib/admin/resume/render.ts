import type { ResumeData } from "./types";
import { templateById } from "./templates";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
/** "Senior Product Designer → Head of Design" becomes title "Head of Design" plus "joined as Senior Product Designer". */
const splitRole = (role: string): { title: string; from?: string } => {
  const parts = role.split(/\s*(?:→|->)\s*/);
  return parts.length > 1 ? { title: parts[parts.length - 1], from: parts[0] } : { title: role };
};

/**
 * The résumé as a document. One column, real text, standard headings,
 * contact in the body, one date format on the line with the employer, round
 * bullets, no tables, columns, icons, or text boxes: the shape every parser
 * reads (Greenhouse, Ashby, Lever, Workday) and the one an LLM screener
 * reads in order. On top of that shape sits the site's typography: the
 * serif for the name and the role titles, Geist for everything else, a
 * single ink, hairline rules. The same HTML drives the preview and the PDF.
 */
export function renderResumeHtml(d: ResumeData, opts: { preview?: boolean; fontCss?: string; template?: string } = {}): string {
  const t = templateById(opts.template);
  const sec = (key: ResumeData["sections"][number]) => {
    switch (key) {
      case "summary":
        return `<section><h2>Summary</h2><p class="lead">${esc(d.summary)}</p></section>`;
      case "experience":
        return `<section><h2>Experience</h2>${d.experience
          .map(
            (e) => `<article>
  ${t.datesRight ? `<div class="row"><h3>${esc(splitRole(e.role).title)}</h3><span class="dates">${esc(e.start)} – ${esc(e.end)}</span></div>
  <p class="meta"><span class="co">${esc(e.company)}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""}</span>${e.location ? ` · ${esc(e.location)}` : ""}${splitRole(e.role).from ? ` · joined as ${esc(splitRole(e.role).from as string)}` : ""}</p>` : `<h3>${esc(splitRole(e.role).title)}</h3>
  <p class="meta"><span class="co">${esc(e.company)}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""}</span> · ${esc(e.start)} – ${esc(e.end)}${e.location ? ` · ${esc(e.location)}` : ""}${splitRole(e.role).from ? ` · joined as ${esc(splitRole(e.role).from as string)}` : ""}</p>`}
  ${e.summary ? `<p class="sub">${esc(e.summary)}</p>` : ""}
  <ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
</article>`
          )
          .join("")}</section>`;
      case "builds":
        return d.builds.length ? `<section><h2>Projects</h2><ul class="plain">${d.builds.map((b) => `<li><strong>${esc(b.title)}.</strong> ${esc(b.line)} <span class="url">${esc(bare(b.url))}</span></li>`).join("")}</ul></section>` : "";
      case "skills":
        return `<section><h2>Skills</h2>${d.skills.map((g) => `<p class="skill"><strong>${esc(g.group)}</strong> ${g.items.map(esc).join(", ")}</p>`).join("")}</section>`;
      case "education":
        // service sits under Education: a standard heading parsers know, and one heading fewer on a two-page budget
        return d.education.length
          ? `<section><h2>Education</h2>${d.education.map((e) => `<p><strong>${esc(e.school)}</strong>${e.years ? `, ${esc(e.years)}` : ""}. ${esc(e.detail)}</p>`).join("")}${d.service ? `<p><strong>${esc(d.service.branch)}</strong>, ${esc(d.service.years)}. ${esc(d.service.role)}.</p>` : ""}</section>`
          : "";
      case "publications":
        return d.publications.length ? `<section><h2>Publications</h2>${d.publications.map((p) => `<p><strong>${esc(p.title)}.</strong> ${esc(p.detail)}${p.url ? ` <span class="url">${esc(bare(p.url))}</span>` : ""}</p>`).join("")}</section>` : "";
      case "service":
        return d.service && !d.education.length ? `<section><h2>Military service</h2><p><strong>${esc(d.service.branch)}</strong>, ${esc(d.service.years)}. ${esc(d.service.role)}.</p></section>` : "";
    }
  };
  const contact = [d.location, d.email, d.phone, ...d.links.map((l) => bare(l.url))].filter(Boolean).map((x) => esc(String(x)));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(d.name)} — Résumé</title>
<style>
  ${opts.fontCss ?? ""}
  @page { size: Letter; margin: 0.5in 0.68in 0.55in; }
  html { -webkit-print-color-adjust: exact; }
  body { margin: 0; font-family: "Geist", -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 9.4pt; line-height: 1.36; color: #141414; font-feature-settings: "ss01" 0; ${opts.preview ? "background:#fff; padding: 0.55in 0.7in 0.6in; width: 8.5in; box-sizing: border-box; margin: 0 auto;" : ""} }
  h1 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 31pt; line-height: 1; letter-spacing: -0.015em; margin: 0; }
  .headline { font-size: 10.5pt; color: #333; margin: 5pt 0 0; }
  .contact { font-size: 8.8pt; color: #666; margin: 3pt 0 0; }
  .contact span { white-space: nowrap; }
  header { padding-bottom: 9pt; border-bottom: 0.7pt solid #141414; }
  h2 { font-family: "Geist", sans-serif; font-weight: 500; font-size: 8pt; letter-spacing: 0.04em; text-transform: uppercase; color: #7a7a76; margin: 10pt 0 3pt; padding-bottom: 3pt; border-bottom: 0.5pt solid #d9d9d4; }
  .lead { font-size: 10.2pt; line-height: 1.4; margin: 3pt 0 0; }
  article { margin-top: 7pt; break-inside: avoid; }
  h3 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 13.5pt; line-height: 1.1; letter-spacing: -0.005em; margin: 0; color: #111; }
  .meta { font-size: 8.9pt; color: #555; margin: 1.5pt 0 0; }
  .meta .co { font-weight: 500; color: #333; }
  .sub { margin: 3pt 0 0; color: #3a3a3a; }
  p { margin: 2.5pt 0 0; }
  ul { margin: 3pt 0 0; padding-left: 11pt; }
  li { margin: 0 0 1.5pt; padding-left: 1pt; }
  li::marker { color: #9a9a96; }
  ul.plain { padding-left: 11pt; }
  strong { font-weight: 500; color: #111; }
  .skill strong { font-weight: 500; }
  .skill strong::after { content: " ·"; color: #9a9a96; }
  .url { color: #666; }
  section { break-inside: auto; }
  ${t.css}
</style></head>
<body>
<header>
  <h1>${esc(d.name)}</h1>
  <p class="headline">${esc(d.headline)}</p>
  <p class="contact">${contact.map((c) => `<span>${c}</span>`).join(" &nbsp;·&nbsp; ")}</p>
</header>
${d.sections.map(sec).join("\n")}
</body></html>`;
}

/** Plain text, the way a parser sees it. Also useful for pasting into a form. */
export function renderResumeText(d: ResumeData): string {
  const out: string[] = [d.name, d.headline, [d.location, d.email, d.phone, ...d.links.map((l) => l.url)].filter(Boolean).join(" | "), ""];
  for (const s of d.sections) {
    if (s === "summary") out.push("SUMMARY", d.summary, "");
    if (s === "experience") {
      out.push("EXPERIENCE");
      for (const e of d.experience) {
        const sr = splitRole(e.role);
        out.push(`${sr.title} — ${e.company}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""} — ${e.start} – ${e.end}${sr.from ? ` (joined as ${sr.from})` : ""}`);
        if (e.summary) out.push(e.summary);
        for (const b of e.bullets) out.push(`- ${b}`);
        out.push("");
      }
    }
    if (s === "builds" && d.builds.length) out.push("PROJECTS", ...d.builds.map((b) => `- ${b.title}. ${b.line} ${b.url}`), "");
    if (s === "skills") out.push("SKILLS", ...d.skills.map((g) => `${g.group}: ${g.items.join(", ")}`), "");
    if (s === "education" && d.education.length) out.push("EDUCATION", ...d.education.map((e) => `${e.school}${e.years ? `, ${e.years}` : ""}. ${e.detail}`), "");
    if (s === "publications" && d.publications.length) out.push("PUBLICATIONS", ...d.publications.map((p) => `${p.title}. ${p.detail}${p.url ? ` ${p.url}` : ""}`), "");
    if (s === "service" && d.service) out.push("MILITARY SERVICE", `${d.service.role}, ${d.service.branch}, ${d.service.years}.`, "");
  }
  return out.join("\n").trim() + "\n";
}

/** Rough page count at Letter with these styles: about 600 words per page. */
export function estimatePages(d: ResumeData): number {
  return Math.max(1, Math.ceil(renderResumeText(d).split(/\s+/).length / 600));
}
