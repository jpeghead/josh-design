import { shareCard, OG_SIZE } from "@/lib/og";
import { projects } from "@/lib/data";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A case study by Josh Whitehead";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  const years = p?.timeline.replace(/[A-Za-z]{3} /g, "") ?? "";
  return shareCard({
    eyebrow: ["Josh Whitehead · Work", p?.role, years].filter(Boolean).join(" · "),
    title: p ? `${p.title}. ${p.summary}` : "Work",
    footer: "josh.design/work",
    size: 64,
  });
}
