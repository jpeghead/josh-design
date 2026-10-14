import Link from "next/link";
import { Container, Label, Arrow } from "@/components/ui";
import { Reveal, Words } from "@/components/motion";
import { WorkCover } from "@/components/work-cover";
import { StoryVideo } from "@/components/story-video";
import { products } from "@/content/products";
import { lab } from "@/content/lab";
import { story } from "@/content/work-media";
import { portedEssays } from "@/content/writing";
import { projects } from "@/lib/data";

export default function Home() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const building = products.filter((p) => p.status !== "Released").slice(0, 4);
  const essay = portedEssays[0];

  return (
    <>
      {/* 01 — the opening frame */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="gutter mx-auto grid w-full max-w-[1440px] items-end gap-12 pb-16 pt-32 sm:pt-40 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:pb-24">
          <div className="lg:col-span-7">
            <p className="text-sm text-fg-2">Josh Whitehead · Designer who builds AI products · Los Angeles</p>
            <h1 className="serif mt-6 max-w-[14ch] text-[3rem] leading-[0.98] text-balance sm:text-[4.75rem] lg:text-[5.75rem]">
              <Words text="I've been making things since before I knew it was a job." />
            </h1>
            <Reveal delay={0.5}>
              <p className="mt-8 max-w-xl text-xl leading-snug text-fg-2 text-pretty sm:text-2xl">
                A kid who drew all day. A Marine with a camera. The first designer at two companies that got acquired. Now I
                design and build AI products end to end, with an agent in the loop: the interface, the system, and the thing
                that ships.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link href="#work" className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-85">
                  See the work
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">
                    ↓
                  </span>
                </Link>
                <Arrow href="/lab" className="text-fg-2">
                  Things I built with AI
                </Arrow>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.25}>
              <div className="frame mx-auto w-[min(100%,360px)] rounded-xl lg:w-full" style={{ aspectRatio: story.montage.aspect }}>
                <StoryVideo src={story.montage.src} poster={story.montage.poster} />
              </div>
              <p className="mt-3 text-center text-xs text-fg-3 lg:text-left">1993 → now, in one stack of photographs.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 02–04 — the work, each as its own cover */}
      <div id="work" className="scroll-mt-16">
        <Container wide className="pb-6 pt-24">
          <Label>Selected work</Label>
        </Container>
        {featured.map((p, i) => (
          <WorkCover key={p.slug} project={p} index={i} flip={i % 2 === 1} />
        ))}
        <Container wide className="py-10">
          <Arrow href="/work">All seven projects, and the client list</Arrow>
        </Container>
      </div>

      {/* 05 — the lab: proof of building with AI */}
      <section className="border-t border-line" aria-labelledby="h-lab">
        <Container wide className="py-24 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Label>
                <span id="h-lab">The Lab</span>
              </Label>
              <h2 className="serif mt-4 text-[2.5rem] leading-[1] text-balance sm:text-[3.5rem]">
                <Words text="Built to see if it could be built." />
              </h2>
              <Reveal delay={0.3}>
                <p className="mt-6 max-w-md text-lg text-fg-2 text-pretty">
                  Things made with an agent in the loop, in days: a playable 3D city of my life, working agent-interface
                  patterns, a live Claude grounded in this site. Every one runs.
                </p>
                <Arrow href="/lab" className="mt-6">
                  Open the lab
                </Arrow>
              </Reveal>
            </div>
            <ul className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
              {lab
                .filter((l) => ["city", "agents", "ask"].includes(l.slug))
                .map((l, i) => (
                  <Reveal key={l.slug} as="li" delay={0.06 * i}>
                    <Link href={l.href} className="group block">
                      <div className="frame frame-hover rounded-lg" style={{ aspectRatio: "4 / 3" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {l.image && <img src={l.image} alt="" loading="lazy" decoding="async" />}
                      </div>
                      <p className="mt-3 flex items-baseline justify-between gap-3">
                        <span className="tight text-[1.0625rem] font-medium">{l.title}</span>
                        <span className="text-xs text-fg-3">{l.kind}</span>
                      </p>
                      <p className="mt-1 text-sm text-fg-2">{l.built.split(" · ").slice(0, 2).join(" · ")}</p>
                    </Link>
                  </Reveal>
                ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 05 — the story, in three photographs */}
      <section className="border-t border-line" aria-labelledby="h-story">
        <Container wide className="py-24 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Label>
                <span id="h-story">Where it comes from</span>
              </Label>
              <h2 className="serif mt-4 text-[2.5rem] leading-[1] text-balance sm:text-[3.5rem]">
                <Words text="Five years behind a camera in places that didn't ask for one." />
              </h2>
              <Reveal delay={0.3}>
                <p className="mt-6 max-w-md text-lg text-fg-2 text-pretty">
                  The Marine Corps is where it clicked. I edited my own photographs, kept asking how things were made, and
                  taught myself off YouTube one video at a time. Everything since is the same question, asked at scale.
                </p>
                <Arrow href="/about" className="mt-6">
                  Read the whole story
                </Arrow>
              </Reveal>
            </div>
            <div className="grid grid-cols-6 gap-3 lg:col-span-7">
              <Reveal className="col-span-6" delay={0.05}>
                <div className="frame rounded-lg" style={{ aspectRatio: story.runway.aspect }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.runway.src} alt={story.runway.alt} loading="lazy" decoding="async" />
                </div>
              </Reveal>
              <Reveal className="col-span-2" delay={0.15}>
                <div className="frame rounded-lg" style={{ aspectRatio: "3 / 4" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.marine.src} alt={story.marine.alt} loading="lazy" decoding="async" />
                </div>
              </Reveal>
              <Reveal className="col-span-4" delay={0.2}>
                <div className="frame h-full rounded-lg" style={{ aspectRatio: "2 / 1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.range.src} alt={story.range.alt} loading="lazy" decoding="async" />
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* 06 — building now */}
      <section className="border-t border-line" aria-labelledby="h-building">
        <Container wide className="py-24 sm:py-32">
          <div className="flex items-baseline justify-between">
            <Label>
              <span id="h-building">Building now, at Boneyard</span>
            </Label>
            <Arrow href="/products" className="text-sm text-fg-2">
              All products
            </Arrow>
          </div>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {building.map((p, i) => (
              <Reveal key={p.slug} as="li" delay={0.05 * i} className="bg-bg">
                <Link href={`/products/${p.slug}`} className="group flex h-full flex-col justify-between p-7 transition-colors hover:bg-fill sm:p-9">
                  <div className="flex items-baseline justify-between">
                    <span className="tighter text-[2rem] font-semibold leading-none">{p.name}</span>
                    <span className="text-xs text-fg-3">{p.status}</span>
                  </div>
                  <p className="serif mt-10 text-[1.75rem] leading-tight text-fg-2 sm:text-[2rem]">{p.tagline}</p>
                  <span className="mt-6 text-sm text-fg-3 transition-colors group-hover:text-fg">
                    Open <span aria-hidden>›</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* 07 — one essay */}
      {essay && (
        <section className="border-t border-line" aria-labelledby="h-essay">
          <Container wide className="py-24 sm:py-32">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <Reveal>
                  <div className="frame rounded-lg" style={{ aspectRatio: "4 / 3" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {essay.image && <img src={essay.image} alt="" loading="lazy" decoding="async" />}
                  </div>
                </Reveal>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <Label>
                  <span id="h-essay">Writing</span>
                </Label>
                <Reveal>
                  <h2 className="serif mt-4 text-[2.5rem] leading-[1] sm:text-[3.5rem]">{essay.title}</h2>
                  <p className="mt-5 max-w-lg text-lg text-fg-2 text-pretty">{essay.description}</p>
                  <Arrow href={`/writing/${essay.slug}`} className="mt-6">
                    Read the essay
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
