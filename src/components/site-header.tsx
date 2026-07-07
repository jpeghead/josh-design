"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/products", label: "Products" },
  { href: "/writing", label: "Writing" },
  { href: "/uses", label: "Uses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[color-mix(in_srgb,var(--color-paper)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-graphite transition-opacity hover:opacity-70"
          aria-label="Josh Whitehead — home"
        >
          Josh Whitehead
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "text-graphite"
                    : "text-graphite-muted hover:text-graphite"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("toggle-command-palette"))
          }
          className="flex items-center gap-1.5 border border-black/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-graphite-dim transition-colors hover:border-black/30 hover:text-graphite"
          aria-label="Open command palette"
        >
          <span aria-hidden>⌘</span>K
        </button>
      </div>
    </header>
  );
}
