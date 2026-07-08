"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the room experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const RoomGame = dynamic(
  () => import("../room/room-game").then((m) => m.RoomGame),
  { ssr: false }
);

export function ArchiveMount() {
  return <RoomGame />;
}
