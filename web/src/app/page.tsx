import type { Metadata } from "next";
import { AWARDS, ETABLISSEMENTS, getEtablissement } from "@/lib/data";
import { SITE } from "@/lib/site";
import { AccueilApp } from "@/components/app/accueil-app";

export const metadata: Metadata = {
  title: `${SITE.name} — Choisissez en confiance`,
  description: SITE.description,
};

export default function HomePage() {
  const laureats = AWARDS.laureats
    .map(({ categorie, slug }) => ({ categorie, nom: getEtablissement(slug)?.nom ?? "", slug }))
    .filter((l) => l.nom);

  return <AccueilApp etablissements={ETABLISSEMENTS} laureats={laureats} annee={AWARDS.annee} />;
}
