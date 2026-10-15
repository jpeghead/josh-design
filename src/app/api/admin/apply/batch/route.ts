import { enqueue, kick, queueSnapshot } from "@/lib/admin/apply/queue";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST { jobIds } queues background preparation for each posting; GET reports the queue. */
export async function POST(req: Request) {
  const { jobIds } = (await req.json()) as { jobIds: string[] };
  if (!Array.isArray(jobIds) || !jobIds.length) return new Response("Which postings?", { status: 400 });
  const ids = enqueue(jobIds);
  return Response.json({ ids, ...queueSnapshot() });
}

export async function GET() {
  void kick();
  return Response.json(queueSnapshot());
}
