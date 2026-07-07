"use client";

/**
 * CHAPTER 3 — FILM. The Corps, 2008–2013.
 * Hard cut to black. Real photographs, full-bleed, shutter-click cuts.
 * The slate carries the double meaning of 2008: married, enlisted.
 * A taped print in the corner: Gunner, Nov 1, 2009.
 */

import type { ChapterProps } from "./engine";
import { seg } from "./engine";

const FRAMES = [
  {
    src: "/archive/web/sfMnAGTnE16cKd9nm8suW4wk.jpg",
    cap: "RANGE DAY · USMC COMBAT PHOTOGRAPHER",
    a: 0.14,
    b: 0.44,
  },
  {
    src: "/archive/web/ILQgtzAfoB1DMrSNqEKzs19bQ.jpg",
    cap: "CONVOY · CLEARED FOR RELEASE",
    a: 0.44,
    b: 0.74,
  },
];

export function C3Film({ t }: ChapterProps) {
  const slate = seg(t, 0.02, 0.12);
  const outro = seg(t, 0.76, 0.92);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* the slate — 2008, twice */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black text-center"
        style={{ opacity: slate < 1 ? 1 : 1 - seg(t, 0.12, 0.17) }}
      >
        <div className="border border-white/25 px-8 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/60">
            Scene 03 · Take 1 · 2008
          </p>
          <h2 className="mt-4 font-display text-4xl italic text-white sm:text-5xl" style={{ opacity: slate }}>
            Married in June.
            <br />
            Enlisted the same year.
          </h2>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
            Parris Island → Camp Geiger → Fort Meade → MCAS New River
          </p>
        </div>
      </div>

      {/* photographs, shutter-cut */}
      {FRAMES.map((f) => {
        const vis = t >= f.a && t < f.b ? 1 : 0;
        const local = seg(t, f.a, f.b);
        const flash = local < 0.045 ? 1 - local / 0.045 : 0;
        return (
          <div key={f.src} className="absolute inset-0" style={{ opacity: vis }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.src}
              alt=""
              className="h-full w-full object-cover"
              style={{ transform: `scale(${1.04 + local * 0.06})` }}
            />
            <div className="absolute inset-0 bg-black/25" />
            {/* shutter flash */}
            <div className="absolute inset-0 bg-white" style={{ opacity: flash }} />
            {/* caption + meter */}
            <div className="absolute bottom-10 left-6 sm:left-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/85">{f.cap}</p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-white/45">
                f/8 · 1/500 · ISO 400 · 0{FRAMES.indexOf(f) + 1}/24
              </p>
            </div>
            <div className="absolute right-6 top-24 font-mono text-[10px] tracking-[0.3em] text-white/45 sm:right-12">
              ▣ REC
            </div>
          </div>
        );
      })}

      {/* the taped-up personal print — Gunner */}
      {(() => {
        const k = seg(t, 0.56, 0.68);
        return (
          <div
            className="absolute right-[7%] top-[16%] z-20 w-44 rotate-3 bg-[#f4efe4] p-2 pb-6 shadow-2xl sm:w-52"
            style={{ opacity: k, transform: `rotate(6deg) translateY(${(1 - k) * -30}px)` }}
          >
            <div className="absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] bg-white/50" />
            <div className="flex aspect-[4/5] items-center justify-center bg-[#d8d0bd]">
              <span className="px-3 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b6353]">
                photo awaiting scan
              </span>
            </div>
            <p className="mt-2 text-center font-display text-sm italic text-[#2b2620]">
              Gunner — Nov 1, 2009
            </p>
          </div>
        );
      })()}

      {/* the click that clicked */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-center"
        style={{ opacity: outro }}
      >
        <h2 className="max-w-3xl px-6 font-display text-5xl italic tracking-tight text-white sm:text-6xl">
          Five years behind a camera.
          <br />
          That&rsquo;s where it clicked.
        </h2>
        <p className="mt-5 max-w-md px-6 text-white/60">
          Editing photos in a war zone, asking the same question over and over:
          how&rsquo;d they make that? Then teaching myself, one video at a time.
        </p>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
          2013 · discharge · back to Cincinnati
        </p>
      </div>
    </div>
  );
}
