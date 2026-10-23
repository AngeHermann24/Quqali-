import type { Metadata } from "next";
import { ProfilPro } from "@/components/pro/profil-pro";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default function ProfilProPage() {
  return <ProfilPro />;
}
