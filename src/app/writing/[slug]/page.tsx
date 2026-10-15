import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { portedEssays, essayBySlug } from "@/content/writing";

export function generateStaticParams() {
  return portedEssays.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = essayBySlug(slug);
  if (!e) return {};
  return { title: e.title, description: e.description };
}

export default async function EssayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const essay = essayBySlug(slug);
  if (!essay) notFound();
  const words = essay.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(words / 230));
  const ordered = [...portedEssays].filter((e) => e.date).sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!));
  const at = ordered.findIndex((e) => e.slug === essay.slug);
  const newer = at > 0 ? ordered[at - 1] : null;
  const older = at >= 0 && at < ordered.length - 1 ? ordered[at + 1] : null;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: essay.title,
    description: essay.description,
    datePublished: essay.date ?? undefined,
    author: { "@type": "Person", name: "Josh Whitehead", url: "https://josh.design" },
    publisher: { "@type": "Person", name: "Josh Whitehead" },
    mainEntityOfPage: `https://josh.design/writing/${essay.slug}`,
    image: `https://josh.design/writing/${essay.slug}/opengraph-image`,
  };

  return (
    <Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="max-w-2xl pb-28 pt-28 sm:pt-40">
        <Link href="/writing" className="text-sm text-fg-2 transition-colors hover:text-fg">
          ‹ Writing
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-fg-2">
            {[essay.badge, essay.date ? new Date(essay.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null, `${readingTime} min read`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="serif mt-3 text-[2.75rem] leading-[1.02] text-balance sm:text-[4rem]">{essay.title}</h1>
          {essay.description && <p className="mt-5 text-xl leading-snug text-fg-2 text-pretty">{essay.description}</p>}
        </header>

        <div className="prose-mono mt-12 text-[1.0625rem] leading-relaxed text-pretty" dangerouslySetInnerHTML={{ __html: essay.html }} />

        <nav aria-label="More writing" className="mt-16 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
          {older && (
            <Link href={`/writing/${older.slug}`} className="group">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">Earlier</p>
              <p className="serif mt-2 text-[1.5rem] leading-tight group-hover:underline">{older.title}</p>
            </Link>
          )}
          {newer && (
            <Link href={`/writing/${newer.slug}`} className="group sm:text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">Later</p>
              <p className="serif mt-2 text-[1.5rem] leading-tight group-hover:underline">{newer.title}</p>
            </Link>
          )}
        </nav>
      </article>
    </Container>
  );
}
