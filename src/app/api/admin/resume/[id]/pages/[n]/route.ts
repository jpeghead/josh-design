import { getResume } from "@/lib/admin/resume/store";
import { pagePng, resumePages } from "@/lib/admin/resume/pages";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET: one page of the PDF as PNG. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const r = getResume(id);
  if (!r) return new Response("Not found", { status: 404 });
  const { dir } = await resumePages(r);
  const png = pagePng(dir, Number(n));
  if (!png) return new Response("No such page", { status: 404 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" } });
}
