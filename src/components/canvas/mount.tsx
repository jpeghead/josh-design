"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the room experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const RoomExperience = dynamic(
  () => import("../room/room-experience").then((m) => m.RoomExperience),
  { ssr: false }
);

export function ArchiveMount() {
  return <RoomExperience />;
}
