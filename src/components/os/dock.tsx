"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useWindowManager, type AppKey, type OpenWindow } from "@/lib/window-store";
import { useSettings } from "@/lib/settings-store";

/**
 * Real dock. Pinned apps + currently open / minimized windows.
 * - Click a pin to open or focus its window.
 * - Click a focused window's dock icon to minimize it back into the dock.
 * - Click a minimized window to bring it back.
 * - Hover any icon → it (and its neighbors) magnify, classic Mac dock.
 */
const PINS: { app: AppKey; label: string }[] = [
  { app: "work", label: "Work" },
  { app: "journal", label: "Journal" },
  { app: "about", label: "About" },
  { app: "contact", label: "Contact" },
];

export function Dock() {
  const { windows, focused, open, focus, minimize, unminimize } =
    useWindowManager();
  const { settings } = useSettings();
  const dockPos = settings.dock.position;
  const dockSize = settings.dock.size;
  const magOn = settings.dock.magnification;
  const [autoShow, setAutoShow] = useState(false);

  // Track cursor X for magnification effect
  const mouseX = useMotionValue<number | null>(null);
  const mouseY = useMotionValue<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reset = () => mouseX.set(null);
    window.addEventListener("pointerleave", reset);
    return () => window.removeEventListener("pointerleave", reset);
  }, [mouseX]);

  // Hidden dock — show on cursor near the bottom edge
  useEffect(() => {
    if (dockPos !== "hidden") return;
    const onMove = (e: PointerEvent) => {
      const near = e.clientY > window.innerHeight - 32;
      setAutoShow(near);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [dockPos]);

  if (dockPos === "hidden" && !autoShow) return null;

  const isVertical = dockPos === "left" || dockPos === "right";

  const openByApp = new Map(windows.map((w) => [`${w.app}:${w.param ?? ""}`, w]));

  const fireDevelop = () => {
    "develop".split("").forEach((k, i) => {
      setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
      }, i * 25);
    });
  };

  const handlePinClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    app: AppKey
  ) => {
    const w = openByApp.get(`${app}:`);
    const r = e.currentTarget.getBoundingClientRect();
    const origin = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    if (w) {
      // macOS dock behavior: clicking a focused-and-visible app minimizes it
      if (w.id === focused && !w.minimized) {
        minimize(w.id);
      } else if (w.minimized) {
        unminimize(w.id);
      } else {
        focus(w.id);
      }
    } else {
      open({ app, origin });
    }
  };

  const handleWinClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    w: OpenWindow
  ) => {
    void e;
    if (w.id === focused && !w.minimized) {
      minimize(w.id);
    } else if (w.minimized) {
      unminimize(w.id);
    } else {
      focus(w.id);
    }
  };

  // Layout classes based on dock position
  const wrapperClass =
    dockPos === "bottom" || (dockPos === "hidden" && autoShow)
      ? "fixed inset-x-0 bottom-3 z-[55] flex justify-center px-3"
      : dockPos === "left"
      ? "fixed inset-y-0 left-3 z-[55] flex items-center"
      : "fixed inset-y-0 right-3 z-[55] flex items-center";

  const innerClass = isVertical
    ? "flex flex-col items-center gap-1 border border-bone-line bg-ink/65 px-2 py-3 backdrop-blur-2xl shadow-[0_28px_60px_-12px_rgba(0,0,0,0.7)]"
    : "flex items-end gap-1 border border-bone-line bg-ink/65 px-3 py-2 backdrop-blur-2xl shadow-[0_28px_60px_-12px_rgba(0,0,0,0.7)]";

  return (
    <motion.aside
      initial={isVertical ? { x: dockPos === "left" ? -30 : 30, opacity: 0 } : { y: 30, opacity: 0 }}
      animate={isVertical ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={wrapperClass}
    >
      <div
        ref={dockRef}
        onPointerMove={(e) => {
          mouseX.set(e.clientX);
          mouseY.set(e.clientY);
        }}
        onPointerLeave={() => {
          mouseX.set(null);
          mouseY.set(null);
        }}
        className={innerClass}
        style={{ WebkitBackdropFilter: "blur(28px) saturate(150%)" }}
      >
        {/* Pinned apps */}
        {PINS.map((pin) => {
          const w = openByApp.get(`${pin.app}:`);
          const isOpen = !!w;
          const isFocused = !!w && w.id === focused && !w.minimized;
          return (
            <DockButton
              key={pin.app}
              mouseX={mouseX}
              mouseY={mouseY}
              vertical={isVertical}
              baseSize={dockSize}
              magnify={magOn}
              label={pin.label}
              isOpen={isOpen}
              isFocused={isFocused}
              onClick={(e) => handlePinClick(e, pin.app)}
            >
              <PinGlyph app={pin.app} />
            </DockButton>
          );
        })}

        <div className={isVertical ? "my-1 h-px w-10 self-center bg-bone-line" : "mx-1 h-10 w-px self-center bg-bone-line"} />

        <AnimatePresence>
          {windows
            .filter(
              (w) => !PINS.some((p) => p.app === w.app && !w.param)
            )
            .map((w) => {
              const isFocused = w.id === focused && !w.minimized;
              return (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ scale: 0.4, opacity: 0, y: 18 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.4, opacity: 0, y: 18 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DockButton
                    mouseX={mouseX}
                    mouseY={mouseY}
                    vertical={isVertical}
                    baseSize={dockSize}
                    magnify={magOn}
                    label={w.slug.replace(/^~\//, "")}
                    isOpen
                    isFocused={isFocused}
                    onClick={(e) => handleWinClick(e, w)}
                  >
                    <WindowGlyph app={w.app} char={(w.param ?? w.app)[0]} />
                  </DockButton>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {windows.filter(
          (w) => !PINS.some((p) => p.app === w.app && !w.param)
        ).length > 0 && (
          <div className={isVertical ? "my-1 h-px w-10 self-center bg-bone-line" : "mx-1 h-10 w-px self-center bg-bone-line"} />
        )}

        {/* Develop easter egg */}
        <DockButton
          mouseX={mouseX}
          mouseY={mouseY}
          vertical={isVertical}
          baseSize={dockSize}
          magnify={magOn}
          label="Develop"
          isOpen={false}
          isFocused={false}
          onClick={fireDevelop}
        >
          <span className="block h-3 w-3 rounded-full border border-safelight" />
        </DockButton>
      </div>
    </motion.aside>
  );
}

const DOCK_RANGE = 110; // px from cursor where magnification applies

function DockButton({
  mouseX,
  mouseY,
  vertical,
  baseSize,
  magnify,
  label,
  isOpen,
  isFocused,
  onClick,
  children,
}: {
  mouseX: ReturnType<typeof useMotionValue<number | null>>;
  mouseY: ReturnType<typeof useMotionValue<number | null>>;
  vertical: boolean;
  baseSize: number;
  magnify: boolean;
  label: string;
  isOpen: boolean;
  isFocused: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const peak = baseSize + 20;

  const axis = vertical ? mouseY : mouseX;

  const distance = useTransform(axis, (v) => {
    if (v === null || !ref.current) return Infinity;
    const r = ref.current.getBoundingClientRect();
    const center = vertical ? r.y + r.height / 2 : r.x + r.width / 2;
    return Math.abs(v - center);
  });
  const sizeRaw = useTransform(distance, (d) => {
    if (!magnify) return baseSize;
    if (!isFinite(d)) return baseSize;
    if (d > DOCK_RANGE) return baseSize;
    const t = 1 - d / DOCK_RANGE;
    return baseSize + (peak - baseSize) * t;
  });
  const size = useSpring(sizeRaw, { stiffness: 400, damping: 28, mass: 0.4 });

  return (
    <div className="group relative flex flex-col items-center">
      <motion.span
        className="pointer-events-none absolute -top-8 origin-bottom rounded-sm border border-bone-line bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-bone opacity-0 transition-opacity group-hover:opacity-100"
      >
        {label}
      </motion.span>
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        style={{ width: size, height: size }}
        className={`flex items-center justify-center border transition-colors ${
          isFocused
            ? "border-safelight bg-safelight/15"
            : "border-bone-line bg-ink-50 hover:border-bone-muted"
        }`}
      >
        {children}
      </motion.button>
      <span
        className={`mt-1 h-[3px] w-[3px] rounded-full transition-colors ${
          isOpen ? "bg-bone" : "bg-transparent"
        }`}
      />
    </div>
  );
}

function PinGlyph({ app }: { app: AppKey }) {
  const c =
    app === "work"
      ? "#e63946"
      : app === "journal"
      ? "#f4a52e"
      : app === "about"
      ? "#9ab1d4"
      : "#cfe0c3";
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5">
      {app === "work" && (
        <g fill="none" stroke={c} strokeWidth="1.2">
          <rect x="4" y="6" width="12" height="9" />
          <line x1="4" y1="8" x2="16" y2="8" />
        </g>
      )}
      {app === "journal" && (
        <g fill="none" stroke={c} strokeWidth="1.2">
          <rect x="5" y="3" width="10" height="14" />
          <line x1="7" y1="7" x2="13" y2="7" />
          <line x1="7" y1="10" x2="13" y2="10" />
          <line x1="7" y1="13" x2="11" y2="13" />
        </g>
      )}
      {app === "about" && (
        <g fill="none" stroke={c} strokeWidth="1.2">
          <circle cx="10" cy="8" r="3" />
          <path d="M4 17 C4 13.5 6.5 11 10 11 C13.5 11 16 13.5 16 17" />
        </g>
      )}
      {app === "contact" && (
        <g fill="none" stroke={c} strokeWidth="1.2">
          <rect x="3" y="5" width="14" height="10" />
          <path d="M3 5 L10 11 L17 5" />
        </g>
      )}
    </svg>
  );
}

function WindowGlyph({ app, char }: { app: AppKey; char: string }) {
  const tint =
    app === "project"
      ? "#e63946"
      : app === "entry"
      ? "#f4a52e"
      : app === "info"
      ? "#9ab1d4"
      : "#f4eee0";
  return (
    <span
      className="font-[var(--font-display)] italic leading-none"
      style={{ color: tint, fontSize: "1.1rem", textShadow: "1px 1px 0 #0a0908" }}
    >
      {char?.toUpperCase()}
    </span>
  );
}
