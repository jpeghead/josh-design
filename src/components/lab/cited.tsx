"use client";

import Link from "next/link";
import { useMemo } from "react";
import { sources, resolveCitation } from "@/lib/sources";

/**
 * Renders a model answer and turns its parenthetical sources, e.g.
 * "(Spin case study)", into links to the page the fact came from. Unknown
 * parentheticals stay as plain text.
 */
export function Cited({ text }: { text: string }) {
  const list = useMemo(() => sources(), []);
  const parts = text.split(/(\([^()]{2,60}\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const inner = part.slice(1, -1);
        const src = resolveCitation(inner, list);
        if (!src) return part;
        return (
          <Link key={i} href={src.href} className="rounded bg-fill px-1 text-[13px] text-fg-2 underline decoration-fg-3 underline-offset-2 hover:text-fg">
            {inner}
          </Link>
        );
      })}
    </>
  );
}
