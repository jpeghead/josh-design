"use client";

/**
 * THE ROOM — a life told as one continuous side-scrolling house, in the
 * INSIDE (Playdead) idiom: darkness, volumetric window light, silhouette
 * figures, one warm practical per room. The camera walks right; the room
 * ages; the family arrives; the desk never leaves.
 *
 * Figures are placeholder silhouettes until reference photos land in
 * /public/reference (posture/build/hair only — faces stay dark).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { detectTier, type CanvasTier } from "../canvas/capability";
import { P, FLOOR_Y, ROOM_H } from "./rooms";
import { ROOMS, WORLD_W, ROOM_CAPTIONS } from "./scenes";

const VH = 1500;

const seg = (t: number, a: number, b: number) =>
  Math.min(Math.max((t - a) / (b - a), 0), 1);
const ease = (k: number) => k * k * (3 - 2 * k);

/** camera world-x for scroll t — slight dwell inside rooms, quick passages */
function camX(t: number): number {
  return 600 + ease(t) * (WORLD_W - 1400);
}

export function RoomExperience() {
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [caption, setCaption] = useState(-1);
  const [phase, setPhase] = useState<"hero" | "walk" | "finale">("hero");
  const spacer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const cam = useRef({ x: 600, init: false });

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "chapter-dark");
      return () => document.documentElement.classList.remove("canvas-mode", "chapter-dark");
    }
  }, [tier]);

  /* scroll → t → caption by camera position */
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
      tRef.current = p;
      setPhase(p < 0.03 ? "hero" : p > 0.955 ? "finale" : "walk");
      const cx = camX(p);
      const ci = ROOM_CAPTIONS.findIndex((c) => cx >= c.x1 && cx <= c.x2);
      setCaption((prev) => (prev !== ci ? ci : prev));
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

  /* render */
  useEffect(() => {
    if (tier !== "full") return;
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let W = 0,
      H = 0;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio, 1.75);
      W = c.width = c.offsetWidth * dpr;
      H = c.height = c.offsetHeight * dpr;
    };
    fit();
    window.addEventListener("resize", fit);

    // drifting dust motes in the light
    const MOTES = Array.from({ length: 140 }, (_, i) => ({
      x: (i * 89.7) % WORLD_W,
      y: 140 + ((i * 53.3) % (FLOOR_Y - 160)),
      r: 0.8 + (i % 3) * 0.5,
      sp: 0.12 + (i % 5) * 0.05,
    }));

    let time = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      time += 0.016;
      const dpr = Math.min(devicePixelRatio, 1.75);
      if (c.offsetWidth * dpr !== W) fit();
      if (c.offsetWidth < 50) return;
      const vw = W / dpr,
        vh = H / dpr;
      const t = tRef.current;

      const k = cam.current;
      const target = camX(t);
      if (!k.init && vw > 50) {
        k.x = target;
        k.init = true;
      }
      k.x += (target - k.x) * 0.08;

      // world→screen: fit ROOM_H into viewport height
      const s = vh / ROOM_H;
      const tx = vw / 2 - k.x * s;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // the void
      ctx.fillStyle = P.void;
      ctx.fillRect(0, 0, vw, vh);

      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * tx, 0);

      const viewL = k.x - vw / s / 2 - 200;
      const viewR = k.x + vw / s / 2 + 200;

      // back wall + floor (continuous, subtly lit around the camera)
      const wallGrad = ctx.createLinearGradient(0, 100, 0, FLOOR_Y);
      wallGrad.addColorStop(0, P.void);
      wallGrad.addColorStop(0.35, P.wallBack);
      wallGrad.addColorStop(1, "#0e1317");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(viewL, 0, viewR - viewL, FLOOR_Y);
      ctx.fillStyle = P.floor;
      ctx.fillRect(viewL, FLOOR_Y, viewR - viewL, ROOM_H - FLOOR_Y);
      // floor sheen under the camera
      const sheen = ctx.createRadialGradient(k.x, FLOOR_Y + 20, 40, k.x, FLOOR_Y + 20, 900);
      sheen.addColorStop(0, "rgba(180,200,205,0.05)");
      sheen.addColorStop(1, "rgba(180,200,205,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(viewL, FLOOR_Y - 4, viewR - viewL, 200);

      // rooms in view
      for (const room of ROOMS) {
        if (room.x + room.w < viewL || room.x > viewR) continue;
        room.draw(ctx, room.x);
      }

      // dust motes, drifting in the shafts
      ctx.fillStyle = "rgba(190,205,210,0.25)";
      for (const m of MOTES) {
        if (m.x < viewL || m.x > viewR) continue;
        const my = m.y + Math.sin(time * m.sp * 2 + m.x) * 14;
        ctx.beginPath();
        ctx.arc(m.x + Math.sin(time * m.sp + m.y) * 8, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // foreground fog band (parallax faster than world)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fog = ctx.createLinearGradient(0, vh * 0.7, 0, vh);
      fog.addColorStop(0, "rgba(7,9,11,0)");
      fog.addColorStop(1, "rgba(7,9,11,0.85)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, vw, vh);
      const top = ctx.createLinearGradient(0, 0, 0, vh * 0.22);
      top.addColorStop(0, "rgba(7,9,11,0.9)");
      top.addColorStop(1, "rgba(7,9,11,0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, vw, vh * 0.25);
      // heavy side vignette — the INSIDE frame
      const vig = ctx.createRadialGradient(vw / 2, vh * 0.46, vh * 0.35, vw / 2, vh * 0.5, vw * 0.75);
      vig.addColorStop(0, "rgba(7,9,11,0)");
      vig.addColorStop(1, "rgba(7,9,11,0.78)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, vh);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [tier]);

  if (tier !== "full") return null;

  const cap = caption >= 0 ? ROOM_CAPTIONS[caption] : null;

  return (
    <section aria-label="The room — a life in one house" data-canvas-walk>
      <div className="fixed inset-0 z-0">
        <canvas ref={canvas} className="h-full w-full" />
        {/* film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.55 0 0 0 0 0.58 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
        {/* hero */}
        <div
          className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14"
          style={{ opacity: phase === "hero" ? 1 : 0, transition: "opacity 500ms" }}
        >
          <p className="eyebrow" style={{ color: "#5d6b72" }}>
            Josh Whitehead — designer & builder
          </p>
          <h1 className="mt-4 font-display text-[11vw] leading-[0.95] tracking-tight text-[#cfd8db] sm:text-[7.5vw]">
            One desk.
            <br />
            <span className="italic">A whole life.</span>
          </h1>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-[#5d6b72]">
            Scroll to walk through the years →
          </p>
        </div>

        {/* the caption — one at a time, fixed home */}
        {cap && phase === "walk" && (
          <div key={caption} className="absolute bottom-14 left-6 max-w-lg sm:left-14 animate-rise">
            <div className="border-l-2 py-1 pl-4" style={{ borderColor: P.accent }}>
              <p className="font-display text-2xl italic leading-snug text-[#cfd8db] sm:text-3xl">
                {cap.text}
              </p>
              {cap.sub && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5d6b72]">
                  {cap.sub}
                </p>
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
            Same desk. Same kid. Still making things.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#5d6b72]">
            Cincinnati, Ohio · Samantha, Gunner & Nolan
          </p>
        </div>
      </div>

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
