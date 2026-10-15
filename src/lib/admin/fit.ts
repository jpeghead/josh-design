import { createHash } from "node:crypto";
import { anthropicConfigured } from "@/lib/anthropic";
import { postingKeywords, roughKeywords } from "./resume/model";
import { coverage, currentBase } from "./resume/store";
import { readJson, writeJson } from "./store";
import type { Posting } from "./types";

export type Fit = { jobId: string; resumeId: string; hash: string; at: string; keywords: string[]; covered: string[]; missing: string[]; by: "claude" | "rules" };

/**
 * How the current base résumé for the posting's persona reads against the
 * posting's own words: which of its keywords appear in the résumé text and
 * which do not. Cached per posting and per résumé version.
 */
export async function fitFor(job: Posting): Promise<Fit> {
  const resume = currentBase(job.persona);
  const hash = createHash("sha1").update(JSON.stringify(resume.data)).digest("hex").slice(0, 8);
  const all = readJson<Fit[]>("fits", []);
  const hit = all.find((f) => f.jobId === job.id && f.resumeId === resume.id && f.hash === hash);
  if (hit) return hit;
  const by = anthropicConfigured() ? "claude" : "rules";
  const keywords = by === "claude" ? await postingKeywords(job).catch(() => roughKeywords(job)) : roughKeywords(job);
  const c = coverage(resume.data, keywords);
  const fit: Fit = { jobId: job.id, resumeId: resume.id, hash, at: new Date().toISOString(), keywords, covered: c.covered, missing: c.missing, by };
  writeJson("fits", [fit, ...all.filter((f) => f.jobId !== job.id)].slice(0, 400));
  return fit;
}

export function cachedFit(job: Posting): Fit | undefined {
  return readJson<Fit[]>("fits", []).find((f) => f.jobId === job.id);
}
