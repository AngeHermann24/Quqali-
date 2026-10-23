import type { Metadata } from "next";
import { AbonnementsAdmin } from "@/components/admin/abonnements-admin";

export const metadata: Metadata = { title: "Abonnements & paiements" };

export default function AbonnementsPage() {
  return <AbonnementsAdmin />;
}
