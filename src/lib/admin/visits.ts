import { readJson, writeJson } from "./store";

/** When Josh last opened Today, so "new since you looked" means exactly that. */
export function lastVisit(): string | null {
  return readJson<{ today?: string }>("visits", {}).today ?? null;
}
export function markVisit() {
  const v = readJson<{ today?: string }>("visits", {});
  writeJson("visits", { ...v, today: new Date().toISOString() });
}
