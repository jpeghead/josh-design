"use client";

/**
 * The Archive experience shell.
 *
 * Owns: capability gate, the tall scroll region that drives the walk, the
 * fixed canvas, and the DOM HUD (drawn-in hero, era labels, artifact captions,
 * finale CTA). When active it visually replaces the server-rendered era
 * timeline — which stays in the DOM for screen readers, search engines, and
 * anyone with JS off or reduced motion.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { detectTier, type CanvasTier } from "./capability";
import { ArchiveScene } from "./archive-scene";
import { eras, type Artifact } from "@/content/archive";
import { identityLine } from "@/content/about";

/** Scroll length of the walk — generous, so each era gets real dwell time. */
const WALK_VH = 120 * eras.length;

export function ArchiveExperience() {
  const router = useRouter();
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [eraIdx, setEraIdx] = useState(0);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [heroK, setHeroK] = useState(0); // 0 = graphite sketch, 1 = crisp
  const [phase, setPhase] = useState<"hero" | "walk" | "finale">("hero");

  const spacer = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  // Flag the document so CSS can swap the DOM walk for the canvas walk.
  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode");
      return () => document.documentElement.classList.remove("canvas-mode");
    }
  }, [tier]);

  // Scroll → progress (rAF-coalesced; the scene reads the ref every frame).
  useEffect(() => {
    if (tier !== "full") return;
    // QA scrub: /?p=0.5 pins the walk at a given progress (deep-linkable).
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
      setPhase(p < 0.06 ? "hero" : p > 0.93 ? "finale" : "walk");
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

  if (tier !== "full") return null;

  const era = eras[eraIdx];
  const dark = era.dark;

  return (
    <section aria-label="The Archive — cinematic walk" data-canvas-walk>
      {/* Fixed scene behind the HUD */}
      <div className="fixed inset-0 z-0">
        <ArchiveScene refs={{ progress, onEra, onArtifact, onNavigate }} />
      </div>

      {/* ------------- HUD ------------- */}
      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
        {/* Drawn-in hero — resolves from sketch to crisp as the walk begins */}
        <div
          className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14 transition-opacity duration-500"
          style={{ opacity: phase === "hero" ? 1 : 0 }}
        >
          <p className="eyebrow mb-5" style={{ color: "#8a8172" }}>
            The Archive — a working record of a life&rsquo;s making
          </p>
          <h1
            className="font-display leading-[0.92] tracking-tight text-[14vw] sm:text-[10vw]"
            style={{
              color: `rgba(38,34,27,${0.25 + heroK * 0.75})`,
              WebkitTextStroke: `${1.2 * (1 - heroK)}px rgba(38,34,27,0.9)`,
              filter: `blur(${(1 - heroK) * 1.6}px)`,
              transform: `translateY(${(1 - heroK) * 8}px)`,
            }}
          >
            Josh
            <br />
            <span className="italic">Whitehead</span>
          </h1>
          <p className="mt-7 max-w-md text-lg" style={{ color: "#5c554a" }}>
            {identityLine}
          </p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: "#8a8172" }}>
            Scroll to walk ↓
          </p>
        </div>

        {/* Era label — quiet, bottom-left, rises anew at each threshold */}
        {phase === "walk" && (
          <div key={era.id} className="absolute bottom-10 left-6 max-w-sm sm:left-14 animate-rise">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tabular-nums" style={{ color: era.muted }}>
                {String(era.index + 1).padStart(2, "0")} / {String(eras.length).padStart(2, "0")}
              </span>
              <span className="eyebrow" style={{ color: era.muted }}>
                {era.years}
              </span>
            </div>
            <h2 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl" style={{ color: era.fg }}>
              {era.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: era.muted }}>
              {era.blurb}
            </p>
          </div>
        )}

        {/* Nearest artifact caption — bottom-right */}
        {artifact && phase === "walk" && (
          <div className="absolute bottom-10 right-6 max-w-xs text-right sm:right-14 animate-rise">
            <p className="font-display text-xl italic" style={{ color: era.fg }}>
              {artifact.title}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: era.muted }}>
              {artifact.caption}
              {artifact.year ? ` · ${artifact.year}` : ""}
              {artifact.href ? " · click to open" : ""}
            </p>
          </div>
        )}

        {/* Finale — the room resolves into the invitation */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700"
          style={{ opacity: phase === "finale" ? 1 : 0 }}
        >
          <p className="eyebrow" style={{ color: "#7d7a74" }}>
            2024 — Present
          </p>
          <h2 className="mt-4 max-w-3xl px-6 font-display text-5xl italic tracking-tight text-bone sm:text-6xl">
            Keep building.
          </h2>
          <p className="mt-5 max-w-md px-6 text-bone-dim">
            Every era leaves a trace. The archive keeps growing.
          </p>
        </div>
      </div>

      {/* Interactive finale CTA (real link, pointer events on) */}
      <div
        className="fixed inset-x-0 bottom-16 z-20 flex justify-center transition-opacity duration-700"
        style={{ opacity: phase === "finale" ? 1 : 0, pointerEvents: phase === "finale" ? "auto" : "none" }}
      >
        <div className="flex gap-3 font-mono text-xs uppercase tracking-widest">
          <Link
            href="/work"
            className="border border-white/25 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold"
          >
            See the work
          </Link>
          <Link
            href="/contact"
            className="border border-gold bg-gold px-5 py-2.5 text-ink transition-opacity hover:opacity-85"
          >
            Send a signal →
          </Link>
        </div>
      </div>

      {/* The scroll that drives the walk */}
      <div ref={spacer} style={{ height: `${WALK_VH}vh` }} />
    </section>
  );
}
