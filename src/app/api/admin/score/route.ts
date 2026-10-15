import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { readJson, writeJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { profileSummary } from "@/lib/admin/resume/profile";
import { usOrRemote } from "@/lib/admin/taxonomy";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.ASK_MODEL ?? "claude-sonnet-5-5";

/**
 * Claude re-scores the top rule-scored postings that it has not scored yet:
 * fit 0–100, one line of why, which résumé persona to lead with. Facts about
 * Josh come from the profile; the model never sees anything else about him.
 */
export async function POST(req: Request) {
  if (!anthropicConfigured()) return Response.json({ error: "No model credentials (federation variables or ANTHROPIC_API_KEY in .env.local), so scoring stays on rules." }, { status: 200 });
  const n = Math.min(300, Math.max(1, Number(new URL(req.url).searchParams.get("n") ?? 60)));
  const jobs = readJson<Posting[]>("jobs", []);
  // AI-heavy postings first, then the rest of the rule-scored top
  const todo = jobs
    .filter((p) => p.scoredBy === "rules" && p.status !== "hidden" && p.score >= 35)
    .sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0) || b.score - a.score)
    .slice(0, n);
  if (!todo.length) return Response.json({ scored: 0 });
  const client = anthropicClient();
  const profile = profileSummary();
  let scored = 0;
  const scoreOne = async (p: Posting) => {
    const res = await client.messages.create({
      model: MODEL,
      thinking: { type: "between_tools" },
      max_tokens: 400,
      system: `You score job postings for one candidate. Reply with JSON only: {"score": 0-100, "why": "one sentence", "persona": "designer-who-builds" | "ai-builder"}.

What he is hunting for, in order: (1) roles at AI-native companies where designing and building AI products is the job itself: agent experience, AI product design, design engineer, founding designer, prototyper, forward-deployed design, product engineer on an AI product; (2) senior design roles at AI-native companies; (3) design-engineer or AI-builder roles at companies where AI is a real product line. A generic product-design role at a company where AI is a feature or a buzzword scores under 50 even if he could get it. Internal-tools, HR, IT, payroll, or admin-surface design roles score under 45 unless the posting is explicitly about agents or AI. Score is the chance he gets a first interview AND would take the job: weight the posting's real requirements against his record, penalize hard requirements he lacks (ML research, a required CS degree, 10+ years of software engineering, deep infra or backend), reward postings that want someone who designs, prototypes in code, and ships with agents. Management-heavy roles (director of a large org, design manager) score lower unless small-team and hands-on. He lives in the US (Los Angeles) and works remote or hybrid US; a role based in or restricted to Europe, the UK, Canada, or elsewhere outside the US scores under 40 unless the posting says remote worldwide. The LOCATION line and the US_OK flag are reliable. persona is which résumé should lead: "ai-builder" when the posting is about building AI products or wants code, "designer-who-builds" when it is a design role.

CANDIDATE:
${profile}`,
      messages: [{ role: "user", content: `COMPANY: ${p.company}\nTITLE: ${p.title}\nLOCATION: ${p.location} ${p.remote ? "(remote)" : ""}\nUS_OK: ${usOrRemote(p.location, p.remote) ? "yes" : "no, outside the US and not marked remote"}\n\n${p.description.slice(0, 6000)}` }],
    });
    const txt = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return;
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
  };
  // five at a time: fast enough, gentle on rate limits
  for (let i = 0; i < todo.length; i += 5) await Promise.all(todo.slice(i, i + 5).map((p) => scoreOne(p).catch(() => undefined)));
  jobs.sort((a, b) => b.score - a.score);
  writeJson("jobs", jobs);
  return Response.json({ scored });
}
