import { resume } from "@/content/resume";
import { socials } from "@/content/about";
import { projects } from "@/lib/data";
import { books } from "@/content/books";
import { lab } from "@/content/lab";
import { readJson, writeJson } from "../store";

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
  service?: { branch: string; role: string; years: string };
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
      return {
        company: p.context,
        role: p.role,
        start,
        end,
        summary: p.summary,
        bullets: [...p.contribution, ...p.outcome].map((text) => ({ text, tags: tagsFor(text) })),
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
      summary: "Design studio and product lab. Client work by day; our own AI products in between, designed and shipped end to end with coding agents in the loop.",
      bullets: [
        { text: "Design and ship AI products end to end: OLO (a desktop companion for the Mac), Weaver (a writing room that remembers a channel), StoryMode (game stories as audio), each with a live site.", tags: ["ai", "shipping", "0-to-1", "engineering"] },
        { text: "Built josh.design as a working AI-builder portfolio: a language model running in the browser on WebGPU, a grounded hosted Claude demo, five agent-interface prototypes, and a playable 3D city built with a coding agent in sixteen days.", tags: ["ai", "engineering", "shipping"] },
        { text: "Open-sourced two of the builds (agent-ui-patterns, local-grounded-chat) and run CI, tests, and a public build log on the portfolio repo.", tags: ["engineering", "ai"] },
        { text: "Wrote Mastery is Dead, a 618-page field manual on how AI is restructuring twenty-five white-collar careers; out in paperback.", tags: ["ai", "writing"] },
      ],
      tools: ["Claude Code", "Codex", "TypeScript", "React", "Next.js", "Three.js", "Figma"],
    });
  }
  return {
    name: resume.name,
    headline: {
      "designer-who-builds": "Product Designer who builds with AI",
      "ai-builder": "AI Product Builder · Product Design background",
    },
    summary: {
      "designer-who-builds":
        "Product designer with fifteen years shipping consumer and B2B software, twice the first designer who became Head of Design (both companies acquired). Now designs and ships AI products end to end with coding agents in the loop: comfortable in Figma and in the code editor, from prototype to production.",
      "ai-builder":
        "Builds AI products end to end: prompts, grounding, streaming interfaces, agent interaction patterns, on-device inference, and the shipping around them, with coding agents in the loop. Fifteen years of product design underneath it, including two runs as first designer to Head of Design at companies that were acquired.",
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
    skills: resume.skills,
    education: [{ school: "Career school, digital design", detail: "Film, photography, code, music, games. Fine art in college (charcoal and canvas) before enlisting." }],
    publications: books.filter((b) => b.status !== "In progress").map((b) => ({ title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title, detail: b.blurb, url: b.site ?? b.link?.href })),
    service: { branch: "United States Marine Corps", role: "Combat photographer", years: "2008 – 2013" },
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
    `Service: ${p.service?.role}, ${p.service?.branch}, ${p.service?.years}.`,
    ...p.publications.map((b) => `Publication: ${b.title}. ${b.detail}`),
  ];
  return lines.join("\n");
}
