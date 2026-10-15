import { notFound } from "next/navigation";
import { getApplication } from "@/lib/admin/apply/store";
import { ApplicationView } from "@/components/admin/application-view";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getApplication(id);
  if (!a) notFound();
  return <ApplicationView initial={a} />;
}
