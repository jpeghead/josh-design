import { readJson, writeJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";

export const runtime = "nodejs";

/** PATCH { id, status?, notes? } updates one posting. */
export async function PATCH(req: Request) {
  const body = (await req.json()) as { id: string; status?: Posting["status"]; notes?: string };
  const jobs = readJson<Posting[]>("jobs", []);
  const j = jobs.find((x) => x.id === body.id);
  if (!j) return new Response("Not found", { status: 404 });
  if (body.status) j.status = body.status;
  if (typeof body.notes === "string") j.notes = body.notes;
  writeJson("jobs", jobs);
  return Response.json(j);
}
