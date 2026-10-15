"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

export function Practice({ jobId, initial }: { jobId: string; initial: Turn[] }) {
  const [turns, setTurns] = useState<Turn[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  const ask = async (next: Turn[]) => {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/jobs/${jobId}/practice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turns: next }) });
    const j = await r.json();
    if (!r.ok || j.error) setErr(j.error ?? `Failed (${r.status})`);
    else setTurns([...next, { role: "assistant", content: j.text }]);
    setBusy(false);
  };
  const send = () => {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...turns, { role: "user" as const, content: t }];
    setTurns(next);
    setText("");
    void ask(next);
  };
  const reset = async () => {
    await fetch(`/api/admin/jobs/${jobId}/practice`, { method: "DELETE" });
    setTurns([]);
  };

  return (
    <div className="mt-6">
      <div className="space-y-4">
        {turns.length === 0 && !busy && (
          <button type="button" onClick={() => ask([])} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg">Start the interview</button>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-fill px-4 py-3 text-[15px] leading-relaxed text-fg" : "max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed text-fg-2"}>
            {t.content}
          </div>
        ))}
        {busy && <p className="text-sm text-fg-3">…</p>}
        {err && <p className="rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}
        <div ref={end} />
      </div>
      {turns.length > 0 && (
        <div className="sticky bottom-0 mt-6 border-t border-line bg-bg pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            placeholder="Your answer. ⌘↵ to send."
            rows={4}
            className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[15px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={send} disabled={busy || !text.trim()} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">Answer</button>
            <button type="button" onClick={reset} className="text-[13px] text-fg-3 hover:text-fg">Start over</button>
          </div>
        </div>
      )}
    </div>
  );
}
