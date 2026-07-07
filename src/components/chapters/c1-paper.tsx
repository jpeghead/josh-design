"use client";

/**
 * CHAPTER 1 — PAPER. Ohio, the beginning.
 * A pencil draws while the words arrive: doodles self-drawing in graphite,
 * "J + S" carved in the corner, the kid who drew before it was a job.
 */

import type { ChapterProps } from "./engine";
import { seg } from "./engine";

/** stroke-dashoffset self-drawing path */
function Draw({
  d,
  t,
  a,
  b,
  sw = 3,
  len = 600,
  color = "#2b2620",
}: {
  d: string;
  t: number;
  a: number;
  b: number;
  sw?: number;
  len?: number;
  color?: string;
}) {
  const k = seg(t, a, b);
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len}
      strokeDashoffset={len * (1 - k)}
      opacity={k > 0 ? 1 : 0}
    />
  );
}

export function C1Paper({ t }: ChapterProps) {
  const title = seg(t, 0.05, 0.3);
  const sub = seg(t, 0.25, 0.45);
  const out = seg(t, 0.9, 1); // hand off to print

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 30% 20%, #fbf7ee 0%, #f3ecdc 55%, #eadfc8 100%)",
        transform: `translateY(${out * -6}vh)`,
        opacity: 1 - out * 0.4,
      }}
    >
      {/* paper tooth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.72 0 0 0 0 0.68 0 0 0 0 0.6 0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* the doodles — a kid's whole desk, drawing itself */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* rocket */}
        <Draw t={t} a={0.06} b={0.3} len={900} sw={4} d="M1050 220 C1080 140 1120 120 1150 130 C1165 180 1150 240 1090 290 L1060 320 L1030 300 Z M1060 320 L1040 370 L1010 330 M1090 290 C1110 310 1115 330 1105 355 M1150 130 L1120 100" />
        {/* star */}
        <Draw t={t} a={0.18} b={0.34} len={400} sw={4} d="M260 190 L285 260 L360 262 L300 305 L322 378 L260 333 L198 378 L220 305 L160 262 L235 260 Z" />
        {/* house */}
        <Draw t={t} a={0.3} b={0.52} len={700} sw={4} d="M1090 620 L1090 740 L1250 740 L1250 620 M1070 630 L1170 540 L1270 630 M1140 740 L1140 680 L1190 680 L1190 740 M1215 655 L1240 655 L1240 685 L1215 685 Z" />
        {/* airplane + dashed flight */}
        <Draw t={t} a={0.42} b={0.62} len={500} sw={4} d="M180 620 L280 600 L360 560 L300 630 L330 660 L270 650 L180 700 L230 640 Z" />
        <Draw t={t} a={0.55} b={0.8} len={800} sw={2.5} d="M370 560 C480 480 620 520 700 470 C790 415 900 430 980 380" />
        {/* J + S heart — the beat that outlasts everything */}
        <g transform="translate(150 760) rotate(-6)">
          <Draw t={t} a={0.62} b={0.78} len={300} sw={3.5} color="#8f3d33" d="M60 30 C60 10 90 5 95 28 C100 5 130 10 130 30 C130 55 95 78 95 78 C95 78 60 55 60 30 Z" />
          {(() => {
            const k = seg(t, 0.72, 0.86);
            return (
              <text
                x="95"
                y="52"
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontStyle="italic"
                fontSize="26"
                fill="#8f3d33"
                opacity={k}
              >
                J + S
              </text>
            );
          })()}
        </g>
        {(() => {
          const k = seg(t, 0.78, 0.9);
          return (
            <text x="150" y="875" fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="3" fill="#97876C" opacity={k}>
              SINCE JUNIOR YEAR · OHIO
            </text>
          );
        })()}
      </svg>

      {/* the words */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-16">
        <p
          className="eyebrow"
          style={{ color: "#97876C", opacity: title, transform: `translateY(${(1 - title) * 20}px)` }}
        >
          Chapter one — paper
        </p>
        <h1
          className="mt-4 max-w-4xl font-display text-[11vw] leading-[0.95] tracking-tight text-[#241F17] sm:text-[7.5vw]"
          style={{
            opacity: title,
            transform: `translateY(${(1 - title) * 40}px)`,
          }}
        >
          I drew before
          <br />
          <span className="italic">I knew it was a job.</span>
        </h1>
        <p
          className="mt-6 max-w-md text-lg text-[#5A4F3E]"
          style={{ opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}
        >
          All day. Every day. Paper, pencils, stories — a kid in Ohio making
          things because stopping never occurred to him.
        </p>
        <p
          className="mt-10 font-mono text-[11px] uppercase tracking-[0.25em] text-[#97876C]"
          style={{ opacity: sub * (1 - seg(t, 0.5, 0.7)) }}
        >
          Keep scrolling — it gets louder ↓
        </p>
      </div>
    </div>
  );
}
