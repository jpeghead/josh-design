"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings-store";

/**
 * Ambient atmosphere that sits between the wallpaper and the desktop.
 *
 *  - A slow vertical scan line that occasionally drifts down the screen,
 *    referencing a CRT / darkroom enlarger sweep
 *  - A subtle vignette that strengthens at night and fades during the day
 *  - Animated film-grain noise (re-stamped every few seconds)
 *
 * All effects are non-interactive and respect prefers-reduced-motion.
 */
export function Atmosphere() {
  const { settings } = useSettings();
  const [reduce, setReduce] = useState(false);
  const [grainSeed, setGrainSeed] = useState(0);

  const motionOff = settings.motion === "off" || reduce;
  const motionFull = settings.motion === "full" && !reduce;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (settings.motion !== "full") return;
    const id = setInterval(() => setGrainSeed((s) => s + 1), 3500);
    return () => clearInterval(id);
  }, [settings.motion]);

  // Time-of-day vignette intensity
  const [hour, setHour] = useState(12);
  useEffect(() => {
    const update = () => {
      const h = new Date().toLocaleString("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: "America/Los_Angeles",
      });
      setHour(parseInt(h));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  // 0 at noon, 1 at midnight
  const nightness = Math.abs(hour - 12) / 12;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {/* Vignette — stronger after sunset */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent ${
            55 - nightness * 15
          }%, rgba(0,0,0,${0.4 + nightness * 0.25}) 100%)`,
        }}
      />

      {/* Slow scan sweep — every 18s, only on full motion */}
      {motionFull && (
        <motion.div
          initial={{ y: "-30vh" }}
          animate={{ y: "130vh" }}
          transition={{
            duration: 18,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 4,
          }}
          className="absolute inset-x-0 h-32"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(244,165,46,0.018) 40%, rgba(244,165,46,0.04) 50%, rgba(244,165,46,0.018) 60%, transparent)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Re-stamped grain — re-renders SVG every few seconds */}
      {!motionOff && <div
        key={grainSeed}
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' seed='${grainSeed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />}
    </div>
  );
}
