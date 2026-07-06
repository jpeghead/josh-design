"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { career, principles, stats } from "@/lib/data";
import { useOpenInWindow } from "../link";

type Tab = "overview" | "storage" | "support" | "service";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "storage", label: "Storage" },
  { id: "support", label: "Support" },
  { id: "service", label: "Service" },
];

/**
 * "About This Archive" — modeled on the macOS About This Mac panel.
 * A system card with a portrait, identifier, build info, and tabbed
 * sections for Overview / Storage / Support / Service.
 */
export function AboutContent() {
  useOpenInWindow();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="flex h-full flex-col">
      {/* Header card */}
      <div className="grid grid-cols-12 gap-6 border-b border-bone-line px-6 py-8 sm:px-10 sm:py-10">
        <div className="col-span-12 flex justify-center sm:col-span-4">
          <Portrait />
        </div>
        <div className="col-span-12 flex flex-col justify-center sm:col-span-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            User · josh@archive
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-4xl leading-tight tracking-tight text-bone sm:text-5xl">
            Josh Whitehead
          </h1>
          <p className="mt-1 font-[var(--font-display)] text-xl italic text-bone-dim">
            Designer, maker, tinkerer.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            Build · Working Archive v18.5 (2026.13)
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            Origin · USMC Combat Photographer · 2008
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            Location · Los Angeles, CA
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-bone-line px-3 sm:px-6">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active ? "text-bone" : "text-bone-muted hover:text-bone-dim"
              }`}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="about-tab"
                  className="absolute inset-x-3 -bottom-px h-px bg-safelight"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-auto px-6 py-8 sm:px-10 sm:py-10">
        {tab === "overview" && <Overview />}
        {tab === "storage" && <Storage />}
        {tab === "support" && <Support />}
        {tab === "service" && <Service />}
      </div>
    </div>
  );
}

function Portrait() {
  return (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs>
          <pattern id="portrait-grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="var(--color-bone)" strokeOpacity="0.08" strokeWidth="0.3" />
          </pattern>
          <radialGradient id="portrait-glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#f4eee0" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f4eee0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="120" height="120" fill="#161311" />
        <rect width="120" height="120" fill="url(#portrait-grid)" />
        <circle cx="60" cy="60" r="56" fill="url(#portrait-glow)" />
        {/* Anatomical-ish portrait */}
        <g stroke="#e63946" strokeOpacity="0.7" strokeWidth="0.8" fill="none">
          <circle cx="60" cy="48" r="22" />
          <path d="M30 110 C 30 88, 42 78, 60 78 C 78 78, 90 88, 90 110" />
          <line x1="50" y1="48" x2="58" y2="48" strokeOpacity="0.8" />
          <line x1="62" y1="48" x2="70" y2="48" strokeOpacity="0.8" />
        </g>
        <g stroke="#f4eee0" strokeOpacity="0.18" strokeWidth="0.4" fill="none">
          <line x1="60" y1="10" x2="60" y2="110" />
          <line x1="10" y1="60" x2="110" y2="60" />
        </g>
        <text
          x="60"
          y="118"
          textAnchor="middle"
          fill="#f4eee0"
          fillOpacity="0.4"
          fontFamily="var(--font-mono), monospace"
          fontSize="5"
          letterSpacing="3"
        >
          JOSH · 1986
        </text>
      </svg>
    </div>
  );
}

function Overview() {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 md:col-span-8">
        <p className="overline">// Bio</p>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-bone-dim">
          <p>
            I joined the Marine Corps at 18 and spent five years behind a
            Nikon as a combat photographer. The job taught me three things
            that still run my career:{" "}
            <span className="text-bone">how to compose under pressure</span>,{" "}
            <span className="text-bone">
              how to ship on a deadline that doesn&rsquo;t care about you
            </span>
            , and{" "}
            <span className="text-bone">
              how to take a photograph that is also a document
            </span>
            .
          </p>
          <p>
            In 2013 I put the camera down and traded it for a Wacom. Since
            then I&rsquo;ve led design at startups and at scale — at{" "}
            <a href="/work/spin" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
              Spin
            </a>{" "}
            I ran a team of ten across product, brand, and creative for a
            fleet that operated in a hundred-plus cities. At{" "}
            <a href="/work/hush" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
              Hush
            </a>{" "}
            I was the first designer in and grew the discipline as we hit a
            million MAU.
          </p>
          <p>
            In 2023 I founded{" "}
            <a href="https://boneyardcollective.com" target="_blank" rel="noreferrer" className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight">
              Boneyard Collective
            </a>{" "}
            — an AI-native product studio. Shipping our own products gives
            us scars; the scars make the client work better.
          </p>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4">
        <p className="overline">// Principles</p>
        <ol className="mt-4 space-y-3">
          {principles.map((p) => (
            <li key={p.n}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {p.n}
              </p>
              <p className="mt-1 font-[var(--font-display)] text-base italic text-bone">
                {p.title}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Storage() {
  const totalProjects = 7;
  const totalEntries = 4;
  const volumes = [
    { name: "~/work", size: totalProjects, label: "frames", color: "bg-safelight", pct: 56 },
    { name: "~/journal", size: totalEntries, label: "entries", color: "bg-sodium", pct: 22 },
    { name: "~/about", size: career.length, label: "career frames", color: "bg-emulsion", pct: 14 },
    { name: "~/system", size: 1, label: "darkroom", color: "bg-bone-muted", pct: 8 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="overline">// Disk · Working Archive</p>
        <div className="mt-3 flex h-6 w-full overflow-hidden border border-bone-line">
          {volumes.map((v) => (
            <div
              key={v.name}
              className={v.color}
              style={{ width: `${v.pct}%` }}
              title={`${v.name} · ${v.size} ${v.label}`}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {volumes.map((v) => (
            <div key={v.name} className="flex items-center gap-2 border border-bone-line p-2">
              <span className={`block h-2 w-2 ${v.color}`} />
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] uppercase tracking-widest text-bone">
                  {v.name}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-bone-muted">
                  {v.size} {v.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="overline">// Receipts</p>
        <div className="mt-3 grid grid-cols-2 gap-px border border-bone-line bg-bone-line md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-ink p-4">
              <p className="font-[var(--font-display)] text-2xl text-bone sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="overline">// Career · film strip</p>
        <ol className="mt-3 space-y-px bg-bone-line">
          {career.map((c, i) => (
            <li key={`${c.year}-${c.org}`} className="grid grid-cols-12 gap-3 bg-ink px-3 py-2">
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {c.year}
              </span>
              <span className="col-span-5 font-[var(--font-display)] text-base text-bone">
                {c.org}
              </span>
              <span className="col-span-5 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {c.role.split(" → ").slice(-1)[0]} · {c.location}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Support() {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 md:col-span-6">
        <p className="overline">// Contact</p>
        <ul className="mt-4 space-y-3">
          <SupportLink
            label="Email"
            value="joshwhitehead.design@gmail.com"
            href="mailto:joshwhitehead.design@gmail.com"
          />
          <SupportLink
            label="Studio"
            value="boneyardcollective.com"
            href="https://boneyardcollective.com"
          />
          <SupportLink label="X / Twitter" value="@jpeghead" href="https://x.com/jpeghead" />
          <SupportLink label="Read.cv" value="joshwhitehead" href="https://read.cv/joshwhitehead" />
        </ul>
      </div>
      <div className="col-span-12 md:col-span-6">
        <p className="overline">// Documentation</p>
        <ul className="mt-4 space-y-3">
          <SupportLink label="Work" value="/work · contact sheet" href="/work" />
          <SupportLink label="Journal" value="/journal · field notes" href="/journal" />
          <SupportLink label="Contact" value="/contact · compose" href="/contact" />
          <SupportLink label="Readme" value="/#readme · opening note" href="#readme" />
        </ul>
      </div>
    </div>
  );
}

function SupportLink({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <li className="border border-bone-line">
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className="group flex items-center justify-between gap-3 p-3 hover:bg-ink-100"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {label}
          </p>
          <p className="mt-0.5 font-[var(--font-display)] text-base text-bone group-hover:text-safelight">
            {value}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          ↗
        </span>
      </a>
    </li>
  );
}

function Service() {
  return (
    <div className="space-y-8">
      <div>
        <p className="overline">// Service offerings · 2026</p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-bone-dim">
          I take a small number of outside engagements each year. Currently
          accepting limited slots in the following modalities.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-px border border-bone-line bg-bone-line md:grid-cols-2">
        <ServiceItem
          name="Design partnership"
          duration="4 — 12 weeks"
          summary="Embedded with your team. Product, brand, system. Senior-only craft."
          status="2 slots · Q3"
        />
        <ServiceItem
          name="Design audit"
          duration="2 weeks"
          summary="Teardown + prioritized roadmap. For teams about to ship or rebuild."
          status="Open · Q2/Q3"
        />
        <ServiceItem
          name="Advisory retainer"
          duration="Monthly"
          summary="Recurring office hours, design review, hiring help."
          status="1 slot · Q3"
        />
        <ServiceItem
          name="Speaking / podcast"
          duration="As scheduled"
          summary="AI in design, product studios, the craft of shipping."
          status="Open"
        />
      </ul>
      <div className="border border-bone-line bg-ink-50 p-5">
        <p className="overline">// To book</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
          The fastest path is{" "}
          <a
            href="mailto:joshwhitehead.design@gmail.com"
            className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight"
          >
            a real email
          </a>
          . Include what you&rsquo;re building, who you&rsquo;re building it
          with, and the rough timeline. I reply within 48 hours.
        </p>
      </div>
    </div>
  );
}

function ServiceItem({
  name,
  duration,
  summary,
  status,
}: {
  name: string;
  duration: string;
  summary: string;
  status: string;
}) {
  return (
    <li className="bg-ink p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-[var(--font-display)] text-xl text-bone">{name}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          {duration}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-bone-dim">{summary}</p>
      <p className="mt-3 inline-block border border-bone-line px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emulsion">
        {status}
      </p>
    </li>
  );
}
