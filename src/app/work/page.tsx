import type { Metadata } from "next";
import { WindowOpener } from "@/components/os/window-opener";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A working archive — selected projects from fifteen years of product design across Spin, Hush, Saucey, NationBuilder, VGV, and Boneyard Collective.",
};

export default function WorkPage() {
  return <WindowOpener app="work" />;
}
