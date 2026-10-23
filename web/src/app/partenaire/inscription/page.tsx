import type { Metadata } from "next";
import { EspaceHeader } from "@/components/espace/ui";
import { InscriptionPartenaire } from "@/components/espace/inscription-partenaire";

export const metadata: Metadata = { title: "Devenir accompagnateur", robots: { index: false } };

export default function InscriptionPartenairePage() {
  return (
    <>
      <EspaceHeader role="Espace accompagnateur partenaire" titre="Candidature accompagnateur" sousTitre="Profil vérifié, entretien et charte déontologique avant validation." />
      <InscriptionPartenaire />
    </>
  );
}
