import type { Metadata } from "next";
import { Container, PageHeader, Label, Arrow } from "@/components/ui";
import { aboutParagraphs } from "@/content/about";
import { career, principles } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "A kid who drew all day, a Marine combat photographer, a self-taught designer and engineer who led design twice and now builds his own studio.",
};

export default function AboutPage() {
  const body = aboutParagraphs.slice(0, -1);
  const closing = aboutParagraphs[aboutParagraphs.length - 1];

  return (
    <Container>
      <PageHeader label="About" title={closing} />

      <section className="max-w-2xl space-y-6 text-lg leading-relaxed text-pretty">
        {body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </section>

      <section className="pt-20" aria-labelledby="h-timeline">
        <Label>
          <span id="h-timeline">Timeline</span>
        </Label>
        <ol className="mt-4 border-t border-line">
          {career.map((c) => (
            <li key={c.span} className="grid gap-x-8 gap-y-1 border-b border-line py-5 sm:grid-cols-[9rem_1fr]">
              <span className="text-sm tabular-nums text-fg-3">{c.span}</span>
              <div>
                <p className="tight text-[1.0625rem] font-medium leading-snug">{c.org}</p>
                <p className="mt-0.5 text-sm text-fg-2">
                  {c.role} · {c.location}
                </p>
                {c.note && <p className="mt-1 text-sm text-fg-3 text-pretty">{c.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="pt-20" aria-labelledby="h-principles">
        <Label>
          <span id="h-principles">What I hold to</span>
        </Label>
        <div className="mt-6 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {principles.map((pr) => (
            <div key={pr.n}>
              <h3 className="tight text-xl font-semibold leading-tight">{pr.title}</h3>
              <p className="mt-2 text-fg-2 text-pretty">{pr.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-x-8 gap-y-3 pb-28 pt-20">
        <Arrow href="/work">The work</Arrow>
        <Arrow href="/contact" className="text-fg-2">
          Get in touch
        </Arrow>
      </section>
    </Container>
  );
}
