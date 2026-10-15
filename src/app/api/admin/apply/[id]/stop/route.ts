import { stopApplication } from "@/lib/admin/apply/agent";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await stopApplication((await params).id);
  return a ? Response.json(a) : new Response("Not found", { status: 404 });
}
