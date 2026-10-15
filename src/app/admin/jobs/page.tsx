import { readJson } from "@/lib/admin/store";
import type { Posting, ScanRun, Company } from "@/lib/admin/types";
import { JobsTable } from "@/components/admin/jobs-table";
import { dedupe } from "@/lib/admin/dedupe";

export const dynamic = "force-dynamic";

export default async function JobsList({ searchParams }: { searchParams: Promise<{ status?: string; tier?: string; min?: string; q?: string; fresh?: string; ai?: string; sort?: string }> }) {
  const sp = await searchParams;
  const all = readJson<Posting[]>("jobs", []);
  const runs = readJson<ScanRun[]>("scans", []);
  const companies = readJson<Company[]>("companies", []);
  const status = sp.status ?? "new";
  const tier = sp.tier ?? "all";
  const min = Number(sp.min ?? 40);
  const q = (sp.q ?? "").toLowerCase();
  const fresh = sp.fresh === "1";
  const aiOnly = sp.ai === "1";
  const weekAgo = Date.now() - 7 * 86400000;
  const rows = dedupe(all.filter(
    (p) =>
      (!fresh || new Date(p.firstSeen).getTime() >= weekAgo) &&
      (!aiOnly || (p.ai ?? 0) >= 3) &&
      (status === "all" || p.status === status) &&
      (tier === "all" || p.tier === tier) &&
      p.score >= min &&
      (!q || `${p.company} ${p.title} ${p.location}`.toLowerCase().includes(q))
  ));
  const sort = sp.sort === "newest" ? "newest" : sp.sort === "pay" ? "pay" : "score";
  const payNum = (x?: string) => (x ? Number((x.match(/\$(\d+)K/g) ?? []).map((m) => m.replace(/\D/g, "")).pop() ?? 0) : 0);
  rows.sort((a, b) => (sort === "newest" ? Date.parse(b.firstSeen) - Date.parse(a.firstSeen) : sort === "pay" ? payNum(b.pay) - payNum(a.pay) : b.score - a.score));
  const counts = { ai: all.filter((p) => p.status === "new" && (p.ai ?? 0) >= 3).length, fresh: all.filter((p) => p.status === "new" && new Date(p.firstSeen).getTime() >= weekAgo).length, new: all.filter((p) => p.status === "new").length, saved: all.filter((p) => p.status === "saved").length, applied: all.filter((p) => p.status === "applied").length, hidden: all.filter((p) => p.status === "hidden").length };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[2rem] leading-tight">Every role.</h1>
          <p className="mt-1 text-sm text-fg-2">
            {companies.length} boards + Hacker News · {all.length} kept · {runs[0] ? `last scan ${new Date(runs[0].at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} (${runs[0].fetched} fetched, ${runs[0].added} new${runs[0].errors.length ? `, ${runs[0].errors.length} boards failed` : ""})` : "never scanned"}
          </p>
        </div>
      </div>
      <JobsTable rows={rows} counts={counts} filters={{ status, tier, min, q: sp.q ?? "", fresh, ai: aiOnly, sort }} errors={runs[0]?.errors ?? []} lastScanAt={runs[0]?.at ?? null} />
    </div>
  );
}
