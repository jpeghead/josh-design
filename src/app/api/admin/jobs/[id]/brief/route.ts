import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getBrief, makeBrief } from "@/lib/admin/brief";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const b = getBrief((await params).id);
  return b ? Response.json(b) : new Response("No brief yet", { status: 404 });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === id);
  if (!job) return new Response("Posting not found", { status: 404 });
  try {
    return Response.json(await makeBrief(job));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
