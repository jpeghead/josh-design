import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { getResume } from "@/lib/admin/resume/store";
import { toPdf, toDocx, toTxt } from "@/lib/admin/resume/export";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET ?format=pdf|docx|txt streams the file; it is also kept under data/admin/out. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";
  const file = format === "docx" ? await toDocx(r) : format === "txt" ? toTxt(r) : await toPdf(r);
  const type = format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : format === "txt" ? "text/plain; charset=utf-8" : "application/pdf";
  return new Response(readFileSync(file), { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${basename(file)}"` } });
}
