"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the chapters experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const ChaptersExperience = dynamic(
  () => import("../chapters/engine").then((m) => m.ChaptersExperience),
  { ssr: false }
);

export function ArchiveMount() {
  return <ChaptersExperience />;
}
