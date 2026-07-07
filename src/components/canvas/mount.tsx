"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the Archive experience. Loaded lazily so the canvas never
 * blocks first paint or the server-rendered content layer — which renders
 * first, always, and remains the fallback tier.
 */
const ArchiveExperience = dynamic(
  () => import("./archive-experience").then((m) => m.ArchiveExperience),
  { ssr: false }
);

export function ArchiveMount() {
  return <ArchiveExperience />;
}
