import type { Metadata } from "next";
import { HubPremium } from "@/components/reservation/hub-premium";

export const metadata: Metadata = { title: "Fonctions Premium", robots: { index: false } };

export default function PremiumPage() {
  return <HubPremium />;
}
