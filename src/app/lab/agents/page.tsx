import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { AgentPatterns } from "@/components/lab/agent-patterns";

export const metadata: Metadata = {
  title: "Agent UI patterns — Builds",
  description: "Four working prototypes for the hard parts of agent interfaces: progress, permissions, failure, and confidence.",
};

export default function Page() {
  return (
    <Container wide>
      <Link href="/lab" className="mt-24 inline-block text-sm text-fg-2 transition-colors hover:text-fg sm:mt-32">
        ‹ Builds
      </Link>
      <div className="-mt-20 sm:-mt-28">
        <PageHeader
          label="Interactive · simulated model, real interface"
          serif
          title="Agent UI patterns."
          dek="The parts of an agent interface that decide whether people trust it. Each one runs; press the buttons. The model is scripted so the interaction can be judged on its own."
        />
      </div>
      <div className="pb-28">
        <AgentPatterns />
      </div>
    </Container>
  );
}
