import Link from "next/link";
import { socials } from "@/content/about";
import { REPO } from "@/content/lab";

const YEAR = 2026;

/** The last chapter: one ask, high contrast, then the small print. */
export function SiteFooter({ invite = true }: { invite?: boolean }) {
  return (
    <footer>
      {invite && (
        <section className="bg-paper text-ink">
          <div className="gutter mx-auto flex w-full max-w-[1440px] flex-col justify-between gap-12 py-24 sm:py-32 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm text-ink/60">Next</p>
              <h2 className="serif mt-3 max-w-3xl text-balance text-[2.75rem] leading-[0.98] sm:text-[4.5rem] lg:text-[5.5rem]">
                Let&rsquo;s make the thing that ships.
              </h2>
            </div>
            <div className="flex flex-col items-start gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-opacity hover:opacity-80">
                Get in touch <span aria-hidden>›</span>
              </Link>
              <a href="mailto:josh@josh.design" className="text-sm text-ink/60 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink">
                josh@josh.design
              </a>
            </div>
          </div>
        </section>
      )}
      <div className="gutter mx-auto flex w-full max-w-[1440px] flex-col gap-4 py-8 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} Josh Whitehead · Los Angeles</p>
        <nav aria-label="Elsewhere" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/resume" className="transition-colors hover:text-fg">
            Résumé
          </Link>
          {REPO.isPublic && (
            <a href={REPO.url} target="_blank" rel="me noreferrer" className="transition-colors hover:text-fg">
              GitHub
            </a>
          )}
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="me noreferrer" className="transition-colors hover:text-fg">
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
