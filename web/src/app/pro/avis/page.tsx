import type { Metadata } from "next";
import { AvisPro } from "@/components/pro/avis-pro";

export const metadata: Metadata = { title: "Avis reçus", robots: { index: false } };

export default function AvisProPage() {
  return <AvisPro />;
}
