import Link from "next/link";
import { Reveal, Drift } from "@/components/motion";
import { workMedia } from "@/content/work-media";
import type { Project } from "@/lib/data";

/**
 * A case study as a magazine cover: the project's own color field, the
 * title at display scale, role and years, one line, one action, one image.
 * Readable when static; the action is always visible.
 */
export function WorkCover({ project, index, flip = false }: { project: Project; index: number; flip?: boolean }) {
  const media = workMedia[project.slug];
  const href = project.internalLink ?? `/work/${project.slug}`;
  const hasCover = !!media?.cover.src;
  const years = project.timeline.replace(/[A-Za-z]{3} /g, "");

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ background: media?.field ?? "#111" }}
      aria-labelledby={`cover-${project.slug}`}
    >
      <div className="gutter mx-auto grid w-full max-w-[1440px] items-center gap-12 py-24 lg:min-h-[92vh] lg:grid-cols-12 lg:gap-8 lg:py-28">
        <div className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
          <Reveal>
            <p className="flex items-baseline gap-4 text-sm text-fg-2">
              <span className="tabular-nums text-fg-3">{String(index + 1).padStart(2, "0")}</span>
              <span>{project.context}</span>
            </p>
            <h2 id={`cover-${project.slug}`} className="tighter mt-5 text-[3.5rem] font-semibold leading-[0.95] sm:text-[5rem] lg:text-[6rem]">
              {project.title}
            </h2>
            <p className="mt-6 max-w-md text-lg leading-snug text-fg-2 text-pretty sm:text-xl">{project.summary}</p>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
              <div>
                <dt className="text-fg-3">Role</dt>
                <dd className="mt-0.5">{project.role}</dd>
              </div>
              <div>
                <dt className="text-fg-3">Years</dt>
                <dd className="mt-0.5">{years}</dd>
              </div>
            </dl>
            <Link
              href={href}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-85"
              style={{ background: "var(--fg)" }}
            >
              {project.internalLink ? "See what we're building" : "Open case study"}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
                ›
              </span>
            </Link>
          </Reveal>
        </div>
        <div className={`lg:col-span-7 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-6"}`}>
          <Reveal delay={0.08}>
            <Link href={href} className="group block" aria-label={`${project.title} — open case study`} tabIndex={-1}>
              {hasCover ? (
                <Drift amount={4} aspect={media.cover.aspect} className="frame-hover rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.cover.src} alt={media.cover.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                </Drift>
              ) : (
                <div className="frame flex items-end rounded-lg p-8" style={{ aspectRatio: "4 / 3", background: "rgba(255,255,255,0.04)" }}>
                  <p className="serif text-[2.5rem] leading-none text-fg-2 sm:text-[4rem]">{project.scope.join(" · ")}</p>
                </div>
              )}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
