import Link from "next/link";
import { Container, Label, Arrow } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { ParticlesMount } from "@/components/builds/particles-mount";
import { lab, REPO } from "@/content/lab";
import { now } from "@/content/now";
import { portedEssays } from "@/content/writing";
import { products } from "@/content/products";
import { repoStars, lastCommit, ago } from "@/lib/github";
import { projects } from "@/lib/data";

export const revalidate = 900;

const OSS = [
  { repo: "jpeghead/agent-ui-patterns", title: "agent-ui-patterns", line: "Working React prototypes for agent interfaces: progress, scoped permissions, failure recovery, graded confidence." },
  { repo: "jpeghead/local-grounded-chat", title: "local-grounded-chat", line: "A grounded language model in the browser on WebGPU. No server, no key." },
  { repo: "jpeghead/josh-design", title: "josh-design", line: "This site, every experiment in it, and the handoff doc that lets an agent pick it up cold." },
];

type Row = { href: string; title: string; line: string; meta?: string; external?: boolean };

function Index({ label, rows }: { label: string; rows: Row[] }) {
  return (
    <section className="border-t border-line py-6" aria-label={label}>
      <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">{label}</h2>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.href + r.title} className="group">
            {r.external ? (
              <a href={r.href} target="_blank" rel="noreferrer" className="block">
                <RowInner r={r} />
              </a>
            ) : (
              <Link href={r.href} className="block">
                <RowInner r={r} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RowInner({ r }: { r: Row }) {
  return (
    <span className="flex items-baseline gap-3">
      <span className="min-w-0 flex-1">
        <span className="tight text-[15px] font-medium underline-offset-4 group-hover:underline">{r.title}</span>
        <span className="text-[15px] text-fg-2"> — {r.line}</span>
      </span>
      {r.meta && <span className="shrink-0 text-xs tabular-nums text-fg-3">{r.meta}</span>}
      <span aria-hidden className="shrink-0 text-xs text-fg-3 transition-transform duration-300 group-hover:translate-x-0.5">
        {r.external ? "↗" : "›"}
      </span>
    </span>
  );
}

export default async function Home() {
  const [stars, commit] = await Promise.all([Promise.all(OSS.map((o) => repoStars(o.repo))), lastCommit("jpeghead/josh-design")]);
  const live = products.filter((p) => p.status === "Site live" || p.status === "Live" || p.status === "Live beta");
  const building: Row[] = [
    ...live.map((p) => ({ href: p.link?.href ?? `/products/${p.slug}`, title: p.name, line: p.tagline, meta: p.link?.label ?? p.status, external: !!p.link?.href.startsWith("http") })),
    ...lab
      .filter((l) => ["portrait", "local", "agents", "ask", "city"].includes(l.slug))
      .map((l) => ({ href: l.href, title: l.title, line: l.blurb.split(". ")[0] + ".", meta: l.kind })),
  ];
  const oss: Row[] = OSS.map((o, i) => ({ href: `https://github.com/${o.repo}`, title: o.title, line: o.line, meta: stars[i] ? `★ ${stars[i]}` : undefined, external: true }));
  const writing: Row[] = portedEssays.slice(0, 4).map((e) => ({ href: `/writing/${e.slug}`, title: e.title, line: e.description.split(". ")[0].replace(/[.:]$/, "") + ".", meta: e.date ? new Date(e.date).getFullYear().toString() : undefined }));
  const before: Row[] = projects
    .filter((p) => p.tier === "case-study")
    .map((p) => ({ href: `/work/${p.slug}`, title: p.title, line: p.summary.split(". ")[0] + ".", meta: p.timeline.replace(/[A-Za-z]{3} /g, "") }));
  const stillBuilding = products.filter((p) => p.status === "In development");

  return (
    <>
      <section className="relative isolate overflow-hidden" aria-label="Introduction">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          <ParticlesMount />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-transparent" />
        </div>
        <Container wide className="relative pb-24 pt-28 sm:pt-36">
          <div className="max-w-[640px]">
            <h1 className="tighter text-[2.25rem] font-semibold leading-none sm:text-[2.75rem]">Josh Whitehead</h1>
            <p className="serif mt-4 text-[1.75rem] leading-[1.1] text-balance sm:text-[2.25rem]">
              Designer who builds AI products end to end, with agents in the loop.
            </p>
            <p className="mt-5 max-w-xl text-[15px] text-fg-2 text-pretty">
              Fifteen years shipping product. First designer to Head of Design twice, both companies acquired. Former Marine Corps combat photographer. Los Angeles.
            </p>

            <dl className="mt-8 space-y-2 border-t border-line pt-5 text-[15px]">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-xs uppercase tracking-[0.14em] text-fg-3 pt-1">This week</dt>
                <dd className="text-fg-2 text-pretty">{now.line}</dd>
              </div>
              {commit && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-xs uppercase tracking-[0.14em] text-fg-3 pt-1">Last commit</dt>
                  <dd className="min-w-0 text-fg-2">
                    <a href={commit.url} target="_blank" rel="noreferrer" className="hover:text-fg">
                      <span className="text-fg-3">{ago(commit.date)} · </span>
                      {commit.message}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              <Index label="Building" rows={building} />
              {stillBuilding.length > 0 && (
                <p className="-mt-2 pb-4 text-sm text-fg-3">
                  Also in the workshop at Boneyard:{" "}
                  {stillBuilding.map((p, i) => (
                    <span key={p.slug}>
                      <Link href={`/products/${p.slug}`} className="underline decoration-fg-3 underline-offset-4 hover:text-fg">
                        {p.name}
                      </Link>
                      {i < stillBuilding.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              )}
              <Index label="Open source" rows={oss} />
              <Index label="Writing" rows={writing} />
              <Index label="Before this" rows={before} />
              <section className="border-t border-line py-6" aria-label="More">
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-fg-2">
                  <li><Link href="/lab" className="hover:text-fg">All builds ›</Link></li>
                  <li><Link href="/process" className="hover:text-fg">How I work with agents ›</Link></li>
                  <li><Link href="/resume" className="hover:text-fg">Résumé ›</Link></li>
                  <li><Link href="/about" className="hover:text-fg">The story ›</Link></li>
                  {REPO.isPublic && <li><a href={REPO.url} target="_blank" rel="noreferrer" className="hover:text-fg">GitHub ↗</a></li>}
                </ul>
              </section>
            </div>
          </div>
        </Container>
      </section>

      {/* a strip of the builds, because some of them are worth seeing */}
      <section className="border-t border-line" aria-labelledby="h-builds">
        <Container wide className="py-16 sm:py-20">
          <div className="flex items-baseline justify-between gap-6">
            <Label>
              <span id="h-builds">Builds · every one runs</span>
            </Label>
            <Arrow href="/lab" className="text-sm text-fg-2">
              All builds
            </Arrow>
          </div>
          <ul className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {lab
              .filter((l) => ["portrait", "local", "agents", "particles", "city", "ask"].includes(l.slug))
              .map((l, i) => (
                <Reveal key={l.slug} as="li" delay={0.04 * i}>
                  <Link href={l.href} className="group block">
                    <div className="frame frame-hover rounded-md" style={{ aspectRatio: "16 / 10" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {l.image && <img src={l.image} alt="" loading="lazy" decoding="async" />}
                    </div>
                    <p className="mt-2 text-[13px] font-medium">{l.title}</p>
                    <p className="text-xs text-fg-3">{l.kind}</p>
                  </Link>
                </Reveal>
              ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
