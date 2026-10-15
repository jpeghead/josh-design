import { getResume } from "@/lib/admin/resume/store";
import { resumePages } from "@/lib/admin/resume/pages";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET: how many pages the PDF has (rendering it if needed) and a hash for cache-busting the images. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  try {
    const { count, hash } = await resumePages(r);
    return Response.json({ count, hash });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
