import { setFields } from "@/lib/admin/apply/agent";

export const runtime = "nodejs";
export const maxDuration = 120;

/** PATCH { edits: [{ key, value }] } sets fields on the live form and re-screenshots. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { edits } = (await req.json()) as { edits: { key: string; value: string }[] };
  const a = await setFields((await params).id, edits ?? []);
  return a ? Response.json(a) : new Response("No live form for that run", { status: 409 });
}
