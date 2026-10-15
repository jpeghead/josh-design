"use client";

import { useEffect, useRef, useState } from "react";
import { Cited } from "./cited";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGEST = [
  "What did Josh actually do at Spin?",
  "Has he led a design team?",
  "What is he building right now?",
  "What was he before he was a designer?",
  "Which of these projects shipped?",
];

/** A live chat on Claude, grounded in the site's own text. Streams. */
export function Ask() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs]);
  // A question in the URL (from the palette or the home page) is asked right away.
  const initialAsked = useRef(false);
  useEffect(() => {
    if (initialAsked.current) return;
    initialAsked.current = true;
    const first = new URLSearchParams(window.location.search).get("q");
    if (first) void send(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setErr(null);
    setQ("");
    const history = msgs;
    setMsgs((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(t || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs((m) => {
          const copy = m.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (e) {
      setErr((e as Error).message);
      setMsgs((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="rounded-xl border border-line bg-fill/60">
      <div className="max-h-[52vh] min-h-[16rem] overflow-y-auto px-5 py-5 sm:px-6" aria-live="polite">
        {msgs.length === 0 && (
          <div>
            <p className="text-sm text-fg-2">Try one:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SUGGEST.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-fill">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ol className="space-y-5">
          {msgs.map((m, i) => (
            <li key={i} className={m.role === "user" ? "text-fg" : "text-fg-2"}>
              <span className="block text-xs text-fg-3">{m.role === "user" ? "You" : "Claude"}</span>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
                {m.content ? m.role === "assistant" ? <Cited text={m.content} /> : m.content : <span className="inline-block h-4 w-2 animate-pulse rounded-sm bg-fg-3/60 align-middle" aria-label="thinking" />}
              </p>
            </li>
          ))}
        </ol>
        {err && (
          <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200" role="alert">
            {err}
          </p>
        )}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about the work…"
          aria-label="Your question"
          maxLength={600}
          disabled={busy}
          className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 py-2.5 text-[15px] placeholder:text-fg-3 focus:border-fg focus:outline-none disabled:opacity-60"
        />
        <button type="submit" disabled={busy || !q.trim()} className="rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-40">
          Ask
        </button>
      </form>
    </div>
  );
}
