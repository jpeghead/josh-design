import type { Metadata } from "next";
import { Container, Arrow } from "@/components/ui";
import { resume } from "@/content/resume";
import { career, projects, principles } from "@/lib/data";
import { lab } from "@/content/lab";
import { PrintButton } from "@/components/print-button";
import { RECORD } from "@/lib/admin/resume/record";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Josh Whitehead — Product Designer & AI Builder. Fifteen years shipping product, first designer to Head of Design twice, now building AI products with agents in the loop.",
};

export default function ResumePage() {
  const cs = projects.filter((p) => p.tier === "case-study");
  const pdf = existsSync(join(process.cwd(), "public", "Josh-Whitehead-Resume.pdf"));
  return (
    <Container>
      <article className="pb-28 pt-28 sm:pt-36 print:pt-8" itemScope itemType="https://schema.org/Person">
        <header className="border-b border-line pb-8">
          <h1 className="tighter text-[2.5rem] font-semibold leading-none sm:text-[3.5rem]" itemProp="name">
            {resume.name}
          </h1>
          <p className="mt-3 text-xl text-fg-2" itemProp="jobTitle">
            {resume.title}
          </p>
          <p className="mt-2 text-sm text-fg-3">
            <span itemProp="address">{resume.location}</span> · <a href={`mailto:${resume.email}`} itemProp="email" className="hover:text-fg">{resume.email}</a> ·{" "}
            <a href={resume.site} itemProp="url" className="hover:text-fg">
              josh.design
            </a>
          </p>
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-pretty" itemProp="description">
            {resume.summary}
          </p>
          <p className="mt-4 text-sm text-fg-3">Open to: {resume.targets.join(" · ")}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 print:hidden">
            {pdf && (
              <a href="/Josh-Whitehead-Resume.pdf" download className="text-sm underline decoration-fg-3 underline-offset-4 transition-colors hover:text-fg">
                Download the PDF
              </a>
            )}
            <PrintButton />
            <a href="/resume.json" className="text-sm text-fg-2 underline decoration-fg-3 underline-offset-4 transition-colors hover:text-fg">
              Machine-readable (JSON Resume)
            </a>
          </p>
        </header>

        <section className="grid gap-6 border-b border-line py-8 sm:grid-cols-[10rem_1fr]" aria-labelledby="r-skills">
          <h2 id="r-skills" className="text-sm text-fg-3">
            Skills
          </h2>
          <dl className="space-y-3">
            {Object.entries(resume.skills).map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm text-fg-2">{k}</dt>
                <dd className="text-[15px]">{v.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-6 border-b border-line py-8 sm:grid-cols-[10rem_1fr]" aria-labelledby="r-exp">
          <h2 id="r-exp" className="text-sm text-fg-3">
            Experience
          </h2>
          <ol className="space-y-7">
            {career
              .slice()
              .reverse()
              .map((c) => {
                const p = projects.find((x) => x.context.startsWith(c.org.split(" (")[0]) || x.title === c.org.split(" (")[0]);
                return (
                  <li key={c.span}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="tight text-[1.0625rem] font-medium">
                        {c.role} · {c.org}
                      </h3>
                      <span className="text-sm tabular-nums text-fg-3">{c.span}</span>
                    </div>
                    <p className="text-sm text-fg-3">{c.location}</p>
                    {p ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-fg-2">
                        {(RECORD[p.context]?.bullets.map((b) => b.text) ?? [...p.contribution, ...p.outcome.slice(0, 2)]).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    ) : (
                      c.note && <p className="mt-2 text-[15px] text-fg-2">{c.note}</p>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>

        <section className="grid gap-6 border-b border-line py-8 sm:grid-cols-[10rem_1fr]" aria-labelledby="r-builds">
          <h2 id="r-builds" className="text-sm text-fg-3">
            Selected AI builds
          </h2>
          <ul className="space-y-2 text-[15px]">
            {lab
              .filter((l) => l.slug !== "site")
              .map((l) => (
                <li key={l.slug}>
                  <span className="font-medium">{l.title}</span> <span className="text-fg-2">— {l.blurb.split(". ")[0]}. {l.built}.</span>{" "}
                  <a href={`https://josh.design${l.href}`} className="text-fg-3 hover:text-fg print:hidden">
                    ↗
                  </a>
                </li>
              ))}
          </ul>
        </section>

        <section className="grid gap-6 border-b border-line py-8 sm:grid-cols-[10rem_1fr]" aria-labelledby="r-cs">
          <h2 id="r-cs" className="text-sm text-fg-3">
            Case studies
          </h2>
          <ul className="space-y-2 text-[15px]">
            {cs.map((p) => (
              <li key={p.slug}>
                <span className="font-medium">{p.title}</span> <span className="text-fg-2">— {p.summary}</span>{" "}
                <a href={`https://josh.design/work/${p.slug}`} className="text-fg-3 hover:text-fg print:hidden">
                  ↗
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 border-b border-line py-8 sm:grid-cols-[10rem_1fr]" aria-labelledby="r-edu">
          <h2 id="r-edu" className="text-sm text-fg-3">
            Service &amp; principles
          </h2>
          <div className="text-[15px] text-fg-2">
            <p>U.S. Marine Corps, Combat Photographer, 2008–2013.</p>
            <p className="mt-2">{principles.map((p) => p.title).join(" ")}</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-x-8 gap-y-3 pt-8 print:hidden">
          <Arrow href="/lab">The builds</Arrow>
          <Arrow href="/work" className="text-fg-2">
            The work
          </Arrow>
          <Arrow href="/contact" className="text-fg-2">
            Contact
          </Arrow>
        </div>
      </article>
    </Container>
  );
}
