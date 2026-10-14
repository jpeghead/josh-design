"use client";

import dynamic from "next/dynamic";

const Loading = () => (
  <div className="flex min-h-dvh items-center justify-center text-sm text-fg-3">Loading…</div>
);

export const CityMount = dynamic(() => import("../game3d/game").then((m) => m.CityGame), { ssr: false, loading: Loading });
export const StudioMount = dynamic(() => import("../archive3d/story").then((m) => m.ArchiveWorld), { ssr: false, loading: Loading });
export const LineMount = dynamic(() => import("../line/line-experience").then((m) => m.LineExperience), { ssr: false, loading: Loading });
export const RoomMount = dynamic(() => import("../room/room-game").then((m) => m.RoomGame), { ssr: false, loading: Loading });
