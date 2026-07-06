"use client";

import { useEffect, useState } from "react";

/**
 * Type `develop` anywhere on the page to trigger a darkroom flash — a nod
 * to Josh's combat photographer past.
 */
export function DevelopEasterEgg() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const target = "develop";
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
      if (buffer === target) {
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
        buffer = "";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!flash) return null;

  return (
    <div
      aria-hidden
      className="develop-flash pointer-events-none fixed inset-0 z-[90]"
      style={{ background: "var(--color-safelight)" }}
    />
  );
}
