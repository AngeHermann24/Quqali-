import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { espaceDe } from "@/lib/sous-domaines";

const ICôNES_USAGER: MetadataRoute.Manifest["icons"] = [
  { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const ICôNES_PRO: MetadataRoute.Manifest["icons"] = [
  { src: "/icon-pro.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "/icon-pro-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-pro-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icon-pro-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icon-pro-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

/** Manifest PWA/TWA par hôte : usager sur app.*, pro sur pro.*, vitrine non installable. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const hote = (await headers()).get("host");
  const espace = espaceDe(hote);

  if (espace === "pro") {
    return {
      id: "/",
      name: "Qualité+ Pro — Espace professionnel",
      short_name: "Qualité+ Pro",
      description: "Gérez votre établissement certifié : dossier, audits, abonnements, équipe.",
      lang: "fr",
      dir: "ltr",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0A1730",
      theme_color: "#1E3A8A",
      icons: ICôNES_PRO,
    };
  }

  if (espace === "vitrine") {
    // La vitrine n'est pas une app : display browser empêche l'installation.
    return {
      name: "Qualité+",
      short_name: "Qualité+",
      display: "browser",
      start_url: "/",
      icons: ICôNES_USAGER,
    };
  }

  return {
    id: "/",
    name: "Qualité+ — Établissements certifiés à Abidjan",
    short_name: "Qualité+",
    description: "Manger · Dormir · Se soigner. En toute confiance.",
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#1E3A8A",
    icons: ICôNES_USAGER,
  };
}
