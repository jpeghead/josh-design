import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.summary };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article className="bg-paper text-graphite">
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-20 sm:px-8">
        <Link href="/work" className="font-mono text-xs text-graphite-muted hover:text-graphite">
          ← Work
        </Link>

        <header className="mt-8">
          <p className="font-mono text-xs text-graphite-muted">{p.context}</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">{p.title}</h1>
          <p className="mt-5 text-xl text-pretty text-graphite-dim">{p.summary}</p>
        </header>

        {/* Metadata block: Role / Timeline / Scope */}
        <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-black/10 py-6 sm:grid-cols-4">
          <div>
            <dt className="eyebrow">Role</dt>
            <dd className="mt-1 text-sm">{p.role}</dd>
          </div>
          <div>
            <dt className="eyebrow">Timeline</dt>
            <dd className="mt-1 text-sm">{p.timeline}</dd>
          </div>
          <div>
            <dt className="eyebrow">Status</dt>
            <dd className="mt-1 text-sm">{p.status}</dd>
          </div>
          <div>
            <dt className="eyebrow">Scope</dt>
            <dd className="mt-1 text-sm">{p.scope.join(", ")}</dd>
          </div>
        </dl>

        <section className="mt-12">
          <h2 className="eyebrow">The brief</h2>
          <p className="mt-3 text-lg leading-relaxed text-pretty">{p.brief}</p>
        </section>

        <section className="mt-12">
          <h2 className="eyebrow">What I did</h2>
          <ul className="mt-4 space-y-4">
            {p.contribution.map((c, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-1 font-mono text-xs text-gold-dim">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed text-pretty">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="eyebrow">Outcome</h2>
          <ul className="mt-4 space-y-2">
            {p.outcome.map((o, i) => (
              <li key={i} className="border-l-2 border-gold pl-4 leading-relaxed text-pretty">
                {o}
              </li>
            ))}
          </ul>
        </section>

        {p.tools && p.tools.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow">Tools</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tools.map((t) => (
                <span key={t} className="border border-black/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-graphite-muted">
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        <nav className="mt-16 flex items-center justify-between border-t border-black/10 pt-6">
          <span className="font-mono text-xs text-graphite-muted">Next</span>
          <Link href={`/work/${next.slug}`} className="group font-display text-2xl tracking-tight">
            {next.title}
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </nav>
      </div>
    </article>
  );
}
