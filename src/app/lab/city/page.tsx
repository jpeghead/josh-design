import type { Metadata } from "next";
import { LabFrame } from "@/components/lab/lab-frame";
import { CityMount } from "@/components/lab/mounts";

export const metadata: Metadata = { title: "Whitehead City — Lab", description: "A GTA-style open world of my life, playable in the browser. Desktop, keyboard and mouse." };

export default function Page() {
  return (
    <LabFrame title="Whitehead City">
      <CityMount />
    </LabFrame>
  );
}
