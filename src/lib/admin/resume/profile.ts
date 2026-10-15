import { resume } from "@/content/resume";
import { socials } from "@/content/about";
import { projects } from "@/lib/data";
import { books } from "@/content/books";
import { lab } from "@/content/lab";
import { readJson, writeJson } from "../store";
import { RECORD, SERVICE_DETAIL, SKILLS_EXTRA } from "./record";

/**
 * The one source of truth for every résumé. Seeded from the site's content
 * modules (which are themselves locked to the real timeline), then owned by
 * data/admin/profile.json so Josh can edit it in the panel. Bullets carry
 * tags so a tailored résumé can select by what a posting asks for.
 */
export type Bullet = { text: string; tags: string[] };
export type Experience = { company: string; role: string; start: string; end: string; location?: string; summary: string; bullets: Bullet[]; tools?: string[]; client?: boolean };
export type Profile = {
  name: string;
  headline: Record<"designer-who-builds" | "ai-builder", string>;
  summary: Record<"designer-who-builds" | "ai-builder", string>;
  email: string;
  phone?: string;
  location: string;
  links: { label: string; url: string }[];
  experience: Experience[];
  builds: { title: string; line: string; url: string; tags: string[] }[];
  skills: Record<string, string[]>;
  education: { school: string; detail: string; years?: string }[];
  publications: { title: string; detail: string; url?: string }[];
  service?: { branch: string; role: string; years: string; detail?: string };
  /** Standard application answers. Only what is true; anything unknown is left blank for review. */
  answers: {
    firstName: string;
    lastName: string;
    workAuthorizedUS: boolean;
    needsSponsorship: boolean;
    howHeard: string;
    pronouns?: string;
    salary?: string;
    startDate?: string;
    willingToRelocate?: string;
    /** "remote", "hybrid", "in-office", or a sentence; used for "are you open to working from our office" questions. */
    workplace?: string;
    /** Cities he would work in or move to, for location questions. */
    locations?: string;
    coverLetterStance: string;
  };
};

const MONTHS: Record<string, string> = { Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", May: "May", Jun: "Jun", Jul: "Jul", Aug: "Aug", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec" };
function span(timeline: string): [string, string] {
  const [a, b] = timeline.split(/[–-]/).map((s) => s.trim());
  const fix = (s: string) => s.replace(/^([A-Z][a-z]{2})\w* /, (_, m: string) => `${MONTHS[m] ?? m} `);
  return [fix(a ?? ""), /present/i.test(b ?? "") ? "Present" : fix(b ?? "")];
}

function tagsFor(text: string): string[] {
  const t: string[] = [];
  const rules: [RegExp, string][] = [
    [/design system/i, "design-systems"],
    [/apple|google|partner/i, "partnerships"],
    [/first (product )?designer|from zero|ground up|founded|stood up/i, "0-to-1"],
    [/head of design|led|lead|team|org/i, "leadership"],
    [/ship|launch|featured|wwdc/i, "shipping"],
    [/ios|app clip|mobile|android|flutter/i, "mobile"],
    [/agent|claude|codex|model|llm|ai\b/i, "ai"],
    [/code|typescript|react|front-end|built/i, "engineering"],
    [/brand/i, "brand"],
    [/dashboard|data|campaign/i, "b2b"],
    [/acqui/i, "outcome"],
  ];
  for (const [r, tag] of rules) if (r.test(text)) t.push(tag);
  return t.length ? t : ["general"];
}

export function seedProfile(): Profile {
  const experience: Experience[] = projects
    .filter((p) => !p.internalLink)
    .map((p) => {
      const [start, end] = span(p.timeline);
      const rec = RECORD[p.context];
      return {
        company: p.context,
        role: rec?.role ?? p.role,
        start,
        end,
        summary: rec?.summary ?? p.summary,
        bullets: rec ? rec.bullets : [...p.contribution, ...p.outcome].map((text) => ({ text, tags: tagsFor(text) })),
        tools: p.tools,
        client: /client/i.test(p.context),
      };
    });
  const boneyard = projects.find((p) => p.slug === "boneyard");
  if (boneyard) {
    const [start, end] = span(boneyard.timeline);
    experience.unshift({
      company: "Boneyard Collective",
      role: boneyard.role,
      start,
      end,
      location: "Los Angeles, CA",
      summary: RECORD["Boneyard Collective — Founder"].summary ?? "",
      bullets: RECORD["Boneyard Collective — Founder"].bullets,
      tools: ["Claude Code", "Codex", "TypeScript", "React", "Next.js", "Three.js", "Veo", "Figma"],
    });
  }
  return {
    name: resume.name,
    headline: {
      "designer-who-builds": "Product Designer who ships AI products, in Figma and in code",
      "ai-builder": "AI Product Builder · ships daily with coding agents · fifteen years of product design",
    },
    summary: {
      "designer-who-builds":
        "Product designer with fifteen years shipping consumer and B2B software: first designer to Head of Design twice (both companies acquired), Apple and Google partnerships shipped, design systems built from zero. For the last two years I have designed and shipped AI products end to end with coding agents in the loop, so the prototype and the product are the same artifact.",
      "ai-builder":
        "I design and build AI products end to end: prompts and context, grounding, measuring what the model actually shipped, streaming and agent interfaces, on-device inference, and the product around them, with coding agents in the loop every day. Underneath that is fifteen years of product design: first designer to Head of Design twice, both companies acquired, Apple and Google partnerships shipped. I want a team building AI-native products where designing and building are one job.",
    },
    email: resume.email,
    location: "Los Angeles, CA · remote-friendly",
    // a résumé carries the site, LinkedIn, and GitHub; the rest of the socials stay on the site
    links: [
      { label: "josh.design", url: resume.site },
      ...socials.filter((s) => /linkedin/i.test(s.href)).map((s) => ({ label: "LinkedIn", url: s.href })),
      { label: "GitHub", url: "https://github.com/jpeghead" },
    ],
    experience,
    builds: lab
      .filter((l) => ["portrait", "local", "agents", "ask", "city"].includes(l.slug))
      .map((l) => ({ title: l.title, line: l.blurb.split(". ")[0] + ".", url: `${resume.site}${l.href}`, tags: ["ai", "engineering"] })),
    skills: Object.fromEntries(
      Object.entries({
        ...resume.skills,
        "AI & models": [...resume.skills["AI & models"], "Evals: measuring shipped model output against a spec", "Generative video pipelines (Veo)", "Agent workflows across many projects"],
      }).map(([k, v]) => [k, [...v, ...(SKILLS_EXTRA[k] ?? [])]])
    ),
    education: [{ school: "Career school, digital design", detail: "Film, photography, code, music, games. Fine art in college (charcoal and canvas) before enlisting." }],
    publications: books.filter((b) => b.status !== "In progress").map((b) => ({ title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title, detail: b.blurb, url: b.site ?? b.link?.href })),
    service: { branch: "United States Marine Corps", role: "Combat photographer", years: "2008 – 2013", detail: SERVICE_DETAIL },
    answers: {
      firstName: "Josh",
      lastName: "Whitehead",
      workAuthorizedUS: true,
      needsSponsorship: false,
      howHeard: "Company website",
      pronouns: "",
      salary: "",
      startDate: "",
      willingToRelocate: "",
      workplace: "",
      locations: "",
      coverLetterStance: "Short, specific, no flattery. Name one thing about the company's product that the builds on josh.design relate to, say what I would do in the first ninety days, and stop.",
    },
  };
}

export function getProfile(): Profile {
  const existing = readJson<Profile | null>("profile", null);
  const seed = seedProfile();
  if (!existing) {
    writeJson("profile", seed);
    return seed;
  }
  // backfill fields added after this profile was saved, without touching what Josh edited
  let changed = false;
  for (const k of Object.keys(seed) as (keyof Profile)[]) {
    if (existing[k] === undefined) {
      (existing as Record<string, unknown>)[k] = seed[k];
      changed = true;
    }
  }
  if (changed) writeJson("profile", existing);
  return existing;
}

export function saveProfile(p: Profile) {
  writeJson("profile", p);
}

/** A compact plain-text view for prompts. */
export function profileSummary(): string {
  const p = getProfile();
  const lines = [
    `${p.name} · ${p.location} · ${p.email}`,
    `Headline: ${p.headline["ai-builder"]}`,
    p.summary["ai-builder"],
    "",
    "EXPERIENCE",
    ...p.experience.map((e) => `- ${e.role} at ${e.company} (${e.start} – ${e.end})${e.client ? " [client engagement]" : ""}: ${e.summary} ${e.bullets.map((b) => b.text).join(" ")}`),
    "",
    "BUILDS (live, runnable)",
    ...p.builds.map((b) => `- ${b.title}: ${b.line} ${b.url}`),
    "",
    "SKILLS",
    ...Object.entries(p.skills).map(([k, v]) => `- ${k}: ${v.join(", ")}`),
    "",
    `Service: ${p.service?.role}, ${p.service?.branch}, ${p.service?.years}. ${p.service?.detail ?? ""}`,
    ...p.publications.map((b) => `Publication: ${b.title}. ${b.detail}`),
  ];
  return lines.join("\n");
}
