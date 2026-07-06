"use client";

import { journal } from "@/lib/data";
import { SundayService } from "@/components/sunday-service";
import { Reveal } from "@/components/reveal";
import { useOpenInWindow } from "../link";

export function JournalContent() {
  useOpenInWindow();
  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="grid grid-cols-12 gap-4 border-b border-bone-line pb-8">
        <div className="col-span-12 md:col-span-8">
          <Reveal>
            <p className="overline">// Journal · field notes</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-3 font-[var(--font-display)] text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] tracking-tight text-bone">
              <span className="block">Notes from</span>
              <span className="block italic">the field.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-6 max-w-2xl text-balance text-lg leading-[1.45] text-bone-dim">
              AI in the design process, fifteen years of shipping, what the
              Corps teaches you, and what I&rsquo;m still trying to figure
              out.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.25} className="col-span-12 md:col-span-4 md:self-end">
          <SundayService />
        </Reveal>
      </div>

      <ol className="mt-8 grid grid-cols-1 gap-px border border-bone-line bg-bone-line md:grid-cols-2">
        {journal.map((j, i) => (
          <Reveal key={j.slug} delay={i * 0.06}>
            <li className="h-full bg-ink">
              <a
                href={`/journal/${j.slug}`}
                className="group flex h-full flex-col justify-between gap-6 p-6 hover:bg-ink-100 sm:p-8"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                    Issue · {String(i + 1).padStart(2, "0")} · {j.category}
                  </p>
                  <h2 className="mt-3 font-[var(--font-display)] text-3xl text-bone group-hover:text-safelight sm:text-4xl">
                    {j.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-balance text-base leading-relaxed text-bone-dim">
                    {j.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                  <span>{j.date}</span>
                  <span className="flex items-center gap-2">
                    {j.readTime} read
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </a>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
