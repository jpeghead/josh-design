import { getResume } from "@/lib/admin/resume/store";
import { thumbnail } from "@/lib/admin/resume/pages";
import { templateById } from "@/lib/admin/resume/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET ?template=x → a small PNG of page one in that template. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const t = templateById(new URL(req.url).searchParams.get("template") ?? undefined).id;
  const png = await thumbnail(r, t);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
