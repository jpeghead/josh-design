import Link from "next/link";
import { notFound } from "next/navigation";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { getBrief } from "@/lib/admin/brief";
import { BriefView } from "@/components/admin/brief-view";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === id);
  if (!job) notFound();
  const brief = getBrief(id);
  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-xs text-fg-3 hover:text-fg">‹ Jobs</Link>
      <h1 className="serif mt-1 text-[1.75rem] leading-tight">
        {job.title} <span className="text-fg-2">· {job.company}</span>
      </h1>
      <p className="mt-1 text-sm text-fg-3">
        Interview brief · from the posting and your profile only ·{" "}
        <a href={job.url} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">the posting ↗</a>
      </p>
      <BriefView jobId={id} initial={brief ?? null} />
    </div>
  );
}
