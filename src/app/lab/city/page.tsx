import type { Metadata } from "next";
import { LabFrame } from "@/components/lab/lab-frame";
import { CityMount } from "@/components/lab/mounts";
import { DesktopOnly } from "@/components/lab/desktop-only";

export const metadata: Metadata = { title: "Whitehead City — Builds", description: "A GTA-style open world of my life, playable in the browser. Desktop, keyboard and mouse." };

export default function Page() {
  return (
    <LabFrame title="Whitehead City">
      <DesktopOnly
        title="Whitehead City"
        poster="/img/lab/city.jpg"
        blurb="A GTA-style open world of my life: a house, a city, ten missions, driving and a rifle range. It runs in the browser on a desktop with WebGL2. Open this page on a computer and it starts at the desk."
      >
        <CityMount />
      </DesktopOnly>
    </LabFrame>
  );
}
