import { readJson } from "@/lib/admin/store";
import type { Posting, ScanRun, Company } from "@/lib/admin/types";
import { JobsTable } from "@/components/admin/jobs-table";

export const dynamic = "force-dynamic";

export default async function Jobs({ searchParams }: { searchParams: Promise<{ status?: string; tier?: string; min?: string; q?: string; fresh?: string }> }) {
  const sp = await searchParams;
  const all = readJson<Posting[]>("jobs", []);
  const runs = readJson<ScanRun[]>("scans", []);
  const companies = readJson<Company[]>("companies", []);
  const status = sp.status ?? "new";
  const tier = sp.tier ?? "all";
  const min = Number(sp.min ?? 40);
  const q = (sp.q ?? "").toLowerCase();
  const fresh = sp.fresh === "1";
  const weekAgo = Date.now() - 7 * 86400000;
  const rows = all.filter(
    (p) =>
      (!fresh || new Date(p.firstSeen).getTime() >= weekAgo) &&
      (status === "all" || p.status === status) &&
      (tier === "all" || p.tier === tier) &&
      p.score >= min &&
      (!q || `${p.company} ${p.title} ${p.location}`.toLowerCase().includes(q))
  );
  const counts = { fresh: all.filter((p) => p.status === "new" && new Date(p.firstSeen).getTime() >= weekAgo).length, new: all.filter((p) => p.status === "new").length, saved: all.filter((p) => p.status === "saved").length, applied: all.filter((p) => p.status === "applied").length, hidden: all.filter((p) => p.status === "hidden").length };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[2rem] leading-tight">Roles worth a look.</h1>
          <p className="mt-1 text-sm text-fg-2">
            {companies.length} boards + Hacker News · {all.length} kept · {runs[0] ? `last scan ${new Date(runs[0].at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} (${runs[0].fetched} fetched, ${runs[0].added} new${runs[0].errors.length ? `, ${runs[0].errors.length} boards failed` : ""})` : "never scanned"}
          </p>
        </div>
      </div>
      <JobsTable rows={rows} counts={counts} filters={{ status, tier, min, q: sp.q ?? "", fresh }} errors={runs[0]?.errors ?? []} />
    </div>
  );
}
