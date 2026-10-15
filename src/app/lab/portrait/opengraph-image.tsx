import { shareCard, OG_SIZE } from "@/lib/og";
import { lab } from "@/content/lab";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A build by Josh Whitehead";

export default function OG() {
  const l = lab.find((x) => x.slug === "portrait");
  return shareCard({
    eyebrow: ["Josh Whitehead · Builds", l?.kind, l?.when].filter(Boolean).join(" · "),
    title: l ? `${l.title}. ${l.blurb.split(". ")[0]}.` : "Builds",
    footer: "josh.design/lab · runs in your browser",
    size: 64,
  });
}
