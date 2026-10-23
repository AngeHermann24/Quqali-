import type { Metadata } from "next";
import { EspaceHeader } from "@/components/espace/ui";
import { InscriptionEtablissement } from "@/components/espace/inscription-etablissement";

export const metadata: Metadata = { title: "Inscription établissement", robots: { index: false } };

export default function InscriptionEtablissementPage() {
  return (
    <>
      <EspaceHeader role="Espace établissement" titre="Créer mon dossier" sousTitre="4 étapes : établissement, localisation, documents, responsable." />
      <InscriptionEtablissement />
    </>
  );
}
