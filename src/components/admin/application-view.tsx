"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Application } from "@/lib/admin/apply/types";

const ACTIVE = new Set(["starting", "filling", "submitting"]);

export function ApplicationView({ initial }: { initial: Application }) {
  const [a, setA] = useState<Application & { live?: boolean }>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const r = await fetch(`/api/admin/apply/${initial.id}`, { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as Application & { live?: boolean };
        if (!stop) setA(j);
      }
    };
    const iv = setInterval(tick, 2000);
    tick();
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [initial.id]);

  const act = async (what: "submit" | "stop") => {
    setBusy(what);
    const r = await fetch(`/api/admin/apply/${a.id}/${what}`, { method: "POST" });
    if (r.ok) setA(await r.json());
    setBusy(null);
  };

  const tone = a.status === "submitted" ? "text-emerald-300" : a.status === "failed" ? "text-red-300" : a.status === "needs-you" || a.status === "review" ? "text-amber-200" : "text-fg-2";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div>
        <Link href="/admin/applications" className="text-xs text-fg-3 hover:text-fg">‹ Applications</Link>
        <h1 className="serif mt-1 text-[1.75rem] leading-tight">
          {a.title} <span className="text-fg-2">· {a.company}</span>
        </h1>
        <p className={`mt-2 text-sm ${tone}`}>
          <span className="uppercase tracking-[0.14em]">{a.status}</span>
          {ACTIVE.has(a.status) && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-fg align-middle" />}
          {a.message && <span className="ml-3 text-fg-2">{a.message}</span>}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(a.status === "review" || a.status === "needs-you") && a.live && (
            <button type="button" disabled={!!busy} onClick={() => act("submit")} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
              {busy === "submit" ? "Submitting…" : "Submit the application"}
            </button>
          )}
          {a.live && (
            <button type="button" disabled={!!busy} onClick={() => act("stop")} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg-2 hover:text-fg disabled:opacity-50">
              Stop and close the browser
            </button>
          )}
          <a href={a.url} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg-2 hover:text-fg">
            Open the form ↗
          </a>
          {a.coverLetter && (
            <a href={`/api/admin/file?name=${encodeURIComponent(a.coverLetter.split("/").pop() ?? "")}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg-2 hover:text-fg">
              Cover letter PDF ↗
            </a>
          )}
        </div>
        {a.screenshot && (
          <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/file?name=${encodeURIComponent(a.screenshot.split("/").pop() ?? "")}&t=${a.steps.length}`} alt="The form as the agent left it" className="w-full" />
          </div>
        )}
      </div>
      <aside className="space-y-6">
        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Fields</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line text-[13px]">
            {a.fields.length === 0 && <li className="py-2 text-fg-3">Reading the form…</li>}
            {a.fields.map((f) => (
              <li key={f.key} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-fg">{f.label || f.kind}</span>
                  <span className={f.status === "filled" ? "text-emerald-300/90" : f.status === "review" ? "text-amber-200" : "text-fg-3"}>{f.status}</span>
                </div>
                {f.value && <p className="mt-0.5 line-clamp-3 text-fg-2">{f.value}</p>}
                {f.note && <p className="mt-0.5 text-xs text-fg-3">{f.note}</p>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Log</h2>
          <ol className="mt-2 space-y-1 text-xs text-fg-2">
            {a.steps.map((s, i) => (
              <li key={i}>
                <span className="tabular-nums text-fg-3">{new Date(s.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</span> {s.text}
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
