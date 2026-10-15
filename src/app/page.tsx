import Link from "next/link";
import { Container, Label, Arrow } from "@/components/ui";
import { Reveal, Words } from "@/components/motion";
import { Hero } from "@/components/builds/hero";
import { lab } from "@/content/lab";
import { portedEssays } from "@/content/writing";
import { workMedia } from "@/content/work-media";
import { projects } from "@/lib/data";

const SKILLS: { title: string; body: string; href: string; proof: string }[] = [
  { title: "Models on the edge", body: "Inference in the browser on WebGPU: weights streamed, cached, grounded, streamed back token by token. No server in the loop.", href: "/lab/local", proof: "A model in your browser" },
  { title: "Grounding and streaming", body: "A route handler that builds its system prompt from the same files that render the pages, streams from the Anthropic SDK, and rate-limits per visitor.", href: "/lab/ask", proof: "Ask my portfolio" },
  { title: "Agent interaction design", body: "Progress you can trust, permissions with real scope, failure that recovers, confidence that's graded. Built, not mocked.", href: "/lab/agents", proof: "Agent UI patterns" },
  { title: "Agentic workflow", body: "Claude Code and Codex read the repo, build, verify in a browser, and commit. I set direction and the bar. Whole directions get built and killed in a day.", href: "/process", proof: "Process, with the artifacts" },
  { title: "Real-time 3D and shaders", body: "A 65k-particle GLSL hero, a physics-driven 3D city, a scroll-conducted studio. Custom shaders, procedural textures, no asset downloads.", href: "/lab/city", proof: "Whitehead City" },
  { title: "Product, end to end", body: "OLO v0 shipped as a browser-only beta: parsers, analysis, portrait, privacy by construction. Before that, first designer to Head of Design twice, both companies acquired.", href: "/products/olo/app", proof: "Try OLO" },
];

export default function Home() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const builds = lab.filter((l) => ["olo", "local", "agents", "city", "ask", "particles"].includes(l.slug));
  const essay = portedEssays[0];

  return (
    <>
      <Hero />

      {/* builds — first, because they're the point */}
      <section id="builds" className="scroll-mt-16 border-t border-line" aria-labelledby="h-builds">
        <Container wide className="py-24 sm:py-32">
          <div className="flex items-baseline justify-between gap-6">
            <Label>
              <span id="h-builds">Builds · every one runs</span>
            </Label>
            <Arrow href="/lab" className="text-sm text-fg-2">
              All builds
            </Arrow>
          </div>
          <ul className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map((l, i) => (
              <Reveal key={l.slug} as="li" delay={0.05 * (i % 3)}>
                <Link href={l.href} className="group block">
                  <div className="frame frame-hover rounded-lg" style={{ aspectRatio: "16 / 10" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image && <img src={l.image} alt="" loading={i < 3 ? "eager" : "lazy"} decoding="async" />}
                  </div>
                  <p className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="tight text-[1.125rem] font-medium">{l.title}</span>
                    <span className="shrink-0 text-xs text-fg-3">{l.kind}</span>
                  </p>
                  <p className="mt-1 text-sm text-fg-2 text-pretty">{l.blurb.split(". ")[0]}.</p>
                  <p className="mt-2 text-xs text-fg-3">{l.built}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* what I do with models — each claim links to the proof */}
      <section className="border-t border-line" aria-labelledby="h-skills">
        <Container wide className="py-24 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Label>
                <span id="h-skills">What I do with models</span>
              </Label>
              <h2 className="serif mt-4 text-[2.5rem] leading-[1] text-balance sm:text-[3.5rem]">
                <Words text="Every claim here links to the thing that proves it." />
              </h2>
            </div>
            <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {SKILLS.map((s, i) => (
                <Reveal key={s.title} as="li" delay={0.04 * i} className="border-t border-line pt-5">
                  <h3 className="tight text-[1.125rem] font-medium">{s.title}</h3>
                  <p className="mt-2 text-[15px] text-fg-2 text-pretty">{s.body}</p>
                  <Arrow href={s.href} className="mt-3 text-sm">
                    {s.proof}
                  </Arrow>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* process — the loop, briefly */}
      <section className="border-t border-line" aria-labelledby="h-process">
        <Container wide className="py-24 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Label>
                <span id="h-process">How I work</span>
              </Label>
              <h2 className="serif mt-4 text-[2.5rem] leading-[1] text-balance sm:text-[3.5rem]">
                <Words text="An agent in the loop, a person at the wheel." />
              </h2>
              <Reveal delay={0.3}>
                <p className="mt-6 max-w-2xl text-lg text-fg-2 text-pretty">
                  Thirty-five commits in sixteen days built a playable city. A subagent cataloged 128 images by project while I did
                  something else. A 299-line handoff document lets a second agent pick the repo up cold. The process page shows the
                  real artifacts, not a diagram.
                </p>
                <Arrow href="/process" className="mt-6">
                  See the process
                </Arrow>
              </Reveal>
            </div>
            <dl className="grid grid-cols-3 gap-6 lg:col-span-5">
              {[
                ["35", "commits, Jul 6–22"],
                ["10,217", "lines across four experiments"],
                ["128", "images cataloged by a subagent"],
              ].map(([n, l]) => (
                <div key={l} className="border-t border-line pt-4">
                  <dt className="tighter text-[2.25rem] font-semibold leading-none sm:text-[3rem]">{n}</dt>
                  <dd className="mt-2 text-sm text-fg-3">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* the foundation — product design, compact */}
      <section className="border-t border-line" aria-labelledby="h-work">
        <Container wide className="py-24 sm:py-32">
          <div className="flex items-baseline justify-between gap-6">
            <Label>
              <span id="h-work">The foundation · fifteen years of product design</span>
            </Label>
            <Arrow href="/work" className="text-sm text-fg-2">
              All work
            </Arrow>
          </div>
          <ul className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-3">
            {featured.map((p, i) => {
              const m = workMedia[p.slug];
              return (
                <Reveal key={p.slug} as="li" delay={0.05 * i}>
                  <Link href={`/work/${p.slug}`} className="group block">
                    <div className="frame frame-hover rounded-lg" style={{ aspectRatio: "1 / 1", background: m?.field }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {m?.cover.src && <img src={m.cover.src} alt={m.cover.alt} loading="lazy" decoding="async" />}
                    </div>
                    <p className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="tight text-[1.125rem] font-medium">{p.title}</span>
                      <span className="shrink-0 text-xs text-fg-3">{p.timeline.replace(/[A-Za-z]{3} /g, "")}</span>
                    </p>
                    <p className="mt-1 text-sm text-fg-2 text-pretty">{p.summary}</p>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      {essay && (
        <section className="border-t border-line" aria-labelledby="h-essay">
          <Container wide className="py-20 sm:py-24">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-4">
                <Label>
                  <span id="h-essay">Latest writing</span>
                </Label>
              </div>
              <div className="lg:col-span-8">
                <Reveal>
                  <h2 className="serif text-[2rem] leading-[1.05] sm:text-[2.75rem]">{essay.title}</h2>
                  <p className="mt-3 max-w-2xl text-fg-2 text-pretty">{essay.description}</p>
                  <Arrow href={`/writing/${essay.slug}`} className="mt-4">
                    Read it
                  </Arrow>
                </Reveal>
              </div>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
