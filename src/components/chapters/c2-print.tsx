"use client";

/**
 * CHAPTER 2 — PRINT. The career school + poster years.
 * The screen becomes the print shop: wood type slams in, registration marks,
 * CMYK bars — and the guillotine cut that left the scar.
 */

import type { ChapterProps } from "./engine";
import { seg } from "./engine";

const LINES = [
  { text: "FILM.", a: 0.06, b: 0.16 },
  { text: "PHOTO.", a: 0.12, b: 0.22 },
  { text: "CODE.", a: 0.18, b: 0.28 },
  { text: "MUSIC.", a: 0.24, b: 0.34 },
  { text: "GAMES.", a: 0.3, b: 0.4 },
];

export function C2Print({ t }: ChapterProps) {
  const cut = seg(t, 0.62, 0.72); // the guillotine
  const after = seg(t, 0.72, 0.9);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#efe7d6]">
      {/* registration marks */}
      {([
        ["6%", "10%"],
        ["92%", "10%"],
        ["6%", "88%"],
        ["92%", "88%"],
      ] as const).map(([x, y], i) => (
        <div
          key={i}
          className="absolute h-7 w-7"
          style={{ left: x, top: y, opacity: seg(t, 0.02, 0.1) }}
        >
          <div className="absolute left-1/2 top-0 h-full w-px bg-black/60" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-black/60" />
          <div className="absolute inset-1.5 rounded-full border border-black/60" />
        </div>
      ))}

      {/* CMYK bars */}
      <div className="absolute right-[6%] top-[16%] flex gap-1" style={{ opacity: seg(t, 0.08, 0.18) }}>
        {["#00b7c6", "#d63384", "#f2c811", "#1a1a1a"].map((c) => (
          <div key={c} className="h-8 w-8" style={{ background: c }} />
        ))}
      </div>

      {/* the two halves — split by the guillotine */}
      {[0, 1].map((half) => (
        <div
          key={half}
          className="absolute inset-0"
          style={{
            clipPath:
              half === 0
                ? "polygon(0 0, 100% 0, 100% 46%, 0 58%)"
                : "polygon(0 58%, 100% 46%, 100% 100%, 0 100%)",
            transform:
              cut > 0
                ? `translate(${(half === 0 ? -1 : 1) * cut * 3.5}vw, ${(half === 0 ? -1 : 1) * cut * 2.5}vh) rotate(${(half === 0 ? -1 : 1) * cut * 1.2}deg)`
                : undefined,
          }}
        >
          <div className="absolute inset-0 bg-[#efe7d6]" />
          {/* wood type slams */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {LINES.map((l, i) => {
              const k = seg(t, l.a, l.b);
              return (
                <div
                  key={l.text}
                  className="font-display font-black leading-[0.82] tracking-tight text-[#1c1712]"
                  style={{
                    fontSize: "13.5vw",
                    opacity: k,
                    transform: `translateX(${(1 - k) * (i % 2 === 0 ? -60 : 60)}vw) scaleY(${0.9 + k * 0.1})`,
                  }}
                >
                  {l.text}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* the blade line */}
      <div
        className="absolute left-0 top-0 h-px w-[141%] origin-left bg-[#8f1d1d]"
        style={{
          top: "58%",
          transform: `rotate(-4.8deg) scaleX(${seg(t, 0.55, 0.64)})`,
          height: 2,
          boxShadow: cut > 0 ? "0 0 12px rgba(143,29,29,0.8)" : undefined,
        }}
      />

      {/* the confession */}
      <div
        className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center px-6 text-center"
        style={{ opacity: after }}
      >
        <p className="eyebrow" style={{ color: "#8f1d1d" }}>
          Large-format print · glued to board · cut by hand
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-5xl italic tracking-tight text-[#241F17] sm:text-6xl">
          I&rsquo;ve still got the scar to prove it.
        </h2>
        <p className="mt-5 max-w-md text-[#5A4F3E]">
          Career school in Ohio: they&rsquo;d teach anything, and I wanted all of it.
          Posters printed, mounted, and sliced by a kid who didn&rsquo;t always
          watch his fingers.
        </p>
      </div>
    </div>
  );
}
