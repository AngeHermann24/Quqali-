import type { Metadata } from "next";
import { StatistiquesAdmin } from "@/components/admin/statistiques-admin";

export const metadata: Metadata = { title: "Statistiques" };

export default function StatistiquesPage() {
  return <StatistiquesAdmin />;
}
