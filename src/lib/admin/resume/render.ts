import type { ResumeData } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One column, text only, standard headings, contact in the body, plain
 * dates, no tables, icons, or text boxes: the shape every parser reads.
 * The same HTML drives the preview and the PDF.
 */
export function renderResumeHtml(d: ResumeData, opts: { preview?: boolean } = {}): string {
  const sec = (key: ResumeData["sections"][number]) => {
    switch (key) {
      case "summary":
        return `<section><h2>Summary</h2><p>${esc(d.summary)}</p></section>`;
      case "experience":
        return `<section><h2>Experience</h2>${d.experience
          .map(
            (e) => `<article>
  <h3>${esc(e.role)}</h3>
  <p class="meta">${esc(e.company)}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""} · ${esc(e.start)} – ${esc(e.end)}${e.location ? ` · ${esc(e.location)}` : ""}</p>
  ${e.summary ? `<p class="sub">${esc(e.summary)}</p>` : ""}
  <ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
</article>`
          )
          .join("")}</section>`;
      case "builds":
        return d.builds.length
          ? `<section><h2>Selected builds</h2><ul>${d.builds.map((b) => `<li><strong>${esc(b.title)}.</strong> ${esc(b.line)} ${esc(b.url.replace(/^https?:\/\//, ""))}</li>`).join("")}</ul></section>`
          : "";
      case "skills":
        return `<section><h2>Skills</h2>${d.skills.map((g) => `<p><strong>${esc(g.group)}:</strong> ${g.items.map(esc).join(", ")}</p>`).join("")}</section>`;
      case "education":
        return d.education.length ? `<section><h2>Education</h2>${d.education.map((e) => `<p><strong>${esc(e.school)}</strong>${e.years ? `, ${esc(e.years)}` : ""}. ${esc(e.detail)}</p>`).join("")}</section>` : "";
      case "publications":
        return d.publications.length ? `<section><h2>Publications</h2>${d.publications.map((p) => `<p><strong>${esc(p.title)}.</strong> ${esc(p.detail)}${p.url ? ` ${esc(p.url.replace(/^https?:\/\//, ""))}` : ""}</p>`).join("")}</section>` : "";
      case "service":
        return d.service ? `<section><h2>Military service</h2><p>${esc(d.service.role)}, ${esc(d.service.branch)}, ${esc(d.service.years)}.</p></section>` : "";
    }
  };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(d.name)} — Résumé</title>
<style>
  @page { size: Letter; margin: 0.55in 0.6in; }
  html { -webkit-print-color-adjust: exact; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 10pt; line-height: 1.32; color: #111; ${opts.preview ? "background:#fff; padding: 0.6in 0.65in; max-width: 8.5in; box-sizing: border-box; margin: 0 auto;" : ""} }
  h1 { font-size: 20pt; margin: 0; letter-spacing: -0.01em; font-weight: 700; }
  .headline { font-size: 11.5pt; margin: 2pt 0 0; }
  .contact { margin: 4pt 0 0; font-size: 9.5pt; color: #333; }
  h2 { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; margin: 11pt 0 3pt; padding-bottom: 2pt; border-bottom: 0.75pt solid #999; }
  h3 { font-size: 10.5pt; margin: 7pt 0 0; font-weight: 700; }
  .meta { margin: 1pt 0 0; font-size: 9.5pt; color: #333; }
  .sub { margin: 2pt 0 0; font-size: 10pt; color: #222; }
  p { margin: 3pt 0; }
  ul { margin: 3pt 0 0; padding-left: 14pt; }
  li { margin: 0 0 2pt; }
  article { break-inside: avoid; }
  section { break-inside: auto; }
</style></head>
<body>
<header>
  <h1>${esc(d.name)}</h1>
  <p class="headline">${esc(d.headline)}</p>
  <p class="contact">${[d.location, d.email, d.phone, ...d.links.map((l) => l.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))].filter(Boolean).map((x) => esc(String(x))).join(" · ")}</p>
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
        out.push(`${e.role} — ${e.company}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""} — ${e.start} – ${e.end}`);
        if (e.summary) out.push(e.summary);
        for (const b of e.bullets) out.push(`- ${b}`);
        out.push("");
      }
    }
    if (s === "builds" && d.builds.length) out.push("SELECTED BUILDS", ...d.builds.map((b) => `- ${b.title}. ${b.line} ${b.url}`), "");
    if (s === "skills") out.push("SKILLS", ...d.skills.map((g) => `${g.group}: ${g.items.join(", ")}`), "");
    if (s === "education" && d.education.length) out.push("EDUCATION", ...d.education.map((e) => `${e.school}${e.years ? `, ${e.years}` : ""}. ${e.detail}`), "");
    if (s === "publications" && d.publications.length) out.push("PUBLICATIONS", ...d.publications.map((p) => `${p.title}. ${p.detail}${p.url ? ` ${p.url}` : ""}`), "");
    if (s === "service" && d.service) out.push("MILITARY SERVICE", `${d.service.role}, ${d.service.branch}, ${d.service.years}.`, "");
  }
  return out.join("\n").trim() + "\n";
}

/** Rough page count at Letter with these styles: about 560 words per page. */
export function estimatePages(d: ResumeData): number {
  return Math.max(1, Math.ceil(renderResumeText(d).split(/\s+/).length / 620));
}
