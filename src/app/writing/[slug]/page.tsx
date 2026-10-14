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

  return (
    <Container>
      <article className="max-w-2xl pb-28 pt-24 sm:pt-32">
        <Link href="/writing" className="text-sm text-fg-2 transition-colors hover:text-fg">
          ‹ Writing
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-fg-2">
            {[essay.badge, essay.date ? new Date(essay.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="tighter mt-2 text-[2.25rem] font-semibold leading-[1.08] text-balance sm:text-[3rem]">{essay.title}</h1>
          {essay.description && <p className="mt-5 text-xl leading-snug text-fg-2 text-pretty">{essay.description}</p>}
        </header>

        <div className="prose-mono mt-12 text-[1.0625rem] leading-relaxed text-pretty" dangerouslySetInnerHTML={{ __html: essay.html }} />
      </article>
    </Container>
  );
}
