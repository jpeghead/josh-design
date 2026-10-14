import type { Metadata } from "next";
import { Container, Label, Arrow } from "@/components/ui";
import { Reveal, Words } from "@/components/motion";
import { StoryVideo } from "@/components/story-video";
import { aboutParagraphs } from "@/content/about";
import { story } from "@/content/work-media";
import { career, principles } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "A kid who drew all day, a Marine combat photographer, a self-taught designer and engineer who led design twice and now builds his own studio.",
};

const photos = [story.osprey, story.flightline, story.range, story.runway, story.doorway, story.crawl, story.ammo, story.flag, story.convoy];

export default function AboutPage() {
  const body = aboutParagraphs.slice(0, -1);
  const closing = aboutParagraphs[aboutParagraphs.length - 1];

  return (
    <>
      <Container wide>
        <header className="grid gap-12 pb-20 pt-28 sm:pt-40 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-sm text-fg-2">About</p>
            <h1 className="serif mt-4 max-w-[16ch] text-[3rem] leading-[0.98] text-balance sm:text-[4.5rem] lg:text-[5.5rem]">
              <Words text={closing} />
            </h1>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.2}>
              <div className="frame mx-auto w-[min(100%,340px)] rounded-xl lg:w-full" style={{ aspectRatio: story.montage.aspect }}>
                <StoryVideo src={story.montage.src} poster={story.montage.poster} />
              </div>
            </Reveal>
          </div>
        </header>
      </Container>

      <Container>
        <section className="max-w-2xl space-y-7 pb-24 text-[1.25rem] leading-relaxed text-pretty">
          {body.map((para, i) => (
            <Reveal key={i} as="p" delay={0.03}>
              {para}
            </Reveal>
          ))}
        </section>
      </Container>

      <section className="border-t border-line" aria-labelledby="h-photos">
        <Container wide className="py-20 sm:py-28">
          <Label>
            <span id="h-photos">2008–2013 · Combat photographer, U.S. Marine Corps</span>
          </Label>
          <div className="mt-6 columns-2 gap-3 sm:columns-3">
            {photos.map((ph, i) => (
              <Reveal key={ph.src} delay={0.04 * (i % 3)} className="mb-3 break-inside-avoid">
                <div className="frame rounded-lg" style={{ aspectRatio: ph.aspect }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.src} alt={ph.alt} loading="lazy" decoding="async" />
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container wide>
        <section className="grid gap-10 border-t border-line py-20 sm:py-28 lg:grid-cols-12" aria-labelledby="h-timeline">
          <div className="lg:col-span-4">
            <Label>
              <span id="h-timeline">Timeline</span>
            </Label>
            <p className="serif mt-4 text-[2rem] leading-tight text-fg-2">Locked to the real dates.</p>
          </div>
          <ol className="border-t border-line lg:col-span-8">
            {career.map((c, i) => (
              <Reveal key={c.span} as="li" delay={0.02 * i} className="grid gap-x-8 gap-y-1 border-b border-line py-5 sm:grid-cols-[9rem_1fr]">
                <span className="text-sm tabular-nums text-fg-3">{c.span}</span>
                <div>
                  <p className="tight text-[1.125rem] font-medium leading-snug">{c.org}</p>
                  <p className="mt-0.5 text-sm text-fg-2">
                    {c.role} · {c.location}
                  </p>
                  {c.note && <p className="mt-1 text-sm text-fg-3 text-pretty">{c.note}</p>}
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 border-t border-line py-20 sm:py-28 lg:grid-cols-12" aria-labelledby="h-principles">
          <div className="lg:col-span-4">
            <Label>
              <span id="h-principles">What I hold to</span>
            </Label>
          </div>
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:col-span-8">
            {principles.map((pr, i) => (
              <Reveal key={pr.n} delay={0.05 * i}>
                <h3 className="serif text-[1.75rem] leading-tight">{pr.title}</h3>
                <p className="mt-2 text-fg-2 text-pretty">{pr.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line py-16">
          <Arrow href="/work">The work</Arrow>
          <Arrow href="/products" className="text-fg-2">
            What I&rsquo;m building
          </Arrow>
        </section>
      </Container>
    </>
  );
}
