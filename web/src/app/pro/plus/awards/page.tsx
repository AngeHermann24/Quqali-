import type { Metadata } from "next";
import { AwardsPro } from "@/components/pro/awards-pro";

export const metadata: Metadata = { title: "Awards", robots: { index: false } };

export default function AwardsProPage() {
  return <AwardsPro />;
}
