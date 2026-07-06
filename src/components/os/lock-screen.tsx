"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/settings-store";
import { playSound } from "@/lib/ui-sound";

type Phase = "awake" | "screensaver" | "locked" | "unlocking";

const IDLE_MS = 60_000;
const SCREENSAVER_TO_LOCK = 6_000;

/**
 * Lock screen + screensaver — restrained, type-driven.
 * No watch faces. The elegance is in the breathing space, the typography,
 * and the slow tonal shift; nothing decorative.
 */
export function LockScreen() {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>("awake");
  const [now, setNow] = useState(() => new Date());
  const [scanProgress, setScanProgress] = useState(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screensaverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const motionMode = settings.motion;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const resetIdle = useCallback(() => {
    if (phase !== "awake") return;
    if (idleRef.current) clearTimeout(idleRef.current);
    if (motionMode === "off") return;
    idleRef.current = setTimeout(() => {
      setPhase("screensaver");
      if (screensaverRef.current) clearTimeout(screensaverRef.current);
      screensaverRef.current = setTimeout(() => {
        setPhase("locked");
        playSound("lock");
      }, SCREENSAVER_TO_LOCK);
    }, IDLE_MS);
  }, [phase, motionMode]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "pointermove", "pointerdown", "keydown", "wheel", "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, resetIdle));
    resetIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleRef.current) clearTimeout(idleRef.current);
      if (screensaverRef.current) clearTimeout(screensaverRef.current);
    };
  }, [resetIdle]);

  useEffect(() => {
    const onLock = () => {
      setPhase("locked");
      playSound("lock");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        onLock();
      }
    };
    window.addEventListener("darkroom:lock-now", onLock);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("darkroom:lock-now", onLock);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (phase !== "screensaver") return;
    const onInput = () => {
      if (screensaverRef.current) clearTimeout(screensaverRef.current);
      setPhase("awake");
    };
    window.addEventListener("pointerdown", onInput);
    window.addEventListener("keydown", onInput);
    return () => {
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, [phase]);

  const beginUnlock = useCallback(() => {
    if (phase !== "locked") return;
    setPhase("unlocking");
    setScanProgress(0);
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setScanProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else {
        playSound("unlock");
        setTimeout(() => setPhase("awake"), 250);
      }
    };
    requestAnimationFrame(tick);
  }, [phase]);

  const fmt = now.toLocaleTimeString("en-US", { hour12: false, timeZone: "America/Los_Angeles" });
  const hhmm = fmt.slice(0, 5);
  const day = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  return (
    <AnimatePresence>
      {phase === "screensaver" && (
        <motion.div
          key="ss"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-ink"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone-muted">
            {day}
          </p>
          <p
            className="mt-8 font-[var(--font-display)] tabular-nums text-bone leading-none"
            style={{ fontSize: "clamp(8rem, 22vw, 22rem)" }}
          >
            {hhmm}
          </p>
          <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.5em] text-bone-muted/70">
            · move to wake ·
          </p>
        </motion.div>
      )}

      {(phase === "locked" || phase === "unlocking") && (
        <motion.div
          key="lock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[115] flex flex-col items-center justify-center bg-ink"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone-muted">
            {day}
          </p>
          <p
            className="mt-6 font-[var(--font-display)] tabular-nums text-bone leading-none"
            style={{ fontSize: "clamp(5rem, 14vw, 12rem)" }}
          >
            {hhmm}
          </p>

          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="font-[var(--font-display)] text-2xl text-bone tracking-wide">
              Josh Whitehead
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone-muted">
              josh@archive
            </p>

            <button
              type="button"
              onClick={beginUnlock}
              disabled={phase === "unlocking"}
              aria-label="Authenticate"
              className="mt-4 relative flex h-1 w-32 items-center justify-center disabled:opacity-50"
            >
              <span className="absolute inset-0 bg-bone-line" />
              {phase === "unlocking" && (
                <span
                  className="absolute left-0 top-0 h-full bg-safelight"
                  style={{ width: `${scanProgress * 100}%` }}
                />
              )}
            </button>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
              {phase === "unlocking" ? "Unlocking…" : "Press any key to unlock"}
            </p>
          </div>

          <p className="absolute inset-x-0 bottom-8 text-center font-mono text-[9px] uppercase tracking-[0.5em] text-bone-muted/60">
            Atelier
          </p>

          <KeyToUnlock onUnlock={beginUnlock} disabled={phase === "unlocking"} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KeyToUnlock({
  onUnlock,
  disabled,
}: {
  onUnlock: () => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 0) return;
      onUnlock();
    };
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, onUnlock]);
  return null;
}
