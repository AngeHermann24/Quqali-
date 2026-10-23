import type { Metadata } from "next";
import { AidePro } from "@/components/pro/aide-pro";

export const metadata: Metadata = { title: "Aide", robots: { index: false } };

export default function AidePage() {
  return <AidePro />;
}
