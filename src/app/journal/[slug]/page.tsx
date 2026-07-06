import type { Metadata } from "next";
import { journal } from "@/lib/data";
import { WindowOpener } from "@/components/os/window-opener";

export function generateStaticParams() {
  return journal.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const j = journal.find((x) => x.slug === slug);
  if (!j) return {};
  return { title: j.title, description: j.excerpt };
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WindowOpener app="entry" param={slug} />;
}
