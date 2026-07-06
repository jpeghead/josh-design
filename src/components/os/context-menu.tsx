"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

export type MenuItem =
  | { kind: "item"; label: string; shortcut?: string; onClick: () => void; disabled?: boolean }
  | { kind: "separator" }
  | { kind: "label"; label: string };

/**
 * Lightweight context menu rendered at the cursor. Auto-closes on Escape,
 * click outside, or running an item.
 */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  // Position: avoid going off-screen
  const W = 240;
  const H = items.length * 28 + 12;
  const px = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - W - 8);
  const py = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - H - 8);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "fixed", left: px, top: py, width: W, zIndex: 90 }}
        className="border border-bone-line bg-ink py-1 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
      >
        {items.map((i, idx) => {
          if (i.kind === "separator") {
            return <div key={idx} className="my-1 h-px bg-bone-line" />;
          }
          if (i.kind === "label") {
            return (
              <div
                key={idx}
                className="px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-widest text-bone-muted"
              >
                {i.label}
              </div>
            );
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={i.disabled}
              onClick={() => {
                i.onClick();
                onClose();
              }}
              className={`flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-widest transition-colors ${
                i.disabled
                  ? "cursor-not-allowed text-bone-muted/40"
                  : "text-bone-dim hover:bg-safelight hover:text-ink"
              }`}
            >
              <span className="truncate">{i.label}</span>
              {i.shortcut && <span className="shrink-0 text-bone-muted">{i.shortcut}</span>}
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
