import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, Label, Arrow } from "@/components/ui";
import { REPO } from "@/content/lab";

export const metadata: Metadata = {
  title: "How this site is built — Lab",
  description: "The stack, the workflow, and the decisions behind josh.design.",
};

const ROWS: [string, string][] = [
  ["Framework", "Next.js 15 (App Router), React 19, TypeScript. Every page is static at build."],
  ["Styling", "Tailwind 4 with a six-token palette: background, foreground, two greys, a hairline, a fill. One serif (Instrument Serif) for the story, Geist for everything else."],
  ["Motion", "CSS transitions gated on an html.js class set before first paint, so the server-rendered page is complete without JavaScript. Word-stagger headlines. 4–6% scroll drift on cover images. Reduced motion renders final states."],
  ["Images", "The previous site's export (136 files) was cataloged by project, then web-sized by a script with macOS sips into public/img. Captions state only what is known."],
  ["Content", "Typed content modules. Career dates and claims live in one locked file with ground rules in its header: no vanity stats, clients never presented as employers, nothing fabricated."],
  ["The Lab", "The 3D city, the studio, the line, and the room are full experiments kept in the same repo and mounted on their own routes. The agent patterns are React with a scripted model. The live demo is a route handler streaming from the Anthropic SDK, grounded on the same content files that render the pages."],
  ["Workflow", "Designed and built with Claude Code and Codex in the loop: the agent reads the repo, proposes, builds, verifies in a browser, and commits. I direct, judge, and cut. Several whole directions were built and thrown away in a day each."],
];

export default function Page() {
  return (
    <Container>
      <Link href="/lab" className="mt-24 inline-block text-sm text-fg-2 transition-colors hover:text-fg sm:mt-32">
        ‹ Lab
      </Link>
      <div className="-mt-20 sm:-mt-28">
        <PageHeader label="This site" serif title="How this site is built." dek="The stack, the workflow, and the decisions. The repo holds every experiment in the Lab, including the ones that didn't make it." />
      </div>
      <dl className="border-t border-line pb-20">
        {ROWS.map(([k, v]) => (
          <div key={k} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <dt className="text-sm text-fg-3">{k}</dt>
            <dd className="text-[17px] text-pretty">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-x-8 gap-y-3 pb-28">
        {REPO.isPublic ? (
          <Arrow href={REPO.url} external>
            Source on GitHub
          </Arrow>
        ) : (
          <p className="text-sm text-fg-3">Source is private for now.</p>
        )}
        <Arrow href="/writing/sixteen-days-in-whitehead-city" className="text-fg-2">
          Read the build log
        </Arrow>
      </div>
    </Container>
  );
}
