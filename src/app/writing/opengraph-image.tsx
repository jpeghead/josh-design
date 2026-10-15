import { shareCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Writing — Josh Whitehead";

export default function OG() {
  return shareCard({ eyebrow: "Josh Whitehead · Writing", title: "Books, and the notes worth keeping.", footer: "josh.design/writing · Mastery is Dead · build logs and essays", size: 104 });
}
