"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Posting } from "@/lib/admin/types";
import type { Grouped } from "@/lib/admin/dedupe";

/** Score bands, so the long list reads in three parts rather than one. */
const band = (score: number) => (score >= 70 ? "Strong fit · 70 and up" : score >= 55 ? "Worth a look · 55 to 69" : "The rest · under 55");

type Filters = { status: string; tier: string; min: number; q: string; fresh: boolean; ai: boolean; sort: string };

export function JobsTable({ rows, counts, filters, errors, lastScanAt }: { rows: Grouped[]; counts: Record<string, number>; filters: Filters; errors: string[]; lastScanAt: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const prepareOne = async (id: string) => {
    setScanning(true);
    const r = await fetch("/api/admin/apply/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobIds: [id] }) });
    setScanning(false);
    if (r.ok) router.push("/admin/queue");
    else setMsg(`Could not queue (${r.status}).`);
  };
  const prepare = async () => {
    if (!picked.size) return;
    setScanning(true);
    const r = await fetch("/api/admin/apply/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobIds: [...picked] }) });
    setScanning(false);
    if (r.ok) router.push("/admin/queue");
    else setMsg(`Could not queue (${r.status}).`);
  };

  const setFilter = (patch: Partial<Filters>) => {
    const f = { ...filters, ...patch };
    const p = new URLSearchParams({ status: f.status, tier: f.tier, min: String(f.min), q: f.q, fresh: f.fresh ? "1" : "0", ai: f.ai ? "1" : "0", sort: f.sort });
    start(() => router.push(`/admin/jobs?${p}`));
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
  const judge = async (id: string, verdict: "up" | "down" | null) => {
    await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, verdict }) });
    router.refresh();
  };
  const update = async (id: string, status: Posting["status"]) => {
    await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    router.refresh();
  };
  const score = async (relearn = false) => {
    setScanning(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/score?n=${relearn ? 300 : 120}${relearn ? "&relearn=1" : ""}`, { method: "POST" });
      const j = await r.json();
      setMsg(j.error ? j.error : `Claude scored ${j.scored} postings.`);
      router.refresh();
    } finally {
      setScanning(false);
    }
  };

  // Keyboard triage: j/k move, s save, h hide, x pick, o or Enter open, b brief. Off while typing.
  const [cursor, setCursor] = useState(-1);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const p = rows[cursor];
      switch (e.key) {
        case "j":
          setCursor((c) => Math.min(rows.length - 1, c + 1));
          break;
        case "k":
          setCursor((c) => Math.max(0, c - 1));
          break;
        case "s":
          if (p) update(p.id, p.status === "saved" ? "new" : "saved");
          break;
        case "h":
          if (p) update(p.id, "hidden");
          break;
        case "x":
          if (p) setPicked((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; });
          break;
        case "o":
        case "Enter":
          if (p) router.push(`/admin/jobs/${encodeURIComponent(p.id)}`);
          break;
        case "b":
          if (p) router.push(`/admin/jobs/${encodeURIComponent(p.id)}/brief`);
          break;
        case "u":
          if (p) judge(p.id, p.verdict === "up" ? null : "up");
          break;
        case "d":
          if (p) judge(p.id, p.verdict === "down" ? null : "down");
          break;
        case "?":
          setMsg("Keys: j/k move · s save · h hide · x pick · o open · b brief · u/d this score is right/wrong");
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cursor]);
  useEffect(() => {
    if (cursor >= 0) document.getElementById(`row-${cursor}`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // Keep the list fresh without a scheduler: one scan per page load when the last one is stale.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const stale = !lastScanAt || Date.now() - new Date(lastScanAt).getTime() > 12 * 3600000;
    if (stale) void scan(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const on = "border-fg bg-fg text-bg";
  const off = "border-line text-fg-2 hover:text-fg";
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-[13px] ${active ? on : off}`;
  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-[11px] uppercase tracking-[0.14em] text-fg-3">{label}</span>
      {children}
    </div>
  );
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-fill/30 px-4 py-3">
        <Group label="Show">
          {(["new", "saved", "applied", "hidden", "all"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setFilter({ status: s })} aria-pressed={filters.status === s} className={chip(filters.status === s)}>
              {s} {s !== "all" && <span className={filters.status === s ? "opacity-70" : "text-fg-3"}>{counts[s] ?? 0}</span>}
            </button>
          ))}
        </Group>
        <Group label="Only">
          <button type="button" onClick={() => setFilter({ ai: !filters.ai })} aria-pressed={filters.ai} className={chip(filters.ai)} title="Agents, models, prompts, or evals in the title or description, three mentions or more">
            {filters.ai ? "✓ " : ""}AI is the work <span className={filters.ai ? "opacity-70" : "text-fg-3"}>{counts.ai ?? 0}</span>
          </button>
          <button type="button" onClick={() => setFilter({ fresh: !filters.fresh })} aria-pressed={filters.fresh} className={chip(filters.fresh)} title="First seen by the scanner in the last seven days">
            {filters.fresh ? "✓ " : ""}found this week <span className={filters.fresh ? "opacity-70" : "text-fg-3"}>{counts.fresh ?? 0}</span>
          </button>
          {(["core", "stretch"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setFilter({ tier: filters.tier === t ? "all" : t })} aria-pressed={filters.tier === t} className={chip(filters.tier === t)} title={t === "core" ? "Design and design-engineering titles" : "Builder titles a step from design: forward deployed, product engineer, DevRel"}>
              {filters.tier === t ? "✓ " : ""}{t} titles
            </button>
          ))}
        </Group>
        <Group label="Sort">
          {(["score", "newest", "pay"] as const).map((o) => (
            <button key={o} type="button" onClick={() => setFilter({ sort: o })} aria-pressed={filters.sort === o} className={chip(filters.sort === o)}>
              {o === "score" ? "best fit" : o}
            </button>
          ))}
        </Group>
        <label className="flex items-center gap-2 text-[13px] text-fg-3">
          score ≥
          <input type="number" defaultValue={filters.min} min={0} max={100} onBlur={(e) => setFilter({ min: Number(e.target.value) })} className="w-14 rounded border border-line bg-transparent px-2 py-0.5 text-fg" />
        </label>
        <input
          type="search"
          defaultValue={filters.q}
          placeholder="company, title, place ⏎"
          onKeyDown={(e) => e.key === "Enter" && setFilter({ q: (e.target as HTMLInputElement).value })}
          className="w-52 rounded-full border border-line bg-transparent px-3 py-1 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={prepare} disabled={scanning || !picked.size} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50" title="Fill these applications in the background, then review them in the queue">
          Prepare {picked.size ? `${picked.size} for the queue` : "(tick roles first)"}
        </button>
        <button type="button" onClick={() => scan()} disabled={scanning} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">
          {scanning ? "Working…" : "Scan boards"}
        </button>
        <button type="button" onClick={() => score()} disabled={scanning} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">
          Score with Claude
        </button>
        <button type="button" onClick={() => score(true)} disabled={scanning} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50" title="Re-rank the top of the list with your ↑/↓ calls in Claude's brief">
          Re-rank with my calls
        </button>
        <span className="text-xs text-fg-3">Score: Claude&rsquo;s read of the chance of a first interview you&rsquo;d want, 0 to 100. ↑/↓ teach it. Press ? for keys.</span>
      </div>
      {msg && <p className="mt-3 text-sm text-fg-2">{msg}</p>}
      {errors.length > 0 && (
        <details className="mt-3 text-xs text-fg-3">
          <summary>{errors.length} boards failed on the last scan</summary>
          <ul className="mt-1 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </details>
      )}

      <p className="mt-6 text-xs uppercase tracking-[0.14em] text-fg-3">{rows.length} roles{pending ? " · loading" : ""}</p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {rows.map((p, i) => (
          <li key={p.id} id={`row-${i}`} onClick={() => setCursor(i)} className={`py-3 ${cursor === i ? "-mx-3 rounded-md bg-fill/60 px-3" : ""}`}>
            {filters.sort === "score" && (i === 0 || band(rows[i - 1].score) !== band(p.score)) && (
              <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-fg-3">{band(p.score)}</p>
            )}
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[1.25rem_3rem_1fr_auto] sm:items-baseline">
              <input type="checkbox" checked={picked.has(p.id)} onChange={(e) => setPicked((s) => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; })} aria-label={`Pick ${p.title} at ${p.company}`} className="h-3.5 w-3.5 accent-[var(--fg)]" />
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
                  {p.variants.length > 0 && (
                    <span className="text-fg-2">
                      {" "}· also{" "}
                      {p.variants.map((v, vi) => (
                        <a key={v.id} href={`/admin/jobs/${encodeURIComponent(v.id)}`} className="underline decoration-fg-3 underline-offset-2 hover:text-fg">
                          {v.location || "another listing"}{vi < p.variants.length - 1 ? ", " : ""}
                        </a>
                      ))}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[13px]">
                <span className="flex overflow-hidden rounded-full border border-line" title="Teach the ranking: is this one for you?">
                  <button type="button" onClick={() => judge(p.id, p.verdict === "up" ? null : "up")} aria-label="Yes, this is the kind of role I want" className={`px-2.5 py-1 ${p.verdict === "up" ? "bg-fg text-bg" : "text-fg-3 hover:text-fg"}`}>↑</button>
                  <button type="button" onClick={() => judge(p.id, p.verdict === "down" ? null : "down")} aria-label="No, not this kind of role" className={`px-2.5 py-1 ${p.verdict === "down" ? "bg-fg text-bg" : "text-fg-3 hover:text-fg"}`}>↓</button>
                </span>
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
                <button type="button" onClick={() => prepareOne(p.id)} disabled={scanning} className="rounded-full bg-fg px-3 py-1 font-medium text-bg disabled:opacity-50" title="Fill this application in the background; review it in the queue">
                  Prepare
                </button>
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
