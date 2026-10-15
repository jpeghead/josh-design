import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Build log — Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Build log", title: "What changed, as it changed.", footer: "josh.design/log · every commit to this site, live from GitHub", size: 104 });
}
