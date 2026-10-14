import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Label, Arrow, Button } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { products } from "@/content/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.name, description: `${p.tagline} ${p.blurb}` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const idx = products.findIndex((x) => x.slug === slug);
  const next = products[(idx + 1) % products.length];

  return (
    <Container>
      <article className="pb-28 pt-28 sm:pt-40">
        <Link href="/products" className="text-sm text-fg-2 transition-colors hover:text-fg">
          ‹ Products
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm text-fg-2">
            Boneyard · {p.status}
          </p>
          <h1 className="tighter mt-3 text-[3rem] font-semibold leading-[1.02] sm:text-[4.5rem]">{p.name}</h1>
          <p className="serif mt-5 text-[1.75rem] leading-tight text-fg-2 sm:text-[2.25rem]">{p.tagline}</p>
        </header>

        {p.gallery && p.gallery.length > 0 ? (
          <div className="mt-14 grid gap-3 sm:grid-cols-2">
            {p.gallery.map((src, i) => (
              <Reveal key={src} className={i === 0 ? "sm:col-span-2" : ""} delay={i * 0.05}>
                <div className="frame rounded-md" style={{ aspectRatio: i === 0 ? "16 / 9" : "4 / 3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${p.name}, image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="frame mt-14 flex items-center justify-center rounded-md" style={{ aspectRatio: "16 / 9" }}>
            <span className="serif text-3xl text-fg-3 sm:text-5xl">In the workshop</span>
          </div>
        )}

        <section className="mt-16 grid gap-10 sm:grid-cols-[1fr_2fr]">
          <Label>What it is</Label>
          <div>
            <p className="text-xl leading-snug text-pretty sm:text-2xl">{p.blurb}</p>
            <ul className="mt-6 space-y-3 border-t border-line pt-6 text-fg-2">
              {p.detail.map((d, i) => (
                <li key={i} className="text-pretty">
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              {p.link ? (
                <Button href={p.link.href} external>
                  {p.link.label}
                </Button>
              ) : (
                <Button href="/contact">Ask about early access</Button>
              )}
            </div>
          </div>
        </section>

        <nav className="mt-20 flex items-baseline justify-between border-t border-line pt-6">
          <span className="text-sm text-fg-3">Next</span>
          <Arrow href={`/products/${next.slug}`} className="text-lg">
            {next.name}
          </Arrow>
        </nav>
      </article>
    </Container>
  );
}
