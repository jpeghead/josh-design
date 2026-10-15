import { getApplication } from "@/lib/admin/apply/store";
import { isLive } from "@/lib/admin/apply/agent";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getApplication(id);
  if (!a) return new Response("Not found", { status: 404 });
  return Response.json({ ...a, live: isLive(id) });
}
