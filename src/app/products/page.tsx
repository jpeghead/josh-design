import type { Metadata } from "next";
import { Container, PageHeader, Label, Arrow } from "@/components/ui";
import { products } from "@/content/products";
import { books } from "@/content/books";

export const metadata: Metadata = {
  title: "Products",
  description: "Things I'm building at Boneyard — OLO, SignalScan, Weaver, StoryMode, and the Xenomorph typeface.",
};

export default function ProductsPage() {
  return (
    <Container>
      <PageHeader label="Products" title="The things I'm building." dek="Where the case studies stop and the making continues. Client work pays for these; these are mine." />

      <section className="border-t border-line" aria-label="Products">
        {products.map((p) => (
          <article key={p.slug} className="grid gap-x-12 gap-y-4 border-b border-line py-10 sm:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="tight text-2xl font-semibold leading-tight">{p.name}</h2>
              <p className="mt-1 text-sm text-fg-3">{p.status}</p>
            </div>
            <div>
              <p className="tight text-xl leading-snug sm:text-[1.375rem]">{p.tagline}</p>
              <p className="mt-3 text-fg-2 text-pretty">{p.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-fg-2">
                {p.detail.map((d, i) => (
                  <li key={i} className="text-pretty">
                    {d}
                  </li>
                ))}
              </ul>
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="mt-6 w-full rounded-xl bg-fill"
                  style={{ aspectRatio: p.aspect.replace("/", " / "), objectFit: "cover" }}
                />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="pb-28 pt-14" aria-labelledby="h-books">
        <Label>
          <span id="h-books">Also writing</span>
        </Label>
        <p className="tight mt-3 text-xl text-fg-2 sm:text-2xl">{books.map((b) => b.title).join(" · ")}</p>
        <Arrow href="/writing" className="mt-4">
          Writing
        </Arrow>
      </section>
    </Container>
  );
}
