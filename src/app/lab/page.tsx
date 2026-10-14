import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, Arrow } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { lab, REPO } from "@/content/lab";

export const metadata: Metadata = {
  title: "Lab",
  description: "Things built to see if they could be built: a playable 3D city, agent UI patterns, a live Claude grounded in this site, and more. All running, all in one repo.",
};

export default function LabPage() {
  const entries = lab.filter((l) => l.slug !== "site");
  const site = lab.find((l) => l.slug === "site")!;
  return (
    <Container wide>
      <PageHeader
        label="Lab"
        serif
        title="Built to see if it could be built."
        dek="Every entry runs. Most were made with an agent in the loop, in days not quarters. They're here because the fastest way to learn what AI can ship is to ship with it."
      />

      <ul className="grid gap-x-6 gap-y-14 pb-20 sm:grid-cols-2">
        {entries.map((l, i) => (
          <Reveal key={l.slug} as="li" delay={0.05 * (i % 2)}>
            <Link href={l.href} className="group block">
              <div className="frame frame-hover rounded-lg" style={{ aspectRatio: l.aspect ?? "16 / 10" }}>
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h2 className="tight text-[1.5rem] font-semibold leading-tight">{l.title}</h2>
                <span className="shrink-0 text-xs text-fg-3">
                  {l.kind}
                  {l.desktopOnly ? " · desktop" : ""}
                </span>
              </div>
              <p className="mt-2 text-[15px] text-fg-2 text-pretty">{l.blurb}</p>
              <p className="mt-3 text-xs text-fg-3">
                {l.when} · {l.built}
              </p>
              <span className="mt-3 inline-block text-sm font-medium">
                {l.kind === "Playable" ? "Play" : l.kind === "Live model" ? "Ask" : "Open"} <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">›</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>

      <section className="grid gap-8 border-t border-line py-16 lg:grid-cols-12" aria-labelledby="h-site">
        <div className="lg:col-span-4">
          <h2 id="h-site" className="tight text-[1.5rem] font-semibold leading-tight">
            {site.title}
          </h2>
          <p className="mt-2 text-xs text-fg-3">{site.built}</p>
        </div>
        <div className="lg:col-span-8">
          <p className="text-lg text-fg-2 text-pretty">{site.blurb}</p>
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            <Arrow href="/lab/site">How this site is built</Arrow>
            {REPO.isPublic && (
              <Arrow href={REPO.url} external className="text-fg-2">
                Source on GitHub
              </Arrow>
            )}
          </div>
        </div>
      </section>
    </Container>
  );
}
