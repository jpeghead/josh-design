import { submitApplication } from "@/lib/admin/apply/agent";
import { readJson, writeJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await submitApplication((await params).id);
  if (!a) return new Response("Not found or no open browser for this run", { status: 404 });
  if (a.status === "submitted") {
    const jobs = readJson<Posting[]>("jobs", []);
    const j = jobs.find((x) => x.id === a.jobId);
    if (j) {
      j.status = "applied";
      writeJson("jobs", jobs);
    }
  }
  return Response.json(a);
}
