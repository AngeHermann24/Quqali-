import type { Metadata } from "next";
import { FormationsPro } from "@/components/pro/formations-pro";

export const metadata: Metadata = { title: "Formations", robots: { index: false } };

export default function FormationsPage() {
  return <FormationsPro />;
}
