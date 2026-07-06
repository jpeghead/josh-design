import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0908",
          color: "#f4eee0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontStyle: "italic",
          fontFamily: "serif",
          border: "2px solid #e63946",
        }}
      >
        J
      </div>
    ),
    size
  );
}
