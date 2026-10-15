import type { Posting } from "./types";

/** "Design Engineer (Web & Brand)" in three regions is one role: strip region and remote suffixes for grouping. */
export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\((us|uk|usa|emea|apac|eu|europe|americas|canada|remote|hybrid|[a-z ]*remote)\)/g, "")
    .replace(/\s*[-–—,|·]\s*(us|uk|usa|emea|apac|eu|europe|north america|americas|canada|remote|hybrid|new york|san francisco|london|nyc|sf)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type Grouped = Posting & { variants: { id: string; location: string; score: number }[] };

/** Collapse same-company same-title postings into the best-scoring one, carrying the others as variants. */
export function dedupe(rows: Posting[]): Grouped[] {
  const map = new Map<string, Grouped>();
  for (const p of rows) {
    const key = `${p.company.toLowerCase()}|${titleKey(p.title)}`;
    const g = map.get(key);
    if (!g) map.set(key, { ...p, variants: [] });
    else if (p.score > g.score) map.set(key, { ...p, variants: [...g.variants, { id: g.id, location: g.location, score: g.score }] });
    else g.variants.push({ id: p.id, location: p.location, score: p.score });
  }
  return [...map.values()];
}
