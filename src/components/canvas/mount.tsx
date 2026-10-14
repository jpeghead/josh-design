"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the archive world. Lazy — the 3D never blocks first
 * paint; the server-rendered site renders first and remains the fallback
 * tier for assistive tech, search, reduced motion, and weak devices.
 */
const ArchiveWorld = dynamic(
  () => import("../archive3d/story").then((m) => m.ArchiveWorld),
  { ssr: false }
);

export function ArchiveMount() {
  return <ArchiveWorld />;
}
