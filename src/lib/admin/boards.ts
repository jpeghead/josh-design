import type { Company, Posting } from "./types";
import { ruleScore, tier } from "./taxonomy";

const H = { "User-Agent": "josh.design admin scanner", Accept: "application/json" };

/** One fetch with a single retry on 429 or a 5xx, since boards rate-limit a full scan now and then. */
async function get(url: string): Promise<Response> {
  const r = await fetch(url, { headers: H, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (r.status !== 429 && r.status < 500) return r;
  await new Promise((f) => setTimeout(f, 2500 + Math.random() * 1500));
  return fetch(url, { headers: H, cache: "no-store", signal: AbortSignal.timeout(20000) });
}

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

/** A pay range stated in the posting text: "$180,000 - $250,000", "$170K – $295K", "USD 150,000 to 200,000". */
export function payInText(text: string): string | undefined {
  const m = text.match(/(?:\$|USD\s?)\s?(\d{2,3}(?:,\d{3})?K?)\s?(?:-|–|—|to)\s?(?:\$|USD\s?)?\s?(\d{2,3}(?:,\d{3})?K?)/i);
  if (!m) return undefined;
  const n = (x: string) => (/k$/i.test(x) ? Number(x.replace(/k/i, "")) * 1000 : Number(x.replace(/,/g, "")));
  const [a, b] = [n(m[1]), n(m[2])];
  if (!(a >= 40000 && b >= a && b <= 2000000)) return undefined;
  return `$${Math.round(a / 1000)}K – $${Math.round(b / 1000)}K`;
}

function make(p: Omit<Posting, "tier" | "score" | "scoreWhy" | "scoredBy" | "persona" | "status" | "firstSeen" | "lastSeen" | "ai">): Posting {
  const now = new Date().toISOString();
  const rs = ruleScore(p.title, p.description, p.location, p.remote);
  return { ...p, pay: p.pay ?? payInText(p.description), tier: tier(p.title), score: rs.score, scoreWhy: rs.why, scoredBy: "rules", persona: rs.persona, ai: rs.ai, status: "new", firstSeen: now, lastSeen: now };
}

export async function greenhouse(c: Company): Promise<Posting[]> {
  const r = await get(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs?content=true`);
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
  const r = await get(`https://api.ashbyhq.com/posting-api/job-board/${c.slug}?includeCompensation=true`);
  if (!r.ok) throw new Error(`ashby ${c.slug} ${r.status}`);
  const j = (await r.json()) as { jobs: { id: string; title: string; location?: string; isRemote?: boolean; jobUrl: string; applyUrl: string; descriptionPlain?: string; descriptionHtml?: string; publishedAt?: string; isListed?: boolean; compensation?: { scrapeableCompensationSalarySummary?: string; compensationTierSummary?: string } }[] };
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
        pay: (() => {
          const raw = x.compensation?.scrapeableCompensationSalarySummary ?? x.compensation?.compensationTierSummary?.split("•")[0]?.trim();
          return raw ? (payInText(raw) ?? raw) : undefined;
        })(),
      })
    );
}

export async function lever(c: Company): Promise<Posting[]> {
  const r = await get(`https://api.lever.co/v0/postings/${c.slug}?mode=json`);
  if (!r.ok) throw new Error(`lever ${c.slug} ${r.status}`);
  const j = (await r.json()) as { id: string; text: string; hostedUrl: string; applyUrl: string; categories?: { location?: string; commitment?: string }; workplaceType?: string; descriptionPlain?: string; createdAt?: number; salaryRange?: { min?: number; max?: number; currency?: string } }[];
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
      pay: (() => {
        const r = x.salaryRange;
        if (!r?.min || !r?.max) return undefined;
        const unit = r.currency === "USD" || !r.currency ? "$" : `${r.currency} `;
        return `${unit}${Math.round(r.min / 1000)}K – ${unit}${Math.round(r.max / 1000)}K`;
      })(),
    })
  );
}

/** The current "Ask HN: Who is hiring?" thread, one posting per top-level comment that looks like a role. */
export async function hackerNews(): Promise<Posting[]> {
  const s = await get("https://hn.algolia.com/api/v1/search_by_date?query=%22Who%20is%20hiring%22&tags=story,author_whoishiring&hitsPerPage=1");
  if (!s.ok) throw new Error(`hn search ${s.status}`);
  const hit = ((await s.json()) as { hits: { objectID: string; title: string }[] }).hits[0];
  if (!hit) return [];
  const t = await get(`https://hn.algolia.com/api/v1/items/${hit.objectID}`);
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

/** Workable's public widget feed; `details=true` includes the HTML description. */
export async function workable(c: Company): Promise<Posting[]> {
  const r = await get(`https://apply.workable.com/api/v1/widget/accounts/${c.slug}?details=true`);
  if (!r.ok) throw new Error(`workable ${c.slug} ${r.status}`);
  const j = (await r.json()) as { jobs: { shortcode: string; title: string; url: string; application_url?: string; telecommuting?: boolean; city?: string; state?: string; country?: string; locations?: { city?: string; country?: string }[]; description?: string; published_on?: string }[] };
  return j.jobs.map((x) => {
    const loc = [x.city, x.state, x.country].filter(Boolean).join(", ") || (x.locations ?? []).map((l) => [l.city, l.country].filter(Boolean).join(", ")).join(" / ");
    return make({
      id: `wk_${c.slug}_${x.shortcode}`,
      source: "workable",
      company: c.name,
      title: x.title.trim(),
      location: loc,
      remote: !!x.telecommuting || /remote/i.test(x.title),
      url: x.url,
      applyUrl: x.application_url ?? `${x.url}/apply`,
      description: text(x.description ?? "").slice(0, 12000),
      postedAt: x.published_on ?? null,
    });
  });
}

/**
 * Rippling's board API lists titles only; the description needs one request
 * per job, so details are fetched only for titles the taxonomy keeps.
 */
export async function rippling(c: Company): Promise<Posting[]> {
  const r = await get(`https://api.rippling.com/platform/api/ats/v1/board/${c.slug}/jobs`);
  if (!r.ok) throw new Error(`rippling ${c.slug} ${r.status}`);
  const list = (await r.json()) as { uuid: string; name: string; url: string; workLocation?: { label?: string } }[];
  const kept = list.filter((x) => tier(x.name.trim()) !== "other").slice(0, 40);
  const details = await Promise.all(
    kept.map(async (x) => {
      try {
        const d = await fetch(`https://api.rippling.com/platform/api/ats/v1/board/${c.slug}/jobs/${x.uuid}`, { headers: H, cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!d.ok) return null;
        return (await d.json()) as { description?: Record<string, string>; workLocations?: { label?: string }[]; createdOn?: string; url?: string };
      } catch {
        return null;
      }
    })
  );
  return kept.map((x, i) => {
    const d = details[i];
    const location = (d?.workLocations ?? []).map((l) => l.label).filter(Boolean).join(" / ") || x.workLocation?.label || "";
    return make({
      id: `rp_${c.slug}_${x.uuid}`,
      source: "rippling",
      company: c.name,
      title: x.name.trim(),
      location,
      remote: /remote/i.test(`${location} ${x.name}`),
      url: d?.url ?? x.url,
      applyUrl: d?.url ?? x.url,
      description: text(Object.values(d?.description ?? {}).join("\n")).slice(0, 12000),
      postedAt: d?.createdOn ?? null,
    });
  });
}

export async function fetchBoard(c: Company): Promise<Posting[]> {
  if (c.source === "greenhouse") return greenhouse(c);
  if (c.source === "ashby") return ashby(c);
  if (c.source === "workable") return workable(c);
  if (c.source === "rippling") return rippling(c);
  return lever(c);
}
