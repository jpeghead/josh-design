import { readJson, writeJson, id as newId } from "../store";
import { renderResumeText } from "./render";
import type { Resume, ResumeData, Persona } from "./types";
import { buildResume } from "./build";
import { getProfile } from "./profile";

export function listResumes(): Resume[] {
  return readJson<Resume[]>("resumes", []);
}
export function getResume(id: string): Resume | undefined {
  return listResumes().find((r) => r.id === id);
}
export function saveResume(r: Resume): Resume {
  const all = listResumes().filter((x) => x.id !== r.id);
  writeJson("resumes", [r, ...all]);
  return r;
}
export function deleteResume(id: string) {
  writeJson("resumes", listResumes().filter((x) => x.id !== id));
}
export function newResume(persona: Persona, label: string, data: ResumeData, extra: Partial<Resume> = {}): Resume {
  return saveResume({ id: newId("res"), persona, label, createdAt: new Date().toISOString(), data, ...extra });
}

/** Which posting keywords the résumé text already contains, which it does not. */
export function coverage(data: ResumeData, keywords: string[]): { covered: string[]; missing: string[] } {
  const text = renderResumeText(data).toLowerCase();
  const covered: string[] = [];
  const missing: string[] = [];
  for (const k of keywords) (text.includes(k.toLowerCase()) ? covered : missing).push(k);
  return { covered, missing };
}

/**
 * The résumé for a persona right now: the newest version that is not tied
 * to a posting. Built from the profile the first time it is asked for, so
 * the page never shows an empty state or asks which one to make.
 */
export function currentBase(persona: Persona): Resume {
  const found = listResumes().find((r) => r.persona === persona && !r.jobId);
  if (found) return found;
  const label = persona === "ai-builder" ? "AI builder" : "Designer who builds";
  return newResume(persona, label, buildResume(getProfile(), persona));
}

/** Rebuild a persona's base from the profile, keeping the old versions in history. */
export function rebuildBase(persona: Persona): Resume {
  const label = persona === "ai-builder" ? "AI builder" : "Designer who builds";
  return newResume(persona, label, buildResume(getProfile(), persona), { instruction: "rebuilt from the profile" });
}
