import type { Metadata } from "next";
import Link from "next/link";
import { aboutParagraphs } from "@/content/about";
import { career, principles } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Josh Whitehead — a kid who drew all day, a Marine combat photographer, a self-taught designer and engineer who led design twice and now builds his own studio.",
};

export default function AboutPage() {
  return (
    <div className="bg-paper text-graphite">
      <header className="mx-auto max-w-3xl px-5 pb-10 pt-20 sm:px-8">
        <p className="eyebrow">About</p>
        <h1 className="mt-4 font-display text-5xl tracking-tight text-balance sm:text-6xl">
          I&rsquo;m still just the kid who won&rsquo;t stop making things.
        </h1>
      </header>

      <section className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="space-y-6 text-lg leading-relaxed text-pretty">
          {aboutParagraphs.map((para, i) => (
            <p key={i} className={i === aboutParagraphs.length - 1 ? "font-display text-2xl italic text-graphite" : ""}>
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* Career film strip */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8" aria-label="Career">
        <p className="eyebrow mb-6">The timeline</p>
        <ol className="relative border-l border-black/15 pl-6">
          {career.map((c) => (
            <li key={c.span} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-gold" aria-hidden />
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-xs tabular-nums text-graphite-muted">{c.span}</span>
                <h3 className="font-display text-xl">{c.org}</h3>
              </div>
              <p className="mt-0.5 text-sm text-graphite-dim">
                {c.role} · {c.location}
              </p>
              {c.note && <p className="mt-1 text-sm text-graphite-muted text-pretty">{c.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {/* Principles */}
      <section className="border-t border-black/10 bg-paper-2 px-5 py-16 sm:px-8" aria-label="Principles">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-6">What I hold to</p>
          <div className="grid gap-8 sm:grid-cols-2">
            {principles.map((pr) => (
              <div key={pr.n}>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-gold-dim">{pr.n}</span>
                  <h3 className="font-display text-xl">{pr.title}</h3>
                </div>
                <p className="mt-2 text-pretty text-graphite-dim">{pr.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/work" className="border border-black/15 px-4 py-2 transition-colors hover:border-gold hover:text-gold-dim">
            The work
          </Link>
          <Link href="/contact" className="border border-black/15 px-4 py-2 transition-colors hover:border-gold hover:text-gold-dim">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
