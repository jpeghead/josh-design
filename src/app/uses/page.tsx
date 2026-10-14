import type { Metadata } from "next";
import { Container, PageHeader, Label } from "@/components/ui";
import { uses } from "@/content/uses.generated";

export const metadata: Metadata = {
  title: "Uses",
  description: "The tools, gear, Figma plugins, and links I keep coming back to.",
};

const GROUPS = ["Tools", "Gear", "Figma plugins", "Links"];

export default function UsesPage() {
  return (
    <Container>
      <PageHeader label="Uses" title="What I keep coming back to." dek="Tools, gear, plugins, and links — the quiet infrastructure behind the work." />

      {GROUPS.map((g) => {
        const items = uses.filter((u) => u.group === g);
        if (!items.length) return null;
        return (
          <section key={g} className="pb-16" aria-labelledby={`h-${g}`}>
            <Label>
              <span id={`h-${g}`}>{g}</span>
            </Label>
            <ul className="mt-4 border-t border-line">
              {items.map((it, i) => {
                const inner = (
                  <>
                    <span className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-fill">
                      {it.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-snug">{it.title}</span>
                      {it.description && <span className="mt-0.5 block text-sm text-fg-2 text-pretty">{it.description}</span>}
                    </span>
                    {it.link && (
                      <span aria-hidden className="text-sm text-fg-3 transition-transform duration-300 group-hover:translate-x-0.5">
                        ↗
                      </span>
                    )}
                  </>
                );
                const cls = "group flex items-center gap-4 py-3.5";
                return (
                  <li key={`${g}-${i}`} className="border-b border-line">
                    {it.link ? (
                      <a href={it.link} target="_blank" rel="noreferrer" className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <div className="pb-16" />
    </Container>
  );
}
