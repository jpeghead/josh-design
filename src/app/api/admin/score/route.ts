import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { readJson, writeJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { profileSummary } from "@/lib/admin/resume/profile";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.ASK_MODEL ?? "claude-sonnet-5-5";

/**
 * Claude re-scores the top rule-scored postings that it has not scored yet:
 * fit 0–100, one line of why, which résumé persona to lead with. Facts about
 * Josh come from the profile; the model never sees anything else about him.
 */
export async function POST() {
  if (!anthropicConfigured()) return Response.json({ error: "No model credentials (federation variables or ANTHROPIC_API_KEY in .env.local), so scoring stays on rules." }, { status: 200 });
  const jobs = readJson<Posting[]>("jobs", []);
  const todo = jobs.filter((p) => p.scoredBy === "rules" && p.status !== "hidden" && p.score >= 35).slice(0, 40);
  if (!todo.length) return Response.json({ scored: 0 });
  const client = anthropicClient();
  const profile = profileSummary();
  let scored = 0;
  for (const p of todo) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `You score job postings for one candidate. Reply with JSON only: {"score": 0-100, "why": "one sentence", "persona": "designer-who-builds" | "ai-builder"}. Score is the chance this candidate gets a first interview and would want the job: weight the posting's real requirements against the candidate's actual record, penalize hard requirements he lacks (e.g. ML research, a CS degree stated as required, 10+ years engineering), reward roles where a designer who ships code with agents is the point. persona is which résumé should lead.\n\nCANDIDATE:\n${profile}`,
      messages: [{ role: "user", content: `COMPANY: ${p.company}\nTITLE: ${p.title}\nLOCATION: ${p.location} ${p.remote ? "(remote)" : ""}\n\n${p.description.slice(0, 6000)}` }],
    });
    const txt = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) continue;
    try {
      const j = JSON.parse(m[0]) as { score: number; why: string; persona: Posting["persona"] };
      p.score = Math.max(0, Math.min(100, Math.round(j.score)));
      p.scoreWhy = String(j.why).slice(0, 240);
      p.persona = j.persona === "ai-builder" ? "ai-builder" : "designer-who-builds";
      p.scoredBy = "claude";
      scored++;
    } catch {
      /* skip unparsable */
    }
  }
  jobs.sort((a, b) => b.score - a.score);
  writeJson("jobs", jobs);
  return Response.json({ scored });
}
