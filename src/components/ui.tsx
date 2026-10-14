import Link from "next/link";
import type { ReactNode } from "react";

/** Reading measure, centered inside the page gutter. */
export function Container({ children, className = "", wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`gutter mx-auto w-full ${wide ? "max-w-[1440px]" : "max-w-[1060px]"} ${className}`}>{children}</div>;
}

/** Page opener: a label, a headline, an optional dek. */
export function PageHeader({ label, title, dek, serif = false }: { label?: string; title: ReactNode; dek?: ReactNode; serif?: boolean }) {
  return (
    <header className="pb-14 pt-28 sm:pb-20 sm:pt-40">
      {label && <p className="text-sm text-fg-2">{label}</p>}
      <h1
        className={`mt-3 max-w-4xl text-balance leading-[1.02] ${
          serif ? "serif text-[3rem] sm:text-[4.5rem] lg:text-[5.25rem]" : "tighter text-[2.75rem] font-semibold sm:text-[4rem]"
        }`}
      >
        {title}
      </h1>
      {dek && <p className="mt-7 max-w-2xl text-xl leading-snug text-fg-2 text-pretty sm:text-[1.375rem]">{dek}</p>}
    </header>
  );
}

/** A section label — small, sentence case, secondary. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-sm text-fg-2 ${className}`}>{children}</h2>;
}

/** A hairline list. Children are <Row>s. */
export function List({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`mt-4 border-t border-line ${className}`}>{children}</ul>;
}

type RowProps = { title: ReactNode; meta?: ReactNode; body?: ReactNode; href?: string; external?: boolean };

/** One row: title, trailing meta, optional second line. Links get a chevron. */
export function Row({ title, meta, body, href, external }: RowProps) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-6">
        <span className="tight text-[1.0625rem] font-medium leading-snug">{title}</span>
        <span className="flex shrink-0 items-baseline gap-3 text-sm text-fg-3">
          {meta}
          {href && (
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
              {external ? "↗" : "›"}
            </span>
          )}
        </span>
      </div>
      {body && <p className="mt-1 max-w-2xl text-[15px] leading-normal text-fg-2 text-pretty">{body}</p>}
    </>
  );
  const cls = "group block py-5 transition-opacity hover:opacity-80";
  return (
    <li className="border-b border-line">
      {href ? (
        external ? (
          <a href={href} target="_blank" rel="noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <Link href={href} className={cls}>
            {inner}
          </Link>
        )
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </li>
  );
}

/** An inline text link with a chevron. */
export function Arrow({ href, children, className = "", external = false }: { href: string; children: ReactNode; className?: string; external?: boolean }) {
  const cls = `group inline-flex items-baseline gap-1.5 text-[15px] font-medium ${className}`;
  const mark = (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
      {external ? "↗" : "›"}
    </span>
  );
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
        {mark}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
      {mark}
    </Link>
  );
}

/** The pill button. One per chapter at most. */
export function Button({ href, children, tone = "light", external = false }: { href: string; children: ReactNode; tone?: "light" | "dark"; external?: boolean }) {
  const cls = `inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-opacity hover:opacity-80 ${
    tone === "light" ? "bg-fg text-bg" : "bg-ink text-paper"
  }`;
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children} <span aria-hidden>↗</span>
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children} <span aria-hidden>›</span>
    </Link>
  );
}
