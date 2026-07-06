"use client";

import { motion } from "motion/react";
import { useAi } from "@/lib/ai-bus";

/**
 * Breathing dot in the menu bar showing AI state.
 *   idle       — bone, slow 2s breath
 *   thinking   — sodium, fast 800ms breath, ring of 3 dots cycling
 *   executing  — emulsion, quick pulse
 *   responding — safelight, rapid blink
 *
 * Clicking opens the Co-pilot panel.
 */
export function AiIndicator() {
  const { state, togglePanel, panelOpen } = useAi();

  const color =
    state === "idle"
      ? "var(--color-bone)"
      : state === "thinking"
      ? "var(--color-sodium)"
      : state === "executing"
      ? "var(--color-emulsion)"
      : "var(--color-safelight)";

  const duration =
    state === "idle" ? 2.4 : state === "thinking" ? 0.8 : state === "executing" ? 0.6 : 0.45;

  return (
    <button
      type="button"
      onClick={togglePanel}
      aria-label={`Co-pilot · ${state}`}
      title={`Co-pilot · ${state}`}
      className={`group ml-1 inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] uppercase tracking-widest transition-colors ${
        panelOpen
          ? "border-safelight bg-safelight/15 text-bone"
          : "border-bone-line text-bone-muted hover:border-bone-muted hover:text-bone"
      }`}
    >
      <span className="relative inline-block h-2 w-2">
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
        <motion.span
          aria-hidden
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
      </span>
      <span className="hidden xl:inline">
        {state === "idle" ? "Co-pilot" : state}
      </span>
    </button>
  );
}
