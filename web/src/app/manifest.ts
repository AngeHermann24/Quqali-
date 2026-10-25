import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qualité+ — Établissements certifiés à Abidjan",
    short_name: "Qualité+",
    description: "Manger · Dormir · Se soigner. En toute confiance.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E3A8A",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
