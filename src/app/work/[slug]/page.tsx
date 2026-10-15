import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Label, Arrow } from "@/components/ui";
import { Reveal, Drift } from "@/components/motion";
import { workMedia } from "@/content/work-media";
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
  const media = workMedia[p.slug];
  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];
  const years = p.timeline.replace(/[A-Za-z]{3} /g, "");

  return (
    <article>
      {/* the cover — the project's field, title, and image */}
      <header className="relative isolate overflow-hidden" style={{ background: media?.field ?? "#111" }}>
        <div className="gutter mx-auto w-full max-w-[1440px] pb-16 pt-28 sm:pt-40">
          <Link href="/work" className="text-sm text-fg-2 transition-colors hover:text-fg">
            ‹ Work
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="text-sm text-fg-2">{p.context}</p>
              <h1 className="tighter mt-4 text-[3.5rem] font-semibold leading-[0.95] sm:text-[6rem] lg:text-[7.5rem]">{p.title}</h1>
              <p className="mt-6 max-w-2xl text-xl leading-snug text-fg-2 text-pretty sm:text-2xl">{p.summary}</p>
            </div>
            <dl className="grid grid-cols-2 gap-6 text-sm lg:col-span-4 lg:grid-cols-1">
              {[
                ["Role", p.role],
                ["Years", years],
                ["Scope", p.scope.join(", ")],
                ["Status", p.status],
              ].map(([k, v]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt className="text-fg-3">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {media?.cover.src && (
            <Reveal className="mt-14" delay={0.1}>
              <Drift amount={5} aspect={media.cover.aspect === "1 / 1" ? "16 / 10" : media.cover.aspect} className="rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.cover.src} alt={media.cover.alt} loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              </Drift>
            </Reveal>
          )}
        </div>
      </header>

      {media?.proof && (
        <Container wide>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-line py-10 sm:grid-cols-4">
            {media.proof.map((pf) => (
              <div key={pf.label}>
                <dt className="tighter text-[2rem] font-semibold leading-none sm:text-[2.75rem]">{pf.n}</dt>
                <dd className="mt-2 text-sm text-fg-3 text-pretty">{pf.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      )}

      {media?.beats ? (
        <Container wide>
          <section className="py-20 sm:py-28" aria-label="The story">
            <ol className="space-y-20 sm:space-y-28">
              {media.beats.map((b, i) => {
                const img = b.image !== undefined ? media.gallery[b.image] : undefined;
                const flip = i % 2 === 1;
                return (
                  <li key={b.title} className="grid gap-8 lg:grid-cols-12 lg:items-center">
                    <div className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
                      <Reveal>
                        <p className="text-sm tabular-nums text-fg-3">{String(i + 1).padStart(2, "0")}</p>
                        <h2 className="serif mt-2 text-[2rem] leading-[1.05] sm:text-[2.75rem]">{b.title}</h2>
                        <p className="mt-5 text-lg leading-relaxed text-fg-2 text-pretty">{b.body}</p>
                      </Reveal>
                    </div>
                    {img && (
                      <Reveal className={`lg:col-span-6 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`} delay={0.08}>
                        <figure>
                          <div className="frame rounded-lg" style={{ aspectRatio: img.aspect }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
                          </div>
                          {img.caption && <figcaption className="mt-3 text-sm text-fg-2">{img.caption}</figcaption>}
                        </figure>
                      </Reveal>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </Container>
      ) : (
      <Container>
        <section className="grid gap-8 py-20 sm:py-28 lg:grid-cols-12">
          <Label className="lg:col-span-3">The brief</Label>
          <p className="serif text-[1.75rem] leading-tight text-pretty sm:text-[2.25rem] lg:col-span-9">{p.brief}</p>
        </section>

        <section className="grid gap-8 border-t border-line py-20 lg:grid-cols-12">
          <Label className="lg:col-span-3">What I did</Label>
          <ol className="lg:col-span-9">
            {p.contribution.map((c, i) => (
              <Reveal key={i} as="li" className="flex gap-6 border-b border-line py-5 first:border-t" delay={0.04 * i}>
                <span className="w-6 shrink-0 text-sm tabular-nums text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg leading-relaxed text-pretty">{c}</span>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 border-t border-line py-20 lg:grid-cols-12">
          <Label className="lg:col-span-3">Outcome</Label>
          <ul className="space-y-4 lg:col-span-9">
            {p.outcome.map((o, i) => (
              <li key={i} className="text-lg leading-relaxed text-pretty">
                {o}
              </li>
            ))}
          </ul>
        </section>
      </Container>
      )}

      {media && media.gallery.length > 0 && (
        <Container wide>
          <section className="border-t border-line py-20 sm:py-28" aria-label="Gallery">
            <Label>{media.beats ? "Everything else from the work" : "The work"}</Label>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {media.gallery
                .filter((_, i) => !media.beats?.some((b) => b.image === i))
                .map((m, i) => (
                <Reveal key={m.src} as="figure" className={m.span === 2 ? "sm:col-span-2" : ""} delay={0.03 * (i % 2)}>
                  <div className="frame rounded-lg" style={{ aspectRatio: m.aspect }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
                  </div>
                  {m.caption && <figcaption className="mt-3 text-sm text-fg-2">{m.caption}</figcaption>}
                </Reveal>
              ))}
            </div>
          </section>
        </Container>
      )}

      <Container>
        {p.tools && p.tools.length > 0 && (
          <section className="grid gap-8 border-t border-line py-12 lg:grid-cols-12">
            <Label className="lg:col-span-3">Tools</Label>
            <p className="text-fg-2 lg:col-span-9">{p.tools.join(", ")}</p>
          </section>
        )}
        <nav className="flex items-baseline justify-between border-t border-line py-10">
          <span className="text-sm text-fg-3">Next</span>
          <Arrow href={next.internalLink ?? `/work/${next.slug}`} className="serif text-[2rem] sm:text-[2.5rem]">
            {next.title}
          </Arrow>
        </nav>
      </Container>
    </article>
  );
}
