import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Josh Whitehead — designer who builds AI products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card, set in the site's own faces (Instrument Serif and Geist, both OFL; files and licenses in src/app/fonts). */
export default async function OG() {
  const dir = join(process.cwd(), "src/app/fonts");
  const [serif, sans] = await Promise.all([readFile(join(dir, "InstrumentSerif-Regular.ttf")), readFile(join(dir, "Geist-Regular.ttf"))]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", color: "#f5f5f3", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, fontFamily: "Instrument Serif" }}>
        <div style={{ fontSize: 26, color: "#a3a3a0", fontFamily: "Geist" }}>Josh Whitehead · Los Angeles</div>
        <div style={{ fontSize: 104, lineHeight: 0.98, marginTop: 20, letterSpacing: -2, maxWidth: 1040 }}>Designer who builds AI products end to end, with agents in the loop.</div>
        <div style={{ fontSize: 24, color: "#a3a3a0", marginTop: 34, fontFamily: "Geist" }}>josh.design · builds you can run · a model in your browser · fifteen years of product</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 400 },
      ],
    }
  );
}
