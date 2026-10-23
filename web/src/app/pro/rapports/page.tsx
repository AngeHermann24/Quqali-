import type { Metadata } from "next";
import { RapportsMensuels } from "@/components/rapports/rapports-mensuels";

export const metadata: Metadata = { title: "Rapport mensuel IA", robots: { index: false } };

export default function RapportsPage() {
  return <RapportsMensuels />;
}
