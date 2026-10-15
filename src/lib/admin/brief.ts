import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { profileSummary } from "./resume/profile";
import { readJson, writeJson } from "./store";
import type { Posting } from "./types";

export type Brief = { jobId: string; createdAt: string; text: string };

export function getBrief(jobId: string): Brief | undefined {
  return readJson<Brief[]>("briefs", []).find((b) => b.jobId === jobId);
}

/**
 * An interview brief for one posting, from the posting text and Josh's
 * profile only. Anything the posting does not say is marked "verify" rather
 * than asserted, because a brief that invents company facts is worse than
 * none.
 */
export async function makeBrief(job: Posting): Promise<Brief> {
  if (!anthropicConfigured()) throw new Error("No model reachable. Run `vercel env pull` to refresh the development token.");
  const client = anthropicClient();
  const res = await client.messages.create({
    model: process.env.ASK_MODEL ?? "claude-sonnet-5-5",
    thinking: { type: "between_tools" },
    max_tokens: 4500,
    system: `You prepare one candidate for an interview. Use only the POSTING and the CANDIDATE. Where the posting is silent (the company's funding, size, competitors, interview process), write "verify:" before the sentence and keep it short, or leave it out. Be direct and specific; no filler, no flattery, no generic interview advice. Keep each bullet to two sentences; the whole brief under 1200 words. Plain text with these exact headings, each on its own line, sections separated by a blank line:

THE ROLE IN TWO LINES
WHAT THEY ARE REALLY HIRING FOR
WHERE JOSH IS STRONG (with the proof from his record)
WHERE JOSH IS THIN (honest, with how to address each)
LIKELY QUESTIONS (8, each followed by one line on the angle to take)
QUESTIONS TO ASK THEM (6, specific to this posting)
THIRTY-SECOND INTRO (in his voice, first person)

CANDIDATE:
${profileSummary()}`,
    messages: [{ role: "user", content: `POSTING: ${job.title} at ${job.company} (${job.location})\n\n${job.description.slice(0, 9000)}` }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  if (!text) throw new Error("The model returned no text.");
  const brief: Brief = { jobId: job.id, createdAt: new Date().toISOString(), text };
  const all = readJson<Brief[]>("briefs", []).filter((b) => b.jobId !== job.id);
  writeJson("briefs", [brief, ...all]);
  return brief;
}
