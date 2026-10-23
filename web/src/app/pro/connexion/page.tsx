import type { Metadata } from "next";
import { ConnexionPro } from "@/components/pro/connexion-pro";

export const metadata: Metadata = { title: "Connexion Pro", robots: { index: false } };

export default function ConnexionProPage() {
  return <ConnexionPro />;
}
