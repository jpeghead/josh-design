import { notFound } from "next/navigation";
import { anthropicConfigured } from "@/lib/anthropic";
import { getResume, listResumes } from "@/lib/admin/resume/store";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { ResumeStudio } from "@/components/admin/resume-studio";

export const dynamic = "force-dynamic";

/** A single version: a tailored résumé, or an older edit. Same studio, one document. */
export default async function One({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getResume(id);
  if (!r) notFound();
  const jobs = readJson<Posting[]>("jobs", []);
  const job = r.jobId ? jobs.find((j) => j.id === r.jobId) : undefined;
  const versions = listResumes()
    .filter((x) => x.id !== r.id && (x.basedOn === r.id || (r.basedOn && (x.id === r.basedOn || x.basedOn === r.basedOn))))
    .map((x) => ({ id: x.id, createdAt: x.createdAt, instruction: x.instruction }));
  const pick = jobs
    .filter((j) => j.status === "saved" || j.score >= 66)
    .slice(0, 80)
    .map((j) => ({ id: j.id, label: `${j.company} — ${j.title}` }));
  return <ResumeStudio single={r} job={job ? { id: job.id, label: `${job.company} — ${job.title}`, url: job.url } : undefined} versions={versions} jobs={pick} hasModel={anthropicConfigured()} />;
}
