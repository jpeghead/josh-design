import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { readJson, writeJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getBrief } from "@/lib/admin/brief";
import { profileSummary } from "@/lib/admin/resume/profile";

export const runtime = "nodejs";
export const maxDuration = 60;

type Turn = { role: "user" | "assistant"; content: string };
type Session = { jobId: string; at: string; turns: Turn[] };

/** GET: the saved practice transcript. POST { turns } → the interviewer's next message; the transcript is saved. DELETE clears it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(readJson<Session[]>("practice", []).find((s) => s.jobId === id) ?? { jobId: id, turns: [] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  writeJson("practice", readJson<Session[]>("practice", []).filter((s) => s.jobId !== id));
  return new Response(null, { status: 204 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === id);
  if (!job) return new Response("Posting not found", { status: 404 });
  if (!anthropicConfigured()) return Response.json({ error: "No model reachable. Run `vercel env pull`." }, { status: 500 });
  const { turns } = (await req.json()) as { turns: Turn[] };
  const brief = getBrief(id);
  const res = await anthropicClient().messages.create({
    model: process.env.ASK_MODEL ?? "claude-sonnet-5-5",
    thinking: { type: "between_tools" },
    max_tokens: 900,
    system: `You are running a practice interview for one candidate, for one posting. You play the interviewer at the company; you also coach, briefly, between questions.

Rules: ask one question at a time, the kind this company would actually ask for this role, drawing on the posting (and the brief, when given). After each answer, give a short critique in three lines at most: what landed, what was vague or unsupported, and one concrete way to make it sharper; flag any claim that is not in the candidate's record as "not in your record". Then ask the next question. Vary the questions: behavioral, craft, role-specific, one about the company, one about compensation or logistics near the end. Keep every message under 160 words. Plain text, no markdown headings. Begin, if the conversation is empty, with one line of framing and the first question.

POSTING: ${job.title} at ${job.company}
${job.description.slice(0, 6000)}

${brief ? `BRIEF:\n${brief.text.slice(0, 5000)}\n` : ""}
CANDIDATE RECORD:
${profileSummary()}`,
    messages: turns.length ? turns : [{ role: "user", content: "Let's begin." }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  if (!text) return Response.json({ error: "The model returned no text." }, { status: 500 });
  const next: Turn[] = [...(turns.length ? turns : []), { role: "assistant", content: text }];
  const all = readJson<Session[]>("practice", []).filter((s) => s.jobId !== id);
  writeJson("practice", [{ jobId: id, at: new Date().toISOString(), turns: next }, ...all].slice(0, 60));
  return Response.json({ text });
}
