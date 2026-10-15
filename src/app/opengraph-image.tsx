import { ImageResponse } from "next/og";

export const alt = "Josh Whitehead — designer who builds AI products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", color: "#f5f5f3", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 26, color: "#a3a3a0", fontFamily: "Helvetica, Arial, sans-serif" }}>Josh Whitehead · Los Angeles</div>
        <div style={{ fontSize: 84, lineHeight: 1.02, marginTop: 18, letterSpacing: -2, maxWidth: 1000 }}>Designer who builds. Agents in the loop, a person at the wheel.</div>
        <div style={{ fontSize: 24, color: "#a3a3a0", marginTop: 28, fontFamily: "Helvetica, Arial, sans-serif" }}>josh.design · builds you can run · a model in your browser · fifteen years of product</div>
      </div>
    ),
    size
  );
}
