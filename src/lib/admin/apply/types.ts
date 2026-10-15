export type FieldKind = "text" | "email" | "tel" | "url" | "textarea" | "select" | "combobox" | "checkbox" | "radio" | "file" | "number" | "date" | "other";

export type Field = {
  key: string; // stable handle for this run (data-apply-key on the element)
  label: string;
  kind: FieldKind;
  required: boolean;
  options?: string[];
  value?: string; // what we set, or what was there
  status: "filled" | "left" | "review" | "skipped";
  note?: string;
};

export type Step = { at: string; text: string };

export type Application = {
  id: string;
  jobId: string;
  company: string;
  title: string;
  url: string;
  resumeId: string;
  autoSubmit: boolean;
  status: "queued" | "starting" | "filling" | "review" | "needs-you" | "submitting" | "submitted" | "failed" | "stopped";
  /** Prepared in the background without a window; the queue shows the screenshot and fields instead. */
  headless?: boolean;
  message?: string;
  fields: Field[];
  steps: Step[];
  screenshot?: string; // path under data/admin/out
  coverLetter?: string; // path under data/admin/out, when one was drafted
  startedAt: string;
  finishedAt?: string;
  /** Where it stands after submission; set by hand in the panel. */
  stage?: "applied" | "replied" | "interviewing" | "offer" | "rejected" | "withdrawn";
  nextAction?: { date: string; note: string } | null;
  notes?: string;
  submittedAt?: string;
};
