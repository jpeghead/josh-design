import { resume } from "@/content/resume";
import { socials } from "@/content/about";
import { projects } from "@/lib/data";
import { books } from "@/content/books";

const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

/** "Oct 2015 – Feb 2017" → ["2015-10", "2017-02"]; "Jan 2024 – Present" → ["2024-01", undefined]. */
function dates(timeline: string): [string | undefined, string | undefined] {
  const parse = (s: string) => {
    const m = s.trim().match(/^([A-Z][a-z]{2}) (\d{4})$/);
    if (m) return `${m[2]}-${MONTHS[m[1]] ?? "01"}`;
    const y = s.trim().match(/^(\d{4})$/);
    return y ? y[1] : undefined;
  };
  const [a, b] = timeline.split(/[–-]/);
  return [parse(a ?? ""), /present/i.test(b ?? "") ? undefined : parse(b ?? "")];
}

/** The résumé in the JSON Resume schema (jsonresume.org), from the same data as /resume. */
export function GET() {
  const doc = {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: resume.name,
      label: resume.title,
      email: resume.email,
      url: resume.site,
      summary: resume.summary,
      location: { city: "Los Angeles", region: "CA", countryCode: "US" },
      profiles: socials.map((s) => ({ network: s.label, url: s.href })),
    },
    work: projects.map((p) => {
      const [startDate, endDate] = dates(p.timeline);
      return {
        name: p.context,
        position: p.role,
        startDate,
        endDate,
        summary: p.summary,
        highlights: [...p.contribution, ...p.outcome],
        url: `${resume.site}/work/${p.slug}`,
      };
    }),
    skills: Object.entries(resume.skills).map(([name, keywords]) => ({ name, keywords })),
    publications: books
      .filter((b) => b.status !== "In progress")
      .map((b) => ({ name: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title, releaseDate: b.year, url: b.site ?? b.link?.href, summary: b.blurb })),
    projects: [
      { name: "Portrait", description: "In-browser analysis of a ChatGPT or Claude export; nothing uploaded.", url: `${resume.site}/lab/portrait` },
      { name: "A model in your browser", description: "A language model on the visitor's GPU through WebGPU, grounded on this site.", url: `${resume.site}/lab/local` },
      { name: "Agent UI patterns", description: "Working prototypes for progress, scoped permissions, failure recovery, graded confidence, and asking before guessing.", url: `${resume.site}/lab/agents` },
      { name: "Whitehead City", description: "A GTA-style open world of the life, built in sixteen days with a coding agent.", url: `${resume.site}/lab/city` },
    ],
    meta: { canonical: `${resume.site}/resume.json`, lastModified: new Date().toISOString().slice(0, 10), targets: resume.targets },
  };
  return new Response(JSON.stringify(doc, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
