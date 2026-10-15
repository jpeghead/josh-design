import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

/** One share card for every page: eyebrow, a serif title, a footer line. Fonts are the site's own (OFL, src/app/fonts). */
export async function shareCard({ eyebrow, title, footer, size = 92 }: { eyebrow: string; title: string; footer: string; size?: number }) {
  const dir = join(process.cwd(), "src/app/fonts");
  const [serif, sans] = await Promise.all([readFile(join(dir, "InstrumentSerif-Regular.ttf")), readFile(join(dir, "Geist-Regular.ttf"))]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", color: "#f5f5f3", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, fontFamily: "Instrument Serif" }}>
        <div style={{ fontSize: 26, color: "#a3a3a0", fontFamily: "Geist" }}>{eyebrow}</div>
        <div style={{ fontSize: size, lineHeight: 1.0, marginTop: 20, letterSpacing: -1.5, maxWidth: 1040, display: "flex" }}>{title}</div>
        <div style={{ fontSize: 24, color: "#a3a3a0", marginTop: 34, fontFamily: "Geist" }}>{footer}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 400 },
      ],
    }
  );
}
