"use client";

/**
 * The desk view — a stylized desktop OS with a browser window showing the
 * REAL portfolio. This is what every visitor sees first. The reveal: press
 * Esc (or the red traffic light, or the pill) to step back from the desk —
 * the desktop shrinks into a monitor sitting in Whitehead City.
 *
 * During the transition the overlay is fitted each frame to the monitor's
 * projected screen rect, then hands off to the emissive screen texture.
 */

import { PortfolioHome } from "@/components/portfolio-home";

export type DeskRect = { x: number; y: number; w: number; h: number };

export function DesktopOverlay({
  mode,
  rect,
  opacity,
  onStepBack,
}: {
  mode: "desk" | "toWorld" | "world" | "toDesk";
  rect: DeskRect | null;
  opacity: number;
  onStepBack: () => void;
}) {
  if (mode === "world") return null;

  const seated = mode === "desk";
  const style: React.CSSProperties = seated
    ? { inset: 0 }
    : rect
      ? {
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          transformOrigin: "0 0",
          transform: `translate(${rect.x}px, ${rect.y}px) scale(${rect.w / window.innerWidth}, ${rect.h / window.innerHeight})`,
        }
      : { inset: 0 };

  return (
    <div
      className="absolute z-30 overflow-hidden"
      style={{ ...style, opacity, pointerEvents: seated ? "auto" : "none" }}
    >
      {/* wallpaper — the city at sunset, abstracted */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #221543 0%, #5a2a4a 38%, #c05a4a 62%, #e8925a 78%, #2b2233 78.5%, #171221 100%)",
        }}
      />
      <p className="absolute bottom-16 left-8 select-none font-display text-6xl italic text-white/[0.07]">
        Whitehead City
      </p>

      {/* menu bar */}
      <div className="absolute inset-x-0 top-0 flex h-9 items-center justify-between border-b border-white/10 bg-black/40 px-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
        <span>◆ Whitehead City OS</span>
        <span className="hidden sm:block">The desk of Josh Whitehead</span>
        <span>NOW · ☀ 100%</span>
      </div>

      {/* the browser window */}
      <div className="absolute left-1/2 top-1/2 flex h-[84vh] w-[92vw] max-w-[1240px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/15 bg-[#101216] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#181b21] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onStepBack}
              title="Step back from the desk"
              aria-label="Step back from the desk"
              className="h-3.5 w-3.5 rounded-full bg-[#ff5f57] transition-transform hover:scale-125"
            />
            <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex w-[60%] items-center justify-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-white/70">
            <span className="text-[#28c840]">●</span> josh.design
          </div>
          <button
            onClick={onStepBack}
            className="whitespace-nowrap rounded-md border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 transition-colors hover:border-gold hover:text-gold"
          >
            ⌫ Step back
          </button>
        </div>
        {/* the actual site */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper">
          <PortfolioHome />
        </div>
      </div>

      {/* the invitation */}
      <button
        onClick={onStepBack}
        className="group absolute bottom-5 right-5 flex items-center gap-3 rounded-full border border-white/20 bg-black/50 py-2.5 pl-4 pr-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
        Step back from the desk
        <span className="text-white/40 transition-colors group-hover:text-gold/60">Esc</span>
      </button>
    </div>
  );
}
