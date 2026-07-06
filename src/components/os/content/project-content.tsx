"use client";

import { projects } from "@/lib/data";
import { MediaBed } from "@/components/media-bed";
import { Reveal } from "@/components/reveal";
import { useOpenInWindow } from "../link";

export function ProjectContent({ slug }: { slug: string }) {
  useOpenInWindow();
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return (
      <div className="px-6 py-16 text-center font-mono text-sm text-bone-muted">
        Frame not found — {slug}
      </div>
    );
  }

  const index = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <article>
      <section className="px-4 pt-10 sm:px-8 sm:pt-14">
        <div className="flex items-baseline justify-between border-b border-bone-line pb-4 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          <span>
            Frame · {String(index + 1).padStart(3, "0")} /{" "}
            {String(projects.length).padStart(3, "0")}
          </span>
          <span className="flex items-center gap-2">
            <span
              className={
                project.status === "Live"
                  ? "h-1.5 w-1.5 rounded-full bg-emulsion"
                  : project.status === "In flight"
                  ? "h-1.5 w-1.5 rounded-full bg-sodium"
                  : "h-1.5 w-1.5 rounded-full bg-bone-muted"
              }
            />
            {project.status}
          </span>
        </div>

        <Reveal>
          <h1 className="mt-8 font-[var(--font-display)] text-[clamp(3rem,10vw,10rem)] leading-[0.86] tracking-tight text-bone">
            {project.title}
          </h1>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 max-w-3xl text-balance text-lg leading-[1.4] text-bone-dim sm:text-xl">
            {project.summary}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <dl className="mt-12 grid grid-cols-2 gap-px border border-bone-line bg-bone-line md:grid-cols-4">
            <Field label="Client" value={project.client} />
            <Field label="Year" value={project.year} />
            <Field label="Role" value={project.role} />
            <Field label="Tags" value={project.tags.join(" · ")} />
          </dl>
        </Reveal>
      </section>

      <div className="px-4 sm:px-8">
        <MediaBed project={project} variant="cover" label="Bed · 01 · Cover" />
      </div>

      <Chapter n="01" label="The challenge" title="What was in the way." body={project.challenge} />

      <div className="px-4 sm:px-8">
        <MediaBed project={project} variant="strip" label="Bed · 02 · In motion" />
      </div>

      <Chapter n="02" label="The approach" title="How we worked." body={project.approach} />

      <div className="px-4 sm:px-8">
        <MediaBed project={project} variant="duotone" label="Bed · 03 · Process" />
      </div>

      <Chapter n="03" label="The outcome" title="What it earned." body={project.outcome} accent />

      {project.metrics && project.metrics.length > 0 && (
        <section className="px-4 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <p className="overline">// Receipts</p>
          </Reveal>
          <div className="mt-6 grid grid-cols-1 gap-px border border-bone-line bg-bone-line md:grid-cols-2 lg:grid-cols-4">
            {project.metrics.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.08}>
                <div className="bg-ink p-6 sm:p-8">
                  <p className="font-[var(--font-display)] text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-tight text-bone">
                    {m.value}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                    {m.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {(project.collaborators || project.tools) && (
        <section className="border-t border-bone-line px-4 py-14 sm:px-8 sm:py-16">
          <div className="grid grid-cols-12 gap-6">
            {project.collaborators && (
              <Reveal className="col-span-12 md:col-span-6">
                <p className="overline">/ Collaborators</p>
                <ul className="mt-3 space-y-1.5 font-[var(--font-display)] text-xl text-bone sm:text-2xl">
                  {project.collaborators.map((c) => (
                    <li key={c} className="italic">
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            {project.tools && (
              <Reveal className="col-span-12 md:col-span-6">
                <p className="overline">/ Toolchain</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.tools.map((t) => (
                    <span
                      key={t}
                      className="border border-bone-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-dim"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {project.classified && (
        <section className="px-4 pb-8 sm:px-8">
          <div className="border border-safelight/40 bg-safelight/5 p-5 sm:p-6">
            <p className="overline text-safelight">/// NDA</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-dim">
              Visuals from this engagement aren&rsquo;t public.{" "}
              <a
                href="mailto:joshwhitehead.design@gmail.com"
                className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight"
              >
                Email me
              </a>{" "}
              for a private walkthrough.
            </p>
          </div>
        </section>
      )}

      <nav className="mt-10 grid grid-cols-1 gap-px border-t border-bone-line bg-bone-line md:grid-cols-2">
        <a
          href={`/work/${prev.slug}`}
          className="group bg-ink p-6 transition-colors hover:bg-ink-100 sm:p-8"
        >
          <p className="overline">← Previous frame</p>
          <p className="mt-3 font-[var(--font-display)] text-3xl italic text-bone transition-colors group-hover:text-safelight sm:text-4xl">
            {prev.title}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {prev.year}
          </p>
        </a>
        <a
          href={`/work/${next.slug}`}
          className="group bg-ink p-6 text-right transition-colors hover:bg-ink-100 sm:p-8"
        >
          <p className="overline">Next frame →</p>
          <p className="mt-3 font-[var(--font-display)] text-3xl italic text-bone transition-colors group-hover:text-safelight sm:text-4xl">
            {next.title}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            {next.year}
          </p>
        </a>
      </nav>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink p-3 sm:p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
      </p>
      <p className="mt-2 text-sm text-bone">{value}</p>
    </div>
  );
}

function Chapter({
  n,
  label,
  title,
  body,
  accent = false,
}: {
  n: string;
  label: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <section className="px-4 py-16 sm:px-8 sm:py-24">
      <div className="grid grid-cols-12 gap-6">
        <Reveal className="col-span-12 md:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            / {n}
          </p>
          <p className="mt-1 overline text-bone-dim">{label}</p>
          <h2
            className={`mt-3 font-[var(--font-display)] text-[clamp(2rem,5vw,5rem)] leading-[0.95] tracking-tight italic ${
              accent ? "text-safelight" : "text-bone"
            }`}
          >
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="col-span-12 md:col-span-7">
          <p className="max-w-2xl text-balance text-lg leading-[1.6] text-bone-dim md:text-xl md:leading-[1.55]">
            {body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
