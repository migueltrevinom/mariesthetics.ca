import { ImageResponse } from "next/og";
import { business } from "@/lib/seo";

export const alt = `${business.name} — Edmonton esthetics studio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse 70% 60% at 15% 0%, #1f4d3a 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 95% 100%, rgba(200,168,107,0.25) 0%, transparent 55%), linear-gradient(160deg,#0f1712,#0b100d)",
          color: "#f3efe6",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#c8a86b",
          }}
        >
          Edmonton, Alberta
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, lineHeight: 1 }}>{business.name}</div>
          <div
            style={{
              fontSize: 40,
              marginTop: 24,
              color: "rgba(243,239,230,0.8)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {business.tagline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#c8a86b",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Facials · Lash Lifts · Brows · Dermaplaning
        </div>
      </div>
    ),
    { ...size },
  );
}
