import type { Metadata } from "next";
import { BrochuresAdmin } from "@/components/admin/brochures-admin";

export const metadata: Metadata = { title: "Brochures PDF" };

export default function BrochuresPage() {
  return <BrochuresAdmin />;
}
