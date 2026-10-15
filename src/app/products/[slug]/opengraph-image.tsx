import { shareCard, OG_SIZE } from "@/lib/og";
import { products } from "@/content/products";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A product by Josh Whitehead at Boneyard";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  return shareCard({
    eyebrow: ["Josh Whitehead · Boneyard", p?.status].filter(Boolean).join(" · "),
    title: p ? `${p.name}. ${p.tagline}` : "Products",
    footer: p?.link?.href.startsWith("http") ? p.link.label : "josh.design/products",
    size: 84,
  });
}
