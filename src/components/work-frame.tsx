"use client";

import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Project } from "@/lib/data";

/**
 * A single project rendered as a "contact-sheet frame." Scroll-driven reveal
 * + subtle parallax on the poster — kinetic without being theatrical.
 */
export function WorkFrame({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.95,
        ease: [0.22, 1, 0.36, 1],
        delay: (index % 3) * 0.07,
      }}
    >
      <Link
        href={`/work/${project.slug}`}
        className="group relative block border border-bone-line bg-ink-50 transition-colors hover:bg-ink-100"
      >
        <div className="flex items-center justify-between border-b border-bone-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          <span>Frame · {String(index + 1).padStart(3, "0")}</span>
          <span className="flex items-center gap-2">
            <span
              className={
                project.status === "Live"
                  ? "h-1.5 w-1.5 rounded-full bg-emulsion"
                  : project.status === "In flight"
                  ? "h-1.5 w-1.5 rounded-full bg-sodium"
                  : project.status === "Confidential"
                  ? "h-1.5 w-1.5 rounded-full bg-safelight"
                  : "h-1.5 w-1.5 rounded-full bg-bone-muted"
              }
            />
            {project.status}
          </span>
        </div>

        <FramePoster project={project} />

        <div className="border-t border-bone-line px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-[var(--font-display)] text-2xl text-bone transition-colors group-hover:text-safelight">
              {project.title}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
              {project.year}
            </span>
          </div>
          <p className="mt-1 text-sm text-bone-dim">{project.role}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-bone-muted">
            {project.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span
                key={t}
                className="border border-bone-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-bone-muted opacity-0 transition-opacity group-hover:opacity-100">
          Open ↗
        </div>
      </Link>
    </motion.div>
  );
}

function FramePoster({ project }: { project: Project }) {
  const seed = hashCode(project.slug);
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const palettes: { bg: string; fg: string; accent: string }[] = [
    { bg: "#161311", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#1a1d1a", fg: "#cfe0c3", accent: "#f4a52e" },
    { bg: "#0f0f10", fg: "#f4eee0", accent: "#9ab1d4" },
    { bg: "#1c1411", fg: "#f4eee0", accent: "#e63946" },
    { bg: "#10130f", fg: "#f4eee0", accent: "#f4a52e" },
  ];
  const palette = palettes[seed % palettes.length];
  const rot = ((seed % 7) - 3) * 0.4;

  const posterRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: posterRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div
      ref={posterRef}
      className="relative aspect-[4/3] overflow-hidden"
      style={{ background: palette.bg }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
      >
        <defs>
          <pattern
            id={`g-${project.slug}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0H0V40"
              fill="none"
              stroke={palette.fg}
              strokeOpacity="0.08"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g-${project.slug})`} />
        <g stroke={palette.accent} strokeWidth="0.5" opacity="0.7">
          <circle cx="200" cy="150" r="44" fill="none" />
          <line x1="200" y1="100" x2="200" y2="200" />
          <line x1="150" y1="150" x2="250" y2="150" />
        </g>
        <text
          x="20"
          y="280"
          fill={palette.fg}
          fillOpacity="0.4"
          fontFamily="var(--font-mono), monospace"
          fontSize="9"
          letterSpacing="2"
        >
          REF · {project.slug.toUpperCase()} · {project.year.replace(" — ", "/")}
        </text>
        <text
          x="380"
          y="280"
          fill={palette.fg}
          fillOpacity="0.4"
          fontFamily="var(--font-mono), monospace"
          fontSize="9"
          letterSpacing="2"
          textAnchor="end"
        >
          ASA 400
        </text>
      </svg>

      <motion.div
        style={{ y }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-[var(--font-display)] italic"
          style={{
            color: palette.fg,
            fontSize: "clamp(5rem, 12vw, 11rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
            textShadow: `2px 2px 0 ${palette.accent}`,
            transform: `rotate(${rot}deg)`,
          }}
        >
          {initials}
        </motion.div>
      </motion.div>

      <div className="absolute inset-x-0 top-0 flex justify-between px-2 py-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-sm"
            style={{ background: "rgba(244, 238, 224, 0.18)" }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 py-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-sm"
            style={{ background: "rgba(244, 238, 224, 0.18)" }}
          />
        ))}
      </div>
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}
