import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Process — how Josh Whitehead works with agents";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Process", title: "An agent in the loop, a person at the wheel.", footer: "josh.design/process · the loop, the artifacts, the numbers from this repo", size: 100 });
}
