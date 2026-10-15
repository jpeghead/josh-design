"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/** Lazy mount so the index renders before Three.js arrives. */
const LifeParticles = dynamic(() => import("./life-particles").then((m) => m.LifeParticles), { ssr: false });

const QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * The field only shows beside the index on wide screens, so phones never
 * fetch Three.js or the sample images. Mounts when the query first matches.
 */
export function ParticlesMount() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const check = () => {
      if (mq.matches) setOn(true);
    };
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  return on ? <LifeParticles /> : null;
}
