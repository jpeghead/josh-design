"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Posting } from "@/lib/admin/types";

type Filters = { status: string; tier: string; min: number; q: string; fresh: boolean; ai: boolean };

export function JobsTable({ rows, counts, filters, errors, lastScanAt }: { rows: Posting[]; counts: Record<string, number>; filters: Filters; errors: string[]; lastScanAt: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const setFilter = (patch: Partial<Filters>) => {
    const f = { ...filters, ...patch };
    const p = new URLSearchParams({ status: f.status, tier: f.tier, min: String(f.min), q: f.q, fresh: f.fresh ? "1" : "0", ai: f.ai ? "1" : "0" });
    start(() => router.push(`/admin?${p}`));
  };
  const scan = async (auto = false) => {
    setScanning(true);
    setMsg(auto ? "Last scan was over twelve hours ago; scanning the boards now." : null);
    try {
      const r = await fetch("/api/admin/scan", { method: "POST" });
      const j = await r.json();
      setMsg(`Scanned: ${j.fetched} fetched, ${j.kept} kept, ${j.added} new.${j.errors?.length ? ` ${j.errors.length} boards failed.` : ""}`);
      router.refresh();
      if (auto && j.added > 0) {
        // New postings arrived on an automatic scan: let Claude rank the top of them too.
        const s = await fetch("/api/admin/score", { method: "POST" }).then((x) => x.json()).catch(() => null);
        if (s?.scored) setMsg((m) => `${m} Claude scored ${s.scored} of the new ones.`);
      }
    } catch (e) {
      setMsg(`Scan failed: ${(e as Error).message}`);
    } finally {
      setScanning(false);
    }
  };
  const update = async (id: string, status: Posting["status"]) => {
    await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    router.refresh();
  };
  const score = async () => {
    setScanning(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/score?n=120", { method: "POST" });
      const j = await r.json();
      setMsg(j.error ? j.error : `Claude scored ${j.scored} postings.`);
      router.refresh();
    } finally {
      setScanning(false);
    }
  };

  // Keep the list fresh without a scheduler: one scan per page load when the last one is stale.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const stale = !lastScanAt || Date.now() - new Date(lastScanAt).getTime() > 12 * 3600000;
    if (stale) void scan(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sel = "rounded-full border border-line bg-transparent px-3 py-1 text-[13px] text-fg-2 hover:text-fg";
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["new", "saved", "applied", "hidden", "all"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setFilter({ status: s })} className={`${sel} ${filters.status === s ? "border-fg text-fg" : ""}`}>
            {s} {s !== "all" && <span className="text-fg-3">{counts[s] ?? 0}</span>}
          </button>
        ))}
        <button type="button" onClick={() => setFilter({ ai: !filters.ai })} className={`${sel} ${filters.ai ? "border-fg text-fg" : ""}`} title="Agents, models, prompts, or evals in the title or description, three mentions or more">
          AI is the work <span className="text-fg-3">{counts.ai ?? 0}</span>
        </button>
        <button type="button" onClick={() => setFilter({ fresh: !filters.fresh })} className={`${sel} ${filters.fresh ? "border-fg text-fg" : ""}`} title="First seen by the scanner in the last seven days">
          found this week <span className="text-fg-3">{counts.fresh ?? 0}</span>
        </button>
        <span className="mx-2 h-4 w-px bg-line" />
        {(["all", "core", "stretch"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setFilter({ tier: t })} className={`${sel} ${filters.tier === t ? "border-fg text-fg" : ""}`}>
            {t}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-line" />
        <label className="text-[13px] text-fg-3">
          min score{" "}
          <input type="number" defaultValue={filters.min} min={0} max={100} onBlur={(e) => setFilter({ min: Number(e.target.value) })} className="w-14 rounded border border-line bg-transparent px-2 py-0.5 text-fg" />
        </label>
        <input
          type="search"
          defaultValue={filters.q}
          placeholder="company, title, place"
          onKeyDown={(e) => e.key === "Enter" && setFilter({ q: (e.target as HTMLInputElement).value })}
          className="ml-auto w-56 rounded-full border border-line bg-transparent px-3 py-1 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none"
        />
        <button type="button" onClick={score} disabled={scanning} className="rounded-full border border-line px-3 py-1 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">
          Score with Claude
        </button>
        <button type="button" onClick={() => scan()} disabled={scanning} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
          {scanning ? "Working…" : "Scan boards"}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-fg-2">{msg}</p>}
      {errors.length > 0 && (
        <details className="mt-3 text-xs text-fg-3">
          <summary>{errors.length} boards failed on the last scan</summary>
          <ul className="mt-1 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </details>
      )}

      <p className="mt-6 text-xs uppercase tracking-[0.14em] text-fg-3">{rows.length} postings{pending ? " · loading" : ""}</p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {rows.map((p) => (
          <li key={p.id} className="py-3">
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[3.5rem_1fr_auto] sm:items-baseline">
              <span className={`tabular-nums text-[15px] font-semibold ${p.score >= 70 ? "text-fg" : p.score >= 50 ? "text-fg-2" : "text-fg-3"}`} title={p.scoreWhy}>
                {p.score}
              </span>
              <div className="min-w-0">
                <a href={`/admin/jobs/${encodeURIComponent(p.id)}`} className="text-left text-[15px] text-fg hover:underline">
                  {p.title}
                </a>
                <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="ml-2 text-xs text-fg-3 hover:text-fg" aria-label="Show the score reason and posting">
                  {open === p.id ? "less" : "more"}
                </button>
                <span className="text-[15px] text-fg-2"> · {p.company}</span>
                <p className="text-xs text-fg-3">
                  {p.location || "location not stated"}{p.pay ? <span className="text-fg-2"> · {p.pay}</span> : ""} · {p.tier} · {p.persona === "ai-builder" ? "AI builder résumé" : "Designer-who-builds résumé"} · {p.source} · scored by {p.scoredBy}
                  {p.postedAt ? ` · posted ${new Date(p.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  {Date.now() - new Date(p.firstSeen).getTime() < 7 * 86400000 ? <span className="text-fg-2"> · found {new Date(p.firstSeen).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span> : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[13px]">
                <a href={p.url} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg">
                  Open ↗
                </a>
                {p.status !== "saved" && (
                  <button type="button" onClick={() => update(p.id, "saved")} className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg">
                    Save
                  </button>
                )}
                <a href={`/admin/jobs/${encodeURIComponent(p.id)}/brief`} className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg">
                  Brief
                </a>
                <a href={`/admin/apply?job=${encodeURIComponent(p.id)}`} className="rounded-full bg-fg px-3 py-1 font-medium text-bg">
                  Apply
                </a>
                {p.status !== "hidden" && (
                  <button type="button" onClick={() => update(p.id, "hidden")} className="rounded-full px-2 py-1 text-fg-3 hover:text-fg" aria-label="Hide">
                    ×
                  </button>
                )}
              </div>
            </div>
            {open === p.id && (
              <div className="mt-3 grid gap-4 rounded-lg border border-line bg-fill/50 p-4 text-sm sm:grid-cols-[1fr_16rem]">
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-fg-2">{p.description}</pre>
                <div className="text-xs text-fg-3">
                  <p className="text-fg-2">Why this score</p>
                  <p className="mt-1">{p.scoreWhy}</p>
                  <p className="mt-3 text-fg-2">Apply at</p>
                  <a href={p.applyUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all underline decoration-fg-3 underline-offset-2 hover:text-fg">
                    {p.applyUrl}
                  </a>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
