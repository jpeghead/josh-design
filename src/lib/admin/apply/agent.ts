import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import type { Browser, BrowserContext, Page } from "playwright";
import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { DATA_DIR } from "../store";
import { getProfile, type Profile } from "../resume/profile";
import { socials } from "@/content/about";
import { toPdf } from "../resume/export";
import { getResume } from "../resume/store";
import { readJson } from "../store";
import { renderLetterHtml } from "../resume/letter";
import { renderResumeText } from "../resume/render";
import type { Resume } from "../resume/types";
import type { Posting } from "../types";
import { getApplication, saveApplication } from "./store";
import type { Application, Field } from "./types";

/**
 * The apply agent. One visible Chromium per run, a persistent profile so
 * sign-ins survive between runs, and a plain contract:
 *   read the form → fill what is known → answer what needs words → stop.
 * It never submits unless told to (autoSubmit, or the Submit action), it
 * never touches a CAPTCHA, and it never invents an answer: unknowns are
 * left blank and marked for review.
 */

const OUT = join(DATA_DIR, "out");
const PROFILE_DIR = join(DATA_DIR, "browser");
// On globalThis so every route bundle in the dev server sees the same open browsers.
type Live = Map<string, { context: BrowserContext; page: Page; profileDir?: string; pdfPath?: string; fields?: Field[] }>;
const g = globalThis as unknown as { __applyLive?: Live };
const live: Live = g.__applyLive ?? (g.__applyLive = new Map());

/** Close a run's browser and, for a background run, remove its profile copy. */
async function closeRun(id: string) {
  const l = live.get(id);
  if (!l) return;
  await l.context.close().catch(() => {});
  live.delete(id);
  if (l.profileDir && l.profileDir !== PROFILE_DIR) execSync(`rm -rf "${l.profileDir}"`);
}

function log(a: Application, text: string) {
  a.steps.push({ at: new Date().toISOString(), text });
  saveApplication(a);
}

/** Collect every visible, fillable control with the best label we can find. Tags each with data-apply-key. */
async function readForm(page: Page): Promise<Field[]> {
  return page.evaluate(() => {
    const out: { key: string; label: string; kind: string; required: boolean; options?: string[]; value?: string }[] = [];
    const seen = new Set<Element>();
    const labelOf = (el: Element): string => {
      const id = el.getAttribute("id");
      let t = "";
      if (id) {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (l) t = l.textContent ?? "";
      }
      if (!t) {
        const lb = el.getAttribute("aria-labelledby");
        if (lb) t = lb.split(/\s+/).map((x) => document.getElementById(x)?.textContent ?? "").join(" ");
      }
      // Rippling and others: <span id="field-9-label"> with no for= and no aria link
      if (!t && id) t = document.getElementById(`${id}-label`)?.textContent ?? "";
      if (!t) {
        const al = el.getAttribute("aria-label") ?? "";
        if (!/^(textbox|search|select\.{3}|input|combobox)$/i.test(al.trim())) t = al;
      }
      if (!t) {
        const wrap = el.closest("label");
        if (wrap) t = (wrap.textContent ?? "").replace(el.textContent ?? "", "");
      }
      if (!t) {
        // walk up a few levels; take the nearest label-like element that comes before the control
        // first pass: real labels and legends; second pass: label-ish classes and question spans. Headings are never borrowed.
        for (const selector of ["label, legend, [id$='-label']", "[class*='label' i], [class*='question' i] > span"]) {
          let node: Element | null = el.parentElement;
          for (let depth = 0; node && depth < 5 && !t; depth++, node = node.parentElement) {
            const cands = [...node.querySelectorAll(selector)].filter((c) => !c.contains(el) && !c.querySelector("input, select, textarea") && c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
            const last = cands[cands.length - 1];
            const txt = last?.textContent?.replace(/\s+/g, " ").trim() ?? "";
            if (txt && txt.length < 200) t = txt;
          }
          if (t) break;
        }
      }
      if (!t) t = el.getAttribute("placeholder") ?? el.getAttribute("name") ?? "";
      return t.replace(/\s+/g, " ").replace(/[*✱]/g, "").replace(/\bSelect ?\.\.\..*$/, "").trim().slice(0, 160);
    };
    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(el as HTMLElement);
      if ((el as HTMLInputElement).type === "file") return true; // drop zones hide the real input; setInputFiles still works
      return cs.display !== "none" && cs.visibility !== "hidden" && (r.width > 0 || r.height > 0);
    };
    let n = 0;
    const tag = (el: Element) => {
      const k = `f${n++}`;
      el.setAttribute("data-apply-key", k);
      return k;
    };
    // radios/checkbox groups by name
    const groups = new Map<string, HTMLInputElement[]>();
    document.querySelectorAll<HTMLInputElement>("input[type=radio], input[type=checkbox]").forEach((el) => {
      const byId = el.getAttribute("aria-labelledby")?.split(/\s+/).map((x) => document.getElementById(x)).find(Boolean);
      if (!visible(el) && !visible(el.closest("label") ?? el) && !(byId && visible(byId))) return;
      const name = el.name || labelOf(el);
      groups.set(name, [...(groups.get(name) ?? []), el]);
    });
    for (const [name, els] of groups) {
      els.forEach((e) => seen.add(e));
      const first = els[0];
      // the question text may sit a level or two above the box the inputs live in (Lever: .application-label beside .application-field)
      let legend = "";
      for (let node: Element | null = first.parentElement, depth = 0; node && depth < 5 && !legend; depth++, node = node.parentElement) {
        const cand = [...node.querySelectorAll("legend, [class*='label' i], label:not(:has(input)), [class*='question' i] > div:first-child")].find((c) => !c.querySelector("input, select, textarea") && (c.textContent ?? "").trim().length > 2);
        if (cand) legend = (cand.textContent ?? "").replace(/\s+/g, " ").replace(/[*✱]/g, "").trim();
        if (node.matches("form, main, body")) break;
      }
      if (!legend) legend = name;
      const options = els.map((e) => {
        const lb = e.getAttribute("aria-labelledby")?.split(/\s+/).map((x) => document.getElementById(x)?.textContent ?? "").join(" ").trim();
        return (e.closest("label")?.textContent ?? (e.id ? document.querySelector(`label[for="${CSS.escape(e.id)}"]`)?.textContent : null) ?? lb ?? e.value).replace(/\s+/g, " ").trim();
      });
      const key = tag(first);
      els.forEach((e, i) => e.setAttribute("data-apply-option", `${key}:${i}`));
      out.push({ key, label: legend.slice(0, 160), kind: first.type === "radio" ? "radio" : "checkbox", required: els.some((e) => e.required || e.getAttribute("aria-required") === "true"), options });
    }
    document.querySelectorAll<HTMLElement>("input, textarea, select, [role=combobox], [contenteditable=true]").forEach((el) => {
      if (seen.has(el)) return;
      const input = el as HTMLInputElement;
      const type = (input.type || "").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "radio", "checkbox"].includes(type)) return;
      if (!visible(el)) return;
      if (el.closest("[data-apply-key]") && el.getAttribute("role") !== "combobox") return;
      const inShell = el.getAttribute("role") !== "combobox" && (el.closest('[role="combobox"]') || el.closest('[class*="select__"], [class*="Select__"], [class*="select-shell"]'));
      if (inShell) return; // the shell itself is listed as the combobox
      const autocompletes = !!el.getAttribute("aria-autocomplete") || el.getAttribute("aria-haspopup") === "listbox";
      const kind = el.tagName === "TEXTAREA" || el.getAttribute("contenteditable") === "true" ? "textarea" : el.tagName === "SELECT" ? "select" : el.getAttribute("role") === "combobox" || autocompletes ? "combobox" : type === "file" ? "file" : type === "email" ? "email" : type === "tel" ? "tel" : type === "url" ? "url" : type === "number" ? "number" : type === "date" ? "date" : "text";
      const key = tag(el);
      const options = el.tagName === "SELECT" ? [...(el as HTMLSelectElement).options].map((o) => o.text.trim()).filter(Boolean) : undefined;
      let label = labelOf(el);
      if (kind === "file" && !/resume|résumé|\bcv\b|cover/i.test(label)) {
        // drop zones wrap the input in their own label; the field's name sits just before the zone
        const zone = el.closest("label") ?? el.parentElement;
        let node: Element | null = zone?.parentElement ?? null;
        for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
          const cands = [...node.querySelectorAll("[id$='-label'], legend, label, [class*='label' i]")].filter((c) => !c.contains(el) && !zone?.contains(c) && c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
          const txt = cands[cands.length - 1]?.textContent?.replace(/\s+/g, " ").replace(/[*✱]/g, "").trim() ?? "";
          if (txt && txt.length < 120) {
            label = txt;
            break;
          }
        }
      }
      out.push({ key, label, kind, required: input.required || el.getAttribute("aria-required") === "true", options, value: kind === "file" ? "" : (input.value ?? "").slice(0, 200) });
    });
    return out as never;
  }) as Promise<Field[]>;
}

const RX = {
  first: /^(first|given)\s*name/i,
  last: /^(last|family|sur)\s*name/i,
  full: /^(full\s*)?name$|^your name/i,
  email: /e-?mail/i,
  phone: /phone|mobile/i,
  linkedin: /linkedin/i,
  github: /github/i,
  twitter: /twitter|\bx (url|profile|handle)/i,
  other: /^other (website|url|link)/i,
  portfolio: /portfolio|website|personal site|url|link/i,
  office: /which (office|location|city)|preferred (office|location|city)|office (location|preference)|location preference|where would you (like|prefer) to work/i,
  location: /^(current )?location\b|^city$|where (are|do) you (live|based)|city and state|^address|what is your location/i,
  country: /^country$|country of residence/i,
  resume: /resume|résumé|cv\b/i,
  cover: /cover letter/i,
  heard: /how did you hear|where did you (hear|find)|source/i,
  auth: /authori[sz]ed to work|legally (authori[sz]ed|eligible)|work authori[sz]ation|eligible to work/i,
  sponsor: /sponsor/i,
  pronoun: /pronoun/i,
  salary: /salary|compensation|pay expectation/i,
  start: /start date|when (can|could|would) you (start|begin)|earliest.*start|start working|notice period/i,
  relocate: /relocat/i,
  workplace: /\b(hybrid|in[- ]?office|in[- ]?person|on[- ]?site|onsite|remote)\b.*\?|open to (working|coming) (from|to|into|in) (the|our|one of our) office|work from (the|our) office|days? (a|per) week in/i,
  eeo: /gender|race|ethnicit|veteran|disabilit|hispanic|latino|sexual orientation|transgender/i,
  company: /current (company|employer)|^company$|organization/i,
  title: /current (title|role)|^title$|job title/i,
  years: /years of experience/i,
  sms: /text message|\bsms\b|texting/i,
  privacy: /privacy|consent|agree|acknowledg|terms/i,
};

function pickOption(options: string[] | undefined, prefer: RegExp[]): string | undefined {
  if (!options) return undefined;
  for (const r of prefer) {
    const o = options.find((x) => r.test(x));
    if (o) return o;
  }
  return undefined;
}

/** Decide a value for a field from the profile, or leave it for review. */
function decide(f: Field, profile: Profile, resume: Resume): { value?: string; status: Field["status"]; note?: string } {
  const L = f.label;
  const a = profile.answers;
  if (f.kind === "file") {
    if (RX.cover.test(L)) return { value: "__COVER_PDF__", status: "filled", note: "cover letter PDF" };
    if (RX.resume.test(L) || f.note === "only-file") return { value: "__RESUME_PDF__", status: "filled", note: "résumé PDF" };
    return { status: "left", note: L ? undefined : "unlabeled upload; add it yourself if it is wanted" };
  }
  if (RX.eeo.test(L)) {
    const v = pickOption(f.options, [/decline|prefer not|choose not|do not wish|don.?t wish|not wish|rather not/i]);
    return v ? { value: v, status: "filled", note: "declined, as allowed" } : { status: "left", note: "self-identification left blank" };
  }
  if (RX.sms.test(L) || f.options?.some((o) => RX.sms.test(o))) {
    const v = pickOption(f.options, [/^no\b/i]);
    return v ? { value: v, status: "filled", note: "declined text messages" } : { status: "left" };
  }
  if (RX.first.test(L)) return { value: a.firstName, status: "filled" };
  if (RX.last.test(L)) return { value: a.lastName, status: "filled" };
  if (RX.full.test(L)) return { value: `${a.firstName} ${a.lastName}`, status: "filled" };
  if (RX.email.test(L)) return { value: profile.email, status: "filled" };
  if (RX.phone.test(L)) return profile.phone ? { value: profile.phone, status: "filled" } : { status: "review", note: "phone: add it on Setup" };
  if (RX.linkedin.test(L)) return { value: profile.links.find((l) => /linkedin/i.test(l.url))?.url ?? "", status: "filled" };
  if (RX.twitter.test(L)) {
    const x = socials.find((l) => /x\.com|twitter\.com/i.test(l.href))?.href;
    return x ? { value: x, status: "filled" } : { status: "left" };
  }
  if (RX.other.test(L)) return { status: "left" };
  if (RX.github.test(L)) return { value: profile.links.find((l) => /github/i.test(l.url))?.url ?? "", status: "filled" };
  if (RX.resume.test(L) && f.kind === "textarea") return { value: renderResumeText(resume.data), status: "filled", note: "résumé as text" };
  if (RX.portfolio.test(L)) return { value: profile.links[0]?.url ?? "", status: "filled" };
  if (RX.relocate.test(L)) {
    if (!a.willingToRelocate) return { status: "review", note: "relocation: answer it on Setup" };
    const v = pickOption(f.options, [new RegExp(`^${a.willingToRelocate.split(" ")[0]}`, "i")]);
    return { value: v ?? a.willingToRelocate, status: "filled" };
  }
  if (RX.workplace.test(L)) {
    if (!a.workplace) return { status: "review", note: "remote or office: answer it on Setup" };
    const v = pickOption(f.options, [new RegExp(a.workplace.split(" ")[0], "i"), /^yes/i]);
    return { value: v ?? a.workplace, status: "filled" };
  }
  if (RX.country.test(L)) {
    const v = pickOption(f.options, [/^united states/i, /^usa?$/i]);
    return { value: v ?? "United States", status: "filled" };
  }
  if (RX.office.test(L) && f.options?.length) {
    const cities = (a.locations ?? "").split(/[,;]/).map((c) => c.trim()).filter(Boolean);
    const v = cities.map((c) => f.options?.find((o) => o.toLowerCase().includes(c.toLowerCase().split(",")[0]))).find(Boolean) ?? pickOption(f.options, [/remote/i, /any|no preference|flexible/i]);
    return v ? { value: v, status: "filled" } : { status: "review", note: "which office: none of your cities is listed" };
  }
  if (RX.location.test(L)) {
    if (f.options?.length) {
      const v = pickOption(f.options, [/^united states/i, /^usa?$/i, /los angeles/i]);
      return v ? { value: v, status: "filled" } : { status: "review", note: "location: pick it" };
    }
    return { value: "Los Angeles, CA", status: "filled" };
  }
  if (RX.sponsor.test(L)) {
    const v = pickOption(f.options, a.needsSponsorship ? [/^yes/i] : [/^no/i]);
    return v ? { value: v, status: "filled" } : { value: a.needsSponsorship ? "Yes" : "No", status: "filled" };
  }
  if (RX.auth.test(L)) {
    const v = pickOption(f.options, a.workAuthorizedUS ? [/^yes/i] : [/^no/i]);
    return v ? { value: v, status: "filled" } : { value: a.workAuthorizedUS ? "Yes" : "No", status: "filled" };
  }
  if (RX.heard.test(L)) {
    const v = pickOption(f.options, [/company (website|careers|site)|careers page|website/i, /other/i]);
    return v ? { value: v, status: "filled" } : { value: a.howHeard, status: "filled" };
  }
  if (RX.pronoun.test(L)) return a.pronouns ? { value: a.pronouns, status: "filled" } : { status: "left" };
  if (RX.salary.test(L)) return a.salary ? { value: a.salary, status: "filled" } : { status: "review", note: "salary: answer it on Setup" };
  if (RX.start.test(L)) return a.startDate ? { value: a.startDate, status: "filled" } : { status: "review", note: "start date: answer it on Setup" };
  if (RX.relocate.test(L)) return a.willingToRelocate ? { value: a.willingToRelocate, status: "filled" } : { status: "review", note: "relocation: you decide" };
  if (RX.company.test(L)) return { value: "Boneyard Collective", status: "filled" };
  if (RX.title.test(L)) return { value: "Founder & Design Lead", status: "filled" };
  if (RX.years.test(L)) return { value: "15", status: "filled" };
  if (RX.privacy.test(L) && f.kind === "checkbox") return { value: f.options?.[0] ?? "yes", status: "review", note: "consent box: read it, then tick it yourself" };
  if (!L.trim() || /^\w+\[.*\]/.test(L)) return f.kind === "radio" || f.kind === "checkbox" ? { status: "review", note: "a question the form did not label; answer it in the browser" } : { status: "skipped", note: "no label; part of a dropdown" };
  if (/arbitrat|agreement|acknowledg|i have read|consent/i.test(L)) return { status: "review", note: "an agreement: read it, then answer yourself" };
  // a paragraph box is a written question whatever its wording ("Why Anthropic?"): draft it from the record
  if (f.kind === "textarea") return { status: "review", note: "free-text question" };
  if (/^(are|do|would|have|will|can|is|were) you\b/i.test(L) || /\?$/.test(L)) return { status: "review", note: "your call" };
  if (f.kind === "text" && f.required) return { status: "review", note: "free-text question" };
  return { status: "left" };
}

/** Claude writes answers to free-text questions, from the profile only, in Josh's register. */
async function answerWithClaude(questions: { key: string; label: string }[], job: Posting, profile: Profile, resume: Resume): Promise<Record<string, string>> {
  if (!anthropicConfigured() || !questions.length) return {};
  const client = anthropicClient();
  const res = await client.messages.create({
    model: process.env.ASK_MODEL ?? "claude-sonnet-5-5",
    thinking: { type: "between_tools" },
    max_tokens: 3000,
    system: `You draft application answers for one candidate, in first person, plain and specific, no flattery, no clichés, 40–140 words each unless the question clearly wants one line. Use only facts in CANDIDATE. If a question cannot be answered from the facts, answer with exactly "REVIEW". Cover letters follow this stance: ${profile.answers.coverLetterStance}\nReply with JSON only: {"<key>": "<answer>", ...}.\n\nCANDIDATE:\n${renderResumeText(resume.data)}`,
    messages: [{ role: "user", content: `ROLE: ${job.title} at ${job.company}\n\nPOSTING:\n${job.description.slice(0, 5000)}\n\nQUESTIONS:\n${questions.map((q) => `${q.key}: ${q.label}`).join("\n")}` }],
  });
  const txt = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    return JSON.parse(m[0]) as Record<string, string>;
  } catch {
    return {};
  }
}

/** react-select and friends: the combobox is a zero-size input inside a control div; click the control. */
const OPEN_LIST = '[role="listbox"]:visible, [id$="-listbox"]:visible';

/** Some dropdowns ignore Escape; an open list under the next control would swallow the click and pick an option. */
async function closeLists(page: Page) {
  for (const step of ["escape", "blank", "tab"]) {
    if (!(await page.locator(OPEN_LIST).count())) return;
    if (step === "escape") await page.keyboard.press("Escape").catch(() => {});
    else if (step === "blank") await page.mouse.click(2, 2).catch(() => {});
    else await page.keyboard.press("Tab").catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function openCombobox(page: Page, sel: string) {
  const el = page.locator(sel).first();
  await closeLists(page);
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const control = el.locator('xpath=ancestor::*[contains(@class,"control") or contains(@class,"select__") or contains(@class,"select-shell")][1]');
  try {
    if (await control.count()) await control.first().click({ timeout: 2500 });
    else await el.click({ force: true, timeout: 2500 });
  } catch {
    // last resort: focus the input itself and open with the keyboard
    await el.focus({ timeout: 2000 });
    await page.keyboard.press("ArrowDown");
  }
}

/** Open a custom dropdown, read its options, close it. Returns [] when it will not open. */
async function comboboxOptions(page: Page, key: string): Promise<string[]> {
  const sel = `[data-apply-key="${key}"]`;
  try {
    await openCombobox(page, sel);
    await page.waitForTimeout(350);
    const list = page.locator(OPEN_LIST).first();
    const opts = (await list.count()) ? await list.locator('[role="option"]').allInnerTexts() : [];
    await closeLists(page);
    return [...new Set(opts.map((o) => o.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 80);
  } catch {
    return [];
  }
}

/** A short cover letter in Josh's register, from the profile and the posting only. Empty when no model is reachable. */
async function draftCoverLetter(job: Posting, profile: Profile, resume: Resume): Promise<string> {
  if (!anthropicConfigured()) return "";
  const client = anthropicClient();
  const res = await client.messages.create({
    model: process.env.ASK_MODEL ?? "claude-sonnet-5-5",
    thinking: { type: "between_tools" },
    max_tokens: 900,
    system: `Write a cover letter for one candidate, first person, 150–220 words, three short paragraphs, no salutation flourishes beyond "Hello," and no closing beyond the name. Stance: ${profile.answers.coverLetterStance} Use only facts in CANDIDATE; never add a frequency, duration, metric, or client that is not stated there. Plain text only.\n\nCANDIDATE:\n${renderResumeText(resume.data)}`,
    messages: [{ role: "user", content: `ROLE: ${job.title} at ${job.company}\n\nPOSTING:\n${job.description.slice(0, 5000)}` }],
  });
  return res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
}

async function coverLetterPdf(text: string, profile: Profile, job: Posting, appId: string, template?: string): Promise<string> {
  const { chromium } = await import("playwright");
  const html = renderLetterHtml(text, profile, job, template);
  // named like the résumé, so what the recruiter downloads reads as a document, not a run id
  const dir = join(OUT, appId);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${profile.name.trim().split(/\s+/).join("-")}-Cover-Letter-${job.company.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`);
  const browser = await chromium.launch();
  try {
    const pg = await browser.newPage();
    await pg.setContent(html, { waitUntil: "load" });
    await pg.pdf({ path: file, format: "Letter", preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
  return file;
}

async function setField(page: Page, f: Field, value: string, pdfPath: string, coverPath?: string) {
  const sel = `[data-apply-key="${f.key}"]`;
  if (f.kind === "file") {
    const isCover = value === "__COVER_PDF__";
    if (isCover && !coverPath) throw new Error("no cover letter to upload");
    const path = isCover ? (coverPath as string) : pdfPath;
    try {
      await page.setInputFiles(sel, path, { timeout: 5000 });
    } catch {
      // Rippling re-renders the form after parsing the résumé, which drops our tag: fall back to position
      const inputs = page.locator('input[type="file"]');
      const n = await inputs.count();
      if (!n) throw new Error("the upload field disappeared");
      await inputs.nth(isCover ? n - 1 : 0).setInputFiles(path, { timeout: 5000 });
    }
    return;
  }
  if (f.kind === "radio" || f.kind === "checkbox") {
    const idx = f.options?.findIndex((o) => o === value) ?? -1;
    if (idx < 0) return;
    const optSel = `[data-apply-option="${f.key}:${idx}"]`;
    try {
      await page.click(optSel, { force: true, timeout: 3000 });
    } catch {
      // the real input is hidden behind a styled control: click its label, else click it in the DOM
      const clicked = await page.evaluate((q) => {
        const el = document.querySelector<HTMLInputElement>(q);
        if (!el) return false;
        const lb = el.getAttribute("aria-labelledby")?.split(/\s+/).map((x) => document.getElementById(x)).find(Boolean);
        const target = (el.id && document.querySelector<HTMLElement>(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label") || (lb as HTMLElement | undefined) || el;
        target.click();
        if (!el.checked) el.click();
        return el.checked;
      }, optSel);
      if (!clicked) throw new Error("the option would not take the click");
    }
    return;
  }
  if (f.kind === "select") {
    await page.selectOption(sel, { label: value });
    return;
  }
  if (f.kind === "combobox") {
    await openCombobox(page, sel);
    await page.waitForTimeout(250);
    const typable = await page.locator(sel).first().evaluate((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || !!el.querySelector("input"));
    if (typable) {
      await page.keyboard.type(value.slice(0, 40), { delay: 10 });
      await page.waitForTimeout(400);
    }
    // only the list that just opened, and the whole option text, so "No" never means "Norway"
    const list = page.locator('[role="listbox"]:visible, [id$="-listbox"]:visible').first();
    const exact = new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
    const scope = (await list.count()) ? list : page;
    const opt = scope.locator('[role="option"]:visible', { hasText: exact }).first();
    if (await opt.count()) {
      try {
        await opt.click({ timeout: 3000 });
      } catch {
        await opt.click({ force: true, timeout: 2000 }).catch(async () => {
          await page.keyboard.type(value.slice(0, 12), { delay: 20 });
          await page.keyboard.press("Enter");
        });
      }
    } else {
      // a place search ("Los Angeles, CA" → "Los Angeles, CA, USA"): the first option that starts with what was typed
      const starts = scope.locator('[role="option"]:visible', { hasText: new RegExp(`^\\s*${value.split(",")[0].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i") }).first();
      if (await starts.count()) await starts.click({ timeout: 3000 });
      else await page.keyboard.press("Enter");
    }
    await closeLists(page);
    return;
  }
  await page.fill(sel, value);
}

async function turnstilePresent(page: Page): Promise<boolean> {
  return (await page.locator('iframe[src*="challenges.cloudflare.com"], .cf-turnstile').count()) > 0;
}

/** A sign-in wall, before anything is filled. */
async function loginWall(page: Page): Promise<string | null> {
  if (/login|signin|sign-in|auth/i.test(page.url()) && (await page.locator('input[type="password"]').count())) return "This board wants an account. Sign in in the open browser, then start the application again; the sign-in is remembered.";
  return null;
}

/**
 * A CAPTCHA that is actually asking something. Greenhouse and friends embed an
 * invisible reCAPTCHA on every form, so the iframe's presence means nothing;
 * only a visible challenge counts.
 */
async function visibleCaptcha(page: Page): Promise<boolean> {
  // Cloudflare Turnstile usually clears itself; it is reported as a note, not a blocker (see turnstilePresent)
  const challenge = page.locator('iframe[src*="recaptcha/api2/bframe"], iframe[src*="hcaptcha.com/captcha"]');
  const n = await challenge.count();
  for (let i = 0; i < n; i++) {
    const box = await challenge.nth(i).boundingBox().catch(() => null);
    if (box && box.width > 50 && box.height > 50) return true;
  }
  const robot = page.locator('text=/i\'m not a robot/i, text=/select all (images|squares)/i');
  return (await robot.count()) > 0 && (await robot.first().isVisible().catch(() => false));
}

/** Start a run: opens the form, fills it, stops for review (or submits when autoSubmit). Runs in the background. */
export async function startApplication(app: Application, job: Posting, resume: Resume, opts: { headless?: boolean } = {}): Promise<void> {
  const a = app;
  let profileDir = PROFILE_DIR;
  try {
    const { chromium } = await import("playwright");
    mkdirSync(OUT, { recursive: true });
    mkdirSync(PROFILE_DIR, { recursive: true });
    const profile = getProfile();
    log(a, "Exporting the résumé PDF.");
    a.resumeHeadline = resume.data.headline;
    const pdfPath = await toPdf(resume);
    if (opts.headless) {
      // a background run gets its own copy of the sign-in profile, so several can be open at once
      profileDir = join(DATA_DIR, "browser-runs", a.id);
      // sign-ins and site data come along; the 30 MB of caches do not
      execSync(`rm -rf "${profileDir}" && mkdir -p "${profileDir}" && rsync -a --exclude 'Cache' --exclude 'Code Cache' --exclude 'GPUCache' --exclude 'Dawn*Cache' --exclude 'Singleton*' --exclude 'LOCK' "${PROFILE_DIR}/" "${profileDir}/"`);
      a.headless = true;
      log(a, "Preparing in the background.");
    } else log(a, "Opening a browser you can watch.");
    const launch = () => chromium.launchPersistentContext(profileDir, { headless: !!opts.headless, viewport: { width: 1200, height: 900 } });
    let context: BrowserContext;
    try {
      context = await launch();
    } catch (e) {
      if (!/already in use|existing browser session/i.test(String(e))) throw e;
      // a browser from an earlier run still holds the profile (the dev server reloaded under it); close it and try once more
      log(a, "An earlier browser was still open on this profile; closing it.");
      try {
        execSync(`pkill -f "${PROFILE_DIR}"`);
      } catch {
        /* nothing matched */
      }
      await new Promise((r) => setTimeout(r, 1200));
      context = await launch();
    }
    const page = context.pages()[0] ?? (await context.newPage());
    live.set(a.id, { context, page, profileDir, pdfPath });
    a.status = "filling";
    log(a, `Going to ${job.applyUrl}`);
    await page.goto(job.applyUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    // Greenhouse and Lever job pages often need an "Apply" click to reveal the form
    const applyBtn = page.locator('a:has-text("Apply"), button:has-text("Apply")').first();
    if ((await page.locator("input[type=file]").count()) === 0 && (await applyBtn.count())) {
      await applyBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    const wall = await loginWall(page);
    if (wall) {
      a.status = "needs-you";
      a.message = wall;
      log(a, wall);
      return;
    }
    page.setDefaultTimeout(8000);
    const fields = await readForm(page);
    const liveEntry = live.get(a.id);
    if (liveEntry) liveEntry.fields = fields;
    const files = fields.filter((f) => f.kind === "file");
    if (files.length === 1) files[0].note = "only-file";
    else if (files.length === 2 && !files.some((f) => RX.resume.test(f.label) || RX.cover.test(f.label))) {
      files[0].note = "only-file"; // convention on two-upload forms: résumé first, cover letter second
      files[1].label = files[1].label || "Cover letter";
    }
    for (const f of fields) if (f.kind === "combobox" && !f.options?.length) f.options = await comboboxOptions(page, f.key);
    log(a, `Read ${fields.length} fields.`);
    let coverText = "";
    let coverPath: string | undefined;
    if (fields.some((f) => RX.cover.test(f.label))) {
      try {
        coverText = await draftCoverLetter(job, profile, resume);
        if (coverText) {
          coverPath = await coverLetterPdf(coverText, profile, job, a.id, resume.template);
          a.coverLetter = coverPath;
          log(a, "Drafted a cover letter with Claude; it is uploaded where the form asks for one. Read it.");
        } else log(a, anthropicConfigured() ? "The model returned no cover letter text." : "No model reachable, so no cover letter was drafted.");
      } catch (e) {
        log(a, `Cover letter drafting failed: ${(e as Error).message.slice(0, 160)}`);
      }
    }
    const toAsk: { key: string; label: string }[] = [];
    for (const f of fields) {
      const d = decide(f, profile, resume);
      f.status = d.status;
      f.note = d.note;
      if (d.value === "__COVER_PDF__" && !coverPath) {
        f.status = "left";
        f.note = "cover letter upload: no model to draft one";
      } else if (RX.cover.test(f.label) && f.kind === "textarea" && coverText) {
        try {
          await setField(page, f, coverText, pdfPath, coverPath);
          f.value = coverText;
          f.status = "filled";
          f.note = "cover letter drafted by Claude; read it";
        } catch (e) {
          f.status = "review";
          f.note = `could not set: ${(e as Error).message.slice(0, 80)}`;
        }
      } else if (d.value !== undefined && d.status === "filled") {
        try {
          await setField(page, f, d.value, pdfPath, coverPath);
          f.value = d.value === "__RESUME_PDF__" ? pdfPath.split("/").pop() : d.value === "__COVER_PDF__" ? coverPath?.split("/").pop() : d.value;
        } catch (e) {
          f.status = "review";
          f.note = `could not set: ${(e as Error).message.slice(0, 80)}`;
        }
        a.fields = fields;
        saveApplication(a);
      } else if (d.status === "review" && d.note === "free-text question") {
        toAsk.push({ key: f.key, label: f.label });
      }
    }
    a.fields = fields;
    saveApplication(a);
    if (toAsk.length) {
      log(a, anthropicConfigured() ? `Drafting ${toAsk.length} written answer${toAsk.length === 1 ? "" : "s"} with Claude.` : `${toAsk.length} written question${toAsk.length === 1 ? "" : "s"} left for you (no model key).`);
      const answers = await answerWithClaude(toAsk, job, profile, resume);
      for (const f of fields) {
        const ans = answers[f.key];
        if (!ans) continue;
        if (ans.trim() === "REVIEW") {
          if (!f.required) {
            f.status = "left";
            f.note = "optional, and the record has nothing to say; left blank";
          } else f.note = "the record does not answer this; write it yourself";
          continue;
        }
        try {
          await setField(page, f, ans, pdfPath);
          f.value = ans;
          f.status = "filled";
          f.note = "drafted by Claude from the profile; read it";
        } catch (e) {
          f.note = `could not set: ${(e as Error).message.slice(0, 80)}`;
        }
      }
      a.fields = fields;
    }
    const shot = join(OUT, `${a.id}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    a.screenshot = shot;
    const reviewCount = fields.filter((f) => f.status === "review").length;
    if (await visibleCaptcha(page)) {
      a.status = "needs-you";
      a.message = opts.headless
        ? "This board shows a CAPTCHA, which needs a window: press Open visibly, solve it there, then Submit."
        : "A CAPTCHA is showing. Solve it in the open browser, then press Submit here.";
      log(a, a.message);
      return;
    }
    a.status = "review";
    a.message = opts.headless
      ? reviewCount
        ? `${reviewCount} field${reviewCount === 1 ? "" : "s"} need${reviewCount === 1 ? "s" : ""} you. Fill them in the queue, then Submit.`
        : "Everything known is filled. Read the screenshot and the fields, then Submit."
      : reviewCount
        ? `${reviewCount} field${reviewCount === 1 ? "" : "s"} need${reviewCount === 1 ? "s" : ""} you. The browser is open; fix them there or here, then Submit.`
        : "Everything known is filled. Read it in the open browser, then Submit.";
    if (await turnstilePresent(page)) a.message += " This form has a Cloudflare check; it usually clears on its own, and if it asks you to click, do that in the browser first.";
    log(a, a.message);
    if (a.autoSubmit && !reviewCount) await submitApplication(a.id);
  } catch (e) {
    a.status = "failed";
    a.message = (e as Error).message.slice(0, 300);
    log(a, `Failed: ${a.message}`);
    await closeRun(a.id);
    if (profileDir !== PROFILE_DIR) execSync(`rm -rf "${profileDir}"`);
  }
}

/** Set fields on a live form from the queue (typed values, chosen options), then re-screenshot. */
export async function setFields(id: string, edits: { key: string; value: string }[]): Promise<Application | undefined> {
  const a = getApplication(id);
  const l = live.get(id);
  if (!a || !l) return undefined;
  for (const e of edits) {
    const f = a.fields.find((x) => x.key === e.key);
    if (!f || f.kind === "file") continue;
    try {
      if (f.kind === "text" || f.kind === "email" || f.kind === "tel" || f.kind === "url" || f.kind === "number" || f.kind === "date" || f.kind === "textarea") await l.page.fill(`[data-apply-key="${f.key}"]`, e.value);
      else await setField(l.page, f, e.value, l.pdfPath ?? "");
      f.value = e.value;
      f.status = e.value ? "filled" : "left";
      f.note = e.value ? "set by you" : undefined;
    } catch (err) {
      f.status = "review";
      f.note = `could not set: ${(err as Error).message.slice(0, 80)}`;
    }
  }
  const shot = join(OUT, `${a.id}.png`);
  await l.page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  a.screenshot = shot;
  const reviewCount = a.fields.filter((f) => f.status === "review").length;
  a.message = reviewCount ? `${reviewCount} field${reviewCount === 1 ? "" : "s"} still need${reviewCount === 1 ? "s" : ""} you.` : "Everything is filled. Read it, then Submit.";
  log(a, `Set ${edits.length} field${edits.length === 1 ? "" : "s"} from the queue.`);
  return a;
}

export async function submitApplication(id: string): Promise<Application | undefined> {
  const a = getApplication(id);
  const l = live.get(id);
  if (!a || !l) return a;
  try {
    a.status = "submitting";
    log(a, "Submitting.");
    const btn = l.page.locator('button[type=submit], input[type=submit], button:has-text("Submit"), button:has-text("Submit application"), button:has-text("Apply")').last();
    const urlBefore = l.page.url();
    const fieldsBefore = await l.page.locator("[data-apply-key]").count();
    await btn.click();
    await Promise.race([l.page.waitForURL((u) => u.toString() !== urlBefore, { timeout: 6000 }).catch(() => undefined), l.page.waitForTimeout(4000)]);
    await l.page.waitForTimeout(1500);
    const shot = join(OUT, `${a.id}-submitted.png`);
    await l.page.screenshot({ path: shot, fullPage: true });
    a.screenshot = shot;
    if (await visibleCaptcha(l.page)) {
      a.status = "needs-you";
      a.message = "A CAPTCHA appeared at submit. Solve it in the open browser, then press Submit here again.";
      log(a, a.message);
      return a;
    }
    // a real confirmation says so in so many words, and the form is gone; a job description that mentions "success" is not one
    const body = (await l.page.textContent("body")) ?? "";
    const fieldsAfter = await l.page.locator("[data-apply-key]").count();
    const formGone = fieldsAfter < Math.ceil(fieldsBefore / 2) || l.page.url() !== urlBefore;
    const saidSo = /thank you for (applying|your application|your interest)|application (has been |was )?(received|submitted|sent)|we('ve| have) received your application|successfully (submitted|applied)|your application is in|we'll be in touch/i.test(body);
    if (saidSo && formGone) {
      a.status = "submitted";
      a.stage = "applied";
      a.submittedAt = new Date().toISOString();
      a.stageAt = { ...(a.stageAt ?? {}), applied: a.submittedAt };
      a.nextAction = { date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10), note: "Follow up if no reply" };
      a.message = "Submitted. The confirmation is in the screenshot.";
    } else {
      a.status = "review";
      const errors = await l.page.locator('[aria-invalid="true"], .error, [class*="error" i]:not(:empty)').allInnerTexts().catch(() => [] as string[]);
      const hint = errors.map((e) => e.trim()).filter((e) => e && e.length < 120).slice(0, 3).join(" · ");
      a.message = `Clicked Submit but saw no confirmation${formGone ? "" : " and the form is still there"}. ${hint ? `The form says: ${hint}.` : "A required field or a CAPTCHA may be waiting; check the screenshot."}`;
    }
    a.finishedAt = new Date().toISOString();
    log(a, a.message);
    if (a.status === "submitted") await closeRun(id);
  } catch (e) {
    a.status = "review";
    a.message = `Submit failed: ${(e as Error).message.slice(0, 200)}`;
    log(a, a.message);
  }
  return a;
}

export async function stopApplication(id: string): Promise<Application | undefined> {
  const a = getApplication(id);
  await closeRun(id);
  if (a && a.status !== "submitted") {
    a.status = "stopped";
    a.finishedAt = new Date().toISOString();
    log(a, "Stopped; the browser is closed.");
  }
  return a;
}

export function isLive(id: string) {
  return live.has(id);
}

/** Draft one written answer for a field on a live run, from the record and the posting; returns the text without setting it. */
export async function draftAnswer(id: string, key: string): Promise<string> {
  const a = getApplication(id);
  if (!a) throw new Error("No such run");
  const f = a.fields.find((x) => x.key === key);
  if (!f) throw new Error("No such field");
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === a.jobId);
  const resume = getResume(a.resumeId);
  if (!job || !resume) throw new Error("The posting or résumé is gone");
  const answers = await answerWithClaude([{ key, label: f.label || "The question on the form" }], job, getProfile(), resume);
  const text = answers[key];
  if (!text || text.trim() === "REVIEW") throw new Error("The record does not answer this one; write it yourself");
  return text;
}
