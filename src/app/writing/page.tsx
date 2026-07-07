import type { Metadata } from "next";
import Link from "next/link";
import { books, portedEssays } from "@/content/writing";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Two books and a handful of essays. Mastery is Dead, The Harmony Protocol, and notes worth keeping.",
};

export default function WritingPage() {
  return (
    <div className="bg-paper text-graphite">
      <header className="mx-auto max-w-4xl px-5 pb-12 pt-20 sm:px-8">
        <p className="eyebrow">Writing</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl tracking-tight text-balance sm:text-6xl">
          Books, and the notes worth keeping.
        </h1>
      </header>

      {/* Books */}
      <section className="mx-auto max-w-4xl px-5 sm:px-8" aria-label="Books">
        <div className="grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
          {books.map((b) => (
            <article key={b.slug} className="flex gap-5 bg-paper p-6">
              <div
                className="w-24 shrink-0 overflow-hidden border border-black/10"
                style={{ aspectRatio: "2 / 3" }}
              >
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover} alt={b.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="awaiting-scan h-full w-full">
                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] opacity-60">Cover soon</span>
                  </div>
                )}
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold-dim">
                  {b.kind} · {b.status}
                  {b.year ? ` · ${b.year}` : ""}
                </span>
                <h2 className="mt-1 font-display text-2xl tracking-tight">{b.title}</h2>
                {b.subtitle && <p className="font-display text-base italic text-graphite-dim">{b.subtitle}</p>}
                <p className="mt-3 text-sm text-pretty text-graphite-dim">{b.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Essays */}
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8" aria-label="Essays">
        <p className="eyebrow mb-5">Essays</p>
        {portedEssays.length === 0 ? (
          <p className="text-graphite-muted">More soon.</p>
        ) : (
          <ul className="divide-y divide-black/10 border-y border-black/10">
            {portedEssays.map((e) => (
              <li key={e.slug}>
                <Link href={`/writing/${e.slug}`} className="group block py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-display text-2xl tracking-tight">{e.title}</h3>
                    {e.date && (
                      <time className="font-mono text-xs text-graphite-muted">
                        {new Date(e.date).getFullYear()}
                      </time>
                    )}
                  </div>
                  {e.description && (
                    <p className="mt-2 max-w-2xl text-pretty text-graphite-dim">{e.description}</p>
                  )}
                  <span className="mt-2 inline-block font-mono text-xs text-graphite-muted transition-transform group-hover:translate-x-0.5">
                    Read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
