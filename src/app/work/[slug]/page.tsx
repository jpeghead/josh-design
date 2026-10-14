import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Label, Arrow } from "@/components/ui";
import { projects } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.summary };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <Container>
      <article className="max-w-3xl pb-28 pt-24 sm:pt-32">
        <Link href="/work" className="text-sm text-fg-2 transition-colors hover:text-fg">
          ‹ Work
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-fg-2">{p.context}</p>
          <h1 className="tighter mt-2 text-[2.5rem] font-semibold leading-[1.05] sm:text-[3.5rem]">{p.title}</h1>
          <p className="mt-6 text-xl leading-snug text-fg-2 text-pretty sm:text-[1.375rem]">{p.summary}</p>
        </header>

        <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 text-sm sm:grid-cols-4">
          {[
            ["Role", p.role],
            ["Timeline", p.timeline],
            ["Status", p.status],
            ["Scope", p.scope.join(", ")],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-fg-3">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14">
          <Label>The brief</Label>
          <p className="mt-3 text-lg leading-relaxed text-pretty">{p.brief}</p>
        </section>

        <section className="mt-14">
          <Label>What I did</Label>
          <ol className="mt-3 border-t border-line">
            {p.contribution.map((c, i) => (
              <li key={i} className="flex gap-5 border-b border-line py-4">
                <span className="w-6 shrink-0 text-sm tabular-nums text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed text-pretty">{c}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <Label>Outcome</Label>
          <ul className="mt-3 space-y-3">
            {p.outcome.map((o, i) => (
              <li key={i} className="leading-relaxed text-pretty">
                {o}
              </li>
            ))}
          </ul>
        </section>

        {p.tools && p.tools.length > 0 && (
          <section className="mt-14">
            <Label>Tools</Label>
            <p className="mt-3 text-fg-2">{p.tools.join(", ")}</p>
          </section>
        )}

        <nav className="mt-20 flex items-baseline justify-between border-t border-line pt-6">
          <span className="text-sm text-fg-3">Next</span>
          <Arrow href={next.internalLink ?? `/work/${next.slug}`} className="text-lg">
            {next.title}
          </Arrow>
        </nav>
      </article>
    </Container>
  );
}
