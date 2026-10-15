import type { Company } from "./types";

const H = { "User-Agent": "josh.design admin probe", Accept: "application/json" };

/** Slug guesses from a company name or URL: "Very Good Ventures" → verygoodventures, very-good-ventures, vgv. */
export function slugGuesses(input: string): string[] {
  const raw = input.trim();
  const fromUrl = raw.match(/(?:greenhouse\.io|ashbyhq\.com|lever\.co|workable\.com\/(?:api\/v1\/widget\/accounts)?|rippling\.com)\/([a-z0-9-]+)/i)?.[1];
  const host = raw.match(/^https?:\/\/(?:www\.)?([a-z0-9-]+)\./i)?.[1];
  const words = raw.toLowerCase().replace(/^https?:\/\/[^/]+\/?/, "").replace(/[^a-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const joined = words.join("");
  const dashed = words.join("-");
  const initials = words.length > 1 ? words.map((w) => w[0]).join("") : "";
  const noSuffix = words.filter((w) => !["inc", "labs", "ai", "co", "the", "corp", "hq"].includes(w));
  return [...new Set([fromUrl, host, joined, dashed, noSuffix.join(""), noSuffix.join("-"), `${joined}ai`, `${joined}hq`, `${joined}labs`, initials].filter((s): s is string => !!s && s.length >= 2))];
}

async function count(source: Company["source"], slug: string): Promise<number> {
  const url =
    source === "greenhouse" ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
    : source === "ashby" ? `https://api.ashbyhq.com/posting-api/job-board/${slug}`
    : source === "workable" ? `https://apply.workable.com/api/v1/widget/accounts/${slug}`
    : source === "rippling" ? `https://api.rippling.com/platform/api/ats/v1/board/${slug}/jobs`
    : `https://api.lever.co/v0/postings/${slug}?mode=json`;
  try {
    const r = await fetch(url, { headers: H, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!r.ok) return 0;
    const j = (await r.json()) as { jobs?: unknown[] } | unknown[];
    return Array.isArray(j) ? j.length : (j.jobs?.length ?? 0);
  } catch {
    return 0;
  }
}

/** Try every guess against every board; return the hits with job counts, best first. */
export async function discover(input: string): Promise<{ source: Company["source"]; slug: string; jobs: number }[]> {
  const guesses = slugGuesses(input);
  const sources: Company["source"][] = ["greenhouse", "ashby", "lever", "workable", "rippling"];
  const results = await Promise.all(guesses.flatMap((slug) => sources.map(async (source) => ({ source, slug, jobs: await count(source, slug) }))));
  return results.filter((r) => r.jobs > 0).sort((a, b) => b.jobs - a.jobs);
}
