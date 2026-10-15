import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getResume } from "@/lib/admin/resume/store";
import { toPdf } from "@/lib/admin/resume/export";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST: copy this résumé's PDF to public/Josh-Whitehead-Resume.pdf, so
 * josh.design/resume offers the same document applications carry. The
 * file is committed like any other asset; this only writes it locally.
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const pdf = await toPdf(r);
  const dest = join(process.cwd(), "public", "Josh-Whitehead-Resume.pdf");
  mkdirSync(join(process.cwd(), "public"), { recursive: true });
  copyFileSync(pdf, dest);
  return Response.json({ ok: true, path: "/Josh-Whitehead-Resume.pdf", note: "Written to public/. Commit it to put it on the site." });
}
