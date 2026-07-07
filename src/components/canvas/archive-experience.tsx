"use client";

/**
 * THE DARKROOM shell.
 *
 * Owns: capability gate, the scroll that drives the walk, and the DOM HUD —
 * which frames the viewport like a strip of film: rebate markings running
 * along the top and bottom edges, a frame counter on the left, the year on
 * the right, and the develop readout for the print in front of you.
 *
 * The server-rendered era timeline stays in the document underneath for
 * screen readers, search, JS-off, and reduced motion.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { detectTier, type CanvasTier } from "./capability";
import { ArchiveScene } from "./archive-scene";
import { eras, type Artifact } from "@/content/archive";
import { identityLine } from "@/content/about";

const WALK_VH = 120 * eras.length;

const BONE = "#f1ece2";
const RED = "#c8574a";
const RED_DIM = "#7e352d";
const GOLD = "#c8a24b";

/** Era year marks for the right-edge readout. */
const ERA_YEAR = ["1993", "2005", "2008", "2013", "2014", "2015", "2024"];

export function ArchiveExperience() {
  const router = useRouter();
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [eraIdx, setEraIdx] = useState(0);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [develop, setDevelop] = useState<number | null>(null);
  const [heroK, setHeroK] = useState(0);
  const [phase, setPhase] = useState<"hero" | "walk" | "finale">("hero");

  const spacer = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "darkroom-mode");
      return () => document.documentElement.classList.remove("canvas-mode", "darkroom-mode");
    }
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
      progress.current = p;
      const k = Math.min(p / 0.045, 1);
      setHeroK((prev) => (Math.abs(prev - k) > 0.02 || (k === 1) !== (prev === 1) ? k : prev));
      setPhase(p < 0.055 ? "hero" : p > 0.93 ? "finale" : "walk");
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

  const onNavigate = useCallback((href: string) => router.push(href), [router]);
  const onEra = useCallback((i: number) => setEraIdx(i), []);
  const onArtifact = useCallback((a: Artifact | null) => setArtifact(a), []);
  const onDevelop = useCallback((f: number | null) => setDevelop(f), []);

  if (tier !== "full") return null;

  const era = eras[eraIdx];
  const rebate = `JOSH WHITEHEAD ▸ THE ARCHIVE ▸ FRAME ${String(eraIdx + 1).padStart(2, "0")}/${String(eras.length).padStart(2, "0")} ▸ ${era.title.toUpperCase()} ▸ ${era.years.toUpperCase()} ▸ SAFELIGHT ON ▸ `;

  return (
    <section aria-label="The Archive — the darkroom" data-canvas-walk>
      <div className="fixed inset-0 z-0 bg-[#0a0405]">
        <ArchiveScene refs={{ progress, onEra, onArtifact, onNavigate, onDevelop }} />
      </div>

      {/* ---------------- film-rebate HUD frame ---------------- */}
      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
        {/* top + bottom rebate tickers */}
        <div className="absolute inset-x-0 top-14 overflow-hidden border-y border-white/[0.07] py-1">
          <div className="animate-marquee whitespace-nowrap font-mono text-[9px] tracking-[0.3em]" style={{ color: RED_DIM }}>
            {rebate.repeat(6)}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/[0.07] py-1">
          <div
            className="animate-marquee whitespace-nowrap font-mono text-[9px] tracking-[0.3em]"
            style={{ color: RED_DIM, animationDirection: "reverse", animationDuration: "80s" }}
          >
            {`KODAK ▸ TRI-X 400 ▸ DEVELOPED BY HAND ▸ AGITATE GENTLY ▸ DO NOT OPEN THE DOOR ▸ `.repeat(8)}
          </div>
        </div>

        {/* left edge: frame counter */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 rotate-180 font-mono text-[10px] tracking-[0.4em]" style={{ writingMode: "vertical-rl", color: RED_DIM }}>
          FRAME {String(eraIdx + 1).padStart(2, "0")} — {era.title.toUpperCase()}
        </div>
        {/* right edge: rolling year */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.4em]" style={{ writingMode: "vertical-rl", color: RED_DIM }}>
          {ERA_YEAR[eraIdx]} ▸ {era.years.toUpperCase()}
        </div>

        {/* hero — the safelight introduction */}
        <div
          className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14"
          style={{ opacity: 1 - heroK, transform: `translateY(${heroK * -24}px)`, transition: "opacity 200ms linear" }}
        >
          <p className="eyebrow mb-5" style={{ color: RED }}>
            You&rsquo;re in the darkroom. The archive is undeveloped.
          </p>
          <h1 className="font-display leading-[0.92] tracking-tight text-[13vw] sm:text-[9.5vw]" style={{ color: BONE }}>
            Josh
            <br />
            <span className="italic">Whitehead</span>
          </h1>
          <p className="mt-7 max-w-md text-lg" style={{ color: "#a89e8e" }}>
            {identityLine}
          </p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: RED }}>
            Scroll to develop ↓
          </p>
        </div>

        {/* era label */}
        {phase === "walk" && (
          <div key={era.id} className="absolute bottom-12 left-6 max-w-sm sm:left-14 animate-rise">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tabular-nums" style={{ color: RED }}>
                {String(eraIdx + 1).padStart(2, "0")} / {String(eras.length).padStart(2, "0")}
              </span>
              <span className="eyebrow" style={{ color: "#8d7f6c" }}>
                {era.years}
              </span>
            </div>
            <h2 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl" style={{ color: BONE }}>
              {era.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#a3988a" }}>
              {era.blurb}
            </p>
          </div>
        )}

        {/* the print in front of you + its development */}
        {artifact && phase === "walk" && (
          <div className="absolute bottom-12 right-6 max-w-xs text-right sm:right-14 animate-rise">
            <p className="font-display text-xl italic" style={{ color: BONE }}>
              {artifact.title}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#8d7f6c" }}>
              {artifact.caption}
              {artifact.year ? ` · ${artifact.year}` : ""}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: develop !== null && develop >= 1 ? GOLD : RED }}>
              {develop !== null && develop >= 1
                ? "FIXED ✓" + (artifact.href ? " · CLICK TO OPEN" : "")
                : `DEVELOPING · ${Math.round((develop ?? 0) * 100)}%`}
            </p>
            {develop !== null && develop < 0.35 && (
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: RED_DIM }}>
                agitate to develop — move across the print
              </p>
            )}
          </div>
        )}

        {/* finale */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700"
          style={{ opacity: phase === "finale" ? 1 : 0 }}
        >
          <p className="eyebrow" style={{ color: RED }}>
            2024 — Present · lights on
          </p>
          <h2 className="mt-4 max-w-3xl px-6 font-display text-5xl italic tracking-tight sm:text-6xl" style={{ color: BONE }}>
            Keep building.
          </h2>
          <p className="mt-5 max-w-md px-6" style={{ color: "#a3988a" }}>
            Everything you just developed is real, and it&rsquo;s all still being made.
          </p>
        </div>
      </div>

      {/* finale CTAs */}
      <div
        className="fixed inset-x-0 bottom-20 z-20 flex justify-center transition-opacity duration-700"
        style={{ opacity: phase === "finale" ? 1 : 0, pointerEvents: phase === "finale" ? "auto" : "none" }}
      >
        <div className="flex gap-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/work" className="border border-white/25 px-5 py-2.5 transition-colors hover:border-gold hover:text-gold" style={{ color: BONE }}>
            See the work
          </Link>
          <Link href="/contact" className="border border-gold bg-gold px-5 py-2.5 text-ink transition-opacity hover:opacity-85">
            Send a signal →
          </Link>
        </div>
      </div>

      <div ref={spacer} style={{ height: `${WALK_VH}vh` }} />
    </section>
  );
}
