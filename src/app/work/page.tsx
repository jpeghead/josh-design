import type { Metadata } from "next";
import { Container, PageHeader, Label, List, Row } from "@/components/ui";
import { projects, clientRoll, clientRollFraming } from "@/lib/data";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected product design — Spin, Hush, Very Good Ventures, Saucey, NationBuilder, Differential, and Boneyard.",
};

export default function WorkPage() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const bench = projects.filter((p) => p.tier === "bench");

  return (
    <Container>
      <PageHeader
        label="Work"
        title="Fifteen years of designing things that ship."
        dek="What I actually did, stated plainly. First designer to Head of Design, twice. A principal seat on the Flutter side of Google's world. Now my own studio."
      />

      <section className="pb-16" aria-labelledby="h-cs">
        <Label>
          <span id="h-cs">Case studies</span>
        </Label>
        <List>
          {featured.map((p) => (
            <Row key={p.slug} href={`/work/${p.slug}`} title={p.title} meta={p.timeline} body={p.summary} />
          ))}
        </List>
      </section>

      <section className="pb-16" aria-labelledby="h-bench">
        <Label>
          <span id="h-bench">Also</span>
        </Label>
        <List>
          {bench.map((p) => (
            <Row key={p.slug} href={p.internalLink ?? `/work/${p.slug}`} title={p.title} meta={p.timeline} body={p.role} />
          ))}
        </List>
      </section>

      <section className="pb-28" aria-labelledby="h-clients">
        <Label>
          <span id="h-clients">Clients</span>
        </Label>
        <p className="tight mt-4 max-w-3xl text-xl leading-snug text-fg-2 sm:text-2xl">{clientRoll.join(", ")}.</p>
        <p className="mt-3 text-sm text-fg-3">{clientRollFraming}</p>
      </section>
    </Container>
  );
}
