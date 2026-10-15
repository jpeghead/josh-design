import { getResume } from "@/lib/admin/resume/store";
import { renderResumeHtml } from "@/lib/admin/resume/render";
import { resumeFontCss } from "@/lib/admin/resume/fonts";

export const runtime = "nodejs";

/** The résumé as a page, for the editor's iframe. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(renderResumeHtml(r.data, { preview: true, fontCss: resumeFontCss() }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
