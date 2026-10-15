import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "About Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · About", title: "I'm still just the kid who won't stop making things.", footer: "josh.design/about · drew all day · Marine combat photographer · first designer, twice · Boneyard", size: 96 });
}
