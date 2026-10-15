"use client";

import dynamic from "next/dynamic";

/** Lazy mount so the index renders before Three.js arrives. */
const LifeParticles = dynamic(() => import("./life-particles").then((m) => m.LifeParticles), { ssr: false });

export function ParticlesMount() {
  return <LifeParticles />;
}
