import { listApplications } from "@/lib/admin/apply/store";
import { Pipeline } from "@/components/admin/pipeline";

export const dynamic = "force-dynamic";

export default function Applications() {
  const all = listApplications();
  return (
    <div>
      <h1 className="serif text-[2rem] leading-tight">Applications.</h1>
      <p className="mt-1 max-w-2xl text-sm text-fg-2">
        Every run the agent has made, and what happened after. Submitted ones move through stages by hand; each carries a next action with a date, and anything due shows at the top.
      </p>
      <Pipeline apps={all} />
    </div>
  );
}
