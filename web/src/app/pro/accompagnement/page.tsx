import type { Metadata } from "next";
import { AccompagnementPro } from "@/components/pro/accompagnement-pro";

export const metadata: Metadata = { title: "Accompagnement", robots: { index: false } };

export default function AccompagnementPage() {
  return <AccompagnementPro />;
}
