import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, Label } from "@/components/ui";
import { recentCommits, ago } from "@/lib/github";

export const metadata: Metadata = {
  title: "Build log",
  description: "Every change to this site, straight from the repository. Updated as commits land.",
};

export const revalidate = 900;

const REPO = "jpeghead/josh-design";

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
}
function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
}

export default async function Page() {
  const commits = await recentCommits(REPO);
  const groups = new Map<string, typeof commits>();
  for (const c of commits) {
    const k = day(c.date);
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const first = commits[commits.length - 1];
  const spanDays = first ? Math.max(1, Math.round((Date.now() - Date.parse(first.date)) / 86400000)) : 0;
  // one bar per day from the first shown commit to today, LA time
  const dayKey = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const perDay: { key: string; n: number }[] = [];
  if (first) {
    const counts = new Map<string, number>();
    for (const c of commits) counts.set(dayKey(Date.parse(c.date)), (counts.get(dayKey(Date.parse(c.date))) ?? 0) + 1);
    for (let t = Date.parse(first.date); t <= Date.now() + 86400000; t += 86400000) {
      const k = dayKey(t);
      if (!perDay.length || perDay[perDay.length - 1].key !== k) perDay.push({ key: k, n: counts.get(k) ?? 0 });
    }
  }
  const maxDay = Math.max(1, ...perDay.map((d) => d.n));

  return (
    <Container>
      <PageHeader
        label="Build log"
        serif
        title="What changed, as it changed."
        dek="This page reads the site's own repository and lists the commits, newest first. Nothing here is written by hand; it is the work, timestamped."
      />
      {commits.length === 0 ? (
        <p className="pb-28 text-fg-2">
          GitHub didn&rsquo;t answer just now. The history is at{" "}
          <a href={`https://github.com/${REPO}/commits`} className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg" target="_blank" rel="noreferrer">
            github.com/{REPO}
          </a>
          .
        </p>
      ) : (
        <div className="pb-28">
          <dl className="grid max-w-2xl grid-cols-3 gap-6 border-y border-line py-6">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-fg-3">Shown</dt>
              <dd className="tighter mt-1 text-2xl font-semibold">{commits.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-fg-3">Over</dt>
              <dd className="tighter mt-1 text-2xl font-semibold">{spanDays} days</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-fg-3">Latest</dt>
              <dd className="tighter mt-1 text-2xl font-semibold">{ago(commits[0].date)}</dd>
            </div>
          </dl>
          <div className="mt-8" aria-label="Commits per day">
            <div className="flex h-14 items-end gap-px">
              {perDay.map((d) => (
                <span
                  key={d.key}
                  title={`${d.key}: ${d.n} commit${d.n === 1 ? "" : "s"}`}
                  className={`min-w-[2px] flex-1 rounded-sm ${d.n ? (d.n === maxDay ? "bg-fg" : "bg-fg-3") : "bg-line"}`}
                  style={{ height: d.n ? `${Math.max(12, (d.n / maxDay) * 100)}%` : "4px" }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] tabular-nums text-fg-3">
              <span>{perDay[0]?.key}</span>
              <span>one bar per day · brightest is the busiest</span>
              <span>today</span>
            </div>
          </div>
          {[...groups.entries()].map(([d, list]) => (
            <section key={d} className="grid gap-4 border-b border-line py-8 sm:grid-cols-[14rem_1fr]" aria-label={d}>
              <Label>
                {d} · {list.length}
              </Label>
              <ol className="space-y-2.5">
                {list.map((c) => (
                  <li key={c.url} className="flex gap-4">
                    <span className="w-[5.5rem] shrink-0 text-sm tabular-nums text-fg-3">{time(c.date)}</span>
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-[15px] leading-snug text-fg-2 transition-colors hover:text-fg">
                      {c.message}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <p className="mt-8 text-sm text-fg-3">
            The hundred most recent. The full history is on{" "}
            <a href={`https://github.com/${REPO}/commits`} className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg" target="_blank" rel="noreferrer">
              GitHub
            </a>
            . <Link href="/process" className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg">How the work gets made</Link>.
          </p>
        </div>
      )}
    </Container>
  );
}
