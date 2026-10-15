import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { LocalLLM } from "@/components/lab/local-llm";
import { localSystemPrompt } from "@/content/grounding";

export const metadata: Metadata = {
  title: "A model in your browser — Builds",
  description: "A language model running on your GPU through WebGPU. No server, no key, nothing leaves your machine. Grounded on this site.",
};

const SYSTEM = localSystemPrompt();

export default function Page() {
  return (
    <Container>
      <Link href="/lab" className="mt-24 inline-block text-sm text-fg-2 transition-colors hover:text-fg sm:mt-32">
        ‹ Builds
      </Link>
      <div className="-mt-20 sm:-mt-28">
        <PageHeader
          label="On-device · WebGPU · no server"
          serif
          title="A model in your browser."
          dek="A language model that runs on your GPU, in this tab. The weights download once and cache. Nothing you type leaves your machine. It knows what this site says and not much else, and a one-billion-parameter model will still get things wrong sometimes. That gap is the demo: compare it with the hosted Claude at Ask my portfolio."
        />
      </div>
      <div className="pb-6">
        <LocalLLM system={SYSTEM} />
      </div>
      <dl className="grid gap-x-10 gap-y-4 border-t border-line py-8 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-fg-3">Runtime</dt>
          <dd className="mt-1">WebLLM compiles the model to WebGPU shaders; inference is in the browser process.</dd>
        </div>
        <div>
          <dt className="text-fg-3">Grounding</dt>
          <dd className="mt-1">The system prompt is a 1,200-token summary generated from the site&rsquo;s content files, sized for a small context window.</dd>
        </div>
        <div>
          <dt className="text-fg-3">Why</dt>
          <dd className="mt-1">Private, free to run, works offline after the first load. The server version at Ask my portfolio is the comparison.</dd>
        </div>
      </dl>
      <div className="pb-28" />
    </Container>
  );
}
