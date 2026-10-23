import type { Metadata } from "next";
import { ModerationAvis } from "@/components/avis/moderation-avis";

export const metadata: Metadata = { title: "Modération des avis", robots: { index: false } };

export default function ModerationPage() {
  return <ModerationAvis />;
}
