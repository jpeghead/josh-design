import type { Application } from "./apply/types";
import type { Posting } from "./types";
import type { Resume } from "./resume/types";

export type Numbers = {
  submitted: number;
  byStage: Record<string, number>;
  responded: number;
  responseRate: number | null;
  interviews: number;
  medianDaysToReply: number | null;
  byPersona: { persona: string; submitted: number; responded: number }[];
  bySource: { source: string; submitted: number; responded: number }[];
};

const RESPONDED = new Set(["replied", "interviewing", "offer", "rejected"]);

/** The funnel after Submit, from what the pipeline records. Honest when small: nulls, not zeros, until there is data. */
export function numbers(apps: Application[], jobs: Posting[], resumes: Resume[]): Numbers {
  const sub = apps.filter((a) => a.status === "submitted");
  const byStage: Record<string, number> = {};
  for (const a of sub) byStage[a.stage ?? "applied"] = (byStage[a.stage ?? "applied"] ?? 0) + 1;
  const responded = sub.filter((a) => RESPONDED.has(a.stage ?? "")).length;
  const days = sub
    .map((a) => {
      const reply = a.stageAt?.replied ?? a.stageAt?.interviewing ?? a.stageAt?.rejected ?? a.stageAt?.offer;
      return reply && a.submittedAt ? (Date.parse(reply) - Date.parse(a.submittedAt)) / 86400000 : null;
    })
    .filter((d): d is number => d !== null)
    .sort((x, y) => x - y);
  const group = <K extends string>(key: (a: Application) => K) => {
    const m = new Map<K, { submitted: number; responded: number }>();
    for (const a of sub) {
      const k = key(a);
      const g = m.get(k) ?? { submitted: 0, responded: 0 };
      g.submitted++;
      if (RESPONDED.has(a.stage ?? "")) g.responded++;
      m.set(k, g);
    }
    return [...m.entries()].map(([k, v]) => ({ key: k, ...v })).sort((x, y) => y.submitted - x.submitted);
  };
  return {
    submitted: sub.length,
    byStage,
    responded,
    responseRate: sub.length ? responded / sub.length : null,
    interviews: sub.filter((a) => ["interviewing", "offer"].includes(a.stage ?? "")).length,
    medianDaysToReply: days.length ? days[Math.floor(days.length / 2)] : null,
    byPersona: group((a) => resumes.find((r) => r.id === a.resumeId)?.persona ?? "unknown").map(({ key, ...v }) => ({ persona: key, ...v })),
    bySource: group((a) => jobs.find((j) => j.id === a.jobId)?.source ?? "unknown").map(({ key, ...v }) => ({ source: key, ...v })),
  };
}
