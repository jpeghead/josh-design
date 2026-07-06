"use client";

/**
 * Luxury watch UI primitives — shared decorative components used across
 * every surface of Atelier to give it the intricacy of a Patek catalog
 * spread or a Grand Seiko dial. Each piece is small but composed so they
 * stack into substantial visual richness.
 */

/* ──────────────────────────────────────────────────────────── */
/* CornerOrnament — small concentric mark at a card corner       */
/* ──────────────────────────────────────────────────────────── */
export function CornerOrnament({
  pos = "tl",
  size = 14,
  tone = "gold",
}: {
  pos?: "tl" | "tr" | "bl" | "br";
  size?: number;
  tone?: "gold" | "steel" | "lume";
}) {
  const stroke =
    tone === "gold"
      ? "var(--color-safelight)"
      : tone === "lume"
      ? "var(--color-emulsion)"
      : "var(--color-bone-muted)";

  const positionClass = {
    tl: "top-1 left-1",
    tr: "top-1 right-1",
    bl: "bottom-1 left-1",
    br: "bottom-1 right-1",
  }[pos];

  // Mirror SVG so the angle always points outward
  const flipX = pos.includes("r") ? -1 : 1;
  const flipY = pos.includes("b") ? -1 : 1;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute ${positionClass}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 14 14" className="h-full w-full" style={{ transform: `scale(${flipX}, ${flipY})` }}>
        <path d="M0 0.5 L4 0.5 M0.5 0 L0.5 4" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.6" />
        <circle cx="2" cy="2" r="0.5" fill={stroke} fillOpacity="0.7" />
      </svg>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* CornerFrame — wraps a card with all four corner ornaments     */
/* ──────────────────────────────────────────────────────────── */
export function CornerFrame({
  size = 14,
  tone = "gold",
  inset = false,
}: {
  size?: number;
  tone?: "gold" | "steel" | "lume";
  inset?: boolean;
}) {
  const ins = inset ? "inset-2" : "";
  void ins;
  return (
    <>
      <CornerOrnament pos="tl" size={size} tone={tone} />
      <CornerOrnament pos="tr" size={size} tone={tone} />
      <CornerOrnament pos="bl" size={size} tone={tone} />
      <CornerOrnament pos="br" size={size} tone={tone} />
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Divider — bilateral engraved divider with center medallion    */
/* ──────────────────────────────────────────────────────────── */
export function Divider({
  left,
  right,
  glyph = "✦",
}: {
  left?: string;
  right?: string;
  glyph?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 py-3 font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
      {left && <span className="shrink-0">{left}</span>}
      <div className="flex flex-1 items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-bone-line to-bone-line" />
        <span className="text-safelight">{glyph}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-bone-line via-bone-line to-transparent" />
      </div>
      {right && <span className="shrink-0">{right}</span>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* EngravedRef — small engraved reference code stamp             */
/* ──────────────────────────────────────────────────────────── */
export function EngravedRef({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`font-mono text-[9px] uppercase leading-tight tracking-[0.32em] text-bone-muted ${className}`}
    >
      <span className="opacity-60">{label}</span>{" "}
      <span className="text-bone-dim">{value}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* SpecColumn — vertical engraved spec strip                      */
/* ──────────────────────────────────────────────────────────── */
export function SpecColumn({
  rows,
  align = "left",
}: {
  rows: { label: string; value: string }[];
  align?: "left" | "right";
}) {
  return (
    <dl className={`flex flex-col gap-3 ${align === "right" ? "text-right" : "text-left"}`}>
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-0.5">
          <dt className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone-muted">
            {r.label}
          </dt>
          <dd className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* AppliedIndex — small gradient-filled gold rectangle           */
/* ──────────────────────────────────────────────────────────── */
export function AppliedIndex({
  width = 2,
  height = 12,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{
        width,
        height,
        background:
          "linear-gradient(180deg, #f0e0b6 0%, #c8a76a 50%, #9c7d49 100%)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,245,220,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.5)",
      }}
      className={`inline-block ${className}`}
    />
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Medallion — circular case-back medallion with engraved ring  */
/* ──────────────────────────────────────────────────────────── */
export function Medallion({
  initials,
  ringText,
  refCode,
  status = "active",
  variant = "polished",
}: {
  initials: string;
  ringText: string;
  refCode: string;
  status?: "active" | "draft" | "archived";
  variant?: "polished" | "brushed" | "satin";
}) {
  const dotColor =
    status === "active"
      ? "var(--color-emulsion)"
      : status === "draft"
      ? "var(--color-sodium)"
      : "var(--color-bone-muted)";

  // Spread ring text around full circle
  const chars = ringText.split("");
  const angleStep = 360 / Math.max(chars.length, 1);

  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <radialGradient id={`med-dial-${refCode}`} cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="rgba(232,224,206,0.12)" />
            <stop offset="100%" stopColor="rgba(232,224,206,0.02)" />
          </radialGradient>
          <linearGradient id={`med-bezel-${refCode}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0e0b6" />
            <stop offset="50%" stopColor="#c8a76a" />
            <stop offset="100%" stopColor="#9c7d49" />
          </linearGradient>
          <linearGradient id={`med-steel-${refCode}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8c9cd" />
            <stop offset="50%" stopColor="#9a9b9e" />
            <stop offset="100%" stopColor="#6e6f72" />
          </linearGradient>
          <path
            id={`ring-path-${refCode}`}
            d="M 100 100 m -78 0 a 78 78 0 1 1 156 0 a 78 78 0 1 1 -156 0"
            fill="none"
          />
        </defs>

        {/* Outer bezel */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={variant === "polished" ? `url(#med-bezel-${refCode})` : `url(#med-steel-${refCode})`}
          strokeWidth="3"
        />
        {/* Inner hairline */}
        <circle cx="100" cy="100" r="86" fill="none" stroke="var(--color-bone-line)" strokeWidth="0.5" />

        {/* Engraved ring text path */}
        <text
          fill="var(--color-bone-muted)"
          fillOpacity="0.85"
          fontFamily="var(--font-mono), monospace"
          fontSize="6.6"
          letterSpacing="3.5"
        >
          <textPath href={`#ring-path-${refCode}`} startOffset="0%">
            {ringText.toUpperCase()}
          </textPath>
        </text>

        {/* Chapter ring tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i * 6 * Math.PI) / 180 - Math.PI / 2;
          const r1 = 72;
          const r2 = i % 5 === 0 ? 66 : 69;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * r1}
              y1={100 + Math.sin(a) * r1}
              x2={100 + Math.cos(a) * r2}
              y2={100 + Math.sin(a) * r2}
              stroke={i % 5 === 0 ? "var(--color-safelight)" : "var(--color-bone-muted)"}
              strokeOpacity={i % 5 === 0 ? "0.8" : "0.32"}
              strokeWidth={i % 5 === 0 ? "0.9" : "0.5"}
            />
          );
        })}

        {/* Dial */}
        <circle cx="100" cy="100" r="60" fill={`url(#med-dial-${refCode})`} />
        {/* Hour markers — 12 applied baton indices */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180 - Math.PI / 2;
          const mx = 100 + Math.cos(a) * 50;
          const my = 100 + Math.sin(a) * 50;
          return (
            <rect
              key={i}
              x={mx - 1.2}
              y={my - 6}
              width="2.4"
              height="12"
              fill={`url(#med-bezel-${refCode})`}
              transform={`rotate(${i * 30} ${mx} ${my})`}
            />
          );
        })}

        {/* Center: initials as engraved/applied */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill="var(--color-bone)"
          fontFamily="var(--font-display), serif"
          fontSize="38"
          letterSpacing="-1"
        >
          {initials}
        </text>

        {/* Status dot — top dial position */}
        <circle cx="100" cy="78" r="2" fill={dotColor} opacity="0.9" />

        {/* REF — bottom dial position */}
        <text
          x="100"
          y="128"
          textAnchor="middle"
          fill="var(--color-bone-muted)"
          fontFamily="var(--font-mono), monospace"
          fontSize="5.6"
          letterSpacing="2.5"
        >
          REF · {refCode}
        </text>
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* ChapterRing — concentric tick ring with caption around top   */
/* ──────────────────────────────────────────────────────────── */
export function ChapterRing({
  size = 120,
  caption,
  refCode,
}: {
  size?: number;
  caption?: string;
  refCode?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: size, height: size }}>
      <defs>
        <path
          id={`chap-top-${refCode}`}
          d={`M ${cx} ${cy} m -${r - 6} 0 a ${r - 6} ${r - 6} 0 1 1 ${(r - 6) * 2} 0`}
          fill="none"
        />
        <path
          id={`chap-bot-${refCode}`}
          d={`M ${cx} ${cy} m -${r - 6} 0 a ${r - 6} ${r - 6} 0 1 0 ${(r - 6) * 2} 0`}
          fill="none"
        />
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-bone-line)" strokeWidth="0.5" />
      {Array.from({ length: 60 }).map((_, i) => {
        const a = (i * 6 * Math.PI) / 180 - Math.PI / 2;
        const r1 = r - 2;
        const r2 = i % 5 === 0 ? r - 6 : r - 4;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke={i % 5 === 0 ? "var(--color-safelight)" : "var(--color-bone-muted)"}
            strokeOpacity={i % 5 === 0 ? "0.6" : "0.25"}
            strokeWidth={i % 5 === 0 ? "0.7" : "0.4"}
          />
        );
      })}
      {caption && (
        <text
          fill="var(--color-bone-muted)"
          fontFamily="var(--font-mono), monospace"
          fontSize={size * 0.06}
          letterSpacing="3"
        >
          <textPath href={`#chap-top-${refCode}`} startOffset="50%" textAnchor="middle">
            {caption.toUpperCase()}
          </textPath>
        </text>
      )}
      {refCode && (
        <text
          fill="var(--color-bone-muted)"
          fillOpacity="0.6"
          fontFamily="var(--font-mono), monospace"
          fontSize={size * 0.05}
          letterSpacing="3"
        >
          <textPath href={`#chap-bot-${refCode}`} startOffset="50%" textAnchor="middle">
            {refCode.toUpperCase()}
          </textPath>
        </text>
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* GuillochéBg — finely-engraved background pattern              */
/* ──────────────────────────────────────────────────────────── */
export function GuillochéBg({ seed = "guill" }: { seed?: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id={`gui-${seed}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q3 0 6 6 T12 6" fill="none" stroke="var(--color-safelight)" strokeOpacity="0.06" strokeWidth="0.5" />
          <path d="M0 6 Q3 12 6 6 T12 6" fill="none" stroke="var(--color-safelight)" strokeOpacity="0.04" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#gui-${seed})`} />
    </svg>
  );
}
