import { readJson, writeJson } from "@/lib/admin/store";
import { discover } from "@/lib/admin/discover";
import type { Company } from "@/lib/admin/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json(readJson<Company[]>("companies", []));
}

/** POST { query, name?, source?, slug? }: with only a query, probe and return hits; with source+slug, save. */
export async function POST(req: Request) {
  const body = (await req.json()) as { query?: string; name?: string; source?: Company["source"]; slug?: string };
  const companies = readJson<Company[]>("companies", []);
  if (body.source && body.slug && body.name) {
    if (companies.some((c) => c.source === body.source && c.slug === body.slug)) return Response.json({ saved: false, reason: "already listed" });
    companies.push({ name: body.name.trim(), source: body.source, slug: body.slug.trim() });
    companies.sort((a, b) => a.name.localeCompare(b.name));
    writeJson("companies", companies);
    return Response.json({ saved: true, count: companies.length });
  }
  if (!body.query?.trim()) return new Response("Give a company name or careers URL.", { status: 400 });
  const hits = await discover(body.query);
  return Response.json({ hits: hits.map((h) => ({ ...h, listed: companies.some((c) => c.source === h.source && c.slug === h.slug) })) });
}

export async function DELETE(req: Request) {
  const { source, slug } = (await req.json()) as { source: Company["source"]; slug: string };
  const companies = readJson<Company[]>("companies", []).filter((c) => !(c.source === source && c.slug === slug));
  writeJson("companies", companies);
  return Response.json({ count: companies.length });
}
