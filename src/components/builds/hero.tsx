"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LifeParticles, STAGES } from "./life-particles";

/**
 * The first screen is a build, and scroll conducts it: the hero is tall,
 * the frame is sticky, and your scroll position morphs the particles from
 * the school photo to the city. The headline changes with the era. At the
 * end it hands off to the builds.
 */
const LINES = [
  { era: "1993", head: "I've been making things since before I knew it was a job.", sub: "A kid who drew all day. The habit never left." },
  { era: "2008", head: "Five years behind a camera in places that didn't ask for one.", sub: "Marine Corps combat photographer. Where it clicked: how is this made?" },
  { era: "2019", head: "First designer in. Left as Head of Design. Twice.", sub: "Hush, then Spin. Apple and Google partnerships shipped. Both companies acquired." },
  { era: "Now", head: "Designer who builds. Agents in the loop, a person at the wheel.", sub: "I design and ship AI products end to end. The builds below run." },
];

export function Hero() {
  const [stage, setStage] = useState(0);
  const progress = useRef(0);
  const section = useRef<HTMLElement>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = section.current;
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      progress.current = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  const line = LINES[reduce ? 3 : stage] ?? LINES[0];
  return (
    <section id="top" ref={section} className="relative" style={{ height: reduce ? "100svh" : "320svh" }} aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <LifeParticles onStage={setStage} progress={reduce ? undefined : progress} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        </div>
        <div className="gutter relative mx-auto flex h-[100svh] w-full max-w-[1440px] flex-col justify-end pb-14 pt-28 sm:pb-20">
          <p className="text-sm text-fg-2">Josh Whitehead · I design and build AI products · Los Angeles</p>
          <h1 className="serif mt-5 max-w-[16ch] text-[2.5rem] leading-[0.98] text-balance transition-opacity duration-500 sm:text-[4.25rem] lg:text-[5.25rem]" key={line.era} aria-live="polite">
            {line.head}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-fg-2 text-pretty sm:text-xl">{line.sub}</p>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="#builds" className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-85">
                {stage >= 3 || reduce ? "See the builds" : "Skip to the builds"}
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </Link>
              <Link href="/lab/local" className="group inline-flex items-baseline gap-1.5 text-[15px] font-medium text-fg-2 transition-colors hover:text-fg">
                Run a model in your browser <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">›</span>
              </Link>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-fg-3">
              <span className="block text-fg-2">{STAGES[stage]?.label}</span>
              {reduce ? "65,536 particles · four photographs" : "scroll to move through the years · 65,536 particles · move the pointer"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
