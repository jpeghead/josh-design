import { notFound } from "next/navigation";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getBrief } from "@/lib/admin/brief";
import { cachedFit } from "@/lib/admin/fit";
import { currentBase, listResumes } from "@/lib/admin/resume/store";
import { listApplications } from "@/lib/admin/apply/store";
import { anthropicConfigured } from "@/lib/anthropic";
import { JobView } from "@/components/admin/job-view";

export const dynamic = "force-dynamic";

/** Everything about one role in one place. */
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobs = readJson<Posting[]>("jobs", []);
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();
  const base = currentBase(job.persona);
  const tailored = listResumes().filter((r) => r.jobId === job.id).map((r) => ({ id: r.id, createdAt: r.createdAt, keywords: r.keywords }));
  const sameCompany = jobs.filter((j) => j.company === job.company && j.id !== job.id).map((j) => ({ id: j.id, title: j.title, score: j.score, location: j.location }));
  const runs = listApplications().filter((a) => a.jobId === job.id).map((a) => ({ id: a.id, status: a.status, startedAt: a.startedAt, stage: a.stage }));
  return <JobView job={job} baseId={base.id} fit={cachedFit(job) ?? null} brief={getBrief(id) ?? null} tailored={tailored} sameCompany={sameCompany} runs={runs} hasModel={anthropicConfigured()} />;
}
