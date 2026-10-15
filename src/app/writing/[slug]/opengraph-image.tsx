import { shareCard, OG_SIZE } from "@/lib/og";
import { portedEssays, essayBySlug } from "@/content/writing";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "An essay by Josh Whitehead";

export function generateStaticParams() {
  return portedEssays.map((e) => ({ slug: e.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = essayBySlug(slug);
  const date = e?.date ? new Date(e.date).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "";
  return shareCard({
    eyebrow: ["Josh Whitehead · Writing", date].filter(Boolean).join(" · "),
    title: e?.title ?? "Writing",
    footer: "josh.design/writing",
    size: (e?.title.length ?? 0) > 44 ? 76 : 92,
  });
}
