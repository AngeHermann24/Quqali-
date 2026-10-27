import type { Metadata } from "next";
import { AbonnementPro } from "@/components/pro/abonnement-pro";

export const metadata: Metadata = { title: "Abonnement", robots: { index: false } };

export default function AbonnementPage() {
  return <AbonnementPro />;
}
