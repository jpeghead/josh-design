import { getProfile } from "@/lib/admin/resume/profile";
import { anthropicConfigured } from "@/lib/anthropic";
import { postingKeywords, roughKeywords, tailorResume } from "@/lib/admin/resume/model";
import { buildResume } from "@/lib/admin/resume/build";
import { getResume, newResume, coverage } from "@/lib/admin/resume/store";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * POST { jobId } → a new version tailored to that posting. With a key:
 * Claude extracts keywords and rewrites toward them. Without: keywords by
 * rule, bullets reordered by rule, nothing reworded.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const { jobId } = (await req.json()) as { jobId: string };
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === jobId);
  if (!job) return new Response("Posting not found", { status: 404 });
  const profile = getProfile();
  const hasKey = anthropicConfigured();
  try {
    const keywords = hasKey ? await postingKeywords(job) : roughKeywords(job);
    const data = hasKey ? await tailorResume(r.data, job, keywords, profile) : buildResume(profile, r.persona, keywords);
    const next = newResume(r.persona, `${r.label} → ${job.company}: ${job.title}`.slice(0, 90), data, {
      basedOn: r.id,
      jobId: job.id,
      company: job.company,
      instruction: hasKey ? `Tailored to ${job.company} — ${job.title}` : `Reordered by rule for ${job.company} — ${job.title} (no key, no rewording)`,
      keywords: coverage(data, keywords),
    });
    return Response.json(next);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
