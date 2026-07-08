"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the room experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const StaticRoomExperience = dynamic(
  () => import("../room/static-room-experience").then((m) => m.StaticRoomExperience),
  { ssr: false }
);

export function ArchiveMount() {
  return <StaticRoomExperience />;
}
