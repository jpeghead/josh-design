import { notFound } from "next/navigation";
import { getResume, listResumes } from "@/lib/admin/resume/store";
import { estimatePages } from "@/lib/admin/resume/render";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { ResumeEditor } from "@/components/admin/resume-editor";

export const dynamic = "force-dynamic";

export default async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getResume(id);
  if (!r) notFound();
  const versions = listResumes().filter((x) => x.id === r.id || x.basedOn === r.id || (r.basedOn && (x.id === r.basedOn || x.basedOn === r.basedOn))).map(({ data: _d, ...v }) => v);
  const jobs = readJson<Posting[]>("jobs", [])
    .filter((j) => j.status === "saved" || j.score >= 70)
    .slice(0, 60)
    .map((j) => ({ id: j.id, label: `${j.company} — ${j.title}` }));
  const job = r.jobId ? readJson<Posting[]>("jobs", []).find((j) => j.id === r.jobId) : undefined;
  return <ResumeEditor resume={r} pages={estimatePages(r.data)} versions={versions} jobs={jobs} job={job ? { id: job.id, label: `${job.company} — ${job.title}`, url: job.url } : undefined} hasKey={!!process.env.ANTHROPIC_API_KEY} />;
}
