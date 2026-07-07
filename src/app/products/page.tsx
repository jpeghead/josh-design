import type { Metadata } from "next";
import { products } from "@/content/products";
import { books } from "@/content/books";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Things I'm building at Boneyard — OLO, SignalScan, Weaver, StoryMode, and the Xenomorph typeface. Made things, not case studies.",
};

export default function ProductsPage() {
  return (
    <div className="bg-ink text-bone">
      <header className="mx-auto max-w-6xl px-5 pb-12 pt-20 sm:px-8">
        <p className="eyebrow">Products</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl tracking-tight text-balance sm:text-6xl">
          The things I&rsquo;m building.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-bone-dim">
          Where the case studies stop and the making continues. Client work pays for
          these; these are mine.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
          {products.map((p) => (
            <article key={p.slug} className="flex flex-col bg-ink p-7">
              <div
                className="w-full overflow-hidden border border-white/10 bg-white/[0.03]"
                style={{ aspectRatio: p.aspect.replace("/", " / ") }}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <div className="awaiting-scan h-full w-full">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-muted">
                      Screenshot coming
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-3xl tracking-tight">{p.name}</h2>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                  {p.status}
                </span>
              </div>
              <p className="mt-1 font-display text-lg italic text-bone-dim">{p.tagline}</p>
              <p className="mt-4 text-pretty text-bone-dim">{p.blurb}</p>
              <ul className="mt-4 space-y-1.5">
                {p.detail.map((d, i) => (
                  <li key={i} className="text-sm text-bone-muted">
                    — {d}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Books cross-link */}
      <section className="border-t border-white/10 px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Also writing</p>
            <p className="mt-2 font-display text-2xl italic">
              {books.map((b) => b.title).join(" · ")}
            </p>
          </div>
          <Link
            href="/writing"
            className="border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:border-gold hover:text-gold"
          >
            Read →
          </Link>
        </div>
      </section>
    </div>
  );
}
