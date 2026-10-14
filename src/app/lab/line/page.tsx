import type { Metadata } from "next";
import { LabFrame } from "@/components/lab/lab-frame";
import { LineMount } from "@/components/lab/mounts";

export const metadata: Metadata = { title: "The line — Builds", description: "One unbroken drawing, scrubbed by scroll." };

export default function Page() {
  return (
    <LabFrame title="The line">
      <LineMount />
    </LabFrame>
  );
}
