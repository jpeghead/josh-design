/**
 * Capability gate for the Archive canvas experience.
 *
 * Tiers:
 *  - "full"   — WebGL2, motion allowed, capable device → the cinematic walk
 *  - "static" — everything else → the server-rendered era timeline (untouched)
 *
 * WebGPU/TSL is the planned upgrade path on top of "full"; the fallback chain
 * stays the same either way.
 */
export type CanvasTier = "full" | "static";

export function detectTier(): CanvasTier {
  if (typeof window === "undefined") return "static";

  // Respect the user before the hardware.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  // Weak-device heuristics — default to the beautiful static site, never jank.
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return "static";
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return "static";

  // Renderer support.
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return "static";
  } catch {
    return "static";
  }

  return "full";
}
