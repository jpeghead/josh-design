"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the line experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const LineExperience = dynamic(
  () => import("../line/line-experience").then((m) => m.LineExperience),
  { ssr: false }
);

export function ArchiveMount() {
  return <LineExperience />;
}
