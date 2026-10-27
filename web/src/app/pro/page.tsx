import type { Metadata } from "next";
import { TableauBordPro } from "@/components/pro/tableau-bord-pro";

export const metadata: Metadata = { title: "Tableau de bord", robots: { index: false } };

export default function TableauBordPage() {
  return <TableauBordPro />;
}
