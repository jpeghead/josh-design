"use client";

/**
 * A language model running in the visitor's browser on WebGPU. No server,
 * no key, nothing leaves the machine. Weights stream once and cache; the
 * system prompt is the site's own text, trimmed for a small context.
 */

import { useEffect, useRef, useState } from "react";
import type { MLCEngine } from "@mlc-ai/web-llm";

const MODELS = [
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 · 1B", size: "≈ 700 MB", note: "the better answers; wants a real GPU" },
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 · 0.5B", size: "≈ 350 MB", note: "half the download; gets dates wrong more often" },
];

type Msg = { role: "user" | "assistant"; content: string };

export function LocalLLM({ system }: { system: string }) {
  const [gpu, setGpu] = useState<boolean | null>(null);
  const [model, setModel] = useState(MODELS[0].id);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<string>("");
  const engine = useRef<MLCEngine | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGpu(typeof navigator !== "undefined" && !!(navigator as Navigator & { gpu?: unknown }).gpu);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgs]);

  async function load() {
    setPhase("loading");
    setProgress("Starting…");
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      engine.current = await CreateMLCEngine(model, {
        initProgressCallback: (p) => setProgress(p.text.replace(/\[.*?\]/g, "").trim()),
      });
      setPhase("ready");
      setProgress("");
    } catch (e) {
      setPhase("error");
      setProgress((e as Error).message);
    }
  }

  async function send(text: string) {
    const question = text.trim();
    const eng = engine.current;
    if (!question || !eng || busy) return;
    setQ("");
    const history = msgs.slice(-4);
    setMsgs((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setBusy(true);
    const t0 = performance.now();
    let tokens = 0;
    try {
      const stream = await eng.chat.completions.create({
        stream: true,
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: question }],
        max_tokens: 220,
        temperature: 0.1,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (!delta) continue;
        tokens++;
        setMsgs((m) => {
          const copy = m.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + delta };
          return copy;
        });
      }
      const s = (performance.now() - t0) / 1000;
      setStats(`${tokens} tokens · ${(tokens / s).toFixed(1)} tok/s · on your GPU`);
    } catch (e) {
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: `The model stopped: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (gpu === false)
    return (
      <div className="rounded-xl border border-line bg-fill/60 p-6 text-fg-2">
        This browser has no WebGPU, so the model can&rsquo;t run here. Chrome, Edge, or Safari 26 on a machine with a GPU will. The server-side version is at{" "}
        <a href="/lab/ask" className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg">
          Ask my portfolio
        </a>
        .
      </div>
    );

  return (
    <div className="rounded-xl border border-line bg-fill/60">
      {phase !== "ready" && (
        <div className="p-6">
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-3 text-sm text-fg-2">Pick a model. It downloads once and stays cached in this browser.</legend>
            {MODELS.map((m) => (
              <label key={m.id} className={`cursor-pointer rounded-lg border p-4 transition ${model === m.id ? "border-fg" : "border-line hover:bg-fill"}`}>
                <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} className="sr-only" disabled={phase === "loading"} />
                <span className="block font-medium">{m.label}</span>
                <span className="mt-1 block text-sm text-fg-3">
                  {m.size} · {m.note}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="button" onClick={load} disabled={phase === "loading"} className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition hover:opacity-85 disabled:opacity-50">
              {phase === "loading" ? "Loading…" : phase === "error" ? "Try again" : "Load the model into this tab"}
            </button>
            {progress && (
              <p className={`text-sm ${phase === "error" ? "text-red-300" : "text-fg-2"}`} role="status">
                {progress}
              </p>
            )}
          </div>
        </div>
      )}
      {phase === "ready" && (
        <>
          <div className="max-h-[48vh] min-h-[14rem] overflow-y-auto px-5 py-5 sm:px-6" aria-live="polite">
            {msgs.length === 0 && (
              <ul className="flex flex-wrap gap-2">
                {["What did Josh do at Spin?", "What is he building now?", "Summarize his career in two sentences."].map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-fill">
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ol className="space-y-5">
              {msgs.map((m, i) => (
                <li key={i} className={m.role === "user" ? "text-fg" : "text-fg-2"}>
                  <span className="block text-xs text-fg-3">{m.role === "user" ? "You" : MODELS.find((x) => x.id === model)?.label}</span>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
                    {m.content || <span className="inline-block h-4 w-2 animate-pulse rounded-sm bg-fg-3/60 align-middle" aria-label="thinking" />}
                  </p>
                </li>
              ))}
            </ol>
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(q);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the model on your machine…" aria-label="Your question" maxLength={400} disabled={busy} className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 py-2.5 text-[15px] placeholder:text-fg-3 focus:border-fg focus:outline-none disabled:opacity-60" />
            <button type="submit" disabled={busy || !q.trim()} className="rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-85 disabled:opacity-40">
              Ask
            </button>
          </form>
          {stats && <p className="border-t border-line px-5 py-2 text-xs text-fg-3">{stats}</p>}
        </>
      )}
    </div>
  );
}
