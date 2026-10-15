import type { Company, Posting } from "./types";
import { ruleScore, tier } from "./taxonomy";

const H = { "User-Agent": "josh.design admin scanner", Accept: "application/json" };

function text(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<\/(p|li|div|h\d|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function make(p: Omit<Posting, "tier" | "score" | "scoreWhy" | "scoredBy" | "persona" | "status" | "firstSeen" | "lastSeen">): Posting {
  const now = new Date().toISOString();
  const rs = ruleScore(p.title, p.description, p.location, p.remote);
  return { ...p, tier: tier(p.title), score: rs.score, scoreWhy: rs.why, scoredBy: "rules", persona: rs.persona, status: "new", firstSeen: now, lastSeen: now };
}

export async function greenhouse(c: Company): Promise<Posting[]> {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs?content=true`, { headers: H, cache: "no-store" });
  if (!r.ok) throw new Error(`greenhouse ${c.slug} ${r.status}`);
  const j = (await r.json()) as { jobs: { id: number; title: string; absolute_url: string; location?: { name: string }; content?: string; updated_at?: string; first_published?: string }[] };
  return j.jobs.map((x) =>
    make({
      id: `gh_${c.slug}_${x.id}`,
      source: "greenhouse",
      company: c.name,
      title: x.title.trim(),
      location: x.location?.name ?? "",
      remote: /remote/i.test(x.location?.name ?? ""),
      url: x.absolute_url,
      applyUrl: x.absolute_url,
      description: text(x.content ?? "").slice(0, 12000),
      postedAt: x.first_published ?? x.updated_at ?? null,
    })
  );
}

export async function ashby(c: Company): Promise<Posting[]> {
  const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${c.slug}?includeCompensation=true`, { headers: H, cache: "no-store" });
  if (!r.ok) throw new Error(`ashby ${c.slug} ${r.status}`);
  const j = (await r.json()) as { jobs: { id: string; title: string; location?: string; isRemote?: boolean; jobUrl: string; applyUrl: string; descriptionPlain?: string; descriptionHtml?: string; publishedAt?: string; isListed?: boolean }[] };
  return j.jobs
    .filter((x) => x.isListed !== false)
    .map((x) =>
      make({
        id: `ab_${c.slug}_${x.id}`,
        source: "ashby",
        company: c.name,
        title: x.title.trim(),
        location: x.location ?? "",
        remote: !!x.isRemote,
        url: x.jobUrl,
        applyUrl: x.applyUrl ?? x.jobUrl,
        description: (x.descriptionPlain ?? text(x.descriptionHtml ?? "")).slice(0, 12000),
        postedAt: x.publishedAt ?? null,
      })
    );
}

export async function lever(c: Company): Promise<Posting[]> {
  const r = await fetch(`https://api.lever.co/v0/postings/${c.slug}?mode=json`, { headers: H, cache: "no-store" });
  if (!r.ok) throw new Error(`lever ${c.slug} ${r.status}`);
  const j = (await r.json()) as { id: string; text: string; hostedUrl: string; applyUrl: string; categories?: { location?: string; commitment?: string }; workplaceType?: string; descriptionPlain?: string; createdAt?: number }[];
  return j.map((x) =>
    make({
      id: `lv_${c.slug}_${x.id}`,
      source: "lever",
      company: c.name,
      title: x.text.trim(),
      location: x.categories?.location ?? "",
      remote: x.workplaceType === "remote" || /remote/i.test(x.categories?.location ?? ""),
      url: x.hostedUrl,
      applyUrl: x.applyUrl ?? x.hostedUrl,
      description: (x.descriptionPlain ?? "").slice(0, 12000),
      postedAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
    })
  );
}

/** The current "Ask HN: Who is hiring?" thread, one posting per top-level comment that looks like a role. */
export async function hackerNews(): Promise<Posting[]> {
  const s = await fetch("https://hn.algolia.com/api/v1/search_by_date?query=%22Who%20is%20hiring%22&tags=story,author_whoishiring&hitsPerPage=1", { headers: H, cache: "no-store" });
  if (!s.ok) throw new Error(`hn search ${s.status}`);
  const hit = ((await s.json()) as { hits: { objectID: string; title: string }[] }).hits[0];
  if (!hit) return [];
  const t = await fetch(`https://hn.algolia.com/api/v1/items/${hit.objectID}`, { headers: H, cache: "no-store" });
  if (!t.ok) throw new Error(`hn thread ${t.status}`);
  const thread = (await t.json()) as { children: { id: number; text?: string; created_at?: string }[] };
  const out: Posting[] = [];
  for (const c of thread.children) {
    if (!c.text) continue;
    const body = text(c.text);
    const first = body.split("\n")[0] ?? "";
    const parts = first.split("|").map((p) => p.trim());
    if (parts.length < 2) continue;
    const company = parts[0].slice(0, 60);
    const title = parts.find((p) => /design|engineer|product|founding|forward|applied|dx\b|developer/i.test(p)) ?? parts[1];
    if (tier(title) === "other") continue;
    const location = parts.find((p) => /remote|onsite|hybrid|,|\b(sf|nyc|la)\b/i.test(p)) ?? "";
    out.push(
      make({
        id: `hn_${c.id}`,
        source: "hn",
        company,
        title: title.slice(0, 120),
        location,
        remote: /remote/i.test(first),
        url: `https://news.ycombinator.com/item?id=${c.id}`,
        applyUrl: (body.match(/https?:\/\/[^\s)]+/) ?? [`https://news.ycombinator.com/item?id=${c.id}`])[0],
        description: body.slice(0, 6000),
        postedAt: c.created_at ?? null,
      })
    );
  }
  return out;
}

export async function fetchBoard(c: Company): Promise<Posting[]> {
  if (c.source === "greenhouse") return greenhouse(c);
  if (c.source === "ashby") return ashby(c);
  return lever(c);
}
