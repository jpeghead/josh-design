import type { Metadata } from "next";
import { WindowOpener } from "@/components/os/window-opener";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Josh Whitehead — design partnerships, advisory, and the occasional product role.",
};

export default function ContactPage() {
  return <WindowOpener app="contact" />;
}
