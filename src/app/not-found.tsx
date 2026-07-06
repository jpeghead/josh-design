import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center pt-28">
      <div className="mx-auto max-w-screen-md px-4 sm:px-6">
        <p className="overline">// 404 — Frame missing</p>
        <h1 className="mt-3 font-[var(--font-display)] text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight text-bone">
          <span className="block">Underexposed.</span>
          <span className="block italic text-safelight">No image.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-bone-dim">
          This frame didn&rsquo;t develop. Either the link is broken, the page
          is still in the chemistry, or it lives somewhere else now.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 border border-bone-line bg-ink-50 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-bone hover:border-safelight"
          >
            Back to the archive
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center gap-3 border border-bone-line px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-bone-dim hover:border-safelight hover:text-bone"
          >
            See the work →
          </Link>
        </div>
      </div>
    </section>
  );
}
