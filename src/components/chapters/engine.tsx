"use client";

/**
 * THE MEDIUMS — Josh's story told as six mediums, because that IS the story:
 * pencil → print → film → browser → phone → signal. The site transforms into
 * each one. Every chapter is its own set piece with its own craft; scroll
 * scrubs a deterministic timeline through all six.
 *
 * The server-rendered era timeline remains underneath for screen readers,
 * search, JS-off, and reduced motion.
 */

import { useEffect, useRef, useState } from "react";
import { detectTier, type CanvasTier } from "../canvas/capability";
import { C1Paper } from "./c1-paper";
import { C2Print } from "./c2-print";
import { C3Film } from "./c3-film";
import { C4Browser } from "./c4-browser";
import { C5Phone } from "./c5-phone";
import { C6Signal } from "./c6-signal";

export type ChapterProps = { t: number; active: boolean };

const CHAPTERS: {
  id: string;
  label: string;
  years: string;
  dark: boolean;
  El: React.ComponentType<ChapterProps>;
}[] = [
  { id: "paper", label: "Paper", years: "Ohio — the beginning", dark: false, El: C1Paper },
  { id: "print", label: "Print", years: "Learning to make", dark: false, El: C2Print },
  { id: "film", label: "Film", years: "USMC · 2008 – 2013", dark: true, El: C3Film },
  { id: "browser", label: "The Browser", years: "2013 – 2015", dark: false, El: C4Browser },
  { id: "phone", label: "The Phone", years: "2015 – 2023", dark: true, El: C5Phone },
  { id: "signal", label: "The Signal", years: "2024 — present", dark: true, El: C6Signal },
];

const N = CHAPTERS.length;
const VH_PER = 170; // scroll length per chapter

/** clamp01 helper shared by all chapters via props math */
export const seg = (t: number, a: number, b: number) =>
  Math.min(Math.max((t - a) / (b - a), 0), 1);

export function ChaptersExperience() {
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [view, setView] = useState({ idx: 0, t: 0 });
  const spacer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  useEffect(() => {
    if (tier !== "full") return;
    document.documentElement.classList.add("canvas-mode");
    return () => {
      document.documentElement.classList.remove("canvas-mode", "chapter-dark");
    };
  }, [tier]);

  useEffect(() => {
    if (tier !== "full") return;
    const forced = (() => {
      const v = new URLSearchParams(window.location.search).get("p");
      const n = v === null ? NaN : Number(v);
      return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : null;
    })();
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = spacer.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      let p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      if (forced !== null) p = forced;
      const x = p * N;
      const idx = Math.min(Math.floor(x), N - 1);
      const t = x - idx;
      setView((prev) =>
        prev.idx !== idx || Math.abs(prev.t - t) > 0.002 ? { idx, t } : prev
      );
      document.documentElement.classList.toggle("chapter-dark", CHAPTERS[idx].dark);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tier]);

  if (tier !== "full") return null;

  const ch = CHAPTERS[view.idx];

  return (
    <section aria-label="The story, told in mediums" data-canvas-walk>
      {/* stage */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {CHAPTERS.map((c, i) => {
          const active = i === view.idx;
          // keep neighbors mounted for seamless handoff
          if (Math.abs(i - view.idx) > 1) return null;
          return (
            <div
              key={c.id}
              className="absolute inset-0"
              style={{
                zIndex: i === view.idx ? 2 : 1,
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <c.El t={active ? view.t : i < view.idx ? 1 : 0} active={active} />
            </div>
          );
        })}
      </div>

      {/* persistent chapter HUD */}
      <div className="pointer-events-none fixed inset-x-0 top-14 z-20 flex items-center justify-between px-5 py-3 sm:px-8" aria-hidden>
        <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.3em]">
          <span className="hud-ink">
            {String(view.idx + 1).padStart(2, "0")}/{String(N).padStart(2, "0")}
          </span>
          <span className="hud-ink font-semibold">{ch.label}</span>
          <span className="hud-ink opacity-60">{ch.years}</span>
        </div>
        {/* chapter progress ticks */}
        <div className="flex gap-1.5">
          {CHAPTERS.map((c, i) => (
            <span
              key={c.id}
              className="hud-tick block h-[3px] w-6 transition-opacity"
              style={{ opacity: i < view.idx ? 1 : i === view.idx ? 0.4 + view.t * 0.6 : 0.18 }}
            />
          ))}
        </div>
      </div>

      <div ref={spacer} style={{ height: `${N * VH_PER}vh` }} />
    </section>
  );
}
