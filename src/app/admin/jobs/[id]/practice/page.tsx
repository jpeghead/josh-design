import Link from "next/link";
import { notFound } from "next/navigation";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { Practice } from "@/components/admin/practice";

export const dynamic = "force-dynamic";

type Session = { jobId: string; turns: { role: "user" | "assistant"; content: string }[] };

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = readJson<Posting[]>("jobs", []).find((j) => j.id === id);
  if (!job) notFound();
  const session = readJson<Session[]>("practice", []).find((s) => s.jobId === id);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/jobs/${encodeURIComponent(id)}`} className="text-xs text-fg-3 hover:text-fg">‹ {job.title}</Link>
      <h1 className="serif mt-1 text-[1.75rem] leading-tight">Practice: {job.company}.</h1>
      <p className="mt-1 text-sm text-fg-3">One question at a time, a short critique after each answer, claims checked against your record. Type like you would talk.</p>
      <Practice jobId={id} initial={session?.turns ?? []} />
    </div>
  );
}
