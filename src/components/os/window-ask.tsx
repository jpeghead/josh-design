"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAi } from "@/lib/ai-bus";
import type { OpenWindow } from "@/lib/window-store";

const SUGGESTIONS: Record<string, string[]> = {
  project: ["Summarize this", "Compare to Hush", "What was the role?", "Recommend a similar frame"],
  entry: ["Summarize this", "Open related project", "Read another entry"],
  work: ["Recommend a frame for a fintech client", "What's the biggest one?"],
  journal: ["Read the latest entry", "Summarize this"],
  about: ["What stands out?", "Recruiter mode"],
  contact: ["Draft a partnership inquiry", "Critic mode"],
  prefs: ["Make it lighter", "Hide the dock", "Mute"],
  readme: ["Tell me about Josh", "Help"],
  info: [],
};

/**
 * The ✨ Ask button (lives in the window title bar) + the inline AI bar
 * that opens at the bottom of the window. Suggestions adapt to which app
 * is in the window. Submitting any input fires the global Co-pilot which
 * also opens its panel to show streaming output.
 */
export function WindowAsk({ w }: { w: OpenWindow }) {
  const { submit, setPanelOpen } = useAi();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const send = (text?: string) => {
    const v = (text ?? draft).trim();
    if (!v) return;
    setPanelOpen(true);
    submit(v);
    setDraft("");
    setOpen(false);
  };

  const suggestions = SUGGESTIONS[w.app] ?? [];

  return (
    <>
      <AskTrigger open={open} onToggle={() => setOpen((o) => !o)} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-30 border-t border-bone-line bg-ink/90 backdrop-blur-2xl"
            style={{ WebkitBackdropFilter: "blur(28px) saturate(140%)" }}
          >
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Ask about {w.slug}
              </span>
            </div>
            {suggestions.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="shrink-0 border border-bone-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-bone-line/40 px-3 py-2"
            >
              <span className="font-mono text-base leading-none text-safelight">›</span>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                placeholder="Ask anything about this window…"
                className="flex-1 bg-transparent font-mono text-xs text-bone placeholder:text-bone-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="inline-flex h-6 items-center gap-1 border border-bone-line px-2 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone disabled:opacity-40"
              >
                ↩
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AskTrigger({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label="Ask Co-pilot about this window"
      title="Ask Co-pilot (⌘.)"
      className={`group inline-flex h-5 items-center gap-1 border px-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        open
          ? "border-safelight bg-safelight/15 text-bone"
          : "border-bone-line/70 text-bone-muted hover:border-bone-muted hover:text-bone"
      }`}
    >
      <span aria-hidden className="text-safelight">✦</span>
      <span className="hidden sm:inline">Ask</span>
    </button>
  );
}
