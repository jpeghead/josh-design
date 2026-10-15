"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Resume } from "@/lib/admin/resume/types";

type R = Omit<Resume, "data">;
type J = { id: string; company: string; title: string; url: string; applyUrl: string; persona: "designer-who-builds" | "ai-builder"; source: string };

export function ApplyPicker({ job, resumes, hasKey }: { job: J; resumes: R[]; hasKey: boolean }) {
  const router = useRouter();
  const suggested = resumes.find((r) => r.jobId === job.id) ?? resumes.find((r) => r.persona === job.persona) ?? resumes[0];
  const [resumeId, setResumeId] = useState(suggested?.id ?? "");
  const [tailor, setTailor] = useState(hasKey && !resumes.some((r) => r.jobId === job.id));
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setErr(null);
    try {
      let rid = resumeId;
      if (tailor) {
        setBusy("Tailoring the résumé to this posting…");
        const t = await fetch(`/api/admin/resume/${rid}/tailor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
        const tj = await t.json();
        if (!t.ok || tj.error) throw new Error(tj.error ?? "Tailoring failed");
        rid = tj.id;
      }
      setBusy("Starting the agent…");
      const r = await fetch("/api/admin/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id, resumeId: rid, autoSubmit }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not start");
      router.push(`/admin/applications/${j.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="text-xs text-fg-3 hover:text-fg">‹ Jobs</Link>
      <h1 className="serif mt-1 text-[1.75rem] leading-tight">
        {job.title} <span className="text-fg-2">· {job.company}</span>
      </h1>
      <p className="mt-1 text-sm text-fg-3">
        {job.source} ·{" "}
        <a href={job.url} target="_blank" rel="noreferrer" className="underline decoration-fg-3 underline-offset-2 hover:text-fg">
          the posting ↗
        </a>
      </p>

      <section className="mt-8 rounded-xl border border-line bg-fill/50 p-5">
        <h2 className="text-sm text-fg">Which résumé</h2>
        {resumes.length === 0 ? (
          <p className="mt-2 text-sm text-fg-2">
            None yet. <Link href="/admin/resumes" className="underline">Build one</Link> first.
          </p>
        ) : (
          <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] text-fg">
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} {r.id === suggested?.id ? "(suggested)" : ""}
              </option>
            ))}
          </select>
        )}
        <label className="mt-4 flex items-start gap-3 text-sm text-fg-2">
          <input type="checkbox" checked={tailor} disabled={!hasKey} onChange={(e) => setTailor(e.target.checked)} className="mt-1" />
          <span>
            Tailor it to this posting first (a new version; facts unchanged).{!hasKey && <span className="block text-xs text-amber-300/90">Needs ANTHROPIC_API_KEY.</span>}
          </span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm text-fg-2">
          <input type="checkbox" checked={autoSubmit} onChange={(e) => setAutoSubmit(e.target.checked)} className="mt-1" />
          <span>
            Submit without stopping for review, if nothing needs me.
            <span className="block text-xs text-fg-3">Off by default. Submitting is the one thing that cannot be undone.</span>
          </span>
        </label>
      </section>

      <div className="mt-6 flex items-center gap-4">
        <button type="button" disabled={!!busy || !resumeId} onClick={go} className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg disabled:opacity-50">
          {busy ?? "Launch the agent"}
        </button>
        <p className="text-xs text-fg-3">A browser window opens on this Mac. You can watch, and take over at any point.</p>
      </div>
      {err && <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}

      <section className="mt-10 text-sm text-fg-3">
        <p className="text-fg-2">What the agent does</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Exports the résumé as a text-layer PDF and opens the application page.</li>
          <li>Reads every field on the form and fills the ones it knows: name, contact, links, résumé upload, work authorization, how you heard, and declines self-identification where that is offered.</li>
          <li>Drafts answers to written questions from the profile, when a model key is present. Anything the profile cannot answer is left for you.</li>
          <li>Stops. You read the form in the open browser and press Submit here, or it submits on its own if you asked for that and nothing needs you.</li>
          <li>Never touches a CAPTCHA or a sign-in: it tells you, and waits.</li>
        </ol>
      </section>
    </div>
  );
}
