"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useWindowManager } from "@/lib/window-store";

/**
 * Mission Control — when active, every open window tiles into a grid and
 * can be picked to focus. Triggered by F3, the menu bar button, the
 * top-right hot corner, or a Spotlight command.
 */
export function MissionControl() {
  const { missionControl, setMissionControl, windows, focus } = useWindowManager();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && missionControl) {
        e.preventDefault();
        setMissionControl(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [missionControl, setMissionControl]);

  const tiles = useMemo(() => {
    if (typeof window === "undefined") return [];
    const visible = windows.filter((w) => !w.minimized);
    const n = visible.length;
    if (n === 0) return [];
    const cols = n <= 2 ? n : n <= 6 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const vw = window.innerWidth;
    const vh = window.innerHeight - 48;
    const PAD = 32;
    const GAP = 20;
    const tileW = (vw - PAD * 2 - GAP * (cols - 1)) / cols;
    const tileH = (vh - 80 - GAP * (rows - 1)) / rows;
    return visible.map((w, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const scale = Math.min(tileW / w.width, tileH / w.height) * 0.92;
      return {
        w,
        x: PAD + col * (tileW + GAP),
        y: 80 + row * (tileH + GAP),
        width: tileW,
        height: tileH,
        scale,
      };
    });
  }, [windows, missionControl]);

  return (
    <AnimatePresence>
      {missionControl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[85] bg-ink/85 backdrop-blur-xl"
          onClick={() => setMissionControl(false)}
        >
          <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone-muted">
              Mission Control · {windows.filter((w) => !w.minimized).length} open · esc to dismiss
            </p>
          </div>

          {tiles.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="font-[var(--font-display)] text-4xl italic text-bone">
                No windows open.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                Click an icon on the desktop, or hit ⌘K
              </p>
            </div>
          )}

          {tiles.map(({ w, x, y, width, height }) => (
            <motion.button
              key={w.id}
              type="button"
              layoutId={`mc-${w.id}`}
              onClick={(e) => {
                e.stopPropagation();
                focus(w.id);
                setMissionControl(false);
              }}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              style={{
                position: "fixed",
                left: x,
                top: y,
                width,
                height,
              }}
              className="group flex flex-col overflow-hidden border border-bone-line bg-ink text-left transition-colors hover:border-safelight"
            >
              <div className="flex items-center justify-between border-b border-bone-line px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="block h-2 w-2 rounded-full bg-safelight" />
                  <span className="block h-2 w-2 rounded-full bg-sodium" />
                  <span className="block h-2 w-2 rounded-full bg-emulsion" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  {w.slug}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-bone-muted">
                  z{w.zIndex}
                </span>
              </div>
              <div className="relative flex-1 overflow-hidden bg-ink-50">
                <Preview slug={w.slug} caption={w.caption} app={w.app} />
                <div className="absolute inset-x-0 bottom-0 border-t border-bone-line bg-ink/90 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-bone-muted group-hover:text-bone">
                  Click to focus →
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Preview({ slug, caption, app }: { slug: string; caption: string; app: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
      <p className="overline">{app}</p>
      <p className="font-[var(--font-display)] text-3xl italic text-bone sm:text-4xl">
        {slug}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {caption}
      </p>
    </div>
  );
}
