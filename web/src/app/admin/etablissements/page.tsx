import type { Metadata } from "next";
import { EtablissementsAdmin } from "@/components/admin/etablissements-admin";

export const metadata: Metadata = { title: "Établissements" };

export default function EtablissementsPage() {
  return <EtablissementsAdmin />;
}
