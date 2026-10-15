"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Hit = { source: "greenhouse" | "ashby" | "lever"; slug: string; jobs: number; listed: boolean };

/** Type a company name or its careers URL; the panel finds its board and adds it to the scan. */
export function AddCompany() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const probe = async () => {
    setBusy(true);
    setMsg(null);
    setHits(null);
    const r = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
    const j = await r.json();
    setHits(j.hits ?? []);
    if (!j.hits?.length) setMsg("No public board answered for that name. Try the exact slug from their careers URL (the part after greenhouse.io/, ashbyhq.com/, or lever.co/).");
    setBusy(false);
  };
  const save = async (h: Hit) => {
    const name = q.replace(/^https?:\/\/[^/]+\/?/, "").trim() || h.slug;
    const r = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, source: h.source, slug: h.slug }) });
    const j = await r.json();
    setMsg(j.saved ? `Added. ${j.count} boards now; the next scan includes it.` : `Not added: ${j.reason}.`);
    router.refresh();
  };

  return (
    <section className="mt-8 rounded-xl border border-line bg-fill/50 p-4">
      <h2 className="text-sm text-fg">Add a company</h2>
      <p className="mt-1 text-xs text-fg-3">A name or a careers URL. The panel tries Greenhouse, Ashby, and Lever with a few spellings and shows what answered.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) probe();
        }}
        className="mt-3 flex gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Granola, or https://jobs.ashbyhq.com/granola" className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-3 py-1.5 text-[13px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none" />
        <button type="submit" disabled={busy || !q.trim()} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
          {busy ? "Probing…" : "Find board"}
        </button>
      </form>
      {hits && hits.length > 0 && (
        <ul className="mt-3 space-y-1 text-[13px]">
          {hits.map((h) => (
            <li key={h.source + h.slug} className="flex items-center justify-between gap-3">
              <span className="text-fg-2">
                {h.source} · <span className="font-mono text-fg">{h.slug}</span> · {h.jobs} open roles
              </span>
              {h.listed ? <span className="text-xs text-fg-3">already listed</span> : <button type="button" onClick={() => save(h)} className="rounded-full border border-line px-3 py-1 text-xs text-fg-2 hover:text-fg">Add</button>}
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="mt-2 text-xs text-fg-2">{msg}</p>}
    </section>
  );
}
