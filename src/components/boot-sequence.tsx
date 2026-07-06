"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { playSound } from "@/lib/ui-sound";

const TOTAL = 1900;
const FADE = 380;

const EXTRA_LINES = [
  "  · lubricating jewel bearings ......... [ ok ]",
  "  · indexing 22 frames ................. [ ok ]",
  "  · resuming session state ............. [ ok ]",
  "  · winding mainspring ................. [ ok ]",
  "  · spotlight cache warm ............... [ ok ]",
  "  · checking for atelier updates ....... [ ok ]",
  "  · synchronizing the date wheel ....... [ ok ]",
];

function buildSequence(lastLogin: string | null) {
  const dateLine = lastLogin
    ? `last login · ${formatLastLogin(lastLogin)} · josh@archive`
    : `last login · first boot · josh@archive`;

  const extras = pickExtras();

  const base = [
    { t: 0, text: "ATELIER · CALIBRE 18.5" },
    { t: 120, text: ">> winding the archive ..." },
    { t: 240, text: "  · mounting /work        ......... [ ok ]" },
    { t: 360, text: "  · mounting /journal     ......... [ ok ]" },
    { t: 480, text: "  · mounting /about       ......... [ ok ]" },
  ];

  const tail = [
    { t: 600, text: "  · regulating balance     ......... [ ok ]" },
    { t: 720, text: "  · loading 07 frames     ......... [ ok ]" },
  ];

  // Splice 0–2 extras between mounts and calibrate
  const inserted = extras.map((text, i) => ({ t: 580 + i * 90, text }));

  return [
    ...base,
    ...inserted,
    ...tail.map((l, i) => ({ ...l, t: l.t + extras.length * 90 })),
    { t: 920 + extras.length * 90, text: "" },
    {
      t: 980 + extras.length * 90,
      text: dateLine,
    },
  ];
}

function pickExtras(): string[] {
  const n = Math.floor(Math.random() * 3); // 0, 1, or 2
  const shuffled = [...EXTRA_LINES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function formatLastLogin(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000);
    const wasYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "America/Los_Angeles",
    }).slice(0, 5);
    if (sameDay) return `today · ${time} PT`;
    if (wasYesterday) return `yesterday · ${time} PT`;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" })} · ${time} PT`;
  } catch {
    return "earlier";
  }
}

export function BootSequence() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState<number[]>([]);

  // Build a stable, randomized sequence per mount
  const sequence = useMemo(() => {
    if (typeof window === "undefined") return [];
    const lastLogin = (() => {
      try {
        const prev = localStorage.getItem("darkroom.session.last");
        // Rotate: stamp current time as the next "last login"
        localStorage.setItem("darkroom.session.last", new Date().toISOString());
        return prev;
      } catch {
        return null;
      }
    })();
    return buildSequence(lastLogin);
  }, []);

  const totalMs = sequence.length
    ? Math.max(TOTAL, sequence[sequence.length - 1].t + 600)
    : TOTAL;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("darkroom-booted") === "true") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      sessionStorage.setItem("darkroom-booted", "true");
      return;
    }

    setActive(true);
    playSound("boot");

    const timers = sequence.map((l, i) =>
      setTimeout(() => setVisible((v) => [...v, i]), l.t)
    );

    const close = setTimeout(() => {
      sessionStorage.setItem("darkroom-booted", "true");
      setActive(false);
    }, totalMs);

    const dismissAny = () => {
      sessionStorage.setItem("darkroom-booted", "true");
      setActive(false);
    };
    window.addEventListener("keydown", dismissAny, { once: true });
    window.addEventListener("pointerdown", dismissAny, { once: true });

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(close);
      window.removeEventListener("keydown", dismissAny);
      window.removeEventListener("pointerdown", dismissAny);
    };
  }, [sequence, totalMs]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE / 1000, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink"
        >
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "100vh" }}
            transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-b from-transparent via-safelight/30 to-transparent"
          />

          <div className="w-full max-w-lg px-6">
            <p className="smcaps">
              ✦ Atelier · Genève · Automatic
            </p>
            <ol className="mt-6 font-mono text-[12px] leading-[1.7] text-bone">
              {sequence.map((l, i) => (
                <li
                  key={i}
                  className={`whitespace-pre transition-opacity duration-200 ${
                    visible.includes(i) ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {l.text || " "}
                </li>
              ))}
            </ol>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              <span className="animate-[var(--animate-blink)]">▊</span>{" "}
              <span className="ml-2">Press any key to skip</span>
            </p>

            <div className="mt-8 h-px w-full overflow-hidden bg-bone-line">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: totalMs / 1000, ease: "linear" }}
                className="h-full bg-safelight"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
