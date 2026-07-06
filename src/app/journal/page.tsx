import type { Metadata } from "next";
import { WindowOpener } from "@/components/os/window-opener";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Field notes on design, AI, and the craft of shipping. From the working archive of Josh Whitehead.",
};

export default function JournalPage() {
  return <WindowOpener app="journal" />;
}
