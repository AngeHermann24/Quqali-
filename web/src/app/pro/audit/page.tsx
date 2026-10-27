import type { Metadata } from "next";
import { AuditPro } from "@/components/pro/audit-pro";

export const metadata: Metadata = { title: "Audit sur place", robots: { index: false } };

export default function AuditPage() {
  return <AuditPro />;
}
