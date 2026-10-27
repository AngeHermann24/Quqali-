import type { Metadata } from "next";
import { DossierPro } from "@/components/pro/dossier-pro";

export const metadata: Metadata = { title: "Dossier de candidature", robots: { index: false } };

export default function DossierPage() {
  return <DossierPro />;
}
