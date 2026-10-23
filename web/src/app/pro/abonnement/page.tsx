import type { Metadata } from "next";
import { TableauAbonnement } from "@/components/paiement/tableau-abonnement";

export const metadata: Metadata = { title: "Abonnement et paiements", robots: { index: false } };

export default function AbonnementPage() {
  return <TableauAbonnement />;
}
