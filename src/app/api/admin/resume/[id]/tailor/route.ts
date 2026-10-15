import { getResume } from "@/lib/admin/resume/store";
import { tailorFor } from "@/lib/admin/resume/tailor";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";

export const runtime = "nodejs";
export const maxDuration = 180;

/** POST { jobId } → a new version of this résumé tailored to that posting. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const { jobId } = (await req.json()) as { jobId: string };
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === jobId);
  if (!job) return new Response("Posting not found", { status: 404 });
  try {
    return Response.json(await tailorFor(job, r));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
