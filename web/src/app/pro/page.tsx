import type { Metadata } from "next";
import { DashboardEtablissement } from "@/components/espace/dashboard-etablissement";

export const metadata: Metadata = { title: "Espace établissement", robots: { index: false } };

export default function EspaceEtablissementPage() {
  return <DashboardEtablissement />;
}
