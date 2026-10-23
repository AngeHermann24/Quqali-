import type { Metadata } from "next";
import { EspaceHeader } from "@/components/espace/ui";
import { ConfigTarifsForm } from "@/components/paiement/config-tarifs";

export const metadata: Metadata = { title: "Administration · Tarifs", robots: { index: false } };

export default function AdminTarifsPage() {
  return (
    <>
      <EspaceHeader role="Espace administrateur" titre="Tarifs et règles de paiement" sousTitre="Prototype : en production, cette page sera réservée aux administrateurs connectés." />
      <ConfigTarifsForm />
    </>
  );
}
