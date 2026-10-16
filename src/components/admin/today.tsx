"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Fresh = { id: string; title: string; company: string; score: number; why: string; location: string; pay?: string };
type Props = {
  since: string | null;
  fresh: Fresh[];
  top: Fresh[];
  fromWatched: { id: string; title: string; company: string; score: number; location: string }[];
  due: { id: string; title: string; company: string; note: string; date: string }[];
  waiting: { id: string; title: string; company: string; headless: boolean; fix: number }[];
  queue: { queued: number; preparing: number; ready: number };
  companies: { name: string; source: string; slug: string; watch: boolean }[];
  lastScan: { at: string; added: number; errors: number } | null;
  counts: { kept: number; scored: number; saved: number };
  week: { prepared: number; submitted: number; replies: number; interviews: number };
  model: { ok: boolean; mode: string; error?: string };
};

export function Today(p: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const ran = useRef(false);

  // one scan per visit when the last one is stale, then Claude on whatever is new
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const stale = !p.lastScan || Date.now() - Date.parse(p.lastScan.at) > 12 * 3600000;
    if (!stale) return;
    setMsg("Scanning the boards…");
    fetch("/api/admin/scan", { method: "POST" })
      .then((r) => r.json())
      .then(async (j: { added: number; errors?: string[] }) => {
        setMsg(`Scanned: ${j.added} new.`);
        if (j.added > 0) {
          const s = await fetch("/api/admin/score?n=120", { method: "POST" }).then((x) => x.json()).catch(() => null);
          if (s?.scored) setMsg((m) => `${m} Claude scored ${s.scored}.`);
        }
        router.refresh();
      })
      .catch(() => setMsg("Scan failed."));
  }, [p.lastScan, router]);

  const watch = async (c: Props["companies"][number], on: boolean) => {
    await fetch("/api/admin/companies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: c.source, slug: c.slug, watch: on }) });
    router.refresh();
  };
  const [busy, setBusy] = useState<string | null>(null);
  const prepare = async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(ids.length === 1 ? ids[0] : "all");
    const r = await fetch("/api/admin/apply/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobIds: ids }) });
    setBusy(null);
    if (r.ok) router.push("/admin/queue");
    else setMsg(`Could not queue (${r.status}).`);
  };
  const hide = async (id: string) => {
    await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "hidden" }) });
    router.refresh();
  };
  const shown = p.fresh.length ? p.fresh : p.top;
  const watched = p.companies.filter((c) => c.watch);
  const matches = q.trim() ? p.companies.filter((c) => !c.watch && c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const sinceText = p.since ? new Date(p.since).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "a week ago";

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-10">
        <div>
          <h1 className="serif text-[2rem] leading-tight">Today.</h1>
          <p className="mt-1 text-sm text-fg-3">
            {p.counts.kept} roles kept · {p.counts.scored} scored by Claude · {p.counts.saved} saved
            {p.lastScan ? ` · last scan ${new Date(p.lastScan.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${p.lastScan.errors ? ` (${p.lastScan.errors} boards failed)` : ""}` : ""}
            {msg ? ` · ${msg}` : ""}
          </p>
        </div>

        {!p.model.ok && (
          <section className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm">
            <p className="text-red-200">Claude is not reachable, so scoring, tailoring, briefs, cover letters, and drafted answers are off until it is.</p>
            <p className="mt-1 text-xs text-fg-3">{p.model.mode === "federation" ? "The Vercel identity token could not be exchanged. The helper refreshes it itself while the Vercel CLI is signed in, so run `vercel login` in the project folder, then reload." : "Set the federation variables or a key in .env.local."}{p.model.error ? ` · ${p.model.error}` : ""}</p>
          </section>
        )}
        <section className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-fg-2">
          <span><span className="tabular-nums text-fg">{p.week.prepared}</span> prepared this week</span>
          <span><span className="tabular-nums text-fg">{p.week.submitted}</span> submitted</span>
          <span><span className="tabular-nums text-fg">{p.week.replies}</span> replies</span>
          <span><span className="tabular-nums text-fg">{p.week.interviews}</span> interviews set</span>
        </section>

        {(p.waiting.length > 0 || p.queue.queued + p.queue.preparing > 0) && (
          <section className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4">
            <h2 className="text-sm text-amber-200">Waiting on you</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-fg-2">
              {p.waiting.map((a) => (
                <li key={a.id}>
                  <Link href={a.headless ? "/admin/queue" : `/admin/applications/${a.id}`} className="text-fg hover:underline">{a.title} · {a.company}</Link>
                  <span className="text-fg-3"> · {a.fix ? `${a.fix} field${a.fix === 1 ? "" : "s"} to fix` : "ready to submit"}{a.headless ? " · in the queue" : " · browser open"}</span>
                </li>
              ))}
              {p.queue.queued + p.queue.preparing > 0 && <li className="text-fg-3">{p.queue.preparing} preparing, {p.queue.queued} waiting their turn.</li>}
            </ul>
          </section>
        )}

        {p.due.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Due</h2>
            <ul className="mt-2 space-y-1 text-[13px] text-fg-2">
              {p.due.map((a) => (
                <li key={a.id}>
                  <Link href="/admin/applications" className="text-fg hover:underline">{a.title} · {a.company}</Link> — {a.note} <span className="text-fg-3">({a.date})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">{p.fresh.length ? `New since ${sinceText} · ${p.fresh.length}` : "The best fits right now · 10"}</h2>
            {shown.length > 0 && (
              <button type="button" disabled={!!busy} onClick={() => prepare(shown.map((j) => j.id))} className="rounded-full bg-fg px-3.5 py-1 text-[13px] font-medium text-bg disabled:opacity-50" title="Fill all of these in the background; review them in the queue">
                {busy === "all" ? "Queuing…" : `Prepare all ${shown.length}`}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-fg-3">
            {p.fresh.length ? "Ranked by fit score, highest first. " : `Nothing new above 60 since ${sinceText}, so here is the top of the list. `}
            The score is Claude&rsquo;s read of the chance you get a first interview and would want the job, 0 to 100, from the posting against your record; the line under each is its reason.
          </p>
          {(p.fresh.length ? p.fresh : p.top).length === 0 ? (
            <p className="mt-2 text-sm text-fg-3">No postings yet. Run a scan from <Link href="/admin/jobs" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">Jobs</Link>.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {shown.map((j) => (
                <li key={j.id} className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[3rem_1fr_auto]">
                  <span className={`tabular-nums text-[15px] font-semibold ${j.score >= 70 ? "text-fg" : "text-fg-2"}`}>{j.score}</span>
                  <div className="min-w-0">
                    <Link href={`/admin/jobs/${encodeURIComponent(j.id)}`} className="text-[15px] text-fg hover:underline">{j.title}</Link>
                    <span className="text-[15px] text-fg-2"> · {j.company}</span>
                    <p className="text-xs text-fg-3">{j.location || "location not stated"}{j.pay ? ` · ${j.pay}` : ""}</p>
                    <p className="mt-1 text-[13px] leading-snug text-fg-2">{j.why}</p>
                  </div>
                  <div className="flex items-start gap-2 text-[13px]">
                    <button type="button" disabled={!!busy} onClick={() => prepare([j.id])} className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg disabled:opacity-50">{busy === j.id ? "…" : "Prepare"}</button>
                    <button type="button" onClick={() => hide(j.id)} className="rounded-full px-2 py-1 text-fg-3 hover:text-fg" aria-label="Hide">×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {watched.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">From companies you watch · {p.fromWatched.length}</h2>
            {p.fromWatched.length === 0 ? (
              <p className="mt-2 text-sm text-fg-3">Nothing new from {watched.map((c) => c.name).join(", ")} in two weeks.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-[13px]">
                {p.fromWatched.map((j) => (
                  <li key={j.id} className="flex gap-3">
                    <span className="w-6 shrink-0 tabular-nums text-fg-3">{j.score}</span>
                    <Link href={`/admin/jobs/${encodeURIComponent(j.id)}`} className="text-fg hover:underline">{j.title}</Link>
                    <span className="text-fg-3">· {j.company} · {j.location}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Companies you watch</h2>
          <p className="mt-1 text-xs text-fg-3">Anything they post shows up above, whatever the score.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {watched.map((c) => (
              <li key={`${c.source}:${c.slug}`}>
                <button type="button" onClick={() => watch(c, false)} className="rounded-full border border-line bg-fill/60 px-2.5 py-0.5 text-xs text-fg hover:border-fg" title="Stop watching">{c.name} ×</button>
              </li>
            ))}
            {watched.length === 0 && <li className="text-xs text-fg-3">None yet.</li>}
          </ul>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="add a company you scan" className="mt-3 w-full rounded-full border border-line bg-transparent px-3 py-1 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none" />
          {matches.length > 0 && (
            <ul className="mt-2 space-y-1">
              {matches.map((c) => (
                <li key={`${c.source}:${c.slug}`}>
                  <button type="button" onClick={() => { watch(c, true); setQ(""); }} className="text-[13px] text-fg-2 hover:text-fg">+ {c.name} <span className="text-fg-3">({c.source})</span></button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="text-[13px] text-fg-3">
          <p><Link href="/admin/jobs" className="text-fg-2 hover:text-fg">Jobs</Link> is the full list with keys (press ? there).</p>
          <p className="mt-1"><Link href="/admin/queue" className="text-fg-2 hover:text-fg">Queue</Link> holds what the agent prepared.</p>
          <p className="mt-1"><Link href="/admin/resumes" className="text-fg-2 hover:text-fg">Résumé</Link> is the document itself.</p>
        </section>
      </aside>
    </div>
  );
}
