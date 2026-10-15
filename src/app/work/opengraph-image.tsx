import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Work — Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Work", title: "The foundation: fifteen years of product design.", footer: "josh.design/work · Spin · Hush · Very Good Ventures · Saucey · NationBuilder", size: 100 });
}
