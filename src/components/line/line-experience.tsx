"use client";

/**
 * THE LINE — one unbroken drawing, from a kid's crayon to a world you're
 * inside of, ending as a signature.
 *
 * Scroll scrubs the drawing. The camera follows the pen. As the line gains
 * skill it gains color and company; at the dive it becomes ribbons that fill
 * the screen, and the ribbons converge into the signature.
 *
 * Rules learned from every prior rejection: one continuous motion, sparse
 * captions (one at a time, long dwell, fixed placement, real contrast),
 * real work clickable inside the drawing, no gimmick cuts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { detectTier, type CanvasTier } from "../canvas/capability";
import {
  STROKES,
  STYLE,
  SEGS,
  TOTAL,
  FRAMES,
  CAPTIONS,
  SPIRAL_C,
  pointAtLen,
} from "./world";

/** pen position for a given scroll t — shared by captions and the renderer */
function penAt(t: number): [number, number] {
  const e = (k: number) => k * k * (3 - 2 * k);
  return pointAtLen(TOTAL * e(Math.min(t / DRAW_END, 1)));
}

const VH = 1400; // total scroll length (vh)
const DRAW_END = 0.78; // the line finishes at the dive; ribbons take over

const seg = (t: number, a: number, b: number) =>
  Math.min(Math.max((t - a) / (b - a), 0), 1);
const ease = (k: number) => k * k * (3 - 2 * k);

/* ------------------------------------------------------------ bg ramp */

const BG: [number, string][] = [
  [0, "#f8f2e5"],
  [0.3, "#f4edda"],
  [0.5, "#efe7d2"],
  [0.68, "#e7dfc9"],
  [0.76, "#8d8776"],
  [0.84, "#191921"],
  [1, "#0b0b10"],
];
function bgAt(t: number): string {
  let i = 0;
  while (i < BG.length - 2 && t > BG[i + 1][0]) i++;
  const [t1, c1] = BG[i];
  const [t2, c2] = BG[i + 1];
  const f = seg(t, t1, t2);
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(c1),
    b = p(c2);
  const m = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

/* ---------------------------------------------------------- component */

export function LineExperience() {
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [caption, setCaption] = useState<number>(-1);
  const [phase, setPhase] = useState<"hero" | "walk" | "finale">("hero");
  const spacer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const worldEl = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);
  const cam = useRef({ x: 500, y: 520, s: 1, init: false });

  useEffect(() => setTier(detectTier()), []);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode");
      return () => document.documentElement.classList.remove("canvas-mode", "chapter-dark");
    }
  }, [tier]);

  /* scroll → t */
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
      setPhase(p < 0.04 ? "hero" : p > 0.925 ? "finale" : "walk");
      const [hx] = penAt(p);
      const ci = CAPTIONS.findIndex((c) =>
        c.a !== undefined
          ? p >= c.a && p <= (c.b ?? 1)
          : p < 0.74 && hx >= (c.x1 ?? 0) && hx <= (c.x2 ?? 0)
      );
      setCaption((prev) => (prev !== ci ? ci : prev));
      document.documentElement.classList.toggle("chapter-dark", p > 0.79);
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

  /* render loop */
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
      c.getContext("2d")!.setTransform(1, 0, 0, 1, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    // ribbons state (ambient time animation is allowed; scrub gates opacity)
    const RIBBONS = Array.from({ length: 16 }, (_, i) => ({
      seed: i * 133.7,
      hue: ["#C8A24B", "#C87F6B", "#7FA0C9", "#A8C4A2", "#E2C078", "#f1ece2"][i % 6],
      amp: 40 + (i % 5) * 26,
      speed: 0.3 + (i % 4) * 0.16,
      yof: (i / 16 - 0.5) * 1.4,
    }));

    // the signature — an honest scrawl (signatures are scrawls)
    const SIG: [number, number][] = (() => {
      const pts: [number, number][] = [];
      // J — a tall loop with a swooping tail
      for (let i = 0; i <= 30; i++) {
        const f = i / 30;
        pts.push([-260 + f * 60, -90 + Math.sin(f * Math.PI) * -70 + f * 150]);
      }
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI * 0.5 + (i / 24) * Math.PI;
        pts.push([-220 + Math.cos(a) * 55, 60 + Math.sin(a) * 45]);
      }
      // connecting scrawl — osh whitehead as energy, not letters
      for (let i = 0; i <= 90; i++) {
        const f = i / 90;
        const x = -160 + f * 420;
        const y =
          10 +
          Math.sin(f * Math.PI * 6.5 + 0.4) * 26 * (1 - f * 0.35) +
          Math.sin(f * Math.PI * 1.2) * 18;
        pts.push([x, y]);
      }
      // the underline flourish, right to left
      for (let i = 0; i <= 20; i++) {
        const f = i / 20;
        pts.push([270 - f * 520, 78 + Math.sin(f * Math.PI) * 16]);
      }
      return pts;
    })();
    let sigLen = 0;
    for (let i = 0; i < SIG.length - 1; i++)
      sigLen += Math.hypot(SIG[i + 1][0] - SIG[i][0], SIG[i + 1][1] - SIG[i][1]);

    let time = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      time += 0.006;
      const t = tRef.current;
      const dpr = Math.min(devicePixelRatio, 1.75);
      // survive layout races and hidden→visible transitions
      if (c.offsetWidth * dpr !== W) fit();
      if (c.offsetWidth < 50) return;
      const vw = W / dpr,
        vh = H / dpr;

      // ---- camera ----
      const drawn = TOTAL * ease(Math.min(t / DRAW_END, 1));
      const head = pointAtLen(drawn);
      const dive = seg(t, 0.74, 0.9);
      const targetX = dive > 0 ? SPIRAL_C[0] : head[0];
      const targetY = dive > 0 ? SPIRAL_C[1] : head[1];
      const baseS = Math.min(vw / 1500, vh / 900) * (1 + seg(t, 0.1, 0.7) * 0.55);
      const s = baseS * Math.pow(30, ease(dive));
      const k = cam.current;
      if (!k.init && vw > 50) {
        // deep links land exactly where the pen is — no fly-in
        k.x = targetX;
        k.y = targetY;
        k.s = s;
        k.init = true;
      }
      const damp = dive > 0 ? 0.14 : 0.07;
      k.x += (targetX - k.x) * damp;
      k.y += (targetY - k.y) * damp;
      k.s += (s - k.s) * damp;

      const tx = vw / 2 - k.x * k.s;
      const ty = vh / 2 - k.y * k.s + vh * 0.06;

      // ---- clear + bg ----
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bgAt(t);
      ctx.fillRect(0, 0, vw, vh);

      // world transform (mirrored on the DOM layer for clickable frames)
      ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * tx, dpr * ty);
      if (worldEl.current) {
        worldEl.current.style.transform = `translate(${tx}px, ${ty}px) scale(${k.s})`;
        worldEl.current.style.opacity = String(1 - seg(t, 0.8, 0.88));
        // work appears as the pen reaches it
        const kids = worldEl.current.children;
        for (let i = 0; i < kids.length; i++) {
          const el = kids[i] as HTMLElement;
          const fx = Number(el.dataset.fx ?? 0);
          const vis = head[0] > fx - 40 ? 1 : 0;
          if (el.style.opacity !== String(vis)) {
            el.style.opacity = String(vis);
            el.style.transition = "opacity 700ms ease";
          }
        }
      }

      // ---- the line ----
      const lineFade = 1 - seg(t, 0.82, 0.9);
      if (lineFade > 0) {
        ctx.globalAlpha = lineFade;
        let budget = drawn;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        let si = -1;
        let st = STYLE.crayon;
        ctx.beginPath();
        for (const sg of SEGS) {
          if (budget <= 0) break;
          if (sg.si !== si) {
            if (si >= 0) ctx.stroke();
            si = sg.si;
            st = STYLE[STROKES[si].style];
            ctx.strokeStyle = st.color;
            ctx.lineWidth = st.width / Math.sqrt(k.s);
            ctx.globalAlpha = st.alpha * lineFade;
            ctx.beginPath();
            ctx.moveTo(sg.x1, sg.y1);
          }
          const f = Math.min(budget / sg.len, 1);
          ctx.lineTo(sg.x1 + (sg.x2 - sg.x1) * f, sg.y1 + (sg.y2 - sg.y1) * f);
          budget -= sg.len;
        }
        ctx.stroke();

        // echoes: the line, multiplied — drawn only for styles that have them
        let acc = 0;
        for (const sg of SEGS) {
          const st2 = STYLE[STROKES[sg.si].style];
          if (st2.echo && acc < drawn) {
            const f = Math.min((drawn - acc) / sg.len, 1);
            if (f > 0) {
              for (const e of st2.echo) {
                ctx.strokeStyle = e.color;
                ctx.lineWidth = (st2.width * 0.8) / Math.sqrt(k.s);
                ctx.globalAlpha = (e.a ?? 0.55) * lineFade;
                ctx.beginPath();
                ctx.moveTo(sg.x1 + e.dx, sg.y1 + e.dy);
                ctx.lineTo(
                  sg.x1 + (sg.x2 - sg.x1) * f + e.dx,
                  sg.y1 + (sg.y2 - sg.y1) * f + e.dy
                );
                ctx.stroke();
              }
            }
          }
          acc += sg.len;
        }

        // the pen tip — a small living glow
        if (t < DRAW_END) {
          ctx.globalAlpha = lineFade;
          ctx.fillStyle = "#C8A24B";
          ctx.beginPath();
          ctx.arc(head[0], head[1], (3 + Math.sin(time * 6) * 0.8) / Math.sqrt(k.s), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- ribbons: the world inside the line ----
      const rib = seg(t, 0.78, 0.9);
      if (rib > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "lighter";
        for (const r of RIBBONS) {
          ctx.globalAlpha = rib * 0.5;
          ctx.strokeStyle = r.hue;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let x = -20; x <= vw + 20; x += 14) {
            const f = x / vw;
            const y =
              vh * (0.5 + r.yof * 0.32) +
              Math.sin(f * 5 + time * r.speed * 2 + r.seed) * r.amp * (0.6 + rib) +
              Math.sin(f * 11 - time * r.speed + r.seed * 2) * r.amp * 0.35;
            if (x === -20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ---- the signature ----
      const sig = seg(t, 0.915, 0.985);
      if (sig > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(vw / 2, vh * 0.42);
        const sc = Math.min(vw / 900, 1.15);
        ctx.scale(sc, sc);
        ctx.strokeStyle = "#f1ece2";
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(200,162,75,0.6)";
        ctx.shadowBlur = 18;
        let budget = sigLen * ease(sig);
        ctx.beginPath();
        ctx.moveTo(SIG[0][0], SIG[0][1]);
        for (let i = 0; i < SIG.length - 1; i++) {
          if (budget <= 0) break;
          const d = Math.hypot(SIG[i + 1][0] - SIG[i][0], SIG[i + 1][1] - SIG[i][1]);
          const f = Math.min(budget / d, 1);
          ctx.lineTo(
            SIG[i][0] + (SIG[i + 1][0] - SIG[i][0]) * f,
            SIG[i][1] + (SIG[i + 1][1] - SIG[i][1]) * f
          );
          budget -= d;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [tier]);

  const onFrameKey = useCallback((e: React.KeyboardEvent, href: string) => {
    if (e.key === "Enter") window.location.assign(href);
  }, []);
  void onFrameKey;

  if (tier !== "full") return null;

  const cap = caption >= 0 ? CAPTIONS[caption] : null;
  const dark = phase === "finale" || tRef.current > 0.79;

  return (
    <section aria-label="One line — the story" data-canvas-walk>
      {/* the drawing */}
      <div className="fixed inset-0 z-0">
        <canvas ref={canvas} className="h-full w-full" />
        {/* paper grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.7 0 0 0 0 0.66 0 0 0 0 0.58 0 0 0 0.045 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* world-anchored clickable work — same transform as the camera */}
      <div className="fixed inset-0 z-[5] overflow-hidden" style={{ pointerEvents: "none" }}>
        <div ref={worldEl} style={{ transformOrigin: "0 0", position: "absolute", inset: 0 }}>
          {FRAMES.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              data-fx={f.x}
              className="group absolute block"
              style={{
                left: f.x,
                top: f.y,
                width: f.w,
                pointerEvents: "auto",
                opacity: 0,
                transform: `rotate(${f.rot ?? 0}deg)`,
              }}
            >
              {f.src ? (
                <span className="block bg-[#fbf7ec] p-1.5 pb-5 shadow-lg transition-transform duration-300 group-hover:-translate-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.label} style={{ height: f.h - 26 }} className="w-full object-cover" loading="lazy" />
                  <span className="mt-1 block text-center font-mono text-[8px] uppercase tracking-[0.15em] text-[#6b6353]">
                    {f.label}
                  </span>
                </span>
              ) : (
                <span
                  className="flex items-center justify-center border border-[#1f2c3d]/50 bg-[#1f2c3d]/5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#1f2c3d] transition-colors group-hover:bg-[#1f2c3d]/15"
                  style={{ height: f.h }}
                >
                  {f.label}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* ---------------- screen-space words ---------------- */}
      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
        {/* hero */}
        <div
          className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14"
          style={{
            opacity: phase === "hero" ? 1 : 0,
            transition: "opacity 400ms",
          }}
        >
          <p className="eyebrow" style={{ color: "#97876C" }}>
            Josh Whitehead — designer & builder
          </p>
          <h1 className="mt-4 font-display text-[12vw] leading-[0.95] tracking-tight text-[#241F17] sm:text-[8vw]">
            It starts
            <br />
            <span className="italic">with a line.</span>
          </h1>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-[#97876C]">
            Scroll to draw ↓
          </p>
        </div>

        {/* the one caption — fixed home, long dwell, real contrast */}
        {cap && phase === "walk" && (
          <div key={caption} className="absolute bottom-14 left-6 max-w-lg sm:left-14 animate-rise">
            <div
              className="border-l-2 py-1 pl-4"
              style={{ borderColor: "#C8A24B" }}
            >
              <p
                className="font-display text-2xl italic leading-snug sm:text-3xl"
                style={{ color: dark ? "#f1ece2" : "#241F17" }}
              >
                {cap.text}
              </p>
              {cap.sub && (
                <p
                  className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: dark ? "#8d8578" : "#8a7a5f" }}
                >
                  {cap.sub}
                </p>
              )}
            </div>
          </div>
        )}

        {/* finale words under the signature */}
        <div
          className="absolute inset-x-0 bottom-[16%] flex flex-col items-center text-center transition-opacity duration-700"
          style={{ opacity: phase === "finale" ? 1 : 0 }}
        >
          <p className="max-w-lg px-6 font-display text-2xl italic text-[#f1ece2] sm:text-3xl">
            Still just the kid who won&rsquo;t stop drawing.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#8d8578]">
            Home · Cincinnati, Ohio · Samantha, Gunner & Nolan
          </p>
        </div>
      </div>

      {/* finale CTAs */}
      <div
        className="fixed inset-x-0 bottom-[5%] z-20 flex justify-center transition-opacity duration-700"
        style={{
          opacity: phase === "finale" ? 1 : 0,
          pointerEvents: phase === "finale" ? "auto" : "none",
        }}
      >
        <div className="flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/work" className="border border-white/25 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
            The work
          </Link>
          <Link href="/products" className="border border-white/25 px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold">
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
