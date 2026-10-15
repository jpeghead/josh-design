export type Source = { label: string; href: string };

/** Longest labels first, so "build log" wins over "builds". */
export function orderSources(list: Source[]): Source[] {
  return [...list].sort((a, b) => b.label.length - a.label.length);
}

/** "(Spin case study)" → the Spin page; "(About)" → /about; anything unknown → null. */
export function resolveCitation(text: string, list: Source[]): Source | null {
  const t = text
    .toLowerCase()
    .replace(/\b(case study|page|section|entry|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  for (const s of list) if (t === s.label || t.includes(s.label)) return s;
  return null;
}
