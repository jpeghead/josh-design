import type { Profile } from "./profile";
import type { Persona, ResumeData } from "./types";

const ORDER: Record<Persona, ResumeData["sections"]> = {
  "designer-who-builds": ["summary", "experience", "builds", "skills", "publications", "education", "service"],
  "ai-builder": ["summary", "builds", "experience", "skills", "publications", "education", "service"],
};
const SKILL_ORDER: Record<Persona, string[]> = {
  "designer-who-builds": ["Product design", "AI & models", "Engineering", "Tools"],
  "ai-builder": ["AI & models", "Engineering", "Product design", "Tools"],
};
const PREFER: Record<Persona, string[]> = {
  "designer-who-builds": ["0-to-1", "leadership", "partnerships", "shipping", "design-systems", "ai"],
  "ai-builder": ["ai", "engineering", "shipping", "0-to-1", "leadership", "partnerships"],
};

/** Score a bullet for a persona and optional posting keywords; higher first. */
function rank(tags: string[], text: string, persona: Persona, keywords: string[]): number {
  let s = 0;
  PREFER[persona].forEach((t, i) => {
    if (tags.includes(t)) s += PREFER[persona].length - i;
  });
  const lower = text.toLowerCase();
  for (const k of keywords) if (lower.includes(k.toLowerCase())) s += 4;
  return s;
}

/** True when a bullet mostly restates the role summary; such bullets add length, not information. */
function restates(summary: string, bullet: string): boolean {
  const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
  const a = words(summary);
  const b = words(bullet);
  if (!b.size) return false;
  let hit = 0;
  for (const w of b) if (a.has(w)) hit++;
  return hit / b.size >= 0.7;
}

/** Build a résumé from the profile for a persona. Keywords (from a posting) reorder bullets but never add facts. */
export function buildResume(profile: Profile, persona: Persona, keywords: string[] = [], maxBullets = 4): ResumeData {
  const experience = profile.experience.map((e, i) => {
    const sorted = [...e.bullets].filter((b) => !restates(e.summary, b.text)).sort((a, b) => rank(b.tags, b.text, persona, keywords) - rank(a.tags, a.text, persona, keywords));
    // the current role carries the most; the oldest two get one line each so the whole thing holds two pages
    const n = i === 0 ? maxBullets : i < 3 ? maxBullets - 1 : i < 5 ? 2 : 1;
    return { company: e.company, role: e.role, start: e.start, end: e.end, location: e.location, summary: e.summary, bullets: sorted.slice(0, n).map((b) => b.text), client: e.client };
  });
  const skills = SKILL_ORDER[persona].filter((g) => profile.skills[g]).map((g) => ({ group: g, items: profile.skills[g] }));
  return {
    persona,
    name: profile.name,
    headline: profile.headline[persona],
    summary: profile.summary[persona],
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    links: profile.links,
    sections: ORDER[persona],
    experience,
    builds: profile.builds.slice(0, 3).map((b) => ({ title: b.title, line: b.line, url: b.url })),
    skills,
    education: profile.education,
    publications: profile.publications,
    service: profile.service,
  };
}
