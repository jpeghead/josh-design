import { anthropicConfigured } from "@/lib/anthropic";
import { currentBase, listResumes } from "@/lib/admin/resume/store";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { ResumeStudio } from "@/components/admin/resume-studio";

export const dynamic = "force-dynamic";

/**
 * One view, two personas, the document itself. The base résumé for each
 * persona is built from the profile the first time; tailored versions hang
 * off a posting and are listed, never chosen up front.
 */
export default async function Resumes({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const sp = await searchParams;
  const ai = currentBase("ai-builder");
  const designer = currentBase("designer-who-builds");
  const jobs = readJson<Posting[]>("jobs", []);
  const tailored = listResumes()
    .filter((r) => r.jobId)
    .map((r) => {
      const j = jobs.find((x) => x.id === r.jobId);
      return { id: r.id, persona: r.persona, createdAt: r.createdAt, company: r.company ?? j?.company ?? "", title: j?.title ?? r.label, keywords: r.keywords };
    });
  const pick = jobs
    .filter((j) => j.status === "saved" || j.score >= 66)
    .slice(0, 80)
    .map((j) => ({ id: j.id, label: `${j.company} — ${j.title}` }));
  return <ResumeStudio bases={{ "ai-builder": ai, "designer-who-builds": designer }} initial={sp.persona === "designer-who-builds" ? "designer-who-builds" : "ai-builder"} tailored={tailored} jobs={pick} hasModel={anthropicConfigured()} />;
}
