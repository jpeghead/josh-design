"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/lab", label: "Builds" },
  { href: "/process", label: "Process" },
  { href: "/work", label: "Work" },
  { href: "/products", label: "Products" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  // The open menu is a takeover: the page behind it should not scroll, and Escape closes it.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // The menu panel sits beside the header, not inside it: the header's backdrop
  // filter would otherwise become the panel's containing block and collapse it.
  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled || open
            ? "bg-bg/70 backdrop-blur-xl backdrop-saturate-150"
            : "bg-transparent"
        }`}
      >
        <div className="gutter mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight transition-opacity hover:opacity-60"
          >
            Josh Whitehead
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 md:flex"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-[13px] transition-colors ${isActive(item.href) ? "text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="text-[13px] text-fg-2 transition-colors hover:text-fg md:hidden"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col justify-between overflow-y-auto border-t border-line bg-bg md:hidden"
        >
          <ul className="gutter mx-auto w-full max-w-[1440px] pt-6">
            {NAV.map((item, i) => (
              <li
                key={item.href}
                className="menu-item"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`serif flex items-baseline justify-between border-b border-line py-4 text-[2.5rem] leading-none ${isActive(item.href) ? "text-fg" : "text-fg-2"}`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="text-xs font-sans tracking-[0.14em] text-fg-3">
                      HERE
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="gutter mx-auto w-full max-w-[1440px] pb-10 pt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg"
            >
              Get in touch <span aria-hidden>›</span>
            </Link>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-3">
              <li>
                <a href="mailto:josh@josh.design" className="hover:text-fg">
                  josh@josh.design
                </a>
              </li>
              <li>
                <Link href="/resume" className="hover:text-fg">
                  Résumé
                </Link>
              </li>
              <li>
                <Link href="/log" className="hover:text-fg">
                  Build log
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/jpeghead/josh-design"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-fg"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </nav>
      )}
    </>
  );
}
