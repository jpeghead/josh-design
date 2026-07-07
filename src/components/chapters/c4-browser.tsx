"use client";

/**
 * CHAPTER 4 — THE BROWSER. 2013–2015.
 * The viewport grows browser chrome. URLs type themselves. Sites load the
 * old way — skeletons, then life. Cincinnati first, then the jump west.
 */

import type { ChapterProps } from "./engine";
import { seg } from "./engine";

const SITES = [
  {
    url: "differential.com/portfolio",
    place: "CINCINNATI, OH · FIRST DESIGN JOB · 2013",
    line: "Designed in the morning. Built the front-end by night.",
    a: 0.08,
    b: 0.45,
    hue: "#3b6ea5",
  },
  {
    url: "nationbuilder.com — senior designer",
    place: "LOS ANGELES, CA · THE JUMP WEST · 2014",
    line: "Software for the people running campaigns.",
    a: 0.45,
    b: 0.85,
    hue: "#a54d3b",
  },
];

export function C4Browser({ t }: ChapterProps) {
  const chrome = seg(t, 0.0, 0.1);
  const outro = seg(t, 0.86, 0.97);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#d6d2c9]">
      {/* desktop wallpaper vibe */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#cfd8d4 0%,#c4beb4 100%)" }} />

      {/* the browser window */}
      <div
        className="relative z-10 w-[92%] max-w-5xl overflow-hidden rounded-lg border border-black/25 bg-[#ece9e2] shadow-2xl"
        style={{
          transform: `translateY(${(1 - chrome) * 60}vh) scale(${0.96 + chrome * 0.04})`,
          height: "78%",
        }}
      >
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-black/15 bg-[#dcd8ce] px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-[#c14b3c]" />
          <span className="h-3 w-3 rounded-full bg-[#d3a94e]" />
          <span className="h-3 w-3 rounded-full bg-[#5d9e63]" />
          <div className="ml-3 flex-1 rounded border border-black/15 bg-white/80 px-3 py-1 font-mono text-[11px] text-[#333]">
            {(() => {
              const site = SITES.find((s) => t >= s.a && t < s.b) ?? SITES[t >= SITES[1].b ? 1 : 0];
              const local = seg(t, site.a, site.a + 0.08);
              const shown = Math.round(site.url.length * local);
              return (
                <>
                  https://{site.url.slice(0, shown)}
                  <span className="animate-pulse">|</span>
                </>
              );
            })()}
          </div>
        </div>

        {/* page area */}
        <div className="relative h-full">
          {SITES.map((s) => {
            const on = t >= s.a && t < s.b + 0.06;
            const local = seg(t, s.a + 0.06, s.b - 0.06);
            const loaded = seg(local, 0.15, 0.55);
            return (
              <div key={s.url} className="absolute inset-0 bg-white" style={{ opacity: on ? 1 : 0 }}>
                {/* loading bar */}
                <div className="h-1 bg-black/10">
                  <div className="h-full" style={{ width: `${Math.min(local * 240, 100)}%`, background: s.hue }} />
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-10">
                  {/* hero block */}
                  <div>
                    <div
                      className="mb-4 h-8 w-2/3"
                      style={{ background: loaded > 0.3 ? s.hue : "#e5e2da", transition: "background 300ms" }}
                    />
                    <div className="space-y-2">
                      {[92, 84, 88, 60].map((w, i) => (
                        <div
                          key={i}
                          className="h-3"
                          style={{
                            width: `${w}%`,
                            background: loaded > 0.3 + i * 0.12 ? "#b9b4a6" : "#eceae3",
                            transition: "background 250ms",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="mt-6 inline-block px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white"
                      style={{ background: s.hue, opacity: loaded > 0.8 ? 1 : 0.15 }}
                    >
                      Ship it →
                    </div>
                  </div>
                  {/* image block */}
                  <div
                    className="flex aspect-[4/3] items-center justify-center border border-black/10"
                    style={{ background: loaded > 0.6 ? `${s.hue}22` : "#f0eee8" }}
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-black/35">
                      {loaded > 0.6 ? "15+ projects shipped" : "loading…"}
                    </span>
                  </div>
                </div>
                {/* place stamp */}
                <div className="absolute bottom-5 left-6 sm:left-10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: s.hue }}>
                    {s.place}
                  </p>
                  <p className="mt-1 font-display text-xl italic text-[#2b2620]">{s.line}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* outro line */}
      <div
        className="absolute inset-x-0 bottom-10 z-20 text-center"
        style={{ opacity: outro }}
      >
        <p className="mx-auto max-w-xl px-6 font-display text-2xl italic text-[#2b2620]">
          The web taught me to ship. Then the phone changed what shipping meant.
        </p>
      </div>
    </div>
  );
}
