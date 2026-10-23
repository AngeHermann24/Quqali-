import type { Metadata } from "next";
import { PlusPro } from "@/components/pro/plus-pro";

export const metadata: Metadata = { title: "Plus", robots: { index: false } };

export default function PlusPage() {
  return <PlusPro />;
}
