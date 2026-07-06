"use client";

import { useSettings } from "@/lib/settings-store";

/**
 * Five luxurious wallpapers anchored in the Rolex boutique / luxury watch
 * retail palette. Each is composed entirely with SVG + CSS — no imagery.
 *
 *  01 · Boutique  — deep Rolex emerald with the wavy boutique-wall texture
 *  02 · Daytona   — warm Daytona-cream backdrop with very soft gradient
 *  03 · Velvet    — deep black velvet (Ressence Type 3 staging)
 *  04 · Rose gold — warm rose-gold gradient field
 *  05 · Midnight  — darker emerald for the evening
 */

export function Wallpaper() {
  const { settings } = useSettings();
  const v = settings.wallpaper;
  switch (v) {
    case 1: return <Boutique />;
    case 2: return <Daytona />;
    case 3: return <Velvet />;
    case 4: return <RoseGold />;
    case 5: return <Midnight />;
    default: return <Boutique />;
  }
}

/* ── 01 · Boutique ─────────────────────────────────────────── */
function Boutique() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: "#0a3024" }}
    >
      {/* Soft overhead spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(255,235,180,0.10), transparent 60%)",
        }}
      />
      {/* Wave wall — the Rolex boutique signature */}
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
      >
        <defs>
          <linearGradient id="emerald-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a5240" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0a3024" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-hi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(216,194,140,0.18)" />
            <stop offset="50%" stopColor="rgba(216,194,140,0.06)" />
            <stop offset="100%" stopColor="rgba(216,194,140,0)" />
          </linearGradient>
        </defs>

        {/* Slight central glow */}
        <ellipse cx="800" cy="380" rx="900" ry="420" fill="url(#emerald-light)" opacity="0.35" />

        {/* Horizontal wave bands — each a smooth sine across the screen */}
        {Array.from({ length: 14 }).map((_, i) => {
          const yBase = 80 + i * 58;
          // Subtle vertical sine offset per wave gives them organic ripple
          const amp = 22 + (i % 3) * 6;
          const wavelength = 320 + (i % 4) * 40;
          const pts: string[] = [];
          for (let x = -50; x <= 1650; x += 8) {
            const y = yBase + Math.sin((x / wavelength) * Math.PI * 2 + i * 0.7) * amp;
            pts.push(`${x},${y}`);
          }
          return (
            <polyline
              key={i}
              points={pts.join(" ")}
              fill="none"
              stroke="#d8c28c"
              strokeOpacity={0.10 + (i % 2) * 0.04}
              strokeWidth="0.8"
            />
          );
        })}

        {/* A softer secondary wave layer */}
        {Array.from({ length: 14 }).map((_, i) => {
          const yBase = 110 + i * 58;
          const amp = 14 + (i % 3) * 4;
          const wavelength = 480 + (i % 4) * 60;
          const pts: string[] = [];
          for (let x = -50; x <= 1650; x += 8) {
            const y = yBase + Math.sin((x / wavelength) * Math.PI * 2 + i * 1.1 + 1.4) * amp;
            pts.push(`${x},${y}`);
          }
          return (
            <polyline
              key={`b-${i}`}
              points={pts.join(" ")}
              fill="none"
              stroke="#1a5240"
              strokeOpacity={0.45}
              strokeWidth="0.6"
            />
          );
        })}

        {/* Bottom emerald floor */}
        <rect y="780" width="100%" height="120" fill="url(#wave-hi)" />
      </svg>

      {/* Inner vignette to focus the eye */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,0,0,0) 50%, rgba(4,18,12,0.65) 100%)",
        }}
      />
    </div>
  );
}

/* ── 02 · Daytona — warm cream backdrop ─────────────────────── */
function Daytona() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: "#f0e6d5" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 35%, rgba(255,255,255,0.45), transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 80%, rgba(180,150,110,0.18), transparent 60%)",
        }}
      />
      {/* Outer warm tone vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(80,60,40,0.18) 100%)",
        }}
      />
    </div>
  );
}

/* ── 03 · Velvet — deep black pile ──────────────────────────── */
function Velvet() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: "#0a0a0b" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(216,194,140,0.05), transparent 70%)",
        }}
      />
      {/* Soft directional pile — diagonal stripe texture, very subtle */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 6px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}

/* ── 04 · Rose gold ─────────────────────────────────────────── */
function RoseGold() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: "#1f1410" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 35%, rgba(185,122,92,0.20), transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 85%, rgba(216,194,140,0.10), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

/* ── 05 · Midnight emerald ──────────────────────────────────── */
function Midnight() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background: "#04150e" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(26,82,64,0.5), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </div>
  );
}
