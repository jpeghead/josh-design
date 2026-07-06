"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useWindowManager } from "@/lib/window-store";
import { useSettings } from "@/lib/settings-store";

/**
 * Restrained system telemetry — minimal panel. No sub-dials, no watch
 * decoration. A quiet typographic data card pinned to the top-right.
 */
export function SystemHud() {
  const { windows, focused } = useWindowManager();
  const { settings } = useSettings();
  const [overrideHidden, setOverrideHidden] = useState(false);
  const visible = settings.hud && !overrideHidden;

  const [fps, setFps] = useState(60);
  const [now, setNow] = useState(() => new Date());

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 220, damping: 30, mass: 0.4 });
  const ys = useSpring(y, { stiffness: 220, damping: 30, mass: 0.4 });
  const xText = useTransform(xs, (v) => String(Math.round(v)).padStart(4, "0"));
  const yText = useTransform(ys, (v) => String(Math.round(v)).padStart(4, "0"));

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  const fpsRef = useRef({ frames: 0, last: performance.now() });
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const s = fpsRef.current;
      s.frames += 1;
      if (t - s.last >= 1000) {
        setFps(Math.round((s.frames * 1000) / (t - s.last)));
        s.frames = 0;
        s.last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const toggle = () => setOverrideHidden((v) => !v);
    window.addEventListener("darkroom:toggle-hud", toggle);
    return () => window.removeEventListener("darkroom:toggle-hud", toggle);
  }, []);

  const focusedWin = windows.find((w) => w.id === focused);
  const slug = focusedWin?.slug ?? "~/";
  const openCount = windows.filter((w) => !w.minimized).length;

  if (!visible) return null;

  const pt = now.toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: "America/Los_Angeles",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed right-4 top-12 z-[8] hidden font-mono text-[10px] uppercase tracking-[0.32em] text-bone-muted md:block"
    >
      <div className="pointer-events-auto flex flex-col gap-2 border border-bone-line/50 bg-ink/55 px-4 py-3 backdrop-blur-md min-w-[200px]">
        <Row label="Time" value={`${pt.slice(0, 5)} PT`} />
        <Row label="Focused" value={slug} />
        <Row label="Windows" value={`${String(openCount).padStart(2, "0")} open`} />
        <Row label="FPS" value={`${String(fps).padStart(2, "0")}`} />
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-bone-line/40">
          <span className="text-bone-muted">Cursor</span>
          <span className="tabular-nums text-bone-dim">
            <motion.span>{xText}</motion.span>
            <span className="mx-1 opacity-50">·</span>
            <motion.span>{yText}</motion.span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-bone-muted">{label}</span>
      <span className="text-bone-dim truncate">{value}</span>
    </div>
  );
}
