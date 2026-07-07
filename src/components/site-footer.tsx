import Link from "next/link";
import { socials, identityLine } from "@/content/about";

const YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink text-bone">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="font-display text-2xl italic leading-tight text-bone">
              Still just the kid who won&rsquo;t stop making things.
            </p>
            <p className="mt-4 text-sm text-bone-dim">{identityLine}</p>
            <Link
              href="/contact"
              className="mt-6 inline-block border-b border-gold pb-0.5 font-mono text-xs uppercase tracking-widest text-gold transition-opacity hover:opacity-70"
            >
              Send a signal →
            </Link>
          </div>

          <nav aria-label="Social" className="flex flex-col gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="me noreferrer"
                className="group flex items-baseline justify-between gap-8 font-mono text-xs text-bone-dim transition-colors hover:text-bone"
              >
                <span className="uppercase tracking-widest">{s.label}</span>
                <span className="text-bone-muted group-hover:text-gold">
                  {s.handle}
                </span>
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-widest text-bone-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {YEAR} Josh Whitehead</span>
          <span>The Archive — a working record of a life&rsquo;s making.</span>
        </div>
      </div>
    </footer>
  );
}
