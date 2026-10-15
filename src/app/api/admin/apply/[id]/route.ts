import { getApplication, listApplications } from "@/lib/admin/apply/store";
import { writeJson } from "@/lib/admin/store";
import { isLive } from "@/lib/admin/apply/agent";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getApplication(id);
  if (!a) return new Response("Not found", { status: 404 });
  return Response.json({ ...a, live: isLive(id) });
}

/** Removes a run's record (a test, or a mistake). The browser, if open, is closed first. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stopApplication } = await import("@/lib/admin/apply/agent");
  await stopApplication(id).catch(() => undefined);
  writeJson("applications", listApplications().filter((a) => a.id !== id));
  return new Response(null, { status: 204 });
}
