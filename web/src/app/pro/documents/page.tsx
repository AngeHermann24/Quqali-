import type { Metadata } from "next";
import { DocumentsPro } from "@/components/pro/documents-pro";

export const metadata: Metadata = { title: "Documents", robots: { index: false } };

export default function DocumentsPage() {
  return <DocumentsPro />;
}
