"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useWindowManager } from "@/lib/window-store";

/**
 * App switcher: hold ⌘ (or Ctrl) and press Tab to step through open windows
 * in most-recently-used order. Release ⌘ to focus the selected window.
 * ⌘Shift+Tab steps backward. Esc cancels.
 */
export function AppSwitcher() {
  const { windows, focused, focus, unminimize } = useWindowManager();
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  // Snapshot of window list captured on first ⌘Tab so the order is stable
  const orderRef = useRef<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (e.key === "Tab" && isMeta) {
        e.preventDefault();
        // First press: capture MRU order (focused first, then by z-index)
        if (!open) {
          const sorted = [...windows].sort((a, b) => b.zIndex - a.zIndex);
          const order = [
            ...(focused ? [focused] : []),
            ...sorted.map((w) => w.id).filter((id) => id !== focused),
          ];
          orderRef.current = order;
          if (order.length < 2) return;
          setOpen(true);
          // Start on the second item (the "previous" window)
          setHighlightIndex(e.shiftKey ? order.length - 1 : 1);
        } else {
          setHighlightIndex((i) => {
            const n = orderRef.current.length;
            if (e.shiftKey) return (i - 1 + n) % n;
            return (i + 1) % n;
          });
        }
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Commit on release of ⌘ / Ctrl
      if ((e.key === "Meta" || e.key === "Control") && open) {
        const target = orderRef.current[highlightIndex];
        setOpen(false);
        if (target) {
          const win = windows.find((w) => w.id === target);
          if (win?.minimized) unminimize(target);
          else focus(target);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [open, highlightIndex, windows, focused, focus, unminimize]);

  // Render cards in the captured order
  const cards = orderRef.current
    .map((id) => windows.find((w) => w.id === id))
    .filter(Boolean) as typeof windows;

  return (
    <AnimatePresence>
      {open && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center"
        >
          <div className="pointer-events-auto border border-bone-line bg-ink/95 px-4 py-3 backdrop-blur-md shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
            <div className="mb-2 flex items-center justify-between gap-12 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              <span>⌘ Tab · App switcher</span>
              <span>
                {String(highlightIndex + 1).padStart(2, "0")} /{" "}
                {String(cards.length).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-stretch gap-2">
              {cards.map((w, i) => {
                const active = i === highlightIndex;
                return (
                  <motion.div
                    key={w.id}
                    animate={{ scale: active ? 1.05 : 1 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex w-32 flex-col gap-2 border p-3 ${
                      active
                        ? "border-safelight bg-safelight/10"
                        : "border-bone-line bg-ink"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="block h-1.5 w-1.5 rounded-full bg-safelight" />
                      <span className="block h-1.5 w-1.5 rounded-full bg-sodium" />
                      <span className="block h-1.5 w-1.5 rounded-full bg-emulsion" />
                    </div>
                    <p className="truncate font-mono text-[10px] uppercase tracking-widest text-bone">
                      {w.slug}
                    </p>
                    <p className="line-clamp-2 font-mono text-[9px] uppercase tracking-widest text-bone-muted">
                      {w.caption}
                    </p>
                    {w.minimized && (
                      <p className="mt-auto font-mono text-[9px] uppercase tracking-widest text-sodium">
                        Minimized
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-6 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              <span>↹ next · ⇧↹ prev</span>
              <span>release ⌘ to switch · esc to cancel</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
