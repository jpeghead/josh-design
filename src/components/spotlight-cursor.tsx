"use client";

import { useEffect, useState } from "react";

/**
 * A live darkroom safelight that follows the cursor. Disabled on touch.
 * Coordinate readout in mono — a nod to framing a photograph.
 */
export function SpotlightCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* The safelight — a soft red halo that follows the cursor */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-[40] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.13] mix-blend-screen blur-3xl"
        style={{
          left: pos.x,
          top: pos.y,
          background:
            "radial-gradient(closest-side, var(--color-safelight), transparent 70%)",
          transition: "transform 80ms linear",
        }}
      />
      {/* Coordinate readout — bottom-left corner */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-[55] hidden font-mono text-[10px] tracking-widest text-bone-muted sm:block">
        <span className="opacity-70">x</span>
        <span className="ml-1 tabular-nums text-bone-dim">
          {String(pos.x).padStart(4, "0")}
        </span>
        <span className="ml-3 opacity-70">y</span>
        <span className="ml-1 tabular-nums text-bone-dim">
          {String(pos.y).padStart(4, "0")}
        </span>
      </div>
    </>
  );
}
