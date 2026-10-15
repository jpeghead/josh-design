export type Persona = "designer-who-builds" | "ai-builder";

/** The rendered subset of the profile: already selected and ordered. Every string here must trace back to profile.json. */
export type ResumeData = {
  persona: Persona;
  name: string;
  headline: string;
  summary: string;
  email: string;
  phone?: string;
  location: string;
  links: { label: string; url: string }[];
  sections: ("summary" | "experience" | "builds" | "skills" | "education" | "publications" | "service")[];
  experience: { company: string; role: string; start: string; end: string; location?: string; summary?: string; bullets: string[]; client?: boolean }[];
  builds: { title: string; line: string; url: string }[];
  skills: { group: string; items: string[] }[];
  education: { school: string; detail: string; years?: string }[];
  publications: { title: string; detail: string; url?: string }[];
  service?: { branch: string; role: string; years: string };
};

export type Resume = {
  id: string;
  persona: Persona;
  label: string;
  createdAt: string;
  basedOn?: string;
  instruction?: string;
  jobId?: string;
  /** Company name of the posting a tailored résumé is for; goes into the file name. */
  company?: string;
  keywords?: { covered: string[]; missing: string[] };
  data: ResumeData;
};
