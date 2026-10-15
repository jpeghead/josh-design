"use client";

import { useState } from "react";
import type { Brief } from "@/lib/admin/brief";

const HEADINGS = /^(THE ROLE IN TWO LINES|WHAT THEY ARE REALLY HIRING FOR|WHERE JOSH IS STRONG.*|WHERE JOSH IS THIN.*|LIKELY QUESTIONS.*|QUESTIONS TO ASK THEM.*|THIRTY-SECOND INTRO.*)$/;

export function BriefView({ jobId, initial }: { jobId: string; initial: Brief | null }) {
  const [brief, setBrief] = useState<Brief | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const make = async () => {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/jobs/${jobId}/brief`, { method: "POST" });
    const j = await r.json();
    if (!r.ok || j.error) setErr(j.error ?? `Failed (${r.status})`);
    else setBrief(j);
    setBusy(false);
  };
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={make} disabled={busy} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
          {busy ? "Writing…" : brief ? "Write it again" : "Write the brief"}
        </button>
        {brief && <span className="text-xs text-fg-3">written {new Date(brief.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
        {brief && (
          <button type="button" onClick={() => navigator.clipboard?.writeText(brief.text)} className="text-xs text-fg-3 underline decoration-fg-3 underline-offset-2 hover:text-fg">
            Copy
          </button>
        )}
      </div>
      {err && <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}
      {brief && (
        <article className="mt-6 space-y-6">
          {brief.text.split("\n").reduce<{ h: string; lines: string[] }[]>((acc, line) => {
            if (HEADINGS.test(line.trim())) acc.push({ h: line.trim(), lines: [] });
            else if (acc.length) acc[acc.length - 1].lines.push(line);
            else acc.push({ h: "", lines: [line] });
            return acc;
          }, []).map((sec, i) => (
            <section key={i}>
              {sec.h && <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">{sec.h}</h2>}
              <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-fg-2">{sec.lines.join("\n").trim()}</div>
            </section>
          ))}
        </article>
      )}
      {!brief && !busy && <p className="mt-4 text-sm text-fg-3">Nothing yet. The brief reads the posting and your profile; where the posting is silent it says &ldquo;verify&rdquo; instead of guessing.</p>}
    </div>
  );
}
