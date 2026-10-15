import { readJson, snapshot, writeJson } from "./store";
import { fetchBoard, hackerNews } from "./boards";
import type { Company, Posting, ScanRun } from "./types";

/**
 * Fetch every company board plus Hacker News, keep postings whose title is
 * core or stretch, merge into jobs.json preserving status and notes, and
 * drop postings not seen for 30 days. Boards that fail are reported, not
 * fatal.
 */
export async function runScan(): Promise<ScanRun> {
  snapshot();
  const companies = readJson<Company[]>("companies", []);
  const existing = readJson<Posting[]>("jobs", []);
  const byId = new Map(existing.map((p) => [p.id, p]));
  const errors: string[] = [];
  let fetched = 0;
  let kept = 0;
  let added = 0;
  const now = new Date().toISOString();

  const results = await Promise.allSettled([...companies.map((c) => fetchBoard(c)), hackerNews()]);
  results.forEach((r, i) => {
    const label = i < companies.length ? `${companies[i].name} (${companies[i].source})` : "Hacker News";
    if (r.status === "rejected") {
      errors.push(`${label}: ${String(r.reason).slice(0, 120)}`);
      return;
    }
    for (const p of r.value) {
      fetched++;
      if (p.tier === "other") continue;
      kept++;
      const prev = byId.get(p.id);
      if (prev) {
        byId.set(p.id, { ...p, status: prev.status, notes: prev.notes, firstSeen: prev.firstSeen, lastSeen: now, score: prev.scoredBy === "claude" ? prev.score : p.score, scoreWhy: prev.scoredBy === "claude" ? prev.scoreWhy : p.scoreWhy, scoredBy: prev.scoredBy, persona: prev.scoredBy === "claude" ? prev.persona : p.persona });
      } else {
        byId.set(p.id, p);
        added++;
      }
    }
  });

  const cutoff = Date.now() - 30 * 86400000;
  const merged = [...byId.values()].filter((p) => Date.parse(p.lastSeen) > cutoff || p.status === "applied" || p.status === "saved");
  merged.sort((a, b) => b.score - a.score);
  writeJson("jobs", merged);
  const run: ScanRun = { at: now, fetched, kept, added, errors };
  const runs = readJson<ScanRun[]>("scans", []);
  writeJson("scans", [run, ...runs].slice(0, 30));
  return run;
}
