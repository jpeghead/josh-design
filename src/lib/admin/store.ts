import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { join } from "node:path";

/** One JSON file per collection under data/admin/. Writes are atomic (write temp, rename). */
export const DATA_DIR = join(process.cwd(), "data", "admin");

export function readJson<T>(name: string, fallback: T): T {
  const p = join(DATA_DIR, `${name}.json`);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(name: string, value: T): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const p = join(DATA_DIR, `${name}.json`);
  const tmp = `${p}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2));
  renameSync(tmp, p);
}

export function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Copy every JSON file in data/admin into backups/YYYY-MM-DD (once a day), keeping the last seven days. */
export function snapshot() {
  const day = new Date().toISOString().slice(0, 10);
  const root = join(DATA_DIR, "backups");
  const dir = join(root, day);
  if (existsSync(dir)) return;
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(DATA_DIR)) if (f.endsWith(".json")) copyFileSync(join(DATA_DIR, f), join(dir, f));
  const days = readdirSync(root).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  for (const old of days.slice(0, Math.max(0, days.length - 7))) rmSync(join(root, old), { recursive: true, force: true });
}
