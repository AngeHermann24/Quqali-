import type { Metadata } from "next";
import { AWARDS } from "@/lib/data";
import { cataloguePublic } from "@/lib/db/catalogue";
import { SITE } from "@/lib/site";
import { AccueilApp } from "@/components/app/accueil-app";

export const metadata: Metadata = {
  title: `${SITE.name} — Choisissez en confiance`,
  description: SITE.description,
};

export default async function HomePage() {
  const etablissements = await cataloguePublic();
  const laureats = AWARDS.laureats
    .map(({ categorie, slug }) => ({ categorie, nom: etablissements.find((e) => e.slug === slug)?.nom ?? "", slug }))
    .filter((l) => l.nom);

  return <AccueilApp etablissements={etablissements} laureats={laureats} annee={AWARDS.annee} />;
}
