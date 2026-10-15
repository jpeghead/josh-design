import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, Label, Arrow } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { products } from "@/content/products";
import { books } from "@/content/books";

export const metadata: Metadata = {
  title: "Products",
  description: "Things I'm building at Boneyard — OLO, SignalScan, Weaver, StoryMode, and the Xenomorph typeface.",
};

export default function ProductsPage() {
  return (
    <Container>
      <PageHeader label="Products · Boneyard" title="The things I'm building." dek="Where the case studies stop and the making continues. Client work pays for these; these are mine." />

      <section className="border-t border-line" aria-label="Products">
        {products.map((p, i) => (
          <Reveal key={p.slug} as="div" delay={0.03 * i}>
            <Link href={`/products/${p.slug}`} className="group grid gap-x-12 gap-y-5 border-b border-line py-10 sm:grid-cols-[1.1fr_1.4fr_0.9fr] sm:items-center">
              <div>
                <h2 className="tighter text-[2rem] font-semibold leading-none sm:text-[2.5rem]">{p.name}</h2>
                <p className="mt-2 text-sm text-fg-3">
                  {p.status}
                  {p.link && p.link.href.startsWith("http") ? ` · ${p.link.label}` : ""}
                </p>
              </div>
              <div>
                <p className="serif text-[1.5rem] leading-tight sm:text-[1.75rem]">{p.tagline}</p>
                <p className="mt-2 max-w-md text-[15px] text-fg-2 text-pretty">{p.blurb}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:gap-6">
                {p.image ? (
                  <div className="frame frame-hover w-28 rounded-md sm:w-36" style={{ aspectRatio: "4 / 3" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" loading="lazy" decoding="async" />
                  </div>
                ) : (
                  <span />
                )}
                <span aria-hidden className="text-fg-3 transition-transform duration-300 group-hover:translate-x-1">
                  ›
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      <section className="pb-28 pt-14" aria-labelledby="h-books">
        <Label>
          <span id="h-books">Also writing</span>
        </Label>
        <p className="serif mt-3 text-[1.75rem] text-fg-2 sm:text-[2.25rem]">{books.map((b) => b.title).join(" · ")}</p>
        <Arrow href="/writing" className="mt-4">
          Writing
        </Arrow>
      </section>
    </Container>
  );
}
