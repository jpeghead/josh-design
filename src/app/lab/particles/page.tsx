import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { Hero } from "@/components/builds/hero";

export const metadata: Metadata = {
  title: "A life in particles — Builds",
  description: "Four photographs of a life sampled into 65,536 GPU particles. Scroll morphs them from the school photo to the Marine to the shipped product to the city built with an agent.",
};

export default function Page() {
  return (
    <>
      <Hero buildsHref="/lab" />
      <Container>
        <section className="py-16">
          <Link href="/lab" className="text-sm text-fg-2 transition-colors hover:text-fg">
            ‹ Builds
          </Link>
          <dl className="mt-8 grid gap-x-10 gap-y-5 border-t border-line pt-8 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-fg-3">What it is</dt>
              <dd className="mt-1">Four photographs sampled into a 256×256 point cloud. Each particle carries four positions and four colors; a vertex shader interpolates between stages with a per-point stagger and a flight arc, lifts by luminance, and pushes away from the pointer.</dd>
            </div>
            <div>
              <dt className="text-fg-3">What drives it</dt>
              <dd className="mt-1">Scroll. The section is 3.2 viewports tall with a sticky frame; your position becomes the morph. Reduced motion renders the final stage. No library effects: two shaders, one draw call.</dd>
            </div>
            <div>
              <dt className="text-fg-3">Why</dt>
              <dd className="mt-1">The story of the site in one object you can move through. It also samples from 512px copies so it&rsquo;s on screen in under a second.</dd>
            </div>
          </dl>
        </section>
      </Container>
    </>
  );
}
