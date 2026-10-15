"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Resume, ResumeData } from "@/lib/admin/resume/types";

type Version = Omit<Resume, "data">;

export function ResumeEditor({ resume, pages, versions, jobs, job, hasKey }: { resume: Resume; pages: number; versions: Version[]; jobs: { id: string; label: string }[]; job?: { id: string; label: string; url: string }; hasKey: boolean }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [jobId, setJobId] = useState(job?.id ?? jobs[0]?.id ?? "");
  const [showJson, setShowJson] = useState(false);
  const [json, setJson] = useState(JSON.stringify(resume.data, null, 2));

  const post = async (path: string, body: unknown) => {
    setBusy(path);
    setErr(null);
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? `Request failed (${r.status})`);
      router.push(`/admin/resumes/${j.id}`);
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
      const r = await fetch(`/api/admin/resume/${resume.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      if (!r.ok) throw new Error(`Save failed (${r.status})`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const btn = "rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <Link href="/admin/resumes" className="text-xs text-fg-3 hover:text-fg">‹ Résumés</Link>
            <h1 className="serif mt-1 text-[1.75rem] leading-tight">{resume.label}</h1>
            <p className="text-xs text-fg-3">
              {resume.persona === "ai-builder" ? "AI builder" : "Designer who builds"} · about {pages} page{pages === 1 ? "" : "s"}
              {resume.instruction ? ` · ${resume.instruction}` : ""}
              {job && (
                <>
                  {" "}· for <a href={job.url} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">{job.label}</a>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/admin/resume/${resume.id}/export?format=pdf`} className="rounded-full bg-fg px-3 py-1.5 text-[13px] font-medium text-bg">PDF</a>
            <a href={`/api/admin/resume/${resume.id}/export?format=docx`} className={btn}>DOCX</a>
            <a href={`/api/admin/resume/${resume.id}/export?format=txt`} className={btn}>TXT</a>
          </div>
        </div>
        <iframe key={resume.id} src={`/api/admin/resume/${resume.id}/preview`} title="Résumé preview" className="mt-4 h-[78vh] w-full rounded-lg border border-line bg-white" />
      </div>

      <aside className="space-y-6">
        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Change it</h2>
          <p className="mt-1 text-xs text-fg-3">
            Plain English. Each change makes a new version; nothing is lost. Facts can only be reworded, reordered, or re-selected from the profile, never added.
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Tighten the summary to two sentences and lead the Spin bullets with the Apple work."
            rows={4}
            className="mt-3 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none"
          />
          <button type="button" disabled={!!busy || !instruction.trim() || !hasKey} onClick={() => post(`/api/admin/resume/${resume.id}/edit`, { instruction })} className="mt-2 rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
            {busy?.endsWith("/edit") ? "Rewriting…" : "Make a new version"}
          </button>
          {!hasKey && <p className="mt-2 text-xs text-amber-300/90">Needs ANTHROPIC_API_KEY in .env.local. Building, preview, and exports work without it.</p>}
        </section>

        <section className="rounded-xl border border-line bg-fill/50 p-4">
          <h2 className="text-sm text-fg">Tailor to a posting</h2>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg">
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.label}</option>
            ))}
          </select>
          <button type="button" disabled={!!busy || !jobId} onClick={() => post(`/api/admin/resume/${resume.id}/tailor`, { jobId })} className={`mt-2 ${btn}`}>
            {busy?.endsWith("/tailor") ? "Tailoring…" : hasKey ? "Tailor with Claude" : "Reorder by rule"}
          </button>
          {resume.keywords && (
            <div className="mt-3 text-xs">
              <p className="text-fg-2">Keywords: {resume.keywords.covered.length} covered, {resume.keywords.missing.length} missing</p>
              {resume.keywords.missing.length > 0 && <p className="mt-1 text-fg-3">Missing: {resume.keywords.missing.join(", ")}</p>}
            </div>
          )}
        </section>

        {err && <p className="rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}

        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Versions</h2>
          <ul className="mt-2 space-y-1 text-[13px]">
            {versions.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/resumes/${v.id}`} className={v.id === resume.id ? "text-fg" : "text-fg-2 hover:text-fg"}>
                  {new Date(v.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {v.instruction ?? "built from profile"}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <button type="button" onClick={() => setShowJson((s) => !s)} className="text-xs text-fg-3 underline decoration-fg-3 underline-offset-2 hover:text-fg">
            {showJson ? "Hide" : "Edit"} the JSON directly
          </button>
          {showJson && (
            <div className="mt-2">
              <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={18} spellCheck={false} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-[11px] text-fg focus:border-fg focus:outline-none" />
              <button type="button" disabled={busy === "json"} onClick={saveJson} className={`mt-2 ${btn}`}>Save this version</button>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
