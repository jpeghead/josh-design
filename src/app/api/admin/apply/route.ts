import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getResume } from "@/lib/admin/resume/store";
import { newApplication, saveApplication } from "@/lib/admin/apply/store";
import { tailoredFor } from "@/lib/admin/resume/tailor";
import { pickTemplate } from "@/lib/admin/resume/ab";
import { currentBase, saveResume } from "@/lib/admin/resume/store";
import { templateById } from "@/lib/admin/resume/templates";
import { startApplication } from "@/lib/admin/apply/agent";
import { listApplications } from "@/lib/admin/apply/store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(listApplications());
}

/** POST { jobId, resumeId, autoSubmit? } starts a run in the background and returns its id. */
export async function POST(req: Request) {
  const body = (await req.json()) as { jobId: string; resumeId: string; autoSubmit?: boolean };
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === body.jobId);
  const resume = getResume(body.resumeId);
  if (!job || !resume) return new Response("Posting or résumé not found", { status: 404 });
  const app = newApplication({ jobId: job.id, company: job.company, title: job.title, url: job.applyUrl, resumeId: resume.id, autoSubmit: !!body.autoSubmit });
  void (async () => {
    // a base résumé is tailored to the posting first; a version already made for this posting is used as is
    let use = resume;
    if (!resume.jobId) {
      try {
        use = await tailoredFor(job);
        const k = use.keywords;
        app.resumeId = use.id;
        app.resumeNote = `Tailored for ${job.company}${k ? ` · ${k.covered.length}/${k.covered.length + k.missing.length} of the posting's terms` : ""}`;
      } catch (e) {
        app.resumeNote = `Base résumé (tailoring failed: ${(e as Error).message.slice(0, 80)})`;
      }
      app.steps.push({ at: new Date().toISOString(), text: app.resumeNote ?? "" });
      saveApplication(app);
    }
    const template = pickTemplate(currentBase(job.persona));
    if (use.template !== template) {
      use.template = template;
      saveResume(use);
    }
    app.template = template;
    app.resumeNote = `${app.resumeNote ?? "Résumé"} · set in ${templateById(template).name}`;
    saveApplication(app);
    await startApplication(app, job, use);
  })();
  return Response.json({ id: app.id });
}
