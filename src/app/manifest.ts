import type { MetadataRoute } from "next";
import { business } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${business.name} · Edmonton Esthetics`,
    short_name: business.name,
    description: business.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b100d",
    theme_color: "#0b100d",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
