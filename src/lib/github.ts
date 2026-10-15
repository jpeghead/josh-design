/**
 * Live signals from GitHub's public API. No token: 60 requests/hour per IP is
 * plenty with ISR caching. Every call fails soft to null so the page never
 * depends on it.
 */
const H = { Accept: "application/vnd.github+json", "User-Agent": "josh.design" };

export async function repoStars(repo: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}`, { headers: H, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const j = (await r.json()) as { stargazers_count?: number };
    return typeof j.stargazers_count === "number" ? j.stargazers_count : null;
  } catch {
    return null;
  }
}

export type Commit = { message: string; date: string; url: string; repo: string };

export async function lastCommit(repo: string): Promise<Commit | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: H, next: { revalidate: 900 } });
    if (!r.ok) return null;
    const j = (await r.json()) as { commit: { message: string; author: { date: string } }; html_url: string }[];
    const c = j[0];
    if (!c) return null;
    return { message: c.commit.message.split("\n")[0], date: c.commit.author.date, url: c.html_url, repo };
  } catch {
    return null;
  }
}

export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Up to a hundred recent commits on the default branch, newest first. */
export async function recentCommits(repo: string, n = 100): Promise<Commit[]> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=${Math.min(100, n)}`, { headers: H, next: { revalidate: 900 } });
    if (!r.ok) return [];
    const j = (await r.json()) as { sha: string; commit: { message: string; author: { date: string } }; html_url: string }[];
    return j.map((c) => ({ message: c.commit.message.split("\n")[0], date: c.commit.author.date, url: c.html_url, repo }));
  } catch {
    return [];
  }
}
