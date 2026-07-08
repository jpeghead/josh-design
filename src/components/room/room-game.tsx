"use client";

/**
 * THE ROOM — the game.
 *
 * You play the silhouette. Walk with ← → (or A/D), interact with E
 * (or ↑ / Space). Each era holds one glowing memory: trigger it and the
 * room blinks, the year rolls over, the room redresses around you — and
 * you age. Kid → teen → Marine → adult. Secondary objects give a line;
 * some open the real work. Tap-to-move on touch.
 *
 * Opens on 1987 as a title cinematic (you can't walk yet — you're the
 * one in the crib). Any key begins. Ends at the workbench, now.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { detectTier, type CanvasTier } from "../canvas/capability";
import { ERAS } from "./eras";
import {
  drawRoom,
  drawPlayer,
  drawMarker,
  drawPrompt,
  DW,
  DH,
  FLOOR_Y,
  type Archetype,
} from "./room-art";

/* --------------------------------------------------------- game config */

type Interactable = {
  x: number;
  y: number; // marker height (world)
  label: string;
  line?: string; // memory line shown on trigger
  advance?: boolean; // primary — moves time forward
  href?: string; // opens real work
};

const ARCH_BY_ERA: Archetype[] = [
  "kid", // 1987 (unused — cinematic)
  "kid", // 1993
  "teen", // 2001
  "teen", // 2004
  "teen", // 2006
  "marine", // 2008
  "marine", // 2009
  "adult", // 2014
  "adult", // 2019
  "adult", // 2021
  "adult", // 2023
  "adult", // now
];

const SPAWN_X = [0, 760, 760, 760, 700, 760, 760, 760, 760, 860, 620, 760];

const INTERACT: Interactable[][] = [
  /* 1987 — cinematic, no player */
  [],
  /* 1993 */
  [
    { x: 650, y: FLOOR_Y - 110, label: "draw", line: "All day. Every day. Drawing was never a choice.", advance: true },
    { x: 1120, y: FLOOR_Y - 90, label: "toy box", line: "Every toy was a prop in a story." },
  ],
  /* 2001 */
  [
    { x: 653, y: FLOOR_Y - 170, label: "log on", line: "The screen glowed and something clicked on in me too.", advance: true },
    { x: 1030, y: FLOOR_Y - 380, label: "posters", line: "Loud walls. Louder headphones." },
  ],
  /* 2004 */
  [
    { x: 706, y: FLOOR_Y - 170, label: "photo strip", line: "Samantha. Junior year. She's in every room after this one.", advance: true },
    { x: 477, y: FLOOR_Y - 120, label: "skateboard", line: "Mostly bruises. Worth it." },
  ],
  /* 2006 */
  [
    { x: 648, y: FLOOR_Y - 210, label: "the easel", line: "Career school, then fine art. Anything they'd teach me.", advance: true },
    { x: 500, y: FLOOR_Y - 175, label: "poster tubes", line: "Printed. Mounted. Cut by hand — I've still got the scar." },
  ],
  /* 2008 */
  [
    { x: 1143, y: FLOOR_Y - 120, label: "the camera", line: "The Marines made me a photographer. That's where it clicked.", advance: true },
    { x: 1231, y: FLOOR_Y - 140, label: "wedding photo", line: "Married in June. Enlisted the same year." },
    { x: 631, y: FLOOR_Y - 450, label: "the flag", line: "Parris Island → Camp Geiger → Fort Meade → MCAS New River." },
  ],
  /* 2009 */
  [
    { x: 1150, y: FLOOR_Y - 130, label: "the crib", line: "Gunner. November 1, 2009. Same corner I started in.", advance: true },
    { x: 740, y: FLOOR_Y - 180, label: "the rocker", line: "The room got smaller and better." },
  ],
  /* 2014 */
  [
    { x: 694, y: FLOOR_Y - 180, label: "ship it", line: "Los Angeles. Saucey, then Hush — first designer in, Head of Design out.", advance: true },
    { x: 990, y: FLOOR_Y - 350, label: "wireframes", href: "/work", label2: "open the work" } as Interactable & { label2?: string },
  ],
  /* 2019 */
  [
    { x: 690, y: FLOOR_Y - 190, label: "keep shipping", line: "Spin. WWDC 2020. Then VGV and Google I/O. The work commuted — I didn't.", advance: true },
    { x: 982, y: FLOOR_Y - 390, label: "WWDC badge", href: "/work/spin" },
    { x: 1130, y: FLOOR_Y - 150, label: "the scooter", href: "/work/spin" },
  ],
  /* 2021 */
  [
    { x: 1150, y: FLOOR_Y - 130, label: "the crib", line: "Nolan. 2021. Third time this corner held everything.", advance: true },
    { x: 940, y: FLOOR_Y - 60, label: "toys", line: "The floor was never clean again. Never mattered." },
  ],
  /* 2023 */
  [
    { x: 560, y: FLOOR_Y - 130, label: "the boxes", line: "2023. We packed the whole life and drove it home to Cincinnati.", advance: true },
    { x: 1155, y: FLOOR_Y - 40, label: "dust outline", line: "Where the crib stood. Three times." },
  ],
  /* now */
  [
    { x: 684, y: FLOOR_Y - 190, label: "keep building", line: "Boneyard. OLO. Weaver. The books. Same desk, same kid.", advance: true },
    { x: 640, y: 300, label: "the rockets", line: "Their drawings, pinned over my bench. The same rocket." },
    { x: 935, y: FLOOR_Y - 130, label: "manuscripts", href: "/writing" },
  ],
];

const WALK_SPEED = 340; // world px/s
const X_MIN = 90;
const X_MAX = 1290;

/* ------------------------------------------------------------ the game */

export function RoomGame() {
  const router = useRouter();
  const [tier, setTier] = useState<CanvasTier | null>(null);
  const [phase, setPhase] = useState<"title" | "play" | "finale">("title");
  const [era, setEra] = useState(0);
  const [memory, setMemory] = useState<string | null>(null);

  const canvas = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ x: 760, v: 0, facing: 1, walk: 0, target: null as number | null });
  const world = useRef({
    era: 0,
    settle: 1,
    dark: 0, // blink overlay
    transitioning: 0, // 0 none | 1 fading out | 2 fading in
    nextEra: 0,
    done: new Set<number>(),
    memTimer: 0,
  });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => setTier(detectTier()), []);

  /* QA deep link: /?era=5 jumps straight into play at that era */
  useEffect(() => {
    if (tier !== "full") return;
    const v = Number(new URLSearchParams(window.location.search).get("era"));
    if (Number.isFinite(v) && v >= 1 && v < ERAS.length) {
      const w = world.current;
      w.era = v;
      w.settle = 1;
      w.dark = 0;
      w.transitioning = 0;
      player.current.x = SPAWN_X[v] ?? 760;
      setEra(v);
      setPhase("play");
    }
  }, [tier]);

  useEffect(() => {
    if (tier === "full") {
      document.documentElement.classList.add("canvas-mode", "chapter-dark");
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.classList.remove("canvas-mode", "chapter-dark");
        document.body.style.overflow = "";
      };
    }
  }, [tier]);

  /* input */
  useEffect(() => {
    if (tier !== "full") return;
    const down = (ev: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "e", "A", "D", "E"].includes(ev.key)) {
        ev.preventDefault();
      }
      keys.current[ev.key.toLowerCase()] = true;
      if (phaseRef.current === "title") {
        beginPlay();
        return;
      }
      if (["e", " ", "arrowup"].includes(ev.key.toLowerCase())) tryInteract();
    };
    const up = (ev: KeyboardEvent) => {
      keys.current[ev.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  function beginPlay() {
    const w = world.current;
    w.transitioning = 1;
    w.nextEra = 1;
    setPhase("play");
  }

  function nearestInteractable(): Interactable | null {
    const w = world.current;
    if (w.transitioning) return null;
    const list = INTERACT[w.era] ?? [];
    let best: Interactable | null = null;
    let bestD = 82;
    for (const it of list) {
      const d = Math.abs(it.x - player.current.x);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  function tryInteract() {
    const w = world.current;
    const it = nearestInteractable();
    if (!it) return;
    if (it.href) {
      router.push(it.href);
      return;
    }
    if (it.line) {
      setMemory(it.line);
      w.memTimer = 4.6;
    }
    if (it.advance && !w.transitioning) {
      if (w.era >= ERAS.length - 1) {
        setPhase("finale");
        return;
      }
      w.transitioning = 1;
      w.nextEra = w.era + 1;
    }
  }

  /* pointer: tap/click to walk (and interact when close) */
  useEffect(() => {
    if (tier !== "full") return;
    const c = canvas.current;
    if (!c) return;
    const onTap = (ev: PointerEvent) => {
      if (phaseRef.current === "title") {
        beginPlay();
        return;
      }
      const rect = c.getBoundingClientRect();
      const vw = rect.width,
        vh = rect.height;
      const s = Math.max(vw / DW, vh / DH);
      const wx = (ev.clientX - rect.left - (vw - DW * s) / 2) / s;
      const it = nearestInteractable();
      if (it && Math.abs(it.x - player.current.x) < 82 && Math.abs(wx - it.x) < 120) {
        tryInteract();
        return;
      }
      player.current.target = Math.min(Math.max(wx, X_MIN), X_MAX);
    };
    c.addEventListener("pointerdown", onTap);
    return () => c.removeEventListener("pointerdown", onTap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  /* main loop */
  useEffect(() => {
    if (tier !== "full") return;
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = now / 1000;

      const dpr = Math.min(devicePixelRatio, 1.75);
      if (c.width !== c.offsetWidth * dpr) {
        c.width = c.offsetWidth * dpr;
        c.height = c.offsetHeight * dpr;
      }
      if (c.offsetWidth < 50) return;
      const vw = c.offsetWidth,
        vh = c.offsetHeight;

      const w = world.current;
      const pl = player.current;

      /* ---- simulate ---- */
      if (phaseRef.current === "play" && !w.transitioning) {
        let dir = 0;
        if (keys.current["arrowleft"] || keys.current["a"]) dir -= 1;
        if (keys.current["arrowright"] || keys.current["d"]) dir += 1;
        if (dir !== 0) pl.target = null;
        if (pl.target !== null) {
          const d = pl.target - pl.x;
          if (Math.abs(d) < 6) pl.target = null;
          else dir = Math.sign(d);
        }
        pl.v = dir * WALK_SPEED;
        if (dir !== 0) pl.facing = dir;
        pl.x = Math.min(Math.max(pl.x + pl.v * dt, X_MIN), X_MAX);
        if (dir !== 0) pl.walk += dt * 9;
      }

      // era transition: fade out → swap + redress → fade in
      if (w.transitioning === 1) {
        w.dark = Math.min(w.dark + dt * 2.4, 1);
        if (w.dark >= 1) {
          w.era = w.nextEra;
          setEra(w.nextEra);
          w.settle = 0;
          pl.x = SPAWN_X[w.era] ?? 760;
          pl.target = null;
          w.transitioning = 2;
        }
      } else if (w.transitioning === 2) {
        w.dark = Math.max(w.dark - dt * 1.6, 0);
        w.settle = Math.min(w.settle + dt * 0.8, 1);
        if (w.dark <= 0 && w.settle >= 1) w.transitioning = 0;
      } else if (w.settle < 1) {
        w.settle = Math.min(w.settle + dt * 0.8, 1);
      }

      if (w.memTimer > 0) {
        w.memTimer -= dt;
        if (w.memTimer <= 0) setMemory(null);
      }

      /* ---- render ---- */
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#07090b";
      g.fillRect(0, 0, vw, vh);
      const s = Math.max(vw / DW, vh / DH);
      g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ((vw - DW * s) / 2), dpr * ((vh - DH * s) / 2));

      drawRoom(g, ERAS[w.era].id, time, w.settle);

      if (phaseRef.current !== "title" && w.era > 0) {
        // markers + prompt
        const near = nearestInteractable();
        for (const it of INTERACT[w.era] ?? []) {
          if (it.advance && w.done.has(w.era)) continue;
          drawMarker(g, it.x, it.y, time, it === near);
        }
        drawPlayer(g, pl.x, ARCH_BY_ERA[w.era], pl.facing, pl.walk, Math.abs(pl.v) > 1 && !w.transitioning);
        if (near && !w.transitioning) {
          drawPrompt(g, near.x, near.y - 18, (near as Interactable & { label2?: string }).label2 ?? near.label);
        }
      }

      // blink
      if (w.dark > 0) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = `rgba(4,5,6,${w.dark})`;
        g.fillRect(0, 0, vw, vh);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  if (tier !== "full") return null;

  return (
    <section aria-label="The room — a playable life" data-canvas-walk className="fixed inset-0 z-0">
      <canvas ref={canvas} className="h-full w-full touch-none" />

      {/* grain + vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.55 0 0 0 0 0.58 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 46%, transparent 40%, rgba(4,5,6,0.55) 78%, rgba(4,5,6,0.9) 100%)",
        }}
      />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        {/* year */}
        <div className="absolute right-6 top-20 sm:right-12">
          <span className="font-display text-5xl italic tabular-nums tracking-tight text-[#cfd8db]/85 sm:text-6xl">
            {ERAS[era].year}
          </span>
        </div>

        {/* title screen */}
        {phase === "title" && (
          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-14">
            <p className="eyebrow" style={{ color: "#5d6b72" }}>
              Josh Whitehead — designer &amp; builder
            </p>
            <h1 className="mt-4 font-display text-[11vw] leading-[0.95] tracking-tight text-[#cfd8db] sm:text-[7.5vw]">
              One room.
              <br />
              <span className="italic">A playable life.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-[#8fa0a8]">
              May 22, 1987. It starts with a crib.
            </p>
            <p className="mt-10 animate-pulse font-mono text-[11px] uppercase tracking-[0.3em] text-[#C8A24B]">
              Press any key — or tap — to grow up
            </p>
          </div>
        )}

        {/* controls hint */}
        {phase === "play" && era === 1 && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#5d6b72]">
              ← → walk · E interact
            </p>
          </div>
        )}

        {/* memory line */}
        {memory && (
          <div key={memory} className="absolute bottom-16 left-6 max-w-lg sm:left-14 animate-rise">
            <div className="border-l-2 py-1 pl-4" style={{ borderColor: "#C8A24B" }}>
              <p className="font-display text-2xl italic leading-snug text-[#cfd8db] sm:text-3xl">{memory}</p>
            </div>
          </div>
        )}

        {/* finale */}
        {phase === "finale" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-center backdrop-blur-[2px]">
            <p className="max-w-lg px-6 font-display text-3xl italic text-[#cfd8db] sm:text-4xl">
              The camera never moved.
              <br />
              Everything else did.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#8fa0a8]">
              Cincinnati, Ohio · Samantha, Gunner &amp; Nolan
            </p>
          </div>
        )}
      </div>

      {/* finale CTAs */}
      {phase === "finale" && (
        <div className="absolute inset-x-0 bottom-[14%] z-20 flex justify-center">
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
      )}
    </section>
  );
}
