import type { Metadata } from "next";
import { AccueilAdmin } from "@/components/admin/accueil-admin";

export const metadata: Metadata = { title: "Back-office" };

export default function AdminPage() {
  return <AccueilAdmin />;
}
