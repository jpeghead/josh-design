import { readFileSync, existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { DATA_DIR } from "@/lib/admin/store";

export const runtime = "nodejs";

/** Serves a file from data/admin/out only (screenshots, exports). */
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const p = normalize(join(DATA_DIR, "out", name));
  if (!name || !p.startsWith(join(DATA_DIR, "out")) || !existsSync(p)) return new Response("Not found", { status: 404 });
  const type = p.endsWith(".png") ? "image/png" : p.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
  return new Response(readFileSync(p), { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
}
