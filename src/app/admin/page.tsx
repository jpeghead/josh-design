import Link from "next/link";
import { readJson } from "@/lib/admin/store";
import type { Company, Posting, ScanRun } from "@/lib/admin/types";
import { listApplications } from "@/lib/admin/apply/store";
import { kick, queueSnapshot, reconcile } from "@/lib/admin/apply/queue";
import { lastVisit, markVisit } from "@/lib/admin/visits";
import { Today } from "@/components/admin/today";

export const dynamic = "force-dynamic";

/** The front door: what arrived since you looked, what is waiting on you, what is due. */
export default async function TodayPage() {
  reconcile();
  void kick();
  const since = lastVisit();
  const sinceMs = since ? Date.parse(since) : Date.now() - 7 * 86400000;
  const jobs = readJson<Posting[]>("jobs", []);
  const companies = readJson<Company[]>("companies", []);
  const runs = readJson<ScanRun[]>("scans", []);
  const apps = listApplications();
  const fresh = jobs.filter((p) => p.status === "new" && Date.parse(p.firstSeen) > sinceMs && p.score >= 60).sort((a, b) => b.score - a.score).slice(0, 12);
  const watched = companies.filter((c) => c.watch);
  const watchedNames = new Set(watched.map((c) => c.name.toLowerCase()));
  const fromWatched = jobs.filter((p) => watchedNames.has(p.company.toLowerCase()) && p.status === "new" && Date.now() - Date.parse(p.firstSeen) < 14 * 86400000).sort((a, b) => b.score - a.score).slice(0, 12);
  const today = new Date().toISOString().slice(0, 10);
  const due = apps.filter((a) => a.status === "submitted" && a.nextAction?.date && a.nextAction.date <= today && !["rejected", "withdrawn", "offer"].includes(a.stage ?? ""));
  const waiting = apps.filter((a) => ["review", "needs-you"].includes(a.status));
  markVisit();
  return (
    <Today
      since={since}
      fresh={fresh.map((p) => ({ id: p.id, title: p.title, company: p.company, score: p.score, why: p.scoreWhy, location: p.location, pay: p.pay }))}
      fromWatched={fromWatched.map((p) => ({ id: p.id, title: p.title, company: p.company, score: p.score, location: p.location }))}
      due={due.map((a) => ({ id: a.id, title: a.title, company: a.company, note: a.nextAction?.note ?? "", date: a.nextAction?.date ?? "" }))}
      waiting={waiting.map((a) => ({ id: a.id, title: a.title, company: a.company, headless: !!a.headless, fix: a.fields.filter((f) => f.status === "review").length }))}
      queue={queueSnapshot()}
      companies={companies.map((c) => ({ name: c.name, source: c.source, slug: c.slug, watch: !!c.watch }))}
      lastScan={runs[0] ? { at: runs[0].at, added: runs[0].added, errors: runs[0].errors.length } : null}
      counts={{ kept: jobs.length, scored: jobs.filter((p) => p.scoredBy === "claude").length, saved: jobs.filter((p) => p.status === "saved").length }}
    />
  );
}
