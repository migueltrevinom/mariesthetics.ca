import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg,#12241c,#0b100d)",
          color: "#c8a86b",
          fontSize: 40,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
