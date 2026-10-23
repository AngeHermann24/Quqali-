import type { Metadata } from "next";
import { FichePro } from "@/components/pro/fiche-pro";

export const metadata: Metadata = { title: "Ma fiche", robots: { index: false } };

export default function FicheProPage() {
  return <FichePro />;
}
