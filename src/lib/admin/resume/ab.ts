import { listApplications } from "../apply/store";
import { getSettings } from "../settings";
import { DEFAULT_TEMPLATE, TEMPLATES } from "./templates";
import type { Resume } from "./types";

/**
 * Which template a new application goes out in. With the A/B rotation on,
 * the least-used template so far (counting runs that reached review or
 * were submitted), so the ten stay balanced and the numbers can compare
 * them; with it off, the base résumé's own template.
 */
export function pickTemplate(base: Resume): string {
  if (!getSettings().abTemplates) return base.template ?? DEFAULT_TEMPLATE;
  const counts = new Map<string, number>(TEMPLATES.map((t) => [t.id, 0]));
  for (const a of listApplications()) {
    if (!a.template || !counts.has(a.template)) continue;
    if (["review", "needs-you", "submitting", "submitted"].includes(a.status)) counts.set(a.template, (counts.get(a.template) ?? 0) + 1);
  }
  return [...counts.entries()].sort((x, y) => x[1] - y[1] || TEMPLATES.findIndex((t) => t.id === x[0]) - TEMPLATES.findIndex((t) => t.id === y[0]))[0][0];
}
