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
  status: "starting" | "filling" | "review" | "needs-you" | "submitting" | "submitted" | "failed" | "stopped";
  message?: string;
  fields: Field[];
  steps: Step[];
  screenshot?: string; // path under data/admin/out
  startedAt: string;
  finishedAt?: string;
};
