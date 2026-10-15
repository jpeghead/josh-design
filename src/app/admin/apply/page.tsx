import { notFound } from "next/navigation";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { listResumes } from "@/lib/admin/resume/store";
import { ApplyPicker } from "@/components/admin/apply-picker";

export const dynamic = "force-dynamic";

export default async function Apply({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job: jobId } = await searchParams;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === jobId);
  if (!job) notFound();
  const resumes = listResumes().map(({ data: _d, ...r }) => r);
  return <ApplyPicker job={{ id: job.id, company: job.company, title: job.title, url: job.url, applyUrl: job.applyUrl, persona: job.persona, source: job.source }} resumes={resumes} hasKey={!!process.env.ANTHROPIC_API_KEY} />;
}
