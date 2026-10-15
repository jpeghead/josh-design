"use client";

/**
 * Portrait — Spotify Wrapped for your chat history, in the browser.
 * Drop in a ChatGPT or Claude export. Everything is parsed and analyzed in
 * this tab; nothing is uploaded. The portrait is written from the numbers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseExport, type Source } from "@/lib/olo/parse";
import { analyze, portrait, sampleConversations, type Stats } from "@/lib/olo/analyze";

type State = { kind: "idle" } | { kind: "busy" } | { kind: "error"; msg: string } | { kind: "done"; stats: Stats; source: Source | "sample"; lines: string[] };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmt = (n: number) => n.toLocaleString("en-US");

function Bars({ values, labels, caption }: { values: number[]; labels: (i: number) => string; caption: string }) {
  const max = Math.max(1, ...values);
  return (
    <figure>
      <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={caption}>
        {values.map((v, i) => (
          <div key={i} className="group relative flex-1">
            <div className="w-full rounded-sm bg-fg transition-opacity group-hover:opacity-100" style={{ height: `${Math.max(2, (v / max) * 100)}%`, opacity: 0.35 + 0.65 * (v / max) }} />
            <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[10px] text-fg-2 group-hover:block">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-fg-3">
        <span>{labels(0)}</span>
        <span>{labels(Math.floor(values.length / 2))}</span>
        <span>{labels(values.length - 1)}</span>
      </div>
      <figcaption className="mt-2 text-xs text-fg-3">{caption}</figcaption>
    </figure>
  );
}

function Months({ data }: { data: { key: string; n: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.n));
  const w = 600, h = 90;
  const pts = data.map((d, i) => [data.length === 1 ? w / 2 : (i / (data.length - 1)) * w, h - (d.n / max) * (h - 8)] as const);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const label = (k: string) => new Date(k + "-15").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label="Messages per month">
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.08" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-fg-3">
        <span>{label(data[0].key)}</span>
        <span>{label(data[data.length - 1].key)}</span>
      </div>
      <figcaption className="mt-2 text-xs text-fg-3">Your messages per month.</figcaption>
    </figure>
  );
}

export function OloApp() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const run = useCallback(async (file: File) => {
    setState({ kind: "busy" });
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const { source, conversations } = parseExport(json);
      const stats = analyze(conversations);
      setState({ kind: "done", stats, source, lines: portrait(stats) });
    } catch (e) {
      setState({ kind: "error", msg: (e as Error).message });
    }
  }, []);

  const sample = useCallback(() => {
    const stats = analyze(sampleConversations());
    setState({ kind: "done", stats, source: "sample", lines: portrait(stats) });
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sample")) sample();
  }, [sample]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) run(f);
  };

  const summary = useMemo(() => (state.kind === "done" ? state.lines.join("\n\n") : ""), [state]);

  if (state.kind !== "done") {
    return (
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`rounded-xl border border-dashed p-8 text-center transition sm:p-12 ${drag ? "border-fg bg-fill" : "border-line bg-fill/60"}`}
        >
          <p className="text-lg">Drop your <code className="font-mono text-[15px]">conversations.json</code> here</p>
          <p className="mt-2 text-sm text-fg-2">From ChatGPT (Settings → Data controls → Export) or Claude (Settings → Privacy → Export data). Unzip, then drop the file.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => input.current?.click()} disabled={state.kind === "busy"} className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition hover:opacity-85 disabled:opacity-50">
              {state.kind === "busy" ? "Reading…" : "Choose the file"}
            </button>
            <button type="button" onClick={sample} className="rounded-full border border-line px-5 py-2.5 text-[15px] font-medium transition hover:bg-fill">
              Try it with sample data
            </button>
          </div>
          <input ref={input} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} aria-label="Choose your conversations.json" />
          {state.kind === "error" && (
            <p className="mt-5 text-sm text-red-300" role="alert">
              {state.msg}
            </p>
          )}
        </div>
        <p className="mt-4 text-sm text-fg-3">
          Nothing leaves this tab. The file is read in your browser, the numbers are computed in your browser, and there is no server involved. Reload the page and it&rsquo;s gone.
        </p>
      </div>
    );
  }

  const s = state.stats;
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-fg-2">
          {state.source === "sample" ? "Sample data" : state.source === "chatgpt" ? "From your ChatGPT export" : "From your Claude export"} · computed locally
        </p>
        <div className="flex gap-4 text-sm">
          <button type="button" onClick={() => navigator.clipboard?.writeText(summary)} className="text-fg-2 underline decoration-fg-3 underline-offset-4 hover:text-fg">
            Copy the portrait
          </button>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="text-fg-2 underline decoration-fg-3 underline-offset-4 hover:text-fg">
            Start over
          </button>
        </div>
      </div>

      {/* the portrait */}
      <section className="mt-8" aria-label="Your portrait">
        {state.lines.map((l, i) => (
          <p key={i} className={`${i === 0 ? "serif text-[1.75rem] leading-tight sm:text-[2.5rem]" : "mt-4 text-lg text-fg-2"} text-pretty`}>
            {l}
          </p>
        ))}
      </section>

      {/* the numbers */}
      <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4">
        {[
          [fmt(s.conversations), "conversations"],
          [fmt(s.userMessages), "messages from you"],
          [fmt(s.userWords), "of your words"],
          [fmt(s.activeDays), "active days"],
        ].map(([n, l]) => (
          <div key={l}>
            <dt className="tighter text-[2rem] font-semibold leading-none sm:text-[2.5rem]">{n}</dt>
            <dd className="mt-1 text-sm text-fg-3">{l}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <Bars values={s.byHour} labels={hourLabel} caption="When you write, by hour of day." />
        <Bars values={s.byWeekday} labels={(i) => DAYS[i]} caption="When you write, by day of week." />
      </div>
      <div className="mt-10">
        <Months data={s.byMonth} />
      </div>

      <section className="mt-12 grid gap-10 border-t border-line pt-10 sm:grid-cols-2" aria-label="What you ask about">
        <div>
          <h3 className="text-sm text-fg-2">Words you keep coming back to</h3>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
            {s.topTerms.map((t, i) => (
              <li key={t.term} className="tight" style={{ fontSize: `${Math.max(14, 30 - i * 0.6)}px`, opacity: Math.max(0.45, 1 - i * 0.02) }}>
                {t.term}
              </li>
            ))}
          </ul>
          {s.topBigrams.length > 0 && (
            <p className="mt-5 text-sm text-fg-3">Pairs: {s.topBigrams.map((b) => b.term).join(" · ")}</p>
          )}
        </div>
        <div>
          <h3 className="text-sm text-fg-2">How you open</h3>
          <ol className="mt-4 border-t border-line">
            {s.openers.map((o) => (
              <li key={o.opener} className="flex items-baseline justify-between border-b border-line py-2 text-[15px]">
                <span>&ldquo;{o.opener}…&rdquo;</span>
                <span className="text-sm tabular-nums text-fg-3">{fmt(o.n)}</span>
              </li>
            ))}
          </ol>
          {s.longest && (
            <p className="mt-5 text-sm text-fg-2">
              Longest conversation: <span className="text-fg">{s.longest.title}</span> · {fmt(s.longest.messages)} messages, {fmt(s.longest.words)} words.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
