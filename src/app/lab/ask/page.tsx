import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { Ask } from "@/components/lab/ask";
import { LocalLLM } from "@/components/lab/local-llm";
import { localSystemPrompt } from "@/content/grounding";
import { anthropicConfigured } from "@/lib/anthropic";

export const metadata: Metadata = {
  title: "Ask my portfolio — Builds",
  description: "A live Claude, grounded in the text of this site, that answers questions about Josh's work.",
};

export default function Page() {
  const live = !!anthropicConfigured();
  return (
    <Container>
      <Link href="/lab" className="mt-24 inline-block text-sm text-fg-2 transition-colors hover:text-fg sm:mt-32">
        ‹ Builds
      </Link>
      <div className="-mt-20 sm:-mt-28">
        <PageHeader
          label={live ? "Live model · Claude" : "Live model · off on this deployment"}
          serif
          title="Ask my portfolio."
          dek="A Claude that knows only what this site says. It answers in a few sentences, names where each fact came from, and says plainly when the site doesn't cover something."
        />
      </div>
      <div className="pb-28">
        {live ? (
          <Ask />
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-line bg-fill/60 p-5 text-[15px] text-fg-2">
              <p>
                This deployment has no hosted model key, so the question goes to a model on your own GPU instead. Same facts, smaller model, nothing leaves your machine. The hosted route is in the repo under{" "}
                <code className="font-mono text-sm">src/app/api/ask</code>; set <code className="font-mono text-sm">ANTHROPIC_API_KEY</code> and it takes over.
              </p>
            </div>
            <LocalLLM system={localSystemPrompt()} />
          </>
        )}
        <p className="mt-6 max-w-2xl text-sm text-fg-3">
          How it&rsquo;s built: a Next.js route handler streams from the Anthropic SDK. The system prompt is generated from the same content files that render these pages, so the model can&rsquo;t know anything the site doesn&rsquo;t say. Twenty questions per visitor per ten minutes.
        </p>
      </div>
    </Container>
  );
}
