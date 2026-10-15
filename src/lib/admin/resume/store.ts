import { readJson, writeJson, id as newId } from "../store";
import { renderResumeText } from "./render";
import type { Resume, ResumeData, Persona } from "./types";

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
