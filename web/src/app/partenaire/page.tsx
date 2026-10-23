import type { Metadata } from "next";
import { DashboardPartenaire } from "@/components/espace/dashboard-partenaire";

export const metadata: Metadata = { title: "Espace accompagnateur", robots: { index: false } };

export default function EspacePartenairePage() {
  return <DashboardPartenaire />;
}
