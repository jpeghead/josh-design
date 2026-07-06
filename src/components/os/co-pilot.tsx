"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAi, type AiMessage } from "@/lib/ai-bus";
import { useWindowManager } from "@/lib/window-store";

/**
 * Co-pilot panel — a slide-out from the right with a chat interface,
 * streaming responses, plan execution feedback, and context-aware
 * suggestions. Triggered from the menu bar AI indicator, ⌘. , or the
 * "Co-pilot" command in Spotlight.
 */
const SUGGESTIONS_GENERAL = [
  "Recommend a project for a fintech client",
  "Compare Spin and Hush",
  "Read me the latest entry",
  "Recruiter mode",
  "Founder mode",
];

const SUGGESTIONS_WITH_WINDOWS = [
  "Summarize this",
  "What else is similar?",
  "Hide the dock",
  "Make it lighter",
];

export function CoPilot() {
  const { panelOpen, setPanelOpen, messages, submit, state, clear } = useAi();
  const { windows } = useWindowManager();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  // ⌘. or Esc handling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPanelOpen(!panelOpen);
      } else if (e.key === "Escape" && panelOpen) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, setPanelOpen]);

  // Autoscroll on new message / streaming
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Autofocus when opened
  useEffect(() => {
    if (panelOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [panelOpen]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || state !== "idle") return;
    submit(draft);
    setDraft("");
  };

  const hasWindows = windows.filter((w) => !w.minimized).length > 0;
  const suggestions = hasWindows ? SUGGESTIONS_WITH_WINDOWS : SUGGESTIONS_GENERAL;

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-[66] bg-ink/40 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-3 right-3 top-12 z-[67] flex w-[min(420px,calc(100vw-1.5rem))] flex-col border border-bone-line bg-ink/95 backdrop-blur-2xl shadow-[0_28px_60px_-12px_rgba(0,0,0,0.7)]"
            style={{ WebkitBackdropFilter: "blur(28px) saturate(140%)" }}
          >
            <Header onClose={() => setPanelOpen(false)} onClear={clear} state={state} />

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-3"
            >
              {messages.length === 0 ? (
                <Welcome />
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <li key={m.id}>
                      <Message msg={m} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Suggestion chips */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-bone-line px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  disabled={state !== "idle"}
                  className="shrink-0 border border-bone-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={onSubmit}
              className="flex items-end gap-2 border-t border-bone-line px-3 py-3"
            >
              <span className="font-mono text-base leading-none text-safelight">›</span>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                rows={1}
                placeholder={
                  state === "idle"
                    ? "Ask me anything · try 'compare spin and hush'"
                    : state[0].toUpperCase() + state.slice(1) + "…"
                }
                disabled={state !== "idle"}
                className="max-h-32 flex-1 resize-none bg-transparent font-mono text-xs text-bone placeholder:text-bone-muted focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || state !== "idle"}
                aria-label="Send"
                className="inline-flex h-7 items-center gap-1 border border-bone-line px-2 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone disabled:opacity-40"
              >
                ↩
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Header({
  onClose,
  onClear,
  state,
}: {
  onClose: () => void;
  onClear: () => void;
  state: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-bone-line px-3 py-2">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <motion.span
          aria-hidden
          animate={{ scale: state === "idle" ? [1, 1.2, 1] : [1, 1.4, 1] }}
          transition={{
            duration: state === "idle" ? 2.4 : 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="block h-1.5 w-1.5 rounded-full"
          style={{
            background:
              state === "idle"
                ? "var(--color-bone)"
                : state === "thinking"
                ? "var(--color-sodium)"
                : state === "executing"
                ? "var(--color-emulsion)"
                : "var(--color-safelight)",
          }}
        />
        <span className="text-bone">Co-pilot</span>
        <span className="text-bone-muted">· {state}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[10px] uppercase tracking-widest text-bone-muted hover:text-bone"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="font-mono text-[10px] uppercase tracking-widest text-bone-muted hover:text-bone"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Welcome() {
  const { submit } = useAi();
  return (
    <div className="px-1 pt-2">
      <p className="font-[var(--font-display)] text-2xl italic leading-tight text-bone">
        Hey — I&rsquo;m the agent that runs this archive.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        Ask me to open frames, compare projects, change the theme, or set up
        a workspace.
      </p>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        Quick starts
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        {[
          "recommend a project for a fintech client",
          "compare spin and hush",
          "recruiter mode",
          "read me the latest entry",
          "make it lighter",
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => submit(q)}
            className="group flex items-baseline justify-between gap-3 border border-bone-line/60 bg-ink-50/40 px-2.5 py-1.5 text-left transition-colors hover:border-safelight hover:bg-ink-100"
          >
            <span className="truncate font-mono text-[11px] text-bone">
              {q}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-bone-muted group-hover:text-safelight">
              ↩
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ msg }: { msg: AiMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] border border-safelight/40 bg-safelight/10 px-3 py-2 text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">You</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-bone">
            {msg.text}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] border border-bone-line bg-ink-50/40 px-3 py-2">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          <span className="inline-block h-1 w-1 rounded-full bg-safelight" />
          Atelier
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.55] text-bone-dim">
          {msg.text}
          {msg.streaming && <span className="ml-0.5 animate-pulse text-safelight">▋</span>}
        </p>
        {msg.steps && msg.steps.length > 0 && (
          <ol className="mt-2 space-y-0.5 border-t border-bone-line/40 pt-2 font-mono text-[10px] uppercase tracking-widest">
            {msg.steps.map((s, i) => (
              <li key={i} className={s.done ? "text-emulsion" : "text-bone-muted"}>
                {s.done ? "✓" : "·"} {s.label}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
