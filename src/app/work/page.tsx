import type { Metadata } from "next";
import Link from "next/link";
import { projects, clientRoll, clientRollFraming } from "@/lib/data";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected product design — Spin, Hush, Very Good Ventures, Saucey, NationBuilder, Differential, and Boneyard. Individual contribution, honestly framed.",
};

export default function WorkPage() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const bench = projects.filter((p) => p.tier === "bench");

  return (
    <div className="bg-paper text-graphite">
      <header className="mx-auto max-w-6xl px-5 pb-12 pt-20 sm:px-8">
        <p className="eyebrow">Work</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl tracking-tight text-balance sm:text-6xl">
          Fifteen years of designing things that ship.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-graphite-dim">
          The through-line is contribution: what I actually did, stated plainly. First
          designer to Head of Design, twice. A principal seat on the Flutter side of
          Google&rsquo;s world. Now my own studio.
        </p>
      </header>

      {/* Case studies */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8" aria-label="Case studies">
        <div className="grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
          {featured.map((p) => (
            <Link
              key={p.slug}
              href={`/work/${p.slug}`}
              className="group flex flex-col justify-between bg-paper p-7 transition-colors hover:bg-paper-2"
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl tracking-tight">{p.title}</h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-muted">
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-graphite-muted">{p.context}</p>
                <p className="mt-5 text-pretty text-graphite-dim">{p.summary}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {p.scope.map((s) => (
                  <span
                    key={s}
                    className="border border-black/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-graphite-muted"
                  >
                    {s}
                  </span>
                ))}
                <span className="ml-auto font-mono text-xs text-graphite transition-transform group-hover:translate-x-0.5">
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bench */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8" aria-label="Also on the bench">
        <p className="eyebrow mb-5">Also on the bench</p>
        <ul className="divide-y divide-black/10 border-y border-black/10">
          {bench.map((p) => {
            const href = p.internalLink ?? `/work/${p.slug}`;
            return (
              <li key={p.slug}>
                <Link
                  href={href}
                  className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4 transition-colors hover:text-graphite"
                >
                  <span className="w-40 font-display text-xl">{p.title}</span>
                  <span className="font-mono text-xs text-graphite-muted">{p.role}</span>
                  <span className="font-mono text-xs text-graphite-muted">{p.timeline}</span>
                  <span className="ml-auto font-mono text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Client roll — honest framing, no implied employment */}
      <section className="border-t border-black/10 bg-paper-2 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-2xl text-sm text-graphite-dim">{clientRollFraming}</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-display text-2xl text-graphite/70 sm:text-3xl">
            {clientRoll.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
