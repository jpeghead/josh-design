"use client";

/**
 * CHAPTER 6 — THE SIGNAL. 2024–present.
 * The interface dissolves into a living field. The products surface out of
 * it. The porch light comes on: home, Cincinnati, still building.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ChapterProps } from "./engine";
import { seg } from "./engine";

const PRODUCTS = ["OLO", "Weaver", "SignalScan", "StoryMode", "Mastery is Dead"];

export function C6Signal({ t, active }: ChapterProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(t);
  tRef.current = t;

  // the field — cheap 2D particles, alive, reactive to progress
  useEffect(() => {
    if (!active) return;
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let w = 0,
      h = 0;
    const fit = () => {
      w = c.width = c.offsetWidth * devicePixelRatio;
      h = c.height = c.offsetHeight * devicePixelRatio;
    };
    fit();
    window.addEventListener("resize", fit);

    const N = 260;
    const pts = Array.from({ length: N }, (_, i) => ({
      a: (i / N) * Math.PI * 2,
      r: 0.12 + Math.random() * 0.42,
      sp: 0.15 + Math.random() * 0.5,
      sz: 0.8 + Math.random() * 2.2,
      hue: Math.random() < 0.7 ? "#c8a24b" : Math.random() < 0.5 ? "#e2c078" : "#f1ece2",
    }));

    let time = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      time += 0.004;
      const k = tRef.current;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.46;
      const R = Math.min(w, h) * (0.32 + k * 0.1);
      for (const p of pts) {
        const ang = p.a + time * p.sp;
        const wob = Math.sin(time * 2.2 + p.a * 5) * 0.06;
        const r = (p.r + wob) * R * (0.6 + k * 0.5);
        const x = cx + Math.cos(ang) * r * 1.35;
        const y = cy + Math.sin(ang) * r * 0.78;
        ctx.globalAlpha = 0.25 + Math.sin(time * 3 + p.a * 7) * 0.15 + 0.2;
        ctx.fillStyle = p.hue;
        ctx.beginPath();
        ctx.arc(x, y, p.sz * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [active]);

  const intro = seg(t, 0.02, 0.14);
  const prods = seg(t, 0.16, 0.5);
  const home = seg(t, 0.55, 0.7);
  const cta = seg(t, 0.72, 0.85);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />

      {/* porch-light warmth rising with "home" */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: home * 0.55,
          background: "radial-gradient(50% 42% at 50% 62%, rgba(255,217,160,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow" style={{ color: "#c8574a", opacity: intro }}>
          Chapter six — the signal · Boneyard
        </p>
        <h2
          className="mt-4 max-w-3xl font-display text-6xl tracking-tight text-bone sm:text-7xl"
          style={{ opacity: intro, transform: `translateY(${(1 - intro) * 30}px)` }}
        >
          Now I build <span className="italic">my own.</span>
        </h2>

        {/* products surface from the field */}
        <div className="mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {PRODUCTS.map((p, i) => {
            const k = seg(prods, i / PRODUCTS.length, (i + 1) / PRODUCTS.length);
            return (
              <span
                key={p}
                className="font-display text-2xl italic text-bone/90 sm:text-3xl"
                style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px)` }}
              >
                {p}
              </span>
            );
          })}
        </div>

        <p
          className="mt-10 max-w-md font-display text-2xl italic text-[#ffd9a0]"
          style={{ opacity: home, transform: `translateY(${(1 - home) * 20}px)` }}
        >
          Home. Cincinnati, Ohio. Samantha, Gunner, Nolan — and a garage full
          of things to make.
        </p>

        <div
          className="mt-10 flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-widest"
          style={{ opacity: cta, pointerEvents: cta > 0.5 ? "auto" : "none" }}
        >
          <Link href="/work" className="border border-white/25 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
            See the work
          </Link>
          <Link href="/products" className="border border-white/25 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
            The products
          </Link>
          <Link href="/contact" className="border border-gold bg-gold px-5 py-2.5 text-ink transition-opacity hover:opacity-85">
            Send a signal →
          </Link>
        </div>

        <p className="mt-12 font-display text-lg italic text-bone/50" style={{ opacity: cta }}>
          Still just the kid who won&rsquo;t stop making things.
        </p>
      </div>
    </div>
  );
}
