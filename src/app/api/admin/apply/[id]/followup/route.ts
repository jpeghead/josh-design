import { anthropicClient, anthropicConfigured } from "@/lib/anthropic";
import { getApplication } from "@/lib/admin/apply/store";
import { profileSummary } from "@/lib/admin/resume/profile";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Drafts a follow-up note for a submitted application. Returns text for Josh
 * to copy into his own mail client; nothing is sent from here.
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = getApplication((await params).id);
  if (!a) return new Response("Not found", { status: 404 });
  if (!anthropicConfigured()) return Response.json({ error: "No model reachable. Run `vercel env pull` to refresh the development token." }, { status: 500 });
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === a.jobId);
  const days = a.submittedAt ? Math.round((Date.now() - new Date(a.submittedAt).getTime()) / 86400000) : null;
  const res = await anthropicClient().messages.create({
    model: process.env.ASK_MODEL ?? "claude-sonnet-5-5",
    thinking: { type: "between_tools" },
    max_tokens: 700,
    system: `You write one short follow-up message from Josh Whitehead about a job application, in his voice: direct, warm, plain, first person, no flattery, no exclamation marks, no "I hope this finds you well". Under 120 words. One specific reason the role fits, drawn from the posting and his record. No invented names or facts; if the recruiter's name is unknown, open with "Hi there,". End with his name. Plain text only, no subject line.

JOSH:
${profileSummary()}`,
    messages: [{
      role: "user",
      content: `Application: ${a.title} at ${a.company}. Stage: ${a.stage ?? "applied"}. Submitted ${days === null ? "date unknown" : `${days} days ago`}.${a.notes ? `\nJosh's notes on this one: ${a.notes}` : ""}${a.nextAction?.note ? `\nPlanned action: ${a.nextAction.note}` : ""}\n\nPosting:\n${(job?.description ?? "").slice(0, 5000)}`,
    }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  return text ? Response.json({ text }) : Response.json({ error: "The model returned no text." }, { status: 500 });
}
