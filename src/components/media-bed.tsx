"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Project } from "@/lib/data";

type Variant = "cover" | "inset" | "strip" | "duotone";

/**
 * A generative, scroll-parallaxed media bed for case studies. Type-driven so
 * we don't fake screenshots, but each variant gives the long-form a different
 * kinetic register — cinematic full-bleeds and quieter editorial insets.
 */
export function MediaBed({
  project,
  variant = "cover",
  label,
}: {
  project: Project;
  variant?: Variant;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax: media moves slower than its container
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const yFast = useTransform(scrollYProgress, [0, 1], ["-22%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.7]);

  const palette = paletteFor(project.slug);

  if (variant === "strip") {
    return (
      <div
        ref={ref}
        className="relative my-12 overflow-hidden border-y border-bone-line"
        style={{ background: palette.bg }}
      >
        <motion.div style={{ y: yFast }} className="flex h-[40vh] items-center">
          <div
            className="flex w-max items-center gap-16 whitespace-nowrap pl-12 pr-12 italic"
            style={{
              color: palette.fg,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(6rem, 14vw, 14rem)",
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="flex items-center gap-12">
                <span>{project.title}</span>
                <span
                  className="inline-block"
                  style={{ color: palette.accent, fontSize: "0.6em" }}
                >
                  ✺
                </span>
              </span>
            ))}
          </div>
        </motion.div>
        {label && (
          <div className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {label}
          </div>
        )}
      </div>
    );
  }

  if (variant === "duotone") {
    return (
      <div
        ref={ref}
        className="relative my-14 grid grid-cols-12 gap-px overflow-hidden border border-bone-line bg-bone-line"
      >
        <div
          className="col-span-12 md:col-span-7 aspect-[5/4] md:aspect-auto md:min-h-[60vh]"
          style={{ background: palette.bg }}
        >
          <motion.div style={{ y }} className="flex h-full items-center justify-center p-6">
            <svg viewBox="0 0 400 400" className="h-full w-full max-w-[480px]">
              <defs>
                <pattern
                  id={`db-grid-${project.slug}`}
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M40 0H0V40"
                    fill="none"
                    stroke={palette.fg}
                    strokeOpacity="0.06"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#db-grid-${project.slug})`} />
              <g stroke={palette.accent} strokeWidth="0.6" opacity="0.85" fill="none">
                <circle cx="200" cy="200" r="60" />
                <circle cx="200" cy="200" r="120" opacity="0.5" />
                <circle cx="200" cy="200" r="180" opacity="0.25" />
                <line x1="200" y1="20" x2="200" y2="380" />
                <line x1="20" y1="200" x2="380" y2="200" />
              </g>
              <text
                x="40"
                y="60"
                fill={palette.fg}
                fillOpacity="0.5"
                fontFamily="var(--font-mono), monospace"
                fontSize="11"
                letterSpacing="3"
              >
                EXP · 1/60s · f/2.8
              </text>
              <text
                x="40"
                y="380"
                fill={palette.fg}
                fillOpacity="0.5"
                fontFamily="var(--font-mono), monospace"
                fontSize="11"
                letterSpacing="3"
              >
                REF · {project.slug.toUpperCase()}
              </text>
            </svg>
          </motion.div>
        </div>
        <div
          className="col-span-12 flex items-end p-6 md:col-span-5 md:p-10"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: palette.accent }}
            >
              {label ?? "Bed · 02"}
            </p>
            <p
              className="mt-4 italic"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 4rem)",
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
              }}
            >
              {project.client}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              {project.year} · {project.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inset") {
    return (
      <div
        ref={ref}
        className="relative my-14 overflow-hidden border border-bone-line"
        style={{ background: palette.bg }}
      >
        <motion.div
          style={{ y, opacity }}
          className="relative flex aspect-[3/2] items-center justify-center"
        >
          <svg
            aria-hidden
            viewBox="0 0 600 400"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id={`ins-grid-${project.slug}`}
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M50 0H0V50"
                  fill="none"
                  stroke={palette.fg}
                  strokeOpacity="0.08"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#ins-grid-${project.slug})`} />
            <g stroke={palette.accent} strokeOpacity="0.7" strokeWidth="0.6" fill="none">
              <rect x="220" y="120" width="160" height="160" />
              <line x1="220" y1="120" x2="380" y2="280" />
              <line x1="380" y1="120" x2="220" y2="280" />
            </g>
          </svg>
          <div
            className="relative italic"
            style={{
              color: palette.fg,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 10vw, 9rem)",
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
              textShadow: `3px 3px 0 ${palette.accent}`,
            }}
          >
            {project.title}
          </div>
        </motion.div>
        {label && (
          <div className="border-t border-bone-line bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {label}
          </div>
        )}
      </div>
    );
  }

  // cover (default) — full-bleed, two-screen height, deep parallax
  return (
    <div
      ref={ref}
      className="relative -mx-4 mt-6 mb-14 overflow-hidden border-y border-bone-line sm:-mx-6"
      style={{ background: palette.bg }}
    >
      <motion.div
        style={{ y, opacity }}
        className="relative flex h-[min(120vh,1100px)] min-h-[640px] items-center justify-center"
      >
        <svg
          aria-hidden
          viewBox="0 0 1600 900"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id={`cov-grid-${project.slug}`}
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M80 0H0V80"
                fill="none"
                stroke={palette.fg}
                strokeOpacity="0.06"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#cov-grid-${project.slug})`} />
          <g stroke={palette.accent} strokeOpacity="0.7" strokeWidth="1" fill="none">
            <circle cx="800" cy="450" r="140" />
            <circle cx="800" cy="450" r="280" opacity="0.4" />
            <circle cx="800" cy="450" r="420" opacity="0.18" />
            <line x1="800" y1="100" x2="800" y2="800" />
            <line x1="200" y1="450" x2="1400" y2="450" />
          </g>
          <text
            x="60"
            y="80"
            fill={palette.fg}
            fillOpacity="0.7"
            fontFamily="var(--font-mono), monospace"
            fontSize="14"
            letterSpacing="3"
          >
            REF · {project.slug.toUpperCase()}
          </text>
          <text
            x="60"
            y="860"
            fill={palette.fg}
            fillOpacity="0.55"
            fontFamily="var(--font-mono), monospace"
            fontSize="12"
            letterSpacing="3"
          >
            {project.client.toUpperCase()}
          </text>
          <text
            x="1540"
            y="860"
            fill={palette.fg}
            fillOpacity="0.55"
            fontFamily="var(--font-mono), monospace"
            fontSize="12"
            letterSpacing="3"
            textAnchor="end"
          >
            {project.year}
          </text>
        </svg>
        <motion.div
          style={{ y: yFast }}
          className="relative italic"
        >
          <span
            style={{
              color: palette.fg,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(6rem, 22vw, 22rem)",
              letterSpacing: "-0.06em",
              lineHeight: 0.85,
              textShadow: `4px 4px 0 ${palette.accent}`,
            }}
          >
            {project.title}
          </span>
        </motion.div>
      </motion.div>
      <div className="flex items-center justify-between border-t border-bone-line bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted sm:px-6">
        <span>{label ?? "Bed · 01 · Cover"}</span>
        <span>↓ Scroll</span>
      </div>
    </div>
  );
}

export function paletteFor(slug: string) {
  const palettes: { bg: string; fg: string; accent: string }[] = [
    { bg: "#161311", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#1a1d1a", fg: "#cfe0c3", accent: "#f4a52e" },
    { bg: "#0f0f10", fg: "#f4eee0", accent: "#9ab1d4" },
    { bg: "#1c1411", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#10130f", fg: "#f4eee0", accent: "#f4a52e" },
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h << 5) - h + slug.charCodeAt(i);
  return palettes[Math.abs(h) % palettes.length];
}
