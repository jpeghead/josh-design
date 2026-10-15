import { listApplications } from "@/lib/admin/apply/store";
import { listResumes } from "@/lib/admin/resume/store";
import { readJson } from "@/lib/admin/store";
import type { Posting } from "@/lib/admin/types";
import { numbers } from "@/lib/admin/analytics";
import { Pipeline } from "@/components/admin/pipeline";

export const dynamic = "force-dynamic";

export default function Applications() {
  const all = listApplications();
  const n = numbers(all, readJson<Posting[]>("jobs", []), listResumes());
  const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
  return (
    <div>
      <h1 className="serif text-[2rem] leading-tight">Applications.</h1>
      <p className="mt-1 max-w-2xl text-sm text-fg-2">
        Every run the agent has made, and what happened after. Submitted ones move through stages by hand; each carries a next action with a date, and anything due shows at the top.
      </p>
      <section className="mt-6 rounded-xl border border-line bg-fill/40 p-4">
        <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">The numbers</h2>
        {n.submitted === 0 ? (
          <p className="mt-2 text-sm text-fg-3">They appear after the first submissions: response rate, interviews, days to a reply, and which résumé and which boards convert.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-4">
            <div><p className="tabular-nums text-[1.6rem] leading-none text-fg">{n.submitted}</p><p className="mt-1 text-xs text-fg-3">submitted</p></div>
            <div><p className="tabular-nums text-[1.6rem] leading-none text-fg">{pct(n.responseRate)}</p><p className="mt-1 text-xs text-fg-3">got a reply ({n.responded})</p></div>
            <div><p className="tabular-nums text-[1.6rem] leading-none text-fg">{n.interviews}</p><p className="mt-1 text-xs text-fg-3">interviewing or offer</p></div>
            <div><p className="tabular-nums text-[1.6rem] leading-none text-fg">{n.medianDaysToReply === null ? "—" : Math.round(n.medianDaysToReply)}</p><p className="mt-1 text-xs text-fg-3">median days to a reply</p></div>
            <div className="sm:col-span-2 text-[13px] text-fg-2">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">By résumé</p>
              {n.byPersona.map((p) => <p key={p.persona}>{p.persona}: {p.submitted} sent, {p.responded} replied</p>)}
            </div>
            <div className="sm:col-span-2 text-[13px] text-fg-2">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">By board</p>
              {n.bySource.map((p) => <p key={p.source}>{p.source}: {p.submitted} sent, {p.responded} replied</p>)}
            </div>
          </div>
        )}
      </section>
      <Pipeline apps={all} />
    </div>
  );
}
