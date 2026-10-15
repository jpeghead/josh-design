import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui";
import { OloApp } from "@/components/olo/olo-app";

export const metadata: Metadata = {
  title: "OLO — the beta",
  description: "Spotify Wrapped for your brain. Drop in your ChatGPT or Claude export and see the shape of how you think. Everything runs in your browser.",
};

export default function Page() {
  return (
    <Container>
      <Link href="/products/olo" className="mt-24 inline-block text-sm text-fg-2 transition-colors hover:text-fg sm:mt-32">
        ‹ OLO
      </Link>
      <div className="-mt-20 sm:-mt-28">
        <PageHeader label="OLO · v0 beta · runs in your browser" serif title="The shape of how you think." dek="Your own questions, read back to you. Drop in the export you can already download from ChatGPT or Claude. Nothing is uploaded; the analysis happens in this tab." />
      </div>
      <div className="pb-28">
        <OloApp />
      </div>
    </Container>
  );
}
