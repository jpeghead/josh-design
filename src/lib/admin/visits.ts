import { readJson, writeJson } from "./store";

/** When Josh last opened Today, so "new since you looked" means exactly that. */
/** The visit "new since" compares against: the previous sitting, not the previous reload. */
export function lastVisit(): string | null {
  const v = readJson<{ today?: string; previous?: string }>("visits", {});
  return v.previous ?? v.today ?? null;
}
/** Reloads within half an hour count as one sitting. */
export function markVisit() {
  const v = readJson<{ today?: string; previous?: string }>("visits", {});
  const now = Date.now();
  const last = v.today ? Date.parse(v.today) : 0;
  if (now - last > 30 * 60000) writeJson("visits", { previous: v.today, today: new Date(now).toISOString() });
  else writeJson("visits", { ...v, today: new Date(now).toISOString() });
}
