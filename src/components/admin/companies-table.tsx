"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { name: string; source: string; slug: string; watch: boolean; kept: number };

/** Every board the scanner reads: what it yields, whether it is watched, and a way to drop it. */
export function CompaniesTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const key = (r: Row) => `${r.source}:${r.slug}`;
  const call = async (method: "PATCH" | "DELETE", r: Row, body: Record<string, unknown>) => {
    setBusy(key(r));
    await fetch("/api/admin/companies", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: r.source, slug: r.slug, ...body }) });
    setBusy(null);
    router.refresh();
  };
  const shown = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(b.watch) - Number(a.watch) || b.kept - a.kept || a.name.localeCompare(b.name));
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm text-fg">Boards · {rows.length}</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter" className="w-40 rounded-full border border-line bg-transparent px-3 py-1 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none" />
      </div>
      <p className="mt-1 text-xs text-fg-3">Kept is how many of a board&rsquo;s postings passed the title filter. Watch puts anything new from that company on Today whatever its score.</p>
      <ul className="mt-3 max-h-[28rem] divide-y divide-line overflow-auto border-y border-line text-[13px]">
        {shown.map((r) => (
          <li key={key(r)} className="grid grid-cols-[1fr_5rem_3rem_auto_auto] items-center gap-3 py-1.5">
            <span className="truncate text-fg">{r.name}</span>
            <span className="text-fg-3">{r.source}</span>
            <span className="tabular-nums text-fg-2">{r.kept}</span>
            <button type="button" disabled={busy === key(r)} onClick={() => call("PATCH", r, { watch: !r.watch })} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${r.watch ? "border-fg bg-fg text-bg" : "border-line text-fg-3 hover:text-fg"}`}>
              {r.watch ? "watching" : "watch"}
            </button>
            <button type="button" disabled={busy === key(r)} onClick={() => call("DELETE", r, {})} className="px-1 text-fg-3 hover:text-fg" aria-label={`Remove ${r.name}`} title="Stop scanning this board">×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
