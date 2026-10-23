import type { Metadata } from "next";
import { AgentsAdmin } from "@/components/admin/agents-admin";

export const metadata: Metadata = { title: "Agents & affectations" };

export default function AgentsPage() {
  return <AgentsAdmin />;
}
