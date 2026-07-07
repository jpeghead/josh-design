import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portedEssays, essayBySlug } from "@/content/writing";

export function generateStaticParams() {
  return portedEssays.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = essayBySlug(slug);
  if (!e) return {};
  return { title: e.title, description: e.description };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = essayBySlug(slug);
  if (!essay) notFound();

  return (
    <article className="bg-paper text-graphite">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-20 sm:px-8">
        <Link href="/writing" className="font-mono text-xs text-graphite-muted hover:text-graphite">
          ← Writing
        </Link>

        <header className="mt-8">
          {essay.badge && <p className="eyebrow">{essay.badge}</p>}
          <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            {essay.title}
          </h1>
          {essay.date && (
            <time className="mt-4 block font-mono text-xs text-graphite-muted">
              {new Date(essay.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          )}
        </header>

        <div
          className="mt-10 text-lg leading-relaxed text-pretty [&_a]:text-gold-dim [&_a]:underline [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:tracking-tight [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_strong]:font-semibold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: essay.html }}
        />
      </div>
    </article>
  );
}
