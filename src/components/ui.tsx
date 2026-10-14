import Link from "next/link";
import type { ReactNode } from "react";

/** The page measure. One width, one gutter. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[980px] px-6 ${className}`}>{children}</div>;
}

/** Page opener: a label, a headline, an optional dek. */
export function PageHeader({ label, title, dek }: { label?: string; title: ReactNode; dek?: ReactNode }) {
  return (
    <header className="pb-14 pt-24 sm:pb-20 sm:pt-32">
      {label && <p className="text-sm font-medium text-fg-2">{label}</p>}
      <h1 className="tighter mt-2 max-w-3xl text-[2.5rem] font-semibold leading-[1.05] text-balance sm:text-[3.5rem]">{title}</h1>
      {dek && <p className="mt-6 max-w-2xl text-xl leading-snug text-fg-2 text-pretty sm:text-[1.375rem]">{dek}</p>}
    </header>
  );
}

/** A section label — small, sentence case, secondary. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-sm font-medium text-fg-2 ${className}`}>{children}</h2>;
}

/** A hairline list. Children are <Row>s. */
export function List({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`mt-4 border-t border-line ${className}`}>{children}</ul>;
}

type RowProps = {
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  href?: string;
  external?: boolean;
};

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
  const cls = "group block py-5";
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
export function Arrow({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-baseline gap-1 text-[15px] font-medium ${className}`}>
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
        ›
      </span>
    </Link>
  );
}
