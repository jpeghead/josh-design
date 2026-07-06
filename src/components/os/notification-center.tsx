"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useWindowManager } from "@/lib/window-store";
import { journal, projects } from "@/lib/data";

/**
 * Slide-in panel from the right edge. Real-feeling widgets — live clock,
 * "now in the studio," latest journal, weather (LA, faked-but-stable),
 * currently playing. Toggled from menu bar, bottom-right hot corner, or
 * Spotlight.
 */
export function NotificationCenter() {
  const { notificationCenter, setNotificationCenter, open } = useWindowManager();
  const [time, setTime] = useState(() => new Date());
  const [showProgress, setShowProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Animate a fake shipping progress
  useEffect(() => {
    if (!notificationCenter) return;
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + Math.random() * 6);
      setShowProgress(p);
    }, 600);
    return () => clearInterval(id);
  }, [notificationCenter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && notificationCenter) {
        setNotificationCenter(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notificationCenter, setNotificationCenter]);

  const pt = time.toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
  const date = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
  const weekOfYear = Math.ceil(
    (time.getTime() - new Date(time.getFullYear(), 0, 1).getTime()) /
      (1000 * 60 * 60 * 24 * 7)
  );

  const latestJournal = journal[0];
  const nowProject = projects.find((p) => p.slug === "boneyard");

  return (
    <AnimatePresence>
      {notificationCenter && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setNotificationCenter(false)}
            className="fixed inset-0 z-[64] bg-ink/40 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-3 right-3 top-12 z-[65] flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-3 overflow-y-auto"
          >
            <Widget title="Today">
              <div className="flex items-baseline gap-3">
                <p className="font-[var(--font-display)] text-5xl tabular-nums leading-none text-bone">
                  {pt.slice(0, 5)}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  PT
                </p>
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-bone-dim">
                {date}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Week · {String(weekOfYear).padStart(2, "0")} · Year · 2026
              </p>
            </Widget>

            <Widget title="Now in the studio">
              <p className="font-[var(--font-display)] text-xl italic leading-tight text-bone">
                Boneyard Collective
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {nowProject?.role ?? "Founder"} · 2023 —
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  <span>Shipping</span>
                  <span>{String(Math.round(showProgress)).padStart(2, "0")}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full bg-bone-line">
                  <motion.div
                    animate={{ width: `${showProgress}%` }}
                    transition={{ duration: 0.6, ease: "linear" }}
                    className="h-full bg-safelight"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setNotificationCenter(false);
                  open({ app: "project", param: "boneyard" });
                }}
                className="mt-4 inline-flex items-center gap-2 border border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-safelight hover:text-bone"
              >
                Open frame ↗
              </button>
            </Widget>

            <Widget title="Latest issue">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {latestJournal.category} · {latestJournal.date}
              </p>
              <p className="mt-2 font-[var(--font-display)] text-lg leading-tight text-bone">
                {latestJournal.title}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-bone-dim">
                {latestJournal.excerpt}
              </p>
              <button
                onClick={() => {
                  setNotificationCenter(false);
                  open({ app: "entry", param: latestJournal.slug });
                }}
                className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted transition-colors hover:text-bone"
              >
                Read · {latestJournal.readTime} →
              </button>
            </Widget>

            <Widget title="Weather · Los Angeles">
              <div className="flex items-center justify-between">
                <p className="font-[var(--font-display)] text-4xl tabular-nums leading-none text-bone">
                  72°
                </p>
                <svg viewBox="0 0 40 40" className="h-10 w-10">
                  <circle cx="20" cy="20" r="9" fill="none" stroke="var(--color-sodium)" strokeWidth="1.5" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
                    const a = (d * Math.PI) / 180;
                    return (
                      <line
                        key={d}
                        x1={20 + Math.cos(a) * 13}
                        y1={20 + Math.sin(a) * 13}
                        x2={20 + Math.cos(a) * 17}
                        y2={20 + Math.sin(a) * 17}
                        stroke="var(--color-sodium)"
                        strokeWidth="1.2"
                      />
                    );
                  })}
                </svg>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Clear · Hi 78° · Lo 61° · Marine layer at dawn
              </p>
            </Widget>

            <Widget title="Currently listening">
              <p className="font-[var(--font-display)] text-lg italic leading-tight text-bone">
                Untrue
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Burial · 2007
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex h-6 items-end gap-[2px]">
                  {[3, 7, 4, 10, 5, 9, 6, 11, 4].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 0.4 + (i % 3) * 0.2, 1] }}
                      transition={{
                        duration: 0.9 + (i % 4) * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        width: 2,
                        height: h,
                        background: "var(--color-bone)",
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  03:14 / 06:42
                </span>
              </div>
            </Widget>

            <Widget title="System">
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                <div className="border border-bone-line p-2">
                  <p>Inspiration</p>
                  <p className="mt-1 text-bone">73%</p>
                </div>
                <div className="border border-bone-line p-2">
                  <p>Signal</p>
                  <p className="mt-1 text-bone">Strong</p>
                </div>
                <div className="border border-bone-line p-2">
                  <p>Caffeine</p>
                  <p className="mt-1 text-bone">2/3 cups</p>
                </div>
                <div className="border border-bone-line p-2">
                  <p>Uptime</p>
                  <p className="mt-1 text-bone">18.4 yrs</p>
                </div>
              </div>
            </Widget>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-bone-line bg-ink/95 backdrop-blur-md">
      <div className="border-b border-bone-line px-3 py-1.5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-bone-muted">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
