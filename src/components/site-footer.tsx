import Link from "next/link";
import { socials } from "@/content/about";

const YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 px-6 py-8 text-xs text-fg-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} Josh Whitehead</p>
        <nav aria-label="Elsewhere" className="flex flex-wrap gap-x-5 gap-y-2">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="me noreferrer" className="transition-colors hover:text-fg">
              {s.label}
            </a>
          ))}
          <Link href="/contact" className="transition-colors hover:text-fg">
            Email
          </Link>
        </nav>
      </div>
    </footer>
  );
}
