"use client";

import Link from "next/link";
import { useState } from "react";
import { LifeParticles, STAGES } from "./life-particles";

/** The first screen is a build: the particle field, with the words over it. */
export function Hero() {
  const [stage, setStage] = useState(0);
  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <LifeParticles onStage={setStage} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>
      <div className="gutter relative mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col justify-end pb-14 pt-28 sm:pb-20">
        <p className="text-sm text-fg-2">Josh Whitehead · I design and build AI products · Los Angeles</p>
        <h1 className="serif mt-5 max-w-[16ch] text-[2.75rem] leading-[0.98] text-balance sm:text-[4.5rem] lg:text-[5.5rem]">
          Designer who builds. Agents in the loop, a person at the wheel.
        </h1>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="#builds" className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-85">
              See the builds
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
            </Link>
            <Link href="/lab/local" className="group inline-flex items-baseline gap-1.5 text-[15px] font-medium text-fg-2 transition-colors hover:text-fg">
              Run a model in your browser <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">›</span>
            </Link>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-fg-3" aria-live="polite">
            <span className="block text-fg-2">{STAGES[stage]?.label}</span>
            65,536 particles · four photographs · two shaders · move the pointer
          </p>
        </div>
      </div>
    </section>
  );
}
