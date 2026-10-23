import type { Metadata } from "next";
import { EspaceHeader } from "@/components/espace/ui";
import { CandidatureAccompagnement } from "@/components/espace/candidature-accompagnement";

export const metadata: Metadata = { title: "Demande d'accompagnement", robots: { index: false } };

export default function AccompagnementPage() {
  return (
    <>
      <EspaceHeader role="Espace établissement" titre="Demande d'accompagnement" sousTitre="Par nos équipes ou par un partenaire certifié, jusqu'au réaudit." />
      <CandidatureAccompagnement />
    </>
  );
}
