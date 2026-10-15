import { getProfile } from "@/lib/admin/resume/profile";
import { editResume } from "@/lib/admin/resume/model";
import { getResume, newResume, coverage } from "@/lib/admin/resume/store";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST { instruction } → a new version of this résumé, edited by Claude under the no-new-facts rules. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = getResume((await params).id);
  if (!r) return new Response("Not found", { status: 404 });
  const { instruction } = (await req.json()) as { instruction: string };
  if (!instruction?.trim()) return new Response("Say what to change.", { status: 400 });
  try {
    const data = await editResume(r.data, instruction.trim(), getProfile());
    const keywords = r.keywords ? coverage(data, [...r.keywords.covered, ...r.keywords.missing]) : undefined;
    const next = newResume(r.persona, r.label, data, { basedOn: r.id, instruction: instruction.trim(), jobId: r.jobId, company: r.company, keywords });
    return Response.json(next);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
