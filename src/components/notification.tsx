"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Single-slot notification toast in the upper right. Fires once per session
 * on the desktop. Slides in, sits for ~5s, then auto-dismisses.
 */
export function Notification() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("darkroom-notice") === "true";
    if (seen) return;

    const show = setTimeout(() => setOpen(true), 1500);
    const dismiss = setTimeout(() => {
      sessionStorage.setItem("darkroom-notice", "true");
      setOpen(false);
    }, 7500);

    return () => {
      clearTimeout(show);
      clearTimeout(dismiss);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, x: 10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-3 top-12 z-[68] w-[min(360px,calc(100vw-1.5rem))] border border-bone-line bg-ink/95 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-bone-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bone-muted">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-safelight" />
              Field notes
            </span>
            <button
              onClick={() => {
                sessionStorage.setItem("darkroom-notice", "true");
                setOpen(false);
              }}
              className="hover:text-bone"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          <Link
            href="/journal/developing-the-archive"
            className="group block px-3 py-3 hover:bg-ink-100"
            onClick={() => setOpen(false)}
          >
            <p className="font-[var(--font-display)] text-lg italic leading-tight text-bone group-hover:text-safelight">
              New issue · Developing the Archive
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              04 min · 2026-05-09 · Studio
            </p>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
