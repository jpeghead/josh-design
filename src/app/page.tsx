import { Container, Label, List, Row, Arrow } from "@/components/ui";
import { identityLine, aboutParagraphs } from "@/content/about";
import { products } from "@/content/products";
import { projects } from "@/lib/data";

export default function Home() {
  const featured = projects.filter((p) => p.tier === "case-study");
  const building = products.filter((p) => p.status !== "Released");
  const closing = aboutParagraphs[aboutParagraphs.length - 1];

  return (
    <Container>
      <section className="pb-20 pt-28 sm:pb-28 sm:pt-44">
        <h1 className="tighter max-w-4xl text-[3rem] font-semibold leading-[1.02] text-balance sm:text-[4.5rem] lg:text-[5.5rem]">
          Designer and builder.
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug text-fg-2 text-pretty sm:text-2xl">
          {identityLine.replace("Designer and builder. ", "")}
        </p>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <Arrow href="/work">See the work</Arrow>
          <Arrow href="/about" className="text-fg-2">
            About me
          </Arrow>
        </div>
      </section>

      <section className="pb-20 sm:pb-24" aria-labelledby="h-work">
        <div className="flex items-baseline justify-between">
          <Label>
            <span id="h-work">Selected work</span>
          </Label>
          <Arrow href="/work" className="text-sm text-fg-2">
            All work
          </Arrow>
        </div>
        <List>
          {featured.map((p) => (
            <Row key={p.slug} href={`/work/${p.slug}`} title={p.title} meta={p.timeline.split(" – ")[0].slice(-4)} body={p.summary} />
          ))}
        </List>
      </section>

      <section className="pb-20 sm:pb-24" aria-labelledby="h-building">
        <div className="flex items-baseline justify-between">
          <Label>
            <span id="h-building">Building now</span>
          </Label>
          <Arrow href="/products" className="text-sm text-fg-2">
            All products
          </Arrow>
        </div>
        <List>
          {building.map((p) => (
            <Row key={p.slug} title={p.name} meta={p.status} body={p.tagline} />
          ))}
        </List>
      </section>

      <section className="pb-28 sm:pb-36" aria-labelledby="h-about">
        <Label>
          <span id="h-about">About</span>
        </Label>
        <p className="tight mt-4 max-w-3xl text-[1.75rem] font-semibold leading-tight text-balance sm:text-[2.25rem]">{closing}</p>
        <p className="mt-6 max-w-2xl text-fg-2 text-pretty">
          Marine combat photographer, then self-taught designer and engineer. First designer to Head of Design twice, a
          principal seat at Very Good Ventures, and now my own studio, Boneyard.
        </p>
        <Arrow href="/about" className="mt-6">
          The whole story
        </Arrow>
      </section>
    </Container>
  );
}
