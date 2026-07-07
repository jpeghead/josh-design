/**
 * Writing — the two books plus a tightly triaged set of essays.
 *
 * PORT: only essays that sound like me. "Do I still care about this?" is the
 * voice of the whole site. PARKED: the generic 2024 AI-listicle posts are kept
 * in the archive but never surfaced — they undercut the voice.
 */
import { portedEssays } from "./writing.generated";
import { books } from "./books";

export { portedEssays, books };

/** Kept in the Framer archive, deliberately not surfaced. */
export const parkedEssaySlugs = [
  "ai-driven-design-techniques",
  "the-rise-of-no-code-tools-empowering-designers-or-diluting-skill",
  "how-to-leverage-ai-for-predictive-design",
  "the-ethics-of-ai-in-design-balancing-innovation-and-responsibility",
  "the-future-of-workspaces-from-flat-screens-to-immersive-xr",
  "how-can-designers-prepare-for-the-future",
  "designing-for-accessibility-more-than-just-a-checklist",
];

export function essayBySlug(slug: string) {
  return portedEssays.find((e) => e.slug === slug) ?? null;
}
