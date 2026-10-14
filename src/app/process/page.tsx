import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Container, PageHeader, Label, Arrow } from "@/components/ui";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Process",
  description: "How Josh works with coding agents: the loop, the artifacts, and the numbers, taken from this repo.",
};

/** Real artifacts, read from the repo at build time. */
function artifacts() {
  const root = process.cwd();
  const agents = readFileSync(path.join(root, "AGENTS.md"), "utf8").split("\n");
  const catalog = JSON.parse(readFileSync(path.join(root, "scripts/framer-catalog.json"), "utf8")) as { file: string; project: string; describe: string; quality: number }[];
  return {
    agentsHead: (() => {
      const i = Math.max(0, agents.findIndex((l) => l.startsWith("You're picking up")));
      return agents.slice(i, i + 30).join("\n");
    })(),
    agentsLines: agents.length,
    catalogCount: catalog.length,
    catalogSample: catalog.filter((c) => c.quality >= 5).slice(0, 4),
  };
}

const LOOP = [
  ["Direction", "I write the brief as a sentence and a bar: what it is, what it must feel like, what's out of bounds. Facts live in locked files with the rules at the top."],
  ["Read", "The agent reads the repo, the content, the git history, and any reference I point it at before touching anything."],
  ["Build", "It proposes, I cut, it builds. Whole directions get built end to end in a day so they can be judged by looking at them, not by arguing."],
  ["Verify", "Nothing is done until it's been looked at in a browser at three sizes with a clean console. A green type-check proves nothing about a room that looks wrong."],
  ["Commit", "Large, thematic, build-green commits with messages that say why. Attribution stays on the agent's work."],
  ["Hand off", "A handoff document keeps the conventions and the traps so the next agent, or the next me, starts warm."],
];

export default function ProcessPage() {
  const a = artifacts();
  return (
    <Container wide>
      <PageHeader
        label="Process"
        serif
        title="An agent in the loop, a person at the wheel."
        dek="This is how the builds on this site get made. Not a diagram: the real artifacts from this repo, and the numbers that fall out of them."
      />

      <section className="grid gap-10 border-t border-line py-20 lg:grid-cols-12" aria-labelledby="h-loop">
        <div className="lg:col-span-4">
          <Label>
            <span id="h-loop">The loop</span>
          </Label>
        </div>
        <ol className="lg:col-span-8">
          {LOOP.map(([k, v], i) => (
            <Reveal key={k} as="li" delay={0.03 * i} className="grid gap-2 border-b border-line py-5 first:border-t sm:grid-cols-[7rem_1fr] sm:gap-8">
              <span className="text-sm text-fg-3">
                {String(i + 1).padStart(2, "0")} · {k}
              </span>
              <span className="text-[17px] text-pretty">{v}</span>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 border-t border-line py-20 lg:grid-cols-12" aria-labelledby="h-handoff">
        <div className="lg:col-span-4">
          <Label>
            <span id="h-handoff">Artifact 01 · the handoff</span>
          </Label>
          <p className="mt-3 text-fg-2 text-pretty">
            {a.agentsLines} lines in the repo root, written so a second agent (Codex) could pick up the city cold: the north star, the traps that cost a session, the licensing rule, the deep links for QA. The first lines, verbatim:
          </p>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-line bg-fill/60 p-5 font-mono text-[12.5px] leading-relaxed text-fg-2 lg:col-span-8">{a.agentsHead}</pre>
      </section>

      <section className="grid gap-10 border-t border-line py-20 lg:grid-cols-12" aria-labelledby="h-subagent">
        <div className="lg:col-span-4">
          <Label>
            <span id="h-subagent">Artifact 02 · the subagent</span>
          </Label>
          <p className="mt-3 text-fg-2 text-pretty">
            The old site exported {a.catalogCount} images with hashed names. A subagent looked at every one, labeled it by project, described what was literally in it, and scored it, while the main thread kept building. The catalog it wrote drives the imagery on this site.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
          {a.catalogSample.map((c) => (
            <li key={c.file} className="rounded-xl border border-line bg-fill/60 p-4 font-mono text-[12px] leading-relaxed text-fg-2">
              <span className="block text-fg-3">{c.file}</span>
              <span className="block text-fg">
                {c.project} · quality {c.quality}
              </span>
              <span className="mt-1 block font-sans text-[13px]">{c.describe}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-10 border-t border-line py-20 lg:grid-cols-12" aria-labelledby="h-numbers">
        <div className="lg:col-span-4">
          <Label>
            <span id="h-numbers">Artifact 03 · the record</span>
          </Label>
          <p className="mt-3 text-fg-2 text-pretty">From the git log of this repository.</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:col-span-8">
          {[
            ["35", "commits between July 6 and July 22, 2026, building the city"],
            ["8", "directions built end to end in that window; 3 shipped to the Builds page"],
            ["10,217", "lines across the four 3D and canvas experiments"],
            ["16", "days from first commit to a playable, mission-complete city"],
            ["3", "whole site directions built and replaced on October 14, 2026"],
            ["0", "ripped assets. Original or CC0 only, by rule"],
          ].map(([n, l]) => (
            <div key={l} className="border-t border-line pt-4">
              <dt className="tighter text-[2.25rem] font-semibold leading-none sm:text-[2.75rem]">{n}</dt>
              <dd className="mt-2 text-sm text-fg-3 text-pretty">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line py-16 pb-28">
        <Arrow href="/writing/sixteen-days-in-whitehead-city">Read the build log</Arrow>
        <Arrow href="/lab" className="text-fg-2">
          See the builds
        </Arrow>
      </section>
    </Container>
  );
}
