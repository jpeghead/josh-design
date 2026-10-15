import { getProfile } from "@/lib/admin/resume/profile";
import { buildResume } from "@/lib/admin/resume/build";
import { listResumes, newResume, rebuildBase } from "@/lib/admin/resume/store";
import type { Persona } from "@/lib/admin/resume/types";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(listResumes().map(({ data: _d, ...r }) => r));
}

/** POST { persona, label?, rebuild? } builds a fresh résumé for a persona from the profile; rebuild replaces the persona's current base. */
export async function POST(req: Request) {
  const body = (await req.json()) as { persona: Persona; label?: string; rebuild?: boolean };
  const persona: Persona = body.persona === "ai-builder" ? "ai-builder" : "designer-who-builds";
  if (body.rebuild) return Response.json(rebuildBase(persona));
  const data = buildResume(getProfile(), persona);
  const r = newResume(persona, body.label ?? (persona === "ai-builder" ? "AI builder" : "Designer who builds"), data);
  return Response.json(r);
}
