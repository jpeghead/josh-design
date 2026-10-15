import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Products — Josh Whitehead at Boneyard";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Boneyard", title: "The things I'm building.", footer: "josh.design/products · OLO · Weaver · StoryMode · SignalScan", size: 104 });
}
