import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { Ask } from "@/components/lab/ask";

export const metadata: Metadata = {
  title: "Ask my portfolio — Builds",
  description: "A live Claude, grounded in the text of this site, that answers questions about Josh's work.",
};

export default function Page() {
  const live = !!process.env.ANTHROPIC_API_KEY;
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
          <div className="rounded-xl border border-line bg-fill/60 p-6 text-fg-2">
            <p>
              This deployment has no model key, so the demo is off. The route, prompt, grounding, streaming, and rate limiting are all in the repo under{" "}
              <code className="font-mono text-sm">src/app/api/ask</code>; set <code className="font-mono text-sm">ANTHROPIC_API_KEY</code> and it turns on.
            </p>
          </div>
        )}
        <p className="mt-6 max-w-2xl text-sm text-fg-3">
          How it&rsquo;s built: a Next.js route handler streams from the Anthropic SDK. The system prompt is generated from the same content files that render these pages, so the model can&rsquo;t know anything the site doesn&rsquo;t say. Twenty questions per visitor per ten minutes.
        </p>
      </div>
    </Container>
  );
}
