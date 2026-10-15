"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Application, Field } from "@/lib/admin/apply/types";

type Snap = { queued: number; preparing: number; ready: number; running: boolean };
const READY = new Set(["review", "needs-you"]);

/** One screen per application: the form as the agent left it, every field editable, Submit when it reads right. */
export function Queue({ initial, snapshot }: { initial: Application[]; snapshot: Snap }) {
  const [apps, setApps] = useState<Application[]>(initial);
  const [snap, setSnap] = useState<Snap>(snapshot);
  const [sel, setSel] = useState<string | null>(initial.find((a) => READY.has(a.status))?.id ?? initial[0]?.id ?? null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [big, setBig] = useState(false);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const [r, q] = await Promise.all([fetch("/api/admin/apply", { cache: "no-store" }), fetch("/api/admin/apply/batch", { cache: "no-store" })]);
      if (!r.ok || stop) return;
      const all = (await r.json()) as Application[];
      setApps(all.filter((a) => a.headless && ["queued", "starting", "filling", "review", "needs-you", "submitting"].includes(a.status)));
      if (q.ok) setSnap(await q.json());
    };
    const iv = setInterval(tick, 3000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, []);

  const a = useMemo(() => apps.find((x) => x.id === sel) ?? apps[0], [apps, sel]);
  useEffect(() => setEdits({}), [a?.id]);
  const ready = apps.filter((x) => READY.has(x.status));
  const pending = apps.filter((x) => !READY.has(x.status));

  const act = async (what: "submit" | "stop") => {
    if (!a) return;
    setBusy(what);
    const r = await fetch(`/api/admin/apply/${a.id}/${what}`, { method: "POST" });
    if (r.ok) {
      const j = (await r.json()) as Application;
      setApps((xs) => xs.map((x) => (x.id === j.id ? j : x)));
      if (j.status === "submitted" || j.status === "stopped") {
        const next = ready.find((x) => x.id !== a.id);
        setSel(next?.id ?? null);
      }
    }
    setBusy(null);
  };
  const save = async () => {
    if (!a) return;
    const list = Object.entries(edits).map(([key, value]) => ({ key, value }));
    if (!list.length) return;
    setBusy("save");
    setMsg(null);
    const r = await fetch(`/api/admin/apply/${a.id}/fields`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ edits: list }) });
    if (r.ok) {
      const j = (await r.json()) as Application;
      setApps((xs) => xs.map((x) => (x.id === j.id ? j : x)));
      setEdits({});
    } else setMsg(`Could not set the fields (${r.status}). The form may have closed; open it visibly instead.`);
    setBusy(null);
  };
  const openVisibly = async () => {
    if (!a) return;
    setBusy("open");
    await fetch(`/api/admin/apply/${a.id}/stop`, { method: "POST" });
    const r = await fetch("/api/admin/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: a.jobId, resumeId: a.resumeId }) });
    const j = await r.json();
    window.location.href = `/admin/applications/${j.id}`;
  };

  const tone = (s: Application["status"]) => (s === "review" || s === "needs-you" ? "text-amber-200" : s === "failed" ? "text-red-300" : "text-fg-3");
  const editable = (f: Field) => f.kind !== "file";
  const needs = a ? a.fields.filter((f) => f.status === "review").length : 0;

  return (
    <div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <div>
          <h1 className="serif text-[1.9rem] leading-tight">The queue.</h1>
          <p className="mt-1 text-sm text-fg-3">
            {snap.ready} ready · {snap.preparing} preparing · {snap.queued} waiting
          </p>
        </div>
        {ready.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Ready for you</h2>
            <ul className="mt-2 space-y-1">
              {ready.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setSel(x.id)} className={`w-full rounded-md px-2 py-1.5 text-left text-[13px] ${a?.id === x.id ? "bg-fill text-fg" : "text-fg-2 hover:text-fg"}`}>
                    <span className="block truncate">{x.title}</span>
                    <span className="block truncate text-xs text-fg-3">{x.company} · {x.fields.filter((f) => f.status === "review").length} to fix</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {pending.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Preparing</h2>
            <ul className="mt-2 space-y-1">
              {pending.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setSel(x.id)} className={`w-full rounded-md px-2 py-1.5 text-left text-[13px] ${a?.id === x.id ? "bg-fill text-fg" : "text-fg-2 hover:text-fg"}`}>
                    <span className="block truncate">{x.title}</span>
                    <span className={`block truncate text-xs ${tone(x.status)}`}>{x.company} · {x.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {apps.length === 0 && <p className="text-sm text-fg-3">Nothing queued. Tick postings on the Jobs page and press Prepare.</p>}
      </aside>

      {a ? (
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/admin/jobs/${encodeURIComponent(a.jobId)}`} className="text-xs text-fg-3 hover:text-fg">{a.company}</Link>
              <h2 className="serif text-[1.6rem] leading-tight">{a.title}</h2>
              <p className={`mt-1 text-sm ${tone(a.status)}`}>{a.message ?? a.status}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!!busy || !READY.has(a.status) || Object.keys(edits).length > 0} onClick={() => act("submit")} title={Object.keys(edits).length ? "Save your edits first" : needs ? "Fields still need you" : "Send this application"} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
                {busy === "submit" ? "Submitting…" : "Submit"}
              </button>
              <button type="button" disabled={!!busy} onClick={openVisibly} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">Open visibly</button>
              <button type="button" disabled={!!busy} onClick={() => act("stop")} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">Drop</button>
              <a href={a.url} target="_blank" rel="noreferrer" className="text-[13px] text-fg-3 hover:text-fg">posting ↗</a>
            </div>
          </div>
          {msg && <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{msg}</p>}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="min-w-0">
              <h3 className="text-xs uppercase tracking-[0.14em] text-fg-3">Fields · {a.fields.length}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {a.fields.map((f) => {
                  const v = edits[f.key] ?? f.value ?? "";
                  const dirty = f.key in edits;
                  return (
                    <li key={f.key} className="py-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-[13px] text-fg">{f.label || <span className="text-fg-3">(unlabeled)</span>}{f.required ? <span className="text-fg-3"> *</span> : ""}</p>
                        <span className={`shrink-0 text-xs ${f.status === "review" ? "text-amber-200" : f.status === "filled" ? "text-fg-3" : "text-fg-3"}`}>{dirty ? "edited" : f.status}</span>
                      </div>
                      {editable(f) ? (
                        f.options && f.options.length > 0 && f.options.length <= 40 ? (
                          <select value={v} onChange={(e) => setEdits((x) => ({ ...x, [f.key]: e.target.value }))} className="mt-1 w-full rounded border border-line bg-bg px-2 py-1 text-[13px] text-fg">
                            <option value="">—</option>
                            {f.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : f.kind === "textarea" || (v && v.length > 90) ? (
                          <textarea value={v} onChange={(e) => setEdits((x) => ({ ...x, [f.key]: e.target.value }))} rows={4} className="mt-1 w-full rounded border border-line bg-transparent px-2 py-1 text-[13px] text-fg focus:border-fg focus:outline-none" />
                        ) : (
                          <input value={v} onChange={(e) => setEdits((x) => ({ ...x, [f.key]: e.target.value }))} className="mt-1 w-full rounded border border-line bg-transparent px-2 py-1 text-[13px] text-fg focus:border-fg focus:outline-none" />
                        )
                      ) : (
                        <p className="mt-1 text-[13px] text-fg-2">{f.value || "—"}</p>
                      )}
                      {f.note && <p className="mt-1 text-xs text-fg-3">{f.note}</p>}
                    </li>
                  );
                })}
              </ul>
              {Object.keys(edits).length > 0 && (
                <div className="sticky bottom-4 mt-3 flex items-center gap-3 rounded-full border border-line bg-bg/95 px-3 py-2 backdrop-blur">
                  <button type="button" disabled={busy === "save"} onClick={save} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">{busy === "save" ? "Setting…" : `Set ${Object.keys(edits).length} on the form`}</button>
                  <button type="button" onClick={() => setEdits({})} className="text-[13px] text-fg-3 hover:text-fg">Discard</button>
                </div>
              )}
            </section>
            <section className="min-w-0">
              <h3 className="text-xs uppercase tracking-[0.14em] text-fg-3">The form as it stands</h3>
              {a.screenshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/admin/file?name=${encodeURIComponent(a.screenshot.split("/").pop() ?? "")}&t=${encodeURIComponent(a.steps[a.steps.length - 1]?.at ?? "")}`} alt="The form" onClick={() => setBig((b) => !b)} className={`mt-2 w-full cursor-zoom-in rounded-md border border-line bg-white ${big ? "max-w-none" : ""}`} />
              ) : (
                <p className="mt-2 text-sm text-fg-3">{a.status === "queued" ? "Waiting its turn." : "Working…"}</p>
              )}
              {a.coverLetter && (
                <a href={`/api/admin/file?name=${encodeURIComponent(a.coverLetter.replace(/^.*\/out\//, ""))}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] text-fg-2 underline decoration-fg-3 underline-offset-2 hover:text-fg">Cover letter PDF ↗</a>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="text-sm text-fg-3">Pick a run on the left.</div>
      )}
    </div>
  );
}
