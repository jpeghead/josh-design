"use client";

/**
 * THE ROOM — one locked camera shot; the room changes through 37 years.
 *
 * No camera movement of any kind. Scroll scrubs time: each era is a
 * pre-rendered still of the SAME room from the SAME angle (see
 * ROOM-RENDER-BRIEF.md). Transitions dip through darkness like a long
 * blink; the year rolls over in the dark. A subtle pointer-driven breath
 * (sub-1% translate/scale) keeps the still feeling like a live 3D scene.
 *
 * Until a render lands in /public/room/, its era shows an intentional
 * placeholder naming what the frame will hold.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { detectTier, type CanvasTier } from "../canvas/capability";
import { ERAS } from "./eras";
import { drawRoom, DW, DH } from "./room-art";

const N = ERAS.length;
const VH = 130 * N; // scroll length
const HERO_END = 0.035;
const FINALE_START = 0.965;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export function StaticRoomExperience() {
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [eraIdx, setEraIdx] = useState(0);
  const [phase, setPhase] = useState<"hero" | "walk" | "finale">("hero");
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const spacer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLCanvasElement>(null);
  const loadedRef = useRef<Record<string, boolean>>({});
  const darkEl = useRef<HTMLDivElement>(null);
  const yearEl = useRef<HTMLSpanElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const tRef = useRef(0);
  const ptr = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "chapter-dark");
      return () => document.documentElement.classList.remove("canvas-mode", "chapter-dark");
    }
  }, [tier]);

  /* scroll → time */
  useEffect(() => {
    if (tier !== "full") return;
    const forced = (() => {
      const v = new URLSearchParams(window.location.search).get("p");
      const n = v === null ? NaN : Number(v);
      return Number.isFinite(n) ? clamp01(n) : null;
    })();
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = spacer.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      let p = total > 0 ? clamp01(-rect.top / total) : 0;
      if (forced !== null) p = forced;
      tRef.current = p;
      setPhase(p < HERO_END ? "hero" : p > FINALE_START ? "finale" : "walk");
      const walk = clamp01((p - HERO_END) / (FINALE_START - HERO_END));
      const e = walk * (N - 1);
      const idx = Math.min(Math.round(e), N - 1);
      setEraIdx((prev) => (prev !== idx ? idx : prev));
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

  /* pointer breath */
  useEffect(() => {
    if (tier !== "full") return;
    const onMove = (ev: PointerEvent) => {
      ptr.current.x = (ev.clientX / window.innerWidth - 0.5) * 2;
      ptr.current.y = (ev.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [tier]);

  /* per-frame compositing — refs only, no React churn */
  useEffect(() => {
    if (tier !== "full") return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = tRef.current;
      const walk = clamp01((p - HERO_END) / (FINALE_START - HERO_END));
      const e = walk * (N - 1);
      const idx = Math.min(Math.round(e), N - 1);

      // layers: hard swap hidden beneath the darkness dip
      for (let i = 0; i < N; i++) {
        const el = layers.current[i];
        if (el) el.style.opacity = i === idx ? "1" : "0";
      }

      // the in-engine room art (until a real render covers it)
      const c = art.current;
      if (c) {
        const dpr = Math.min(devicePixelRatio, 1.75);
        if (c.width !== c.offsetWidth * dpr) {
          c.width = c.offsetWidth * dpr;
          c.height = c.offsetHeight * dpr;
        }
        if (c.offsetWidth > 50) {
          const g = c.getContext("2d")!;
          const vw = c.offsetWidth,
            vh = c.offsetHeight;
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.fillStyle = "#07090b";
          g.fillRect(0, 0, vw, vh);
          if (!loadedRef.current[ERAS[idx].id]) {
            const s2 = Math.max(vw / DW, vh / DH);
            g.setTransform(dpr * s2, 0, 0, dpr * s2, dpr * ((vw - DW * s2) / 2), dpr * ((vh - DH * s2) / 2));
            // props settle in as you arrive; era 0 opens fully dressed
            const settle = idx === 0 ? 1 : e >= idx ? 1 : clamp01(1 - (idx - e) / 0.36);
            drawRoom(g, ERAS[idx].id, performance.now() / 1000, settle);
          }
        }
      }

      // the blink — darkness peaking at each era boundary
      const frac = e - Math.floor(e);
      const dBoundary = Math.abs(frac - 0.5); // 0 at boundary
      let dark = clamp01(1 - dBoundary / 0.14) * 0.94;
      if (p < HERO_END) dark = Math.max(dark, 0.25);
      if (darkEl.current) darkEl.current.style.opacity = String(dark);

      // year rolls over while dark
      if (yearEl.current && yearEl.current.textContent !== ERAS[idx].year) {
        yearEl.current.textContent = ERAS[idx].year;
      }

      // the breath — sub-1% parallax; the camera itself never moves
      const q = ptr.current;
      q.cx += (q.x - q.cx) * 0.04;
      q.cy += (q.y - q.cy) * 0.04;
      if (stage.current) {
        stage.current.style.transform = `translate(${q.cx * -9}px, ${q.cy * -5}px) scale(1.045)`;
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [tier]);

  if (tier !== "full") return null;

  const era = ERAS[eraIdx];

  return (
    <section aria-label="The room — one shot, a whole life" data-canvas-walk>
      {/* ---------------- the shot ---------------- */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#07090b]">
        <div ref={stage} className="absolute inset-0 will-change-transform">
          <canvas ref={art} className="absolute inset-0 h-full w-full" />
          {ERAS.map((er, i) => (
            <div
              key={er.id}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className="absolute inset-0"
              style={{ opacity: i === eraIdx ? 1 : 0 }}
            >
              {/* the render, once it exists */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/room/${er.file}`}
                alt=""
                className="h-full w-full object-cover"
                style={{ display: loaded[er.id] ? "block" : "none" }}
                onLoad={() => {
                  loadedRef.current[er.id] = true;
                  setLoaded((m) => (m[er.id] ? m : { ...m, [er.id]: true }));
                }}
                onError={(ev) => {
                  (ev.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>

        {/* the blink */}
        <div ref={darkEl} className="pointer-events-none absolute inset-0 bg-[#040506]" style={{ opacity: 0 }} />

        {/* grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.55 0 0 0 0 0.58 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 46%, transparent 40%, rgba(4,5,6,0.55) 78%, rgba(4,5,6,0.9) 100%)",
          }}
        />
      </div>

      {/* ---------------- words ---------------- */}
      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
        {/* the year — always present, rolls in the dark */}
        <div className="absolute right-6 top-20 text-right sm:right-12">
          <span
            ref={yearEl}
            className="font-display text-5xl italic tabular-nums tracking-tight text-[#cfd8db]/85 sm:text-6xl"
          >
            1987
          </span>
        </div>

        {/* hero */}
        <div
          className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14"
          style={{ opacity: phase === "hero" ? 1 : 0, transition: "opacity 500ms" }}
        >
          <p className="eyebrow" style={{ color: "#5d6b72" }}>
            Josh Whitehead — designer &amp; builder
          </p>
          <h1 className="mt-4 font-display text-[11vw] leading-[0.95] tracking-tight text-[#cfd8db] sm:text-[7.5vw]">
            One room.
            <br />
            <span className="italic">Thirty-seven years.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-[#8fa0a8]">
            May 22, 1987 → now. The camera never moves. The life does.
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-[#5d6b72]">
            Scroll — the room remembers ↓
          </p>
        </div>

        {/* era caption — one at a time, fixed home */}
        {phase === "walk" && (
          <div key={era.id} className="absolute bottom-14 left-6 max-w-lg sm:left-14 animate-rise">
            <div className="border-l-2 py-1 pl-4" style={{ borderColor: "#C8A24B" }}>
              {era.date && (
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C8A24B]">{era.date}</p>
              )}
              <p className="mt-1 font-display text-2xl italic leading-snug text-[#cfd8db] sm:text-3xl">
                {era.caption}
              </p>
              {era.sub && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5d6b72]">{era.sub}</p>
              )}
            </div>
          </div>
        )}

        {/* finale */}
        <div
          className="absolute inset-x-0 bottom-[18%] flex flex-col items-center text-center transition-opacity duration-700"
          style={{ opacity: phase === "finale" ? 1 : 0 }}
        >
          <p className="max-w-lg px-6 font-display text-2xl italic text-[#cfd8db] sm:text-3xl">
            The camera never moved. Everything else did.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#5d6b72]">
            Cincinnati, Ohio · Samantha, Gunner &amp; Nolan
          </p>
        </div>
      </div>

      {/* finale CTAs */}
      <div
        className="fixed inset-x-0 bottom-[6%] z-20 flex justify-center transition-opacity duration-700"
        style={{ opacity: phase === "finale" ? 1 : 0, pointerEvents: phase === "finale" ? "auto" : "none" }}
      >
        <div className="flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/work" className="border border-white/20 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
            The work
          </Link>
          <Link href="/products" className="border border-white/20 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
            The products
          </Link>
          <Link href="/contact" className="border border-gold bg-gold px-5 py-2.5 text-ink transition-opacity hover:opacity-85">
            Send a signal →
          </Link>
        </div>
      </div>

      <div ref={spacer} style={{ height: `${VH}vh` }} />
    </section>
  );
}
