import { shareCard, OG_SIZE } from "@/lib/og";

export const alt = "Josh Whitehead — designer who builds AI products";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OG() {
  return shareCard({
    eyebrow: "Josh Whitehead · Los Angeles",
    title: "Designer who builds AI products end to end, with agents in the loop.",
    footer: "josh.design · builds you can run · a model in your browser · fifteen years of product",
    size: 104,
  });
}
