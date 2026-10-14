"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Full-bleed shell for an experiment: hides the site chrome while mounted,
 * keeps one way back. The experiment owns the viewport.
 */
export function LabFrame({ children, title }: { children: React.ReactNode; title: string }) {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("lab-full");
    return () => html.classList.remove("lab-full", "canvas-mode", "chapter-dark", "game-mode", "darkroom-mode");
  }, []);
  return (
    <div className="relative min-h-dvh">
      <Link
        href="/lab"
        className="fixed left-4 top-4 z-[200] rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white/85 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
      >
        ‹ Lab · {title}
      </Link>
      {children}
    </div>
  );
}
