import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Builds — things Josh Whitehead built with AI, that you can run";

export default function OG() {
  return shareCard({
    eyebrow: "Josh Whitehead · Builds",
    title: "Things I built with AI, that you can run.",
    footer: "josh.design/lab · a model in your browser · agent interfaces · a playable city · live Claude",
    size: 100,
  });
}
