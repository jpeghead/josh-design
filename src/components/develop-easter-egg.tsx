"use client";

import { useEffect, useState } from "react";

/**
 * Type "develop" anywhere (outside an input) and the page briefly develops —
 * a quiet nod to the darkroom origin. No dependencies, no OS.
 */
const WORD = "develop";

export function DevelopEasterEgg() {
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-WORD.length);
      if (buffer === WORD) {
        buffer = "";
        document.body.classList.add("develop-flash");
        setShowing(true);
        window.setTimeout(() => document.body.classList.remove("develop-flash"), 1200);
        window.setTimeout(() => setShowing(false), 1600);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!showing) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 border border-gold/40 bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-gold"
    >
      Developing…
    </div>
  );
}
