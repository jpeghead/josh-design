import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
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
