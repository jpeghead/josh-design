import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getResume } from "@/lib/admin/resume/store";
import { newApplication } from "@/lib/admin/apply/store";
import { startApplication } from "@/lib/admin/apply/agent";
import { listApplications } from "@/lib/admin/apply/store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(listApplications());
}

/** POST { jobId, resumeId, autoSubmit? } starts a run in the background and returns its id. */
export async function POST(req: Request) {
  const body = (await req.json()) as { jobId: string; resumeId: string; autoSubmit?: boolean };
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === body.jobId);
  const resume = getResume(body.resumeId);
  if (!job || !resume) return new Response("Posting or résumé not found", { status: 404 });
  const app = newApplication({ jobId: job.id, company: job.company, title: job.title, url: job.applyUrl, resumeId: resume.id, autoSubmit: !!body.autoSubmit });
  void startApplication(app, job, resume);
  return Response.json({ id: app.id });
}
