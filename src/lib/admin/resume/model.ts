import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import type { Profile } from "./profile";
import type { ResumeData } from "./types";
import type { Posting } from "../types";

const MODEL = process.env.ASK_MODEL ?? "claude-sonnet-5-5";

function client() {
  if (!anthropicConfigured()) throw new Error("No model credentials (federation variables or ANTHROPIC_API_KEY in .env.local). Editing with instructions and tailoring need them; building, previewing, and exporting do not.");
  return anthropicClient();
}

const RULES = `You edit a résumé as structured JSON. Hard rules:
- Never invent facts. No new employers, titles, dates, clients, metrics, degrees, awards, or tools. Every bullet must be a rewording, trimming, or re-selection of what is in BANK (the candidate's full profile). You may combine two bank bullets into one if nothing new is implied.
- Keep the schema exactly: return the same JSON shape you received, complete, with every field present. Return JSON only, no prose, no code fence.
- Keep "client engagement" marked where the bank marks it; never present a client as an employer.
- Plain dates stay as given ("Jan 2023 – Mar 2025" style). One column of text. No tables, icons, or symbols.
- Prefer concrete verbs and outcomes already in the bank. Mirror a posting's vocabulary only where it is true of the candidate.`;

function bank(p: Profile): string {
  return [
    `Headlines: ${JSON.stringify(p.headline)}`,
    `Summaries: ${JSON.stringify(p.summary)}`,
    ...p.experience.map((e) => `${e.role} at ${e.company} (${e.start} – ${e.end})${e.client ? " [client engagement]" : ""}\n  summary: ${e.summary}\n` + e.bullets.map((b) => `  - ${b.text}`).join("\n")),
    `Builds: ${p.builds.map((b) => `${b.title}: ${b.line} ${b.url}`).join(" | ")}`,
    `Skills: ${JSON.stringify(p.skills)}`,
    `Education: ${JSON.stringify(p.education)}`,
    `Publications: ${JSON.stringify(p.publications)}`,
    `Service: ${JSON.stringify(p.service)}`,
  ].join("\n");
}

function parse(txt: string, base: ResumeData): ResumeData {
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("The model did not return JSON.");
  const d = JSON.parse(m[0]) as Partial<ResumeData>;
  if (!d.name || !Array.isArray(d.experience) || !Array.isArray(d.sections)) throw new Error("The model returned an incomplete résumé.");
  // anything the model left out keeps the value it was given, so a reply missing "skills" cannot save a résumé no renderer can draw
  const arr = <T>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  return {
    ...base,
    ...d,
    name: d.name,
    headline: typeof d.headline === "string" ? d.headline : base.headline,
    summary: typeof d.summary === "string" ? d.summary : base.summary,
    links: arr(d.links, base.links),
    experience: arr(d.experience, base.experience),
    builds: arr(d.builds, base.builds),
    skills: arr(d.skills, base.skills),
    education: arr(d.education, base.education),
    publications: arr(d.publications, base.publications),
    sections: arr(d.sections, base.sections),
  } as ResumeData;
}

/** Apply a plain-English instruction ("make the summary shorter", "lead with the Apple work") to a résumé. */
export async function editResume(data: ResumeData, instruction: string, profile: Profile): Promise<ResumeData> {
  const res = await client().messages.create({
    model: MODEL,
    thinking: { type: "between_tools" },
    max_tokens: 6000,
    system: `${RULES}\n\nBANK:\n${bank(profile)}`,
    messages: [{ role: "user", content: `CURRENT RESUME JSON:\n${JSON.stringify(data)}\n\nINSTRUCTION: ${instruction}\n\nReturn the full updated JSON.` }],
  });
  return parse(res.content.map((c) => (c.type === "text" ? c.text : "")).join(""), data);
}

/** Pull the terms a parser would look for from a posting: skills, tools, title words, responsibilities. */
export async function postingKeywords(p: Posting): Promise<string[]> {
  const res = await client().messages.create({
    model: MODEL,
    thinking: { type: "between_tools" },
    max_tokens: 400,
    system: 'Extract the 12 to 20 most important keywords and phrases an applicant tracking system would match this posting on: tools, skills, role words, domain terms. Reply with a JSON array of strings only.',
    messages: [{ role: "user", content: `${p.title} at ${p.company}\n\n${p.description.slice(0, 7000)}` }],
  });
  const txt = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const m = txt.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    return (JSON.parse(m[0]) as string[]).map((s) => String(s)).slice(0, 24);
  } catch {
    return [];
  }
}

/** Rewrite a résumé toward a posting: reorder, reselect, reword toward its vocabulary. Facts stay the facts. */
export async function tailorResume(data: ResumeData, p: Posting, keywords: string[], profile: Profile): Promise<ResumeData> {
  const res = await client().messages.create({
    model: MODEL,
    thinking: { type: "between_tools" },
    max_tokens: 6000,
    system: `${RULES}\n\nBANK:\n${bank(profile)}`,
    messages: [
      {
        role: "user",
        content: `POSTING: ${p.title} at ${p.company}\nKEYWORDS THE PARSER WILL LOOK FOR: ${keywords.join(", ")}\n\nPOSTING TEXT:\n${p.description.slice(0, 5000)}\n\nCURRENT RESUME JSON:\n${JSON.stringify(data)}\n\nTailor the résumé to this posting: choose the headline and summary wording that fits, reorder and reselect bullets from the bank so the most relevant lead, use the posting's vocabulary where it is true of the candidate, keep it to the same length or shorter (never longer). For each keyword above, if the bank supports it, make sure the exact term appears somewhere natural (a bullet, the summary, or the skills list); if the bank does not support it, leave it out. Return the full JSON.`,
      },
    ],
  });
  return parse(res.content.map((c) => (c.type === "text" ? c.text : "")).join(""), data);
}

/** Rule-based keyword pull for when there is no key: capitalized tool names and known skill words in the posting. */
export function roughKeywords(p: Posting): string[] {
  const text = `${p.title}\n${p.description}`;
  const known = ["Figma", "React", "TypeScript", "Next.js", "Tailwind", "Swift", "SwiftUI", "Flutter", "iOS", "Android", "design system", "prototyp", "LLM", "agent", "Claude", "GPT", "prompt", "evals", "RAG", "WebGPU", "Three.js", "GLSL", "user research", "A/B", "growth", "onboarding", "developer", "API", "SDK", "CLI", "enterprise", "B2B", "consumer", "mobile", "web", "accessibility", "motion", "brand", "0 to 1", "end-to-end", "cross-functional", "leadership", "mentor", "roadmap", "ship"];
  const hits = known.filter((k) => new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text));
  return hits.slice(0, 20);
}
