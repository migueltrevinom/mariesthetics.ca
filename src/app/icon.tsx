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
          background: "linear-gradient(145deg, #19241e, #0b110e)",
          borderRadius: "18px",
          border: "2px solid rgba(200, 168, 107, 0.45)",
          padding: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="50"
          height="50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Custom Mari Esthetics Luxury Monogram M */}
          <path
            d="M 16 22 C 22 22 28 27 32 37 L 36 71 L 28 71 L 28 75 L 45 75 L 45 71 L 37 71 L 37 40 L 51 63 L 55 63 L 69 38 L 69 62 C 69 68 73 73 81 74 C 83 74 85 73 86 72 C 85 71 82 71 80 71 C 75 71 72 67 72 60 L 72 36 L 77 36 L 77 32 L 64 32 L 64 36 L 68 36 L 53 60 L 38 33 L 28 33 C 24 26 20 22 16 22 Z"
            fill="#c8a86b"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
