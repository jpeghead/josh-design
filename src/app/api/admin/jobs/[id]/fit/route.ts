import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { fitFor } from "@/lib/admin/fit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET: keyword fit of the current base résumé against this posting (computed once per résumé version). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === id);
  if (!job) return new Response("Not found", { status: 404 });
  try {
    return Response.json(await fitFor(job));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
