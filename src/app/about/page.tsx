import type { Metadata } from "next";
import { WindowOpener } from "@/components/os/window-opener";

export const metadata: Metadata = {
  title: "About",
  description:
    "Josh Whitehead — Marine Corps combat photographer turned product designer. Now founder at Boneyard Collective. Fifteen years of designing things that ship.",
};

export default function AboutPage() {
  return <WindowOpener app="about" />;
}
