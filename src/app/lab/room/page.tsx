import type { Metadata } from "next";
import { LabFrame } from "@/components/lab/lab-frame";
import { RoomMount } from "@/components/lab/mounts";

export const metadata: Metadata = { title: "The room — Lab", description: "A life as one side-scrolling house. Arrow keys to walk, E to interact." };

export default function Page() {
  return (
    <LabFrame title="The room">
      <RoomMount />
    </LabFrame>
  );
}
