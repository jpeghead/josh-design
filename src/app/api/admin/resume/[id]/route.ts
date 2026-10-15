import { getResume, saveResume, deleteResume } from "@/lib/admin/resume/store";
import type { ResumeData } from "@/lib/admin/resume/types";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const r = getResume((await params).id);
  return r ? Response.json(r) : new Response("Not found", { status: 404 });
}

/** PATCH { label?, data? } edits a résumé in place (manual edits from the JSON panel). */
export async function PATCH(req: Request, { params }: Ctx) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const body = (await req.json()) as { label?: string; data?: ResumeData };
  if (body.label) r.label = body.label;
  if (body.data) r.data = body.data;
  return Response.json(saveResume(r));
}

export async function DELETE(_: Request, { params }: Ctx) {
  deleteResume((await params).id);
  return new Response(null, { status: 204 });
}
