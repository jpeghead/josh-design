import type { Metadata } from "next";
import { Container, PageHeader, Label, List, Row } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { WorkCover } from "@/components/work-cover";
import { moreScreens } from "@/content/work-media";
import { projects, clientRoll, clientRollFraming } from "@/lib/data";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected product design — Spin, Hush, Very Good Ventures, Saucey, NationBuilder, Differential, and Boneyard.",
};

export default function WorkPage() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const bench = projects.filter((p) => p.tier === "bench");

  return (
    <>
      <Container wide>
        <PageHeader
          label="Work"
          serif
          title="Fifteen years of designing things that ship."
          dek="What I actually did, stated plainly. First designer to Head of Design, twice. A principal seat on the Flutter side of Google's world. Now my own studio."
        />
      </Container>

      {featured.map((p, i) => (
        <WorkCover key={p.slug} project={p} index={i} flip={i % 2 === 1} />
      ))}

      <Container wide>
        <section className="grid gap-12 py-24 lg:grid-cols-12 sm:py-32" aria-labelledby="h-bench">
          <div className="lg:col-span-4">
            <Label>
              <span id="h-bench">Also on the bench</span>
            </Label>
            <p className="serif mt-4 text-[2rem] leading-tight text-fg-2">The years that built the muscle.</p>
          </div>
          <div className="lg:col-span-8">
            <List className="mt-0">
              {bench.map((p) => (
                <Row key={p.slug} href={p.internalLink ?? `/work/${p.slug}`} title={p.title} meta={p.timeline} body={`${p.role}. ${p.summary}`} />
              ))}
            </List>
          </div>
        </section>

        <section className="border-t border-line py-24 sm:py-32" aria-labelledby="h-more">
          <Label>
            <span id="h-more">More screens</span>
          </Label>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {moreScreens.map((m, i) => (
              <Reveal key={m.src} as="figure" delay={0.05 * i}>
                <div className="frame rounded-lg" style={{ aspectRatio: m.aspect }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
                </div>
                {m.caption && <figcaption className="mt-3 text-sm text-fg-2">{m.caption}</figcaption>}
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-line py-24 sm:py-32" aria-labelledby="h-clients">
          <Label>
            <span id="h-clients">Clients and employers</span>
          </Label>
          <p className="serif mt-5 max-w-5xl text-[2rem] leading-[1.1] text-balance sm:text-[3rem]">{clientRoll.join(", ")}.</p>
          <p className="mt-5 max-w-2xl text-sm text-fg-3">{clientRollFraming}</p>
        </section>
      </Container>
    </>
  );
}
