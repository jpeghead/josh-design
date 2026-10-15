import { listApplications } from "@/lib/admin/apply/store";
import { kick, queueSnapshot, reconcile } from "@/lib/admin/apply/queue";
import { Queue } from "@/components/admin/queue";

export const dynamic = "force-dynamic";

/** Applications prepared in the background, waiting for a look and a Submit. */
export default async function QueuePage() {
  reconcile();
  void kick();
  const apps = listApplications().filter((a) => a.headless && ["queued", "starting", "filling", "review", "needs-you", "submitting"].includes(a.status));
  return <Queue initial={apps} snapshot={queueSnapshot()} />;
}
