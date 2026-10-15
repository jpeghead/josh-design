import { getApplication, saveApplication } from "@/lib/admin/apply/store";
import type { Application } from "@/lib/admin/apply/types";

export const runtime = "nodejs";

/** PATCH { stage?, nextAction?, notes?, markSubmitted? } updates the pipeline fields by hand. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = getApplication((await params).id);
  if (!a) return new Response("Not found", { status: 404 });
  const body = (await req.json()) as Partial<Pick<Application, "stage" | "nextAction" | "notes">> & { markSubmitted?: boolean };
  if (body.markSubmitted) {
    a.status = "submitted";
    a.stage = a.stage ?? "applied";
    a.submittedAt = a.submittedAt ?? new Date().toISOString();
    a.finishedAt = a.finishedAt ?? a.submittedAt;
  }
  if (body.stage) a.stage = body.stage;
  if (body.nextAction !== undefined) a.nextAction = body.nextAction;
  if (typeof body.notes === "string") a.notes = body.notes;
  return Response.json(saveApplication(a));
}
