import { readJson } from "../store";
import type { Posting } from "../types";
import { currentBase, listResumes } from "../resume/store";
import { tailoredFor } from "../resume/tailor";
import { getApplication, listApplications, newApplication, saveApplication } from "./store";
import { isLive, startApplication } from "./agent";

/**
 * The review queue: applications prepared in the background, one at a
 * time, each in its own headless browser with its own copy of the sign-in
 * profile. They stop at review; Josh approves or fixes each from the queue
 * page. Never more than LIVE_MAX waiting at once, so memory stays sane.
 */
const LIVE_MAX = 6;
const g = globalThis as unknown as { __applyQueue?: { running: boolean } };
const state = (g.__applyQueue ??= { running: false });

export function enqueue(jobIds: string[]): string[] {
  const jobs = readJson<Posting[]>("jobs", []);
  const ids: string[] = [];
  for (const id of jobIds) {
    const job = jobs.find((j) => j.id === id);
    if (!job) continue;
    const open = listApplications().find((a) => a.jobId === id && ["queued", "starting", "filling", "review", "needs-you"].includes(a.status));
    if (open) {
      ids.push(open.id);
      continue;
    }
    // the résumé is chosen when the run starts (tailored then, from the current base); until then the base stands in
    const app = newApplication({ jobId: job.id, company: job.company, title: job.title, url: job.applyUrl, resumeId: currentBase(job.persona).id, autoSubmit: false, headless: true });
    app.status = "queued";
    saveApplication(app);
    ids.push(app.id);
  }
  void kick();
  return ids;
}

/** Start the worker if it is not running. Safe to call from any page load. */
export async function kick(): Promise<void> {
  if (state.running) return;
  state.running = true;
  try {
    for (;;) {
      const all = listApplications();
      const waiting = all.filter((a) => a.headless && ["review", "needs-you"].includes(a.status)).length;
      const next = all.filter((a) => a.status === "queued").sort((x, y) => x.startedAt.localeCompare(y.startedAt))[0];
      if (!next || waiting >= LIVE_MAX) break;
      const job = readJson<Posting[]>("jobs", []).find((j) => j.id === next.jobId);
      if (!job) {
        next.status = "failed";
        next.message = "The posting is gone.";
        saveApplication(next);
        continue;
      }
      next.status = "starting";
      next.steps.push({ at: new Date().toISOString(), text: "Tailoring the résumé to this posting from the approved base." });
      saveApplication(next);
      let resume;
      try {
        resume = await tailoredFor(job);
        const k = resume.keywords;
        next.resumeNote = `Tailored for ${job.company}${k ? ` · ${k.covered.length}/${k.covered.length + k.missing.length} of the posting's terms` : ""}`;
      } catch (e) {
        resume = listResumes().find((r) => r.id === next.resumeId) ?? currentBase(job.persona);
        next.resumeNote = `Base résumé (tailoring failed: ${(e as Error).message.slice(0, 80)})`;
      }
      next.resumeId = resume.id;
      next.steps.push({ at: new Date().toISOString(), text: next.resumeNote });
      saveApplication(next);
      await startApplication(next, job, resume, { headless: true });
    }
  } finally {
    state.running = false;
  }
}

export function queueSnapshot() {
  const all = listApplications();
  return {
    queued: all.filter((a) => a.status === "queued").length,
    preparing: all.filter((a) => a.headless && ["starting", "filling"].includes(a.status)).length,
    ready: all.filter((a) => a.headless && ["review", "needs-you"].includes(a.status)).length,
    running: state.running,
  };
}

export function queued(id: string) {
  return getApplication(id)?.status === "queued";
}

/**
 * A run that says it is waiting but has no browser behind it (the server
 * restarted under it) is marked stopped, so Today and the queue never
 * point at a window that is not there.
 */
export function reconcile(): number {
  let n = 0;
  for (const a of listApplications()) {
    if (["starting", "filling", "review", "needs-you", "submitting"].includes(a.status) && !isLive(a.id)) {
      a.status = "stopped";
      a.finishedAt = new Date().toISOString();
      a.message = "The browser behind this run was lost (the server restarted). Prepare it again.";
      a.steps.push({ at: new Date().toISOString(), text: a.message });
      saveApplication(a);
      n++;
    }
  }
  return n;
}
