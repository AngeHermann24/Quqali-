import type { Metadata } from "next";
import { ControlesPro } from "@/components/pro/controles-pro";

export const metadata: Metadata = { title: "Contrôles réguliers", robots: { index: false } };

export default function ControlesPage() {
  return <ControlesPro />;
}
