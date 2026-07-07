import type { Metadata } from "next";
import { uses } from "@/content/uses.generated";
import { UsesIndex } from "@/components/uses-index";

export const metadata: Metadata = {
  title: "Uses",
  description:
    "The tools, gear, Figma plugins, and links I keep coming back to. A quiet index, kept honest.",
};

export default function UsesPage() {
  return (
    <div className="bg-paper text-graphite">
      <header className="mx-auto max-w-6xl px-5 pb-10 pt-20 sm:px-8">
        <p className="eyebrow">Uses</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl tracking-tight text-balance sm:text-6xl">
          What I keep coming back to.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-graphite-dim">
          Tools, gear, plugins, and links — the quiet infrastructure behind the work.
          The links go out; everything else stays here.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <UsesIndex items={uses} />
      </section>
    </div>
  );
}
