import type { Metadata } from "next";
import { ResultatPro } from "@/components/pro/resultat-pro";

export const metadata: Metadata = { title: "Résultat de l'audit", robots: { index: false } };

export default function ResultatPage() {
  return <ResultatPro />;
}
