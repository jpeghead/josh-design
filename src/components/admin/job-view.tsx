"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Posting } from "@/lib/admin/types";
import type { Brief } from "@/lib/admin/brief";
import type { Fit } from "@/lib/admin/fit";
import { BriefView } from "@/components/admin/brief-view";

type Props = {
  job: Posting;
  baseId: string;
  fit: Fit | null;
  brief: Brief | null;
  tailored: { id: string; createdAt: string; keywords?: { covered: string[]; missing: string[] } }[];
  sameCompany: { id: string; title: string; score: number; location: string }[];
  runs: { id: string; status: string; startedAt: string; stage?: string }[];
  hasModel: boolean;
};

export function JobView({ job, baseId, fit: initialFit, brief, tailored, sameCompany, runs, hasModel }: Props) {
  const router = useRouter();
  const [fit, setFit] = useState<Fit | null>(initialFit);
  const [fitBusy, setFitBusy] = useState(false);
  const [notes, setNotes] = useState(job.notes ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (fit || fitBusy) return;
    setFitBusy(true);
    fetch(`/api/admin/jobs/${job.id}/fit`)
      .then((r) => r.json())
      .then((j: Fit & { error?: string }) => (j.error ? setErr(j.error) : setFit(j)))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setFitBusy(false));
  }, [fit, fitBusy, job.id]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy("patch");
    await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: job.id, ...body }) });
    setBusy(null);
    router.refresh();
  };
  const prepare = async () => {
    setBusy("prepare");
    const r = await fetch("/api/admin/apply/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobIds: [job.id] }) });
    setBusy(null);
    if (r.ok) router.push("/admin/queue");
    else setErr(`Could not queue (${r.status}).`);
  };
  const tailor = async () => {
    setBusy("tailor");
    setErr(null);
    try {
      const r = await fetch(`/api/admin/resume/${baseId}/tailor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? `Failed (${r.status})`);
      router.push(`/admin/resumes/${j.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pill = (on: boolean) => `rounded-full border px-3 py-1 text-[13px] ${on ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:text-fg"}`;
  const coveredPct = fit ? Math.round((fit.covered.length / Math.max(1, fit.covered.length + fit.missing.length)) * 100) : null;
  const posted = job.postedAt ? new Date(job.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <Link href="/admin/jobs" className="text-xs text-fg-3 hover:text-fg">‹ Jobs</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="serif text-[2rem] leading-tight">{job.title}</h1>
            <p className="mt-1 text-[15px] text-fg-2">
              {job.company} · {job.location || "location not stated"}
              {job.remote ? " · remote" : ""}
              {job.pay ? <span className="text-fg"> · {job.pay}</span> : ""}
            </p>
            <p className="mt-1 text-xs text-fg-3">
              {job.source} · {job.tier} · {posted ? `posted ${posted} · ` : ""}found {new Date(job.firstSeen).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
              <a href={job.url} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">the posting ↗</a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex overflow-hidden rounded-full border border-line" title="Teach the ranking: is this one for you?">
              <button type="button" onClick={() => patch({ verdict: job.verdict === "up" ? null : "up" })} disabled={!!busy} className={`px-3 py-1 text-[13px] ${job.verdict === "up" ? "bg-fg text-bg" : "text-fg-3 hover:text-fg"}`}>↑ want this</button>
              <button type="button" onClick={() => patch({ verdict: job.verdict === "down" ? null : "down" })} disabled={!!busy} className={`px-3 py-1 text-[13px] ${job.verdict === "down" ? "bg-fg text-bg" : "text-fg-3 hover:text-fg"}`}>↓ not this</button>
            </span>
            <button type="button" onClick={() => patch({ status: job.status === "saved" ? "new" : "saved" })} disabled={!!busy} className={pill(job.status === "saved")}>{job.status === "saved" ? "Saved" : "Save"}</button>
            <button type="button" onClick={() => patch({ status: job.status === "hidden" ? "new" : "hidden" })} disabled={!!busy} className={pill(job.status === "hidden")}>{job.status === "hidden" ? "Hidden" : "Hide"}</button>
            <button type="button" onClick={prepare} disabled={!!busy} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50" title="Fill the application in the background; review it in the queue">
              {busy === "prepare" ? "Queuing…" : "Prepare"}
            </button>
            <Link href={`/admin/apply?job=${encodeURIComponent(job.id)}`} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg" title="Open a browser window you can watch and fill it there">Apply visibly</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-[6rem_1fr]">
          <div>
            <p className={`tabular-nums text-[2.5rem] leading-none ${job.score >= 70 ? "text-fg" : "text-fg-2"}`}>{job.score}</p>
            <p className="mt-1 text-xs text-fg-3">scored by {job.scoredBy}</p>
          </div>
          <div>
            <p className="text-[15px] leading-relaxed text-fg-2">{job.scoreWhy}</p>
            <p className="mt-2 text-xs text-fg-3">
              Lead with the {job.persona === "ai-builder" ? "AI builder" : "designer who builds"} résumé · AI signal {job.ai ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Fit against the base résumé</h2>
          {fit ? (
            <div className="mt-3">
              <div className="flex items-baseline gap-3">
                <p className="tabular-nums text-[1.6rem] leading-none text-fg">{coveredPct}%</p>
                <p className="text-sm text-fg-2">
                  {fit.covered.length} of {fit.covered.length + fit.missing.length} of the posting&rsquo;s terms appear in the résumé {fit.by === "rules" ? "(terms picked by rule; no model)" : ""}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {fit.covered.map((k) => <span key={k} className="rounded-full border border-line bg-fill/60 px-2.5 py-0.5 text-xs text-fg">{k}</span>)}
                {fit.missing.map((k) => <span key={k} className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs text-fg-3">{k}</span>)}
              </div>
              <p className="mt-3 text-xs text-fg-3">Solid: in the résumé now. Dashed: in the posting, not in the résumé. Tailoring puts the true ones in and leaves the rest out.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-fg-3">{fitBusy ? "Reading the posting…" : "No fit computed."}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={tailor} disabled={!!busy} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">
              {busy === "tailor" ? "Tailoring…" : hasModel ? "Tailor the résumé to this posting" : "Reorder the résumé for this posting"}
            </button>
            {tailored.map((t) => (
              <Link key={t.id} href={`/admin/resumes/${t.id}`} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg hover:underline">
                Tailored {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{t.keywords ? ` · ${t.keywords.covered.length}/${t.keywords.covered.length + t.keywords.missing.length}` : ""}
              </Link>
            ))}
          </div>
          {err && <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}
        </section>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">The posting</h2>
          <div className="mt-3 max-w-3xl whitespace-pre-wrap text-[14.5px] leading-relaxed text-fg-2">{job.description}</div>
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Interview brief</h2>
            <Link href={`/admin/jobs/${encodeURIComponent(job.id)}/practice`} className="text-[13px] text-fg-2 underline decoration-fg-3 underline-offset-2 hover:text-fg">Practice the interview →</Link>
          </div>
          <BriefView jobId={job.id} initial={brief} />
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Notes</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (job.notes ?? "") && patch({ notes })} placeholder="who you know there, what you heard, why it matters" rows={4} className="mt-2 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none" />
          <p className="mt-1 text-xs text-fg-3">Saves when you click away.</p>
        </section>

        {runs.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Applications</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {runs.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/applications/${r.id}`} className="text-fg hover:underline">{r.status}{r.stage ? ` · ${r.stage}` : ""}</Link>
                  <span className="text-fg-3"> · {new Date(r.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sameCompany.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Also at {job.company} · {sameCompany.length}</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {sameCompany.slice(0, 12).map((s) => (
                <li key={s.id} className="flex gap-2">
                  <span className="w-6 shrink-0 tabular-nums text-fg-3">{s.score}</span>
                  <Link href={`/admin/jobs/${s.id}`} className="min-w-0 truncate text-fg-2 hover:text-fg">{s.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
