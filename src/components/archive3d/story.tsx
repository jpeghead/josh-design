"use client";

/**
 * The DOM story — real sections, real headings, real captions. The canvas
 * creates the place; this carries the meaning and the fallback order.
 *
 * Tier gate: capable devices with motion allowed get the world; everyone
 * else gets the server-rendered site untouched (it stays in the document
 * either way for assistive tech, search, and find-in-page).
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { detectTier, type CanvasTier } from "@/components/canvas/capability";
import { CHAPTERS } from "./chapters";
import { useScrollConductor } from "./conductor";
import { World } from "./world";

const IDS = CHAPTERS.map((c) => `ch-${c.id}`);

export function ArchiveWorld() {
  const [tier, setTier] = useState<CanvasTier | "pending">("pending");
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [lost, setLost] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => setTier(detectTier()), []);

  const full = tier === "full";
  const { state, step } = useScrollConductor(useMemo(() => (full ? IDS : []), [full]), false);

  // the site chrome adapts to the world
  useEffect(() => {
    if (!full) return;
    const html = document.documentElement;
    html.classList.add("canvas-mode");
    return () => html.classList.remove("canvas-mode", "chapter-dark");
  }, [full]);
  useEffect(() => {
    if (!full) return;
    document.documentElement.classList.toggle("chapter-dark", !!CHAPTERS[active]?.dark);
  }, [active, full]);

  const fonts = useMemo(() => {
    if (typeof window === "undefined") return { display: "Georgia, serif", mono: "ui-monospace, monospace" };
    const cs = getComputedStyle(document.documentElement);
    return {
      display: cs.getPropertyValue("--font-display").trim() || "Georgia, serif",
      mono: cs.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace",
    };
  }, []);

  const onChapter = useCallback((i: number) => setActive(i), []);
  const onHover = useCallback((id: string | null) => setHover(id), []);
  const onLost = useCallback(() => setLost(true), []);
  const onReady = useCallback(() => setBooted(true), []);

  if (!full) return null;

  return (
    <>
      <style>{`
        .ch-copy { pointer-events: auto; opacity: 0; transform: translateY(18px); transition: opacity .9s var(--ease-cinematic), transform .9s var(--ease-cinematic); }
        [data-active="true"] .ch-copy { opacity: 1; transform: none; }
        .ch-copy.on-dark { color: var(--color-bone); }
        .ch-copy.on-light { color: var(--color-graphite); }
        .ch-scrim { position:absolute; inset:0; pointer-events:none; }
        .ch-scrim.on-dark { background: linear-gradient(to top, rgba(8,9,12,.72), rgba(8,9,12,0) 62%); }
        .ch-scrim.on-light { background: linear-gradient(to top, rgba(244,238,226,.5), rgba(244,238,226,0) 55%); }
        .ch-fig { display:flex; gap:.75rem; align-items:baseline; padding:.35rem 0; border-top:1px solid color-mix(in srgb, currentColor 18%, transparent); transition: opacity .35s; }
        .ch-fig[data-hover="true"] { opacity: 1; }
        .ch-figs:hover .ch-fig:not([data-hover="true"]) { opacity: .55; }
        .ch-poster { position:fixed; inset:0; z-index:5; background:#0b0d12; transition: opacity .6s var(--ease-cinematic); display:flex; align-items:center; justify-content:center; }
      `}</style>

      {/* the world — fixed under the story */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {!lost && (
          <World cond={state} step={step} onChapter={onChapter} onHover={onHover} onLost={onLost} onReady={onReady} fonts={fonts} />
        )}
      </div>

      {/* poster until the first frame is real */}
      <div className="ch-poster" style={{ opacity: booted ? 0 : 1, pointerEvents: "none" }} aria-hidden="true">
        <p className="eyebrow text-bone">Whitehead — the archive</p>
      </div>

      {lost && (
        <p className="fixed left-4 top-20 z-20 max-w-sm border border-gold/60 bg-ink/90 px-4 py-2 font-mono text-[11px] text-bone">
          The 3D room paused (graphics context lost). The story continues below.
        </p>
      )}

      {/* the chapters — semantic, in document order. The layer itself lets the
          pointer through to the room; only the copy block catches it. */}
      <div className="pointer-events-none relative z-10">
        {CHAPTERS.map((c, i) => {
          const tone = c.dark ? "on-dark" : "on-light";
          return (
            <section
              key={c.id}
              id={`ch-${c.id}`}
              data-chapter={c.id}
              data-active={i === active}
              aria-labelledby={`ch-${c.id}-title`}
              className="relative"
              style={{ height: `${c.scrollWeight * 100}vh` }}
            >
              <div className="sticky top-0 flex h-[100dvh] items-end">
                <div className={`ch-scrim ${tone}`} />
                <div className={`ch-copy ${tone} relative mx-auto w-full max-w-6xl px-5 pb-[10vh] sm:px-8 sm:pb-[12vh]`}>
                  <div className="max-w-xl">
                    <p className="eyebrow">{c.copy.eyebrow}</p>
                    <h2 id={`ch-${c.id}-title`} className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl lg:text-6xl">
                      {c.copy.title}
                    </h2>
                    <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed opacity-85 sm:text-lg">{c.copy.body}</p>
                    {c.artifacts && c.artifacts.length > 0 && (
                      <ul className="ch-figs mt-6 list-none p-0">
                        {c.artifacts.map((a) => (
                          <li key={a.id}>
                            <figure className="ch-fig m-0" data-hover={hover === a.id}>
                              <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">{a.type}</span>
                              <figcaption className="text-sm">
                                <span className="font-medium">{a.title}</span>
                                <span className="opacity-70"> — {a.caption}</span>
                              </figcaption>
                            </figure>
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.copy.action && (
                      <p className="mt-7">
                        <Link href={c.copy.action.href} className="font-mono text-xs uppercase tracking-widest underline underline-offset-4 decoration-gold hover:opacity-70">
                          {c.copy.action.label}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
