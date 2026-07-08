"use client";

import dynamic from "next/dynamic";

/**
 * Client mount for the room experience. Lazy — the story engine never
 * blocks first paint; the server-rendered content layer renders first and
 * remains the fallback tier.
 */
const CityGame = dynamic(
  () => import("../game3d/game").then((m) => m.CityGame),
  { ssr: false }
);

export function ArchiveMount() {
  return <CityGame />;
}
