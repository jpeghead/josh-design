import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center bg-paper text-graphite">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="eyebrow">404 — frame missing</p>
        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,8rem)] leading-[0.9] tracking-tight">
          <span className="block">Underexposed.</span>
          <span className="block italic text-graphite-dim">No image.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-graphite-dim">
          This frame didn&rsquo;t develop. Either the link is broken or the page lives
          somewhere else now.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/" className="border border-black/15 px-4 py-2 transition-colors hover:border-gold hover:text-gold-dim">
            Back to the archive
          </Link>
          <Link href="/work" className="border border-black/15 px-4 py-2 transition-colors hover:border-gold hover:text-gold-dim">
            See the work →
          </Link>
        </div>
      </div>
    </section>
  );
}
