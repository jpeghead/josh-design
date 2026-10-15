import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Résumé — Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Résumé", title: "Product designer and AI builder. Fifteen years shipping; now designing and shipping AI products end to end.", footer: "josh.design/resume · also as JSON at /resume.json", size: 72 });
}
