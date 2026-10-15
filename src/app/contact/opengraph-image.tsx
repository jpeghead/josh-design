import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Contact Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Contact", title: "Tell me what you're making.", footer: "josh@josh.design · josh.design/contact", size: 104 });
}
