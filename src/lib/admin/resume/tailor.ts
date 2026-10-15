import { anthropicConfigured } from "@/lib/anthropic";
import { buildResume } from "./build";
import { postingKeywords, roughKeywords, tailorResume } from "./model";
import { getProfile } from "./profile";
import { coverage, currentBase, listResumes, newResume, saveResume } from "./store";
import { resumePages } from "./pages";
import type { Posting } from "../types";
import type { Resume } from "./types";

/**
 * A résumé for one posting, derived from the approved base for the
 * posting's persona: the posting's own terms where they are true of the
 * record, bullets reordered toward them, nothing added. With a model the
 * wording is adjusted; without one only the order changes. The layout and
 * the facts are the base's; only the emphasis is the posting's.
 */
export async function tailorFor(job: Posting, from?: Resume): Promise<Resume> {
  const base = from ?? currentBase(job.persona);
  const profile = getProfile();
  const hasModel = anthropicConfigured();
  const keywords = hasModel ? await postingKeywords(job).catch(() => roughKeywords(job)) : roughKeywords(job);
  const data = hasModel ? await tailorResume(base.data, job, keywords, profile) : buildResume(profile, base.persona, keywords);
  const made = newResume(base.persona, `${base.label} → ${job.company}: ${job.title}`.slice(0, 90), data, {
    basedOn: base.id,
    jobId: job.id,
    company: job.company,
    template: base.template,
    instruction: hasModel ? `Tailored to ${job.company} — ${job.title}` : `Reordered by rule for ${job.company} — ${job.title} (no model, no rewording)`,
    keywords: coverage(data, keywords),
  });
  return fitToTwoPages(made);
}

/**
 * Two pages is the budget. The model is asked to keep length, but a
 * sentence here and there adds up; measure the real PDF and trim from the
 * bottom (the oldest roles' extra bullets, then a project line) until it
 * holds, so a tailored résumé never arrives as three pages.
 */
export async function fitToTwoPages(r: Resume): Promise<Resume> {
  for (let i = 0; i < 8; i++) {
    const { count } = await resumePages(r);
    if (count <= 2) return r;
    const d = r.data;
    // first, any role over its budget for its position (the model likes to add one); then the oldest roles' extras
    const caps = [4, 3, 3, 2, 2, 1, 1];
    const over = d.experience.find((e, i) => e.bullets.length > (caps[i] ?? 1));
    const roles = [...d.experience].reverse();
    const victim = over ?? roles.find((e) => e.bullets.length > 1) ?? null;
    if (victim) victim.bullets.pop();
    else if (d.builds.length > 2) d.builds.pop();
    else if (d.summary.split(/(?<=\.)\s+/).length > 2) d.summary = d.summary.split(/(?<=\.)\s+/).slice(0, -1).join(" ");
    else return r;
    saveResume(r);
  }
  return r;
}

/** The tailored résumé for a posting if one exists and still derives from the current base; otherwise a fresh one. */
export async function tailoredFor(job: Posting): Promise<Resume> {
  const base = currentBase(job.persona);
  const existing = listResumes().find((r) => r.jobId === job.id && r.basedOn === base.id);
  return existing ?? tailorFor(job, base);
}
