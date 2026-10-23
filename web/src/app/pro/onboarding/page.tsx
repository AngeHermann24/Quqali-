import type { Metadata } from "next";
import { OnboardingPro } from "@/components/pro/onboarding-pro";

export const metadata: Metadata = { title: "Bienvenue", robots: { index: false } };

export default function OnboardingProPage() {
  return <OnboardingPro />;
}
