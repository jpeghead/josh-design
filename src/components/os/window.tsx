"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  useWindowManager,
  geomForSnap,
  type OpenWindow,
  type SnapZone,
} from "@/lib/window-store";
import { playSound } from "@/lib/ui-sound";
import { WindowAsk } from "@/components/os/window-ask";

const MIN_W = 420;
const MIN_H = 320;
const TITLE_BAR_H = 36;

/** Distance from edge in pixels that triggers a snap zone */
const EDGE = 24;
const CORNER = 80;

function snapZoneFor(x: number, y: number, vw: number, vh: number): SnapZone {
  const nearTop = y <= EDGE;
  const nearLeft = x <= EDGE;
  const nearRight = x >= vw - EDGE;
  const nearBottom = y >= vh - EDGE;

  if (nearTop && x <= CORNER) return "top-left";
  if (nearTop && x >= vw - CORNER) return "top-right";
  if (nearBottom && x <= CORNER) return "bottom-left";
  if (nearBottom && x >= vw - CORNER) return "bottom-right";

  if (nearTop) return "full";
  if (nearLeft) return "left";
  if (nearRight) return "right";
  return null;
}

type EdgeKind = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function Window({
  w,
  children,
  onContextMenu,
}: {
  w: OpenWindow;
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const { focused, focus, close, move, resize, snap, minimize, maximize } =
    useWindowManager();
  const isFocused = focused === w.id;
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Drag state — refs to avoid stale-closure pointer chain */
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [, forceRerender] = useState(0);
  const setDrag = (v: { pointerId: number; offsetX: number; offsetY: number } | null) => {
    dragRef.current = v;
    forceRerender((x) => x + 1);
  };
  const drag = dragRef.current;

  const [snapPreview, setSnapPreviewState] = useState<SnapZone>(null);
  const snapPreviewRef = useRef<SnapZone>(null);
  const setSnapPreview = (v: SnapZone) => {
    snapPreviewRef.current = v;
    setSnapPreviewState(v);
  };

  /* Resize state */
  const rsRef = useRef<{
    pointerId: number;
    edge: EdgeKind;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const [, forceRsRerender] = useState(0);
  const setRs = (v: typeof rsRef.current) => {
    rsRef.current = v;
    forceRsRerender((x) => x + 1);
  };

  /* Momentum overshoot — animates a slight bounce after drag release */
  const [bounce, setBounce] = useState<{ dx: number; dy: number } | null>(null);
  const releaseVelocityRef = useRef({ vx: 0, vy: 0, lastTime: 0, lastX: 0, lastY: 0 });

  /* Play open sound once on mount */
  const playedOpenRef = useRef(false);
  useEffect(() => {
    if (!playedOpenRef.current) {
      playedOpenRef.current = true;
      playSound("open");
    }
  }, []);

  const box = w.maximized
    ? { x: 8, y: 48, width: window.innerWidth - 16, height: window.innerHeight - 100 }
    : { x: w.x, y: w.y, width: w.width, height: w.height };

  /* ── Title bar drag ─────────────────────────────────────────── */
  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (w.maximized) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    focus(w.id);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDrag({
      pointerId: e.pointerId,
      offsetX: e.clientX - w.x,
      offsetY: e.clientY - w.y,
    });
    releaseVelocityRef.current = {
      vx: 0, vy: 0,
      lastTime: performance.now(),
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const onTitlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const x = Math.max(-w.width + 80, Math.min(window.innerWidth - 80, e.clientX - d.offsetX));
    const y = Math.max(40, Math.min(window.innerHeight - 80, e.clientY - d.offsetY));
    move(w.id, x, y);

    // Track velocity for momentum
    const t = performance.now();
    const v = releaseVelocityRef.current;
    const dt = Math.max(1, t - v.lastTime);
    v.vx = ((e.clientX - v.lastX) / dt) * 16;
    v.vy = ((e.clientY - v.lastY) / dt) * 16;
    v.lastTime = t;
    v.lastX = e.clientX;
    v.lastY = e.clientY;

    const zone = snapZoneFor(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    setSnapPreview(zone);
  };

  const onTitlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d && d.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      const zone = snapPreviewRef.current;
      setDrag(null);
      if (zone) {
        snap(w.id, zone);
        playSound("snap");
      } else {
        // Apply a small momentum overshoot
        const { vx, vy } = releaseVelocityRef.current;
        const max = 18;
        const dx = Math.max(-max, Math.min(max, vx * 0.4));
        const dy = Math.max(-max, Math.min(max, vy * 0.4));
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          setBounce({ dx, dy });
          // Reset bounce after spring settles
          setTimeout(() => setBounce(null), 380);
        }
      }
      setSnapPreview(null);
    }
  };

  /* ── Edge / corner resize ───────────────────────────────────── */
  const onEdgePointerDown = (edge: EdgeKind) => (e: React.PointerEvent) => {
    if (w.maximized) return;
    e.stopPropagation();
    focus(w.id);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setRs({
      pointerId: e.pointerId,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: w.width,
      startH: w.height,
      startLeft: w.x,
      startTop: w.y,
    });
  };

  const onEdgePointerMove = (e: React.PointerEvent) => {
    const s = rsRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    let width = s.startW;
    let height = s.startH;
    let x = s.startLeft;
    let y = s.startTop;

    // Horizontal
    if (s.edge.includes("e")) width = s.startW + dx;
    if (s.edge.includes("w")) {
      width = s.startW - dx;
      x = s.startLeft + dx;
    }
    // Vertical
    if (s.edge.includes("s")) height = s.startH + dy;
    if (s.edge.includes("n")) {
      height = s.startH - dy;
      y = s.startTop + dy;
    }

    // Clamp width/height — and clamp x/y so the left/top edge doesn't push past min
    if (width < MIN_W) {
      if (s.edge.includes("w")) x = s.startLeft + (s.startW - MIN_W);
      width = MIN_W;
    }
    if (height < MIN_H) {
      if (s.edge.includes("n")) y = s.startTop + (s.startH - MIN_H);
      height = MIN_H;
    }

    // Keep within viewport
    width = Math.min(window.innerWidth - x - 4, width);
    height = Math.min(window.innerHeight - y - 4, height);

    if (x !== w.x || y !== w.y) move(w.id, x, y);
    resize(w.id, width, height);
  };

  const onEdgePointerUp = (e: React.PointerEvent) => {
    if (rsRef.current?.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setRs(null);
    }
  };

  void drag; // silence unused-var when not consumed in JSX

  return (
    <>
      {snapPreview && <SnapGhost zone={snapPreview} z={w.zIndex - 1} />}

      <motion.div
        role="dialog"
        aria-label={w.slug}
        onPointerDown={() => focus(w.id)}
        onContextMenu={onContextMenu}
        initial={
          w.openOrigin
            ? {
                opacity: 0,
                scale: 0.04,
                x: w.openOrigin.x - box.x - box.width / 2,
                y: w.openOrigin.y - box.y - box.height / 2,
                rotate: -2,
              }
            : { opacity: 0, scale: 0.96, y: 12 }
        }
        animate={
          bounce
            ? { opacity: 1, scale: 1, x: bounce.dx, y: bounce.dy, rotate: 0 }
            : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
        }
        exit={{ opacity: 0, scale: 0.88, y: 12, filter: "blur(4px)" }}
        transition={
          bounce
            ? { type: "spring", stiffness: 220, damping: 18, mass: 0.35 }
            : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
        }
        onAnimationComplete={() => bounce && setBounce(null)}
        style={{
          position: "fixed",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          zIndex: w.zIndex,
          WebkitBackdropFilter: "blur(28px) saturate(140%)",
        }}
        className={`sapphire flex flex-col overflow-hidden border backdrop-blur-2xl ${
          isFocused
            ? "border-bone-line bg-ink/85 shadow-[0_0_0_1px_rgba(200,167,106,0.16),0_36px_80px_-12px_rgba(0,0,0,0.85),0_0_60px_-12px_rgba(200,167,106,0.14)]"
            : "border-bone-line/50 bg-ink/70 shadow-[0_18px_60px_-12px_rgba(0,0,0,0.55)]"
        }`}
      >
        {/* Title bar — brushed steel band with polished bevel highlight */}
        <div
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          onPointerCancel={onTitlePointerUp}
          onDoubleClick={() => maximize(w.id)}
          onContextMenu={onContextMenu}
          className={`flex items-center justify-between border-b border-bone-line px-3 select-none ${
            w.maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"
          } ${isFocused ? "bg-ink-50" : "bg-ink-100/50"}`}
          style={{ height: TITLE_BAR_H }}
        >
          <div data-no-drag className="flex items-center gap-1.5">
            <TrafficLight
              color="safelight"
              isFocused={isFocused}
              label="Close"
              shortcut="⌘W"
              onClick={() => {
                playSound("close");
                close(w.id);
              }}
              glyph={
                <svg viewBox="0 0 10 10" className="h-full w-full">
                  <line x1="3" y1="3" x2="7" y2="7" stroke="#0a0908" strokeWidth="1.2" />
                  <line x1="7" y1="3" x2="3" y2="7" stroke="#0a0908" strokeWidth="1.2" />
                </svg>
              }
            />
            <TrafficLight
              color="sodium"
              isFocused={isFocused}
              label="Minimize"
              onClick={() => {
                playSound("minimize");
                minimize(w.id);
              }}
              glyph={
                <svg viewBox="0 0 10 10" className="h-full w-full">
                  <line x1="2" y1="5" x2="8" y2="5" stroke="#0a0908" strokeWidth="1.2" />
                </svg>
              }
            />
            <TrafficLight
              color="emulsion"
              isFocused={isFocused}
              label={w.maximized ? "Restore" : "Maximize"}
              onClick={() => {
                playSound("click");
                maximize(w.id);
              }}
              glyph={
                <svg viewBox="0 0 10 10" className="h-full w-full">
                  <path
                    d="M2 4 L2 2 L4 2 M6 2 L8 2 L8 4 M8 6 L8 8 L6 8 M4 8 L2 8 L2 6"
                    stroke="#0a0908"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
              }
            />
          </div>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] sm:flex">
            <span className={isFocused ? "text-bone" : "text-bone-muted"}>{w.slug}</span>
            <span aria-hidden className="text-bone-line">·</span>
            <span className="text-bone-muted">{w.caption}</span>
          </div>

          <div data-no-drag className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {w.snap && <span className="text-bone-dim">snap · {w.snap}</span>}
            <span>
              {Math.round(box.width)}×{Math.round(box.height)}
            </span>
            {w.app !== "info" && <WindowAsk w={w} />}
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="relative flex-1 overflow-auto">
          {children}
        </div>

        {/* ── Edge resize handles ─────────────────────────────── */}
        {!w.maximized && (
          <>
            <EdgeHandle edge="n" onDown={onEdgePointerDown("n")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-ns-resize left-2 right-2 top-0 h-1.5" />
            <EdgeHandle edge="s" onDown={onEdgePointerDown("s")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-ns-resize left-2 right-2 bottom-0 h-1.5" />
            <EdgeHandle edge="e" onDown={onEdgePointerDown("e")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-ew-resize top-9 bottom-2 right-0 w-1.5" />
            <EdgeHandle edge="w" onDown={onEdgePointerDown("w")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-ew-resize top-9 bottom-2 left-0 w-1.5" />
            <EdgeHandle edge="ne" onDown={onEdgePointerDown("ne")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-nesw-resize top-0 right-0 h-3 w-3" />
            <EdgeHandle edge="nw" onDown={onEdgePointerDown("nw")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-nwse-resize top-0 left-0 h-3 w-3" />
            <EdgeHandle edge="sw" onDown={onEdgePointerDown("sw")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-nesw-resize bottom-0 left-0 h-3 w-3" />
            <EdgeHandle edge="se" onDown={onEdgePointerDown("se")} onMove={onEdgePointerMove} onUp={onEdgePointerUp} className="cursor-nwse-resize bottom-0 right-0 h-5 w-5">
              <svg viewBox="0 0 16 16" className="h-full w-full">
                <line x1="2" y1="14" x2="14" y2="2" stroke="var(--color-bone-muted)" strokeWidth="0.8" opacity="0.6" />
                <line x1="6" y1="14" x2="14" y2="6" stroke="var(--color-bone-muted)" strokeWidth="0.8" opacity="0.6" />
                <line x1="10" y1="14" x2="14" y2="10" stroke="var(--color-bone-muted)" strokeWidth="0.8" opacity="0.6" />
              </svg>
            </EdgeHandle>
          </>
        )}
      </motion.div>
    </>
  );
}

function EdgeHandle({
  edge,
  onDown,
  onMove,
  onUp,
  className,
  children,
}: {
  edge: EdgeKind;
  onDown: (e: React.PointerEvent) => void;
  onMove: (e: React.PointerEvent) => void;
  onUp: (e: React.PointerEvent) => void;
  className: string;
  children?: React.ReactNode;
}) {
  void edge;
  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`absolute z-10 ${className}`}
    >
      {children}
    </div>
  );
}

function TrafficLight({
  color,
  isFocused,
  label,
  shortcut,
  onClick,
  glyph,
}: {
  color: "safelight" | "sodium" | "emulsion";
  isFocused: boolean;
  label: string;
  shortcut?: string;
  onClick: () => void;
  glyph: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      className={`group block h-3 w-3 cursor-pointer rounded-full border border-ink ${
        isFocused ? `bg-${color}` : "bg-bone-line"
      }`}
    >
      <span className="block h-full w-full rounded-full opacity-0 group-hover:opacity-100">
        {glyph}
      </span>
    </button>
  );
}

function SnapGhost({ zone, z }: { zone: SnapZone; z: number }) {
  if (typeof window === "undefined") return null;
  const g = geomForSnap(zone, window.innerWidth, window.innerHeight);
  if (!g) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      style={{
        position: "fixed",
        left: g.x,
        top: g.y,
        width: g.width,
        height: g.height,
        zIndex: z,
      }}
      className="pointer-events-none border border-safelight bg-safelight/10 backdrop-blur-[2px]"
    >
      <div className="absolute inset-3 border border-safelight/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-safelight">
        {zone}
      </div>
    </motion.div>
  );
}
