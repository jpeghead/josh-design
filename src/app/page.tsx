import Link from "next/link";
import { eras, artifactsByEra } from "@/content/archive";
import { identityLine } from "@/content/about";
import { ArtifactTile } from "@/components/artifact-tile";
import { ArchiveMount } from "@/components/canvas/mount";

export default function Home() {
  const first = eras[0];

  return (
    <>
      {/* The cinematic walk — mounts only on capable devices with motion
          allowed. When active, CSS visually swaps the DOM walk below for the
          canvas; the DOM version stays in the document for AT, search, and
          the static tier. */}
      <ArchiveMount />

      <div data-dom-walk>
      {/* Hero — the paper-light opening. The drawn-in wordmark is the static,
          content-layer version of the signature moment; the canvas layer
          animates it when active. */}
      <section
        className="relative flex min-h-[88vh] flex-col justify-center px-5 sm:px-8"
        style={{ background: first.bg, color: first.fg }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <p className="eyebrow">The Archive — a working record of a life&rsquo;s making</p>
          <h1 className="mt-6 font-display text-[15vw] leading-[0.9] tracking-tight sm:text-[11vw] lg:text-[9rem]">
            Josh
            <br />
            <span className="italic">Whitehead</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-balance" style={{ color: first.muted }}>
            {identityLine}
          </p>
          <p className="mt-6 max-w-2xl text-pretty leading-relaxed">
            What follows is one continuous walk — from a kid who drew all day, through
            the Corps, into the products people carry in their pockets, and out the
            other side into what I&rsquo;m building now.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest">
            <a href="#era-childhood" className="border-b border-current pb-0.5 transition-opacity hover:opacity-60">
              Begin the walk ↓
            </a>
            <Link href="/work" className="opacity-60 transition-opacity hover:opacity-100">
              Skip to work →
            </Link>
          </div>
        </div>
      </section>

      {/* The era timeline — light → dark, one section per era. */}
      {eras.map((era) => {
        const items = artifactsByEra(era.id);
        return (
          <section
            key={era.id}
            id={`era-${era.id}`}
            className="scroll-mt-14 px-5 py-24 sm:px-8"
            style={{ background: era.bg, color: era.fg }}
            aria-label={era.title}
          >
            <div className="mx-auto max-w-6xl">
              <header className="max-w-2xl">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm tabular-nums" style={{ color: era.muted }}>
                    {String(era.index + 1).padStart(2, "0")}
                  </span>
                  <span className="eyebrow" style={{ color: era.muted }}>
                    {era.years}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
                  {era.title}
                </h2>
                <p className="mt-4 text-lg text-pretty" style={{ color: era.muted }}>
                  {era.blurb}
                </p>
              </header>

              {items.length > 0 && (
                <div className="mt-12 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
                  {items.map((a) => (
                    <ArtifactTile key={a.id} artifact={a} />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Landing — the walk ends on an invitation. */}
      <section className="bg-ink px-5 py-28 text-bone sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl font-display text-4xl italic tracking-tight sm:text-5xl">
            The archive keeps growing.
          </h2>
          <p className="mt-5 max-w-xl text-bone-dim">
            The case studies, the products, and the writing all live here — no detours
            off-site to see the work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-widest">
            <Link href="/work" className="border border-white/20 px-4 py-2 transition-colors hover:border-gold hover:text-gold">
              See the work
            </Link>
            <Link href="/products" className="border border-white/20 px-4 py-2 transition-colors hover:border-gold hover:text-gold">
              What I&rsquo;m building
            </Link>
            <Link href="/contact" className="border border-white/20 px-4 py-2 transition-colors hover:border-gold hover:text-gold">
              Send a signal
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
