import type { Metadata } from "next";
import { ParcoursPro } from "@/components/pro/parcours-pro";

export const metadata: Metadata = { title: "Mon parcours", robots: { index: false } };

export default function ParcoursPage() {
  return <ParcoursPro />;
}
