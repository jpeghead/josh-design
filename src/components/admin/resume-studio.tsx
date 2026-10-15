"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Persona, Resume, ResumeData } from "@/lib/admin/resume/types";

type Tailored = { id: string; persona: Persona; createdAt: string; company: string; title: string; keywords?: { covered: string[]; missing: string[] } };
type Pick = { id: string; label: string };
const NAMES: Record<Persona, string> = { "ai-builder": "AI builder", "designer-who-builds": "Designer who builds with AI" };

/** Pages of the exact PDF, as images on the dark ground. */
function Pages({ id, hash, count, dim }: { id: string; hash: string; count: number; dim?: boolean }) {
  return (
    <div className={`space-y-5 transition-opacity duration-300 ${dim ? "opacity-0" : "opacity-100"}`}>
      {Array.from({ length: count }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={`/api/admin/resume/${id}/pages/${i + 1}?v=${hash}`} alt={`Page ${i + 1}`} width={1020} height={1320} className="w-full rounded-[3px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)]" />
      ))}
    </div>
  );
}

/** What differs between the two personas, computed from the data so it is always true. */
function diff(a: ResumeData, b: ResumeData): string[] {
  const out: string[] = [];
  if (a.headline !== b.headline) out.push("Headline");
  if (a.summary !== b.summary) out.push("Summary");
  if (a.sections.join() !== b.sections.join()) out.push(`Section order (${a.sections[1]} first vs ${b.sections[1]} first)`);
  const roles = a.experience.filter((e, i) => b.experience[i] && e.bullets.join() !== b.experience[i].bullets.join()).map((e) => e.company.split(/ [—(]/)[0]);
  if (roles.length) out.push(`Bullets chosen and ordered differently at ${roles.join(", ")}`);
  if (a.builds.map((x) => x.title).join() !== b.builds.map((x) => x.title).join()) out.push("Which projects are shown");
  if (a.skills.map((s) => s.group).join() !== b.skills.map((s) => s.group).join()) out.push("Skills group order");
  return out;
}

export function ResumeStudio(props: { bases?: Record<Persona, Resume>; initial?: Persona; tailored?: Tailored[]; single?: Resume; job?: { id: string; label: string; url: string }; versions?: { id: string; createdAt: string; instruction?: string }[]; jobs: Pick[]; hasModel: boolean }) {
  const router = useRouter();
  const [persona, setPersona] = useState<Persona>(props.initial ?? "ai-builder");
  const current: Resume = props.single ?? (props.bases as Record<Persona, Resume>)[persona];
  const other: Resume | undefined = props.single ? undefined : (props.bases as Record<Persona, Resume>)[persona === "ai-builder" ? "designer-who-builds" : "ai-builder"];
  const [meta, setMeta] = useState<Record<string, { count: number; hash: string }>>({});
  const [swapping, setSwapping] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [jobId, setJobId] = useState(props.job?.id ?? props.jobs[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [json, setJson] = useState(JSON.stringify(current.data, null, 2));

  // page counts for every document in play, so the toggle is instant after the first look
  useEffect(() => {
    const ids = [current.id, other?.id].filter((x): x is string => !!x);
    for (const id of ids) {
      if (meta[id]) continue;
      fetch(`/api/admin/resume/${id}/pages`)
        .then((r) => r.json())
        .then((j: { count?: number; hash?: string; error?: string }) => {
          if (j.error) setErr(j.error);
          else setMeta((m) => ({ ...m, [id]: { count: j.count ?? 0, hash: j.hash ?? "" } }));
        })
        .catch((e) => setErr((e as Error).message));
    }
  }, [current.id, other?.id, meta]);
  useEffect(() => setJson(JSON.stringify(current.data, null, 2)), [current]);

  const toggle = (p: Persona) => {
    if (p === persona) return;
    setSwapping(true);
    setTimeout(() => {
      setPersona(p);
      setSwapping(false);
      window.history.replaceState(null, "", `/admin/resumes?persona=${p}`);
    }, 180);
  };
  const post = async (path: string, body: unknown, go = true) => {
    setBusy(path);
    setErr(null);
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? `Request failed (${r.status})`);
      if (go && j.id && (j.jobId || props.single)) router.push(`/admin/resumes/${j.id}`);
      else router.refresh();
      setInstruction("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const saveJson = async () => {
    setBusy("json");
    setErr(null);
    try {
      const data = JSON.parse(json) as ResumeData;
      const r = await fetch(`/api/admin/resume/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      if (!r.ok) throw new Error(`Save failed (${r.status})`);
      setMeta((m) => ({ ...m, [current.id]: undefined as never }));
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const differences = useMemo(() => (other ? diff(current.data, other.data) : []), [current, other]);
  const m = meta[current.id];
  const btn = "rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {props.single ? (
              <>
                <Link href="/admin/resumes" className="text-xs text-fg-3 hover:text-fg">‹ Résumé</Link>
                <h1 className="serif mt-1 text-[1.9rem] leading-tight">{props.job ? `For ${props.job.label.split(" — ")[0]}.` : current.label}</h1>
                <p className="mt-1 text-sm text-fg-3">
                  {NAMES[current.persona]}
                  {props.job && (
                    <>
                      {" "}· tailored to <a href={props.job.url} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">{props.job.label.split(" — ")[1]}</a>
                    </>
                  )}
                  {current.instruction ? ` · ${current.instruction}` : ""}
                </p>
              </>
            ) : (
              <>
                <h1 className="serif text-[1.9rem] leading-tight">The résumé.</h1>
                <p className="mt-1 max-w-xl text-sm text-fg-3">One record, two ways to lead. This is the file that goes out: one column, real text, the site&rsquo;s type.</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!props.single && (
              <div role="tablist" aria-label="Persona" className="flex rounded-full border border-line p-0.5 text-[13px]">
                {(["ai-builder", "designer-who-builds"] as Persona[]).map((p) => (
                  <button key={p} role="tab" aria-selected={persona === p} type="button" onClick={() => toggle(p)} className={`rounded-full px-3 py-1 transition-colors ${persona === p ? "bg-fg text-bg" : "text-fg-2 hover:text-fg"}`}>
                    {NAMES[p]}
                  </button>
                ))}
              </div>
            )}
            <a href={`/api/admin/resume/${current.id}/export?format=pdf`} className="rounded-full bg-fg px-3.5 py-1.5 text-[13px] font-medium text-bg">PDF</a>
            <a href={`/api/admin/resume/${current.id}/export?format=docx`} className={btn}>DOCX</a>
            <a href={`/api/admin/resume/${current.id}/export?format=txt`} className={btn}>TXT</a>
          </div>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-[52rem]">
          {m ? <Pages id={current.id} hash={m.hash} count={m.count} dim={swapping} /> : <div className="aspect-[17/22] w-full animate-pulse rounded-[3px] bg-fill" aria-label="Rendering the PDF" />}
          {m && <p className="mt-3 text-center text-xs text-fg-3">{m.count} page{m.count === 1 ? "" : "s"} · Letter · the PDF exactly as it will be sent</p>}
        </div>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        {other && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">What changes between the two</h2>
            {differences.length ? (
              <ul className="mt-2 space-y-1 text-[13px] text-fg-2">
                {differences.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-fg-3">Nothing yet; they are the same document.</p>
            )}
            <p className="mt-2 text-xs text-fg-3">Same facts in both. The persona decides which lead, which bullets, and which projects.</p>
          </section>
        )}

        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Change it</h2>
          <p className="mt-1 text-xs text-fg-3">Plain English. Facts can be reworded, reordered, or re-selected from the record, never added.</p>
          <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Lead the Spin bullets with the Google Maps numbers and cut the summary to two sentences." rows={4} className="mt-3 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={!!busy || !instruction.trim() || !props.hasModel} onClick={() => post(`/api/admin/resume/${current.id}/edit`, { instruction })} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
              {busy?.endsWith("/edit") ? "Rewriting…" : "Apply"}
            </button>
            {!props.single && (
              <button type="button" disabled={!!busy} onClick={() => post("/api/admin/resume", { persona, rebuild: true }, false)} className={btn} title="Start this persona over from the profile; older versions stay in history">
                {busy === "/api/admin/resume" ? "Rebuilding…" : "Rebuild from the record"}
              </button>
            )}
          </div>
          {!props.hasModel && <p className="mt-2 text-xs text-amber-300/90">No model reachable: run `vercel env pull`. Exports and the toggle work without it.</p>}
        </section>

        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Tailor to a posting</h2>
          <p className="mt-1 text-xs text-fg-3">Makes a version for one job: the posting&rsquo;s words where they are true, bullets reordered, file named for the company.</p>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg">
            {props.jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.label}</option>
            ))}
          </select>
          <button type="button" disabled={!!busy || !jobId} onClick={() => post(`/api/admin/resume/${current.id}/tailor`, { jobId })} className={`mt-2 ${btn}`}>
            {busy?.endsWith("/tailor") ? "Tailoring…" : props.hasModel ? "Tailor with Claude" : "Reorder by rule"}
          </button>
          {current.keywords && (
            <p className="mt-3 text-xs text-fg-2">
              Keywords: {current.keywords.covered.length} covered, {current.keywords.missing.length} missing{current.keywords.missing.length > 0 && <span className="text-fg-3"> · {current.keywords.missing.join(", ")}</span>}
            </p>
          )}
        </section>

        {err && <p className="rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}

        {props.tailored && props.tailored.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Tailored · {props.tailored.length}</h2>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {props.tailored.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/resumes/${t.id}`} className="text-fg hover:underline">{t.company}</Link>
                  <span className="text-fg-3"> · {t.title.slice(0, 40)} · {NAMES[t.persona].split(" ")[0]}{t.keywords ? ` · ${t.keywords.covered.length}/${t.keywords.covered.length + t.keywords.missing.length} keywords` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {props.versions && props.versions.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Other versions</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {props.versions.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/resumes/${v.id}`} className="text-fg-2 hover:text-fg">
                    {new Date(v.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {v.instruction ?? "built from the record"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <button type="button" onClick={() => setShowJson((s) => !s)} className="text-xs text-fg-3 underline decoration-fg-3 underline-offset-2 hover:text-fg">
            {showJson ? "Hide" : "Edit"} the data directly
          </button>
          {showJson && (
            <div className="mt-2">
              <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={18} spellCheck={false} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-[11px] text-fg focus:border-fg focus:outline-none" />
              <button type="button" disabled={busy === "json"} onClick={saveJson} className={`mt-2 ${btn}`}>Save</button>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
