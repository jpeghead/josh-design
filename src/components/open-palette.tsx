"use client";

/** A button that opens the command palette; for pages that want to offer search inline. */
export function OpenPalette({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("open-palette"))} className={className}>
      {children}
    </button>
  );
}
