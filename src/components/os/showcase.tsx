"use client";

import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/data";
import { useWindowManager } from "@/lib/window-store";
import { useAi } from "@/lib/ai-bus";
import { useSettings } from "@/lib/settings-store";

/**
 * The Panorama — a horizontal, scroll-snap cinematic canvas that traverses
 * Josh's career year by year. The desktop is no longer a page; it's a
 * window display you walk past, each scene composed in its own register.
 */

type Scene =
  | { kind: "intro" }
  | { kind: "origin"; year: string; title: string; place: string; note: string; palette: Palette }
  | { kind: "frame"; slug: string; year: string; palette: Palette; layout: SceneLayout }
  | { kind: "outro" };

type Palette = { bg: string; fg: string; accent: string; rule: string };
type SceneLayout = "left-text" | "right-text" | "center-stack" | "diagonal";

const SCENES: Scene[] = [
  { kind: "intro" },
  {
    kind: "origin",
    year: "2008",
    title: "U.S.M.C.",
    place: "Camp Pendleton · deployed",
    note: "Five years behind a Nikon as a combat photographer. Composition under pressure. Deadlines that don't care about you. A photograph is a document.",
    palette: { bg: "#0d100c", fg: "#e8ddc6", accent: "#a8c4a2", rule: "#1d251c" },
  },
  {
    kind: "frame",
    slug: "differential",
    year: "2013",
    palette: { bg: "#161310", fg: "#ecdfc4", accent: "#c8a76a", rule: "#2b2723" },
    layout: "left-text",
  },
  {
    kind: "frame",
    slug: "nationbuilder",
    year: "2014",
    palette: { bg: "#10160f", fg: "#e8ddc6", accent: "#a8c4a2", rule: "#1d251c" },
    layout: "diagonal",
  },
  {
    kind: "frame",
    slug: "saucey",
    year: "2015",
    palette: { bg: "#1c1410", fg: "#f5ede0", accent: "#e8c87a", rule: "#28201a" },
    layout: "right-text",
  },
  {
    kind: "frame",
    slug: "hush",
    year: "2017",
    palette: { bg: "#1c0e10", fg: "#f5e5dd", accent: "#e0a78e", rule: "#2a1518" },
    layout: "center-stack",
  },
  {
    kind: "frame",
    slug: "spin",
    year: "2019",
    palette: { bg: "#0a3024", fg: "#f5ede0", accent: "#e8c87a", rule: "#143a2c" },
    layout: "left-text",
  },
  {
    kind: "frame",
    slug: "boneyard",
    year: "2023",
    palette: { bg: "#0a3024", fg: "#f5ede0", accent: "#e8c87a", rule: "#143a2c" },
    layout: "right-text",
  },
  { kind: "outro" },
];

const AUTO_PAN_INTERVAL = 14_000;

export function Desktop() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Panorama />
    </div>
  );
}

function Panorama() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { settings } = useSettings();

  // Track scroll position to drive markers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        const x = el.scrollLeft;
        const idx = Math.round(x / w);
        setActiveIndex(Math.max(0, Math.min(SCENES.length - 1, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Idle auto-pan
  useEffect(() => {
    if (paused || settings.motion === "off") return;
    const el = scrollRef.current;
    if (!el) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % SCENES.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, AUTO_PAN_INTERVAL);
    return () => clearInterval(id);
  }, [paused, activeIndex, settings.motion]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches?.("input, textarea, [contenteditable]")) return;
      const el = scrollRef.current;
      if (!el) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        const next = Math.min(SCENES.length - 1, activeIndex + 1);
        el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        el.scrollTo({ left: prev * el.clientWidth, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  // Convert vertical wheel to horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY * 2.5, behavior: "auto" });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const jumpTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={scrollRef}
        className="h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden flex"
        style={{ scrollBehavior: "smooth" }}
      >
        {SCENES.map((scene, i) => (
          <SceneFrame key={i} scene={scene} index={i} total={SCENES.length} />
        ))}
      </div>

      <ChromeOverlay
        activeIndex={activeIndex}
        scenes={SCENES}
        onJump={jumpTo}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Scene frame                                                    */
/* ───────────────────────────────────────────────────────────── */

function SceneFrame({
  scene,
  index,
  total,
}: {
  scene: Scene;
  index: number;
  total: number;
}) {
  if (scene.kind === "intro") return <IntroScene index={index} total={total} />;
  if (scene.kind === "outro") return <OutroScene index={index} total={total} />;
  if (scene.kind === "origin") return <OriginScene scene={scene} index={index} total={total} />;
  return <FrameScene scene={scene} index={index} total={total} />;
}

/* ── Intro ──────────────────────────────────────────────────── */
function IntroScene({ index, total }: { index: number; total: number }) {
  return (
    <section
      className="relative flex h-full min-w-full snap-center items-center justify-center px-12"
      style={{ background: "#0a3024", color: "#f5ede0" }}
    >
      <SceneMarker index={index} total={total} year="" accent="#e8c87a" />

      <div className="relative flex flex-col items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-[#e8c87a]">
          Atelier · A working archive
        </p>
        <motion.h1
          className="mt-12 font-[var(--font-display)] leading-[0.85] tracking-tight gold-leaf"
          style={{ fontSize: "clamp(7rem, 24vw, 28rem)" }}
        >
          Josh Whitehead
        </motion.h1>
        <p className="mt-12 max-w-xl text-balance text-center text-[14px] leading-[1.85] text-[#cdbfa8]">
          Eighteen years of product design. Five behind a camera in the
          Marine Corps before that. What follows is a walk through the work,
          in order, from the beginning.
        </p>

        <div className="mt-16 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.45em] text-[#e8c87a]">
          <span>Walk the gallery</span>
          <span aria-hidden className="text-[#e8c87a]/70">→</span>
        </div>
      </div>

      <SceneEdge accent="#e8c87a" />
    </section>
  );
}

/* ── Origin ─────────────────────────────────────────────────── */
function OriginScene({
  scene,
  index,
  total,
}: {
  scene: Extract<Scene, { kind: "origin" }>;
  index: number;
  total: number;
}) {
  const { palette } = scene;
  return (
    <section
      className="relative flex h-full min-w-full snap-center items-center px-16"
      style={{ background: palette.bg, color: palette.fg }}
    >
      <SceneMarker index={index} total={total} year={scene.year} accent={palette.accent} />

      <div className="grid w-full grid-cols-12 gap-16 items-end">
        <div className="col-span-12 md:col-span-7 md:col-start-2">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.55em]"
            style={{ color: palette.accent }}
          >
            Origin · {scene.year} — 2013
          </p>
          <h2
            className="mt-6 font-[var(--font-display)] leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(5rem, 10vw, 12rem)" }}
          >
            {scene.title}
          </h2>
          <p
            className="mt-4 font-mono text-[10px] uppercase tracking-[0.5em]"
            style={{ color: palette.accent, opacity: 0.7 }}
          >
            {scene.place}
          </p>
          <p
            className="mt-12 max-w-xl text-balance text-[14px] leading-[1.95]"
            style={{ color: palette.fg, opacity: 0.78 }}
          >
            {scene.note}
          </p>
        </div>

        <div className="col-span-12 md:col-span-3 md:col-end-12 self-stretch flex items-end">
          <div
            className="font-[var(--font-display)] leading-none"
            style={{
              fontSize: "clamp(8rem, 18vw, 18rem)",
              color: palette.accent,
              opacity: 0.18,
              letterSpacing: "-0.05em",
            }}
          >
            {scene.year.slice(2)}
          </div>
        </div>
      </div>

      <SceneEdge accent={palette.accent} />
    </section>
  );
}

/* ── Project frame ──────────────────────────────────────────── */
function FrameScene({
  scene,
  index,
  total,
}: {
  scene: Extract<Scene, { kind: "frame" }>;
  index: number;
  total: number;
}) {
  const { open } = useWindowManager();
  const project = projects.find((p) => p.slug === scene.slug)!;
  const { palette, layout } = scene;

  const onOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    open({ app: "project", param: project.slug, origin: { x: r.x + r.width / 2, y: r.y + r.height / 2 } });
  };

  // Each layout is structurally different — not just left/right flip
  if (layout === "diagonal") {
    return (
      <section
        className="relative h-full min-w-full snap-center px-16 py-16"
        style={{ background: palette.bg, color: palette.fg }}
      >
        <SceneMarker index={index} total={total} year={scene.year} accent={palette.accent} />

        {/* Diagonal composition — title top-left, summary bottom-right, big year center */}
        <div className="relative h-full w-full">
          <div className="absolute left-0 top-[12%] max-w-2xl">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.55em]"
              style={{ color: palette.accent }}
            >
              Frame · {scene.year}
            </p>
            <h2
              className="mt-4 font-[var(--font-display)] leading-[0.85] tracking-tight"
              style={{ fontSize: "clamp(5rem, 11vw, 13rem)" }}
            >
              {project.title}
            </h2>
          </div>

          <div
            className="absolute right-0 bottom-[12%] max-w-md text-right"
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.5em]"
              style={{ color: palette.accent, opacity: 0.7 }}
            >
              {project.role}
            </p>
            <p
              className="mt-6 text-[14px] leading-[1.95]"
              style={{ color: palette.fg, opacity: 0.78 }}
            >
              {project.summary}
            </p>
            <button
              type="button"
              onClick={onOpen}
              className="mt-8 inline-block border-b border-current pb-1 font-mono text-[11px] uppercase tracking-[0.4em] transition-opacity hover:opacity-70"
              style={{ color: palette.accent }}
            >
              Open frame →
            </button>
          </div>

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-[var(--font-display)] leading-none"
            style={{
              fontSize: "clamp(14rem, 30vw, 32rem)",
              color: palette.accent,
              opacity: 0.06,
              letterSpacing: "-0.06em",
            }}
          >
            {scene.year}
          </div>
        </div>

        <SceneEdge accent={palette.accent} />
      </section>
    );
  }

  if (layout === "center-stack") {
    return (
      <section
        className="relative flex h-full min-w-full snap-center items-center justify-center px-16"
        style={{ background: palette.bg, color: palette.fg }}
      >
        <SceneMarker index={index} total={total} year={scene.year} accent={palette.accent} />

        <div className="flex flex-col items-center">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.55em]"
            style={{ color: palette.accent }}
          >
            {scene.year} · {project.role}
          </p>
          <h2
            className="mt-10 font-[var(--font-display)] leading-[0.82] tracking-tight"
            style={{ fontSize: "clamp(8rem, 18vw, 20rem)" }}
          >
            {project.title}
          </h2>

          <div
            className="mt-12 h-px w-32"
            style={{ background: palette.accent, opacity: 0.5 }}
          />

          <p className="mt-12 max-w-xl text-balance text-center text-[14px] leading-[1.95]" style={{ color: palette.fg, opacity: 0.78 }}>
            {project.summary}
          </p>

          <button
            type="button"
            onClick={onOpen}
            className="mt-12 border-b border-current pb-1 font-mono text-[11px] uppercase tracking-[0.4em] transition-opacity hover:opacity-70"
            style={{ color: palette.accent }}
          >
            Open frame →
          </button>
        </div>

        <SceneEdge accent={palette.accent} />
      </section>
    );
  }

  // left-text or right-text
  const textLeft = layout === "left-text";
  return (
    <section
      className="relative grid h-full min-w-full snap-center grid-cols-12 px-16"
      style={{ background: palette.bg, color: palette.fg }}
    >
      <SceneMarker index={index} total={total} year={scene.year} accent={palette.accent} />

      <div
        className={`col-span-12 flex flex-col justify-center md:col-span-6 ${
          textLeft ? "md:col-start-1 md:pr-12" : "md:col-start-7 md:pl-12 md:order-2"
        }`}
      >
        <p
          className="font-mono text-[10px] uppercase tracking-[0.55em]"
          style={{ color: palette.accent }}
        >
          Frame · {scene.year}
          <span className="mx-3 opacity-50">·</span>
          {project.role}
        </p>
        <h2
          className="mt-6 font-[var(--font-display)] leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(5rem, 11vw, 13rem)" }}
        >
          {project.title}
        </h2>
        <p
          className="mt-10 max-w-lg text-[14px] leading-[1.95]"
          style={{ color: palette.fg, opacity: 0.78 }}
        >
          {project.summary}
        </p>
        <div className="mt-12 flex items-center gap-8">
          <button
            type="button"
            onClick={onOpen}
            className="border-b border-current pb-1 font-mono text-[11px] uppercase tracking-[0.4em] transition-opacity hover:opacity-70"
            style={{ color: palette.accent }}
          >
            Open frame →
          </button>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.5em]"
            style={{ color: palette.accent, opacity: 0.6 }}
          >
            {project.status}
          </p>
        </div>
      </div>

      <div
        className={`col-span-12 hidden md:flex md:col-span-6 ${
          textLeft ? "md:col-start-7 md:order-2" : "md:col-start-1 md:order-1"
        } items-center justify-center`}
      >
        <div
          className="font-[var(--font-display)] leading-none"
          style={{
            fontSize: "clamp(12rem, 26vw, 28rem)",
            color: palette.accent,
            opacity: 0.85,
            letterSpacing: "-0.05em",
          }}
        >
          {project.title.slice(0, 1)}
        </div>
      </div>

      <SceneEdge accent={palette.accent} />
    </section>
  );
}

/* ── Outro ──────────────────────────────────────────────────── */
function OutroScene({ index, total }: { index: number; total: number }) {
  const { open } = useWindowManager();
  return (
    <section
      className="relative flex h-full min-w-full snap-center items-center justify-center px-16"
      style={{ background: "#0d0d0e", color: "#f5ede0" }}
    >
      <SceneMarker index={index} total={total} year="Now" accent="#e8c87a" />

      <div className="flex flex-col items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-[#e8c87a]">
          End of gallery · the rest is conversation
        </p>
        <h2
          className="mt-12 font-[var(--font-display)] leading-[0.85] tracking-tight gold-leaf"
          style={{ fontSize: "clamp(6rem, 16vw, 20rem)" }}
        >
          Send a signal
        </h2>
        <p className="mt-12 max-w-lg text-balance text-center text-[14px] leading-[1.95] text-[#cdbfa8]">
          I read every message. Right now I&rsquo;m taking on a small number
          of design partnerships, advisory roles, and the occasional public
          collaboration.
        </p>
        <div className="mt-12 flex items-center gap-8">
          <button
            type="button"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              open({ app: "contact", origin: { x: r.x + r.width / 2, y: r.y + r.height / 2 } });
            }}
            className="border-b border-[#e8c87a] pb-1 font-mono text-[11px] uppercase tracking-[0.4em] text-[#e8c87a] transition-opacity hover:opacity-70"
          >
            Compose a message →
          </button>
          <a
            href="mailto:joshwhitehead.design@gmail.com"
            className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#cdbfa8] transition-colors hover:text-[#f5ede0]"
          >
            joshwhitehead.design@gmail.com
          </a>
        </div>
      </div>

      <SceneEdge accent="#e8c87a" />
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Scene chrome                                                   */
/* ───────────────────────────────────────────────────────────── */

function SceneMarker({
  index,
  total,
  year,
  accent,
}: {
  index: number;
  total: number;
  year: string;
  accent: string;
}) {
  return (
    <div className="absolute left-12 top-10 flex items-baseline gap-4">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.55em]"
        style={{ color: accent }}
      >
        Scene {String(index + 1).padStart(2, "0")}
        <span className="mx-2 opacity-50">/</span>
        {String(total).padStart(2, "0")}
      </span>
      {year && (
        <>
          <span className="text-[10px]" style={{ color: accent, opacity: 0.4 }}>·</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.55em]" style={{ color: accent, opacity: 0.8 }}>
            {year}
          </span>
        </>
      )}
    </div>
  );
}

/* Subtle vertical accent line on the right edge of each scene */
function SceneEdge({ accent }: { accent: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-12 right-0 w-px"
      style={{ background: accent, opacity: 0.15 }}
    />
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Chrome overlay — scrubber + ai prompt                         */
/* ───────────────────────────────────────────────────────────── */

function ChromeOverlay({
  activeIndex,
  scenes,
  onJump,
}: {
  activeIndex: number;
  scenes: Scene[];
  onJump: (i: number) => void;
}) {
  const { submit, setPanelOpen } = useAi();
  const [draft, setDraft] = useState("");

  const askAi = () => {
    const v = draft.trim();
    if (!v) return;
    setPanelOpen(true);
    setTimeout(() => submit(v), 60);
    setDraft("");
  };

  const labelFor = (s: Scene, i: number): string => {
    if (s.kind === "intro") return "Atelier";
    if (s.kind === "outro") return "Signal";
    if (s.kind === "origin") return s.year;
    if (s.kind === "frame") return s.year;
    return String(i);
  };

  return (
    <>
      {/* AI prompt — sits above the scrubber */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          askAi();
        }}
        className="absolute bottom-[5.5rem] left-1/2 z-30 flex w-[min(440px,calc(100vw-3rem))] -translate-x-1/2 items-center gap-2 border border-bone-line/40 bg-ink/55 px-3 py-2 backdrop-blur-md"
      >
        <span className="font-[var(--font-display)] text-base italic leading-none text-bone-dim">›</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Atelier…"
          className="flex-1 bg-transparent text-xs text-bone placeholder:text-bone-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted transition-colors hover:text-bone disabled:opacity-30"
        >
          Ask
        </button>
      </form>

      {/* Year scrubber */}
      <div className="absolute inset-x-0 bottom-10 z-20 flex items-center justify-center">
        <div className="flex items-end gap-7">
          {scenes.map((s, i) => {
            const active = i === activeIndex;
            const label = labelFor(s, i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                className="group flex flex-col items-center gap-2"
                aria-label={`Jump to scene ${i + 1}: ${label}`}
              >
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.4em] transition-colors"
                  style={{
                    color: active ? "#e8c87a" : "rgba(245,237,224,0.4)",
                  }}
                >
                  {label}
                </span>
                <span
                  className="block h-px transition-all"
                  style={{
                    width: active ? 22 : 10,
                    background: active ? "#e8c87a" : "rgba(245,237,224,0.3)",
                    height: active ? 2 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Silence unused-imports for primitives reserved for future use
void useMotionValue;
void useScroll;
void useTransform;
