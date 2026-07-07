"use client";

import { useMemo, useState } from "react";
import type { UseItem } from "@/content/uses.generated";

const GROUPS = ["All", "Tools", "Gear", "Figma plugins", "Links"] as const;

export function UsesIndex({ items }: { items: UseItem[] }) {
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");

  const filtered = useMemo(
    () => (group === "All" ? items : items.filter((i) => i.group === group)),
    [items, group]
  );

  return (
    <div>
      <div role="tablist" aria-label="Filter" className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const count = g === "All" ? items.length : items.filter((i) => i.group === g).length;
          const active = g === group;
          return (
            <button
              key={g}
              role="tab"
              aria-selected={active}
              onClick={() => setGroup(g)}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active
                  ? "border-graphite bg-graphite text-paper"
                  : "border-black/15 text-graphite-muted hover:border-black/40 hover:text-graphite"
              }`}
            >
              {g} <span className="opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((it, i) => {
          const inner = (
            <>
              <div className="h-10 w-10 shrink-0 overflow-hidden border border-black/10 bg-paper-2">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm text-graphite">{it.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest text-graphite-muted">
                    {it.tag}
                  </span>
                </div>
                {it.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-graphite-muted text-pretty">
                    {it.description}
                  </p>
                )}
              </div>
            </>
          );
          return (
            <li key={`${it.collection}-${i}`} className="bg-paper">
              {it.link ? (
                <a
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 p-4 transition-colors hover:bg-paper-2"
                >
                  {inner}
                </a>
              ) : (
                <div className="flex gap-3 p-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
