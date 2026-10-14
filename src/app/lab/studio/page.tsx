import type { Metadata } from "next";
import { LabFrame } from "@/components/lab/lab-frame";
import { StudioMount } from "@/components/lab/mounts";

export const metadata: Metadata = { title: "The studio — Lab", description: "One persistent 3D room conducted by scroll." };

export default function Page() {
  return (
    <LabFrame title="The studio">
      <StudioMount />
    </LabFrame>
  );
}
