import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { DATA_DIR } from "../store";
import { renderResumeHtml, renderResumeText } from "./render";
import { resumeFontCss } from "./fonts";
import type { Resume } from "./types";

const OUT = join(DATA_DIR, "out");

/**
 * Each résumé exports into its own folder so the file itself can carry the
 * name recruiters and parsers expect: First-Last-Resume.pdf, with the
 * company appended on a tailored one. The folder keeps versions apart.
 */
function outDir(r: Resume) {
  const dir = join(OUT, r.id);
  mkdirSync(dir, { recursive: true });
  return dir;
}
function fileBase(r: Resume) {
  const name = r.data.name.trim().split(/\s+/).join("-");
  const co = r.company ? `-${r.company.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : "";
  return `${name}-Resume${co}`;
}

/** Text-layer PDF through Chromium: the same HTML as the preview, printed at Letter. */
export async function toPdf(r: Resume): Promise<string> {
  const { chromium } = await import("playwright");
  const file = join(outDir(r), `${fileBase(r)}.pdf`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(renderResumeHtml(r.data, { fontCss: resumeFontCss(), template: r.template }), { waitUntil: "load" });
    await page.pdf({ path: file, format: "Letter", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
  return file;
}

/** Word document, the format the strictest parsers prefer. Headings are real heading styles, bullets are real bullets. */
export async function toDocx(r: Resume): Promise<string> {
  const d = r.data;
  const file = join(outDir(r), `${fileBase(r)}.docx`);
  const P = (text: string, o: { bold?: boolean; size?: number; color?: string } = {}) => new Paragraph({ children: [new TextRun({ text, bold: o.bold, size: o.size ?? 21, color: o.color })], spacing: { after: 60 } });
  const H = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } });
  const B = (text: string) => new Paragraph({ children: [new TextRun({ text, size: 21 })], bullet: { level: 0 }, spacing: { after: 40 } });
  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: d.name, bold: true, size: 40 })], spacing: { after: 40 } }),
    P(d.headline, { size: 23 }),
    P([d.location, d.email, d.phone, ...d.links.map((l) => l.url)].filter(Boolean).join(" | "), { size: 19, color: "333333" }),
  ];
  for (const s of d.sections) {
    if (s === "summary") children.push(H("Summary"), P(d.summary));
    if (s === "experience") {
      children.push(H("Experience"));
      for (const e of d.experience) {
        children.push(new Paragraph({ children: [new TextRun({ text: e.role, bold: true, size: 22 })], spacing: { before: 160, after: 20 } }));
        children.push(P(`${e.company}${e.client && !/client/i.test(e.company) ? " (client engagement)" : ""} | ${e.start} – ${e.end}${e.location ? ` | ${e.location}` : ""}`, { size: 19, color: "333333" }));
        if (e.summary) children.push(P(e.summary));
        for (const b of e.bullets) children.push(B(b));
      }
    }
    if (s === "builds" && d.builds.length) {
      children.push(H("Projects"));
      for (const b of d.builds) children.push(B(`${b.title}. ${b.line} ${b.url}`));
    }
    if (s === "skills") {
      children.push(H("Skills"));
      for (const g of d.skills) children.push(new Paragraph({ children: [new TextRun({ text: `${g.group}: `, bold: true, size: 21 }), new TextRun({ text: g.items.join(", "), size: 21 })], spacing: { after: 60 } }));
    }
    if (s === "education" && d.education.length) {
      children.push(H("Education"));
      for (const e of d.education) children.push(P(`${e.school}${e.years ? `, ${e.years}` : ""}. ${e.detail}`));
    }
    if (s === "publications" && d.publications.length) {
      children.push(H("Publications"));
      for (const p of d.publications) children.push(P(`${p.title}. ${p.detail}${p.url ? ` ${p.url}` : ""}`));
    }
    if (s === "education" && d.service) children.push(P(`${d.service.branch}, ${d.service.years}. ${d.service.role}.`));
    if (s === "service" && d.service && !d.education.length) children.push(H("Military service"), P(`${d.service.role}, ${d.service.branch}, ${d.service.years}.`));
  }
  const doc = new Document({ styles: { default: { document: { run: { font: "Calibri", size: 21 } } } }, sections: [{ properties: { page: { margin: { top: 864, bottom: 864, left: 936, right: 936 } } }, children }] });
  writeFileSync(file, await Packer.toBuffer(doc));
  return file;
}

export function toTxt(r: Resume): string {
  const file = join(outDir(r), `${fileBase(r)}.txt`);
  writeFileSync(file, renderResumeText(r.data));
  return file;
}
