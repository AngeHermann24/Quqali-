import type { Metadata } from "next";
import { headers } from "next/headers";
import { AWARDS } from "@/lib/data";
import { cataloguePublic } from "@/lib/db/catalogue";
import { SITE } from "@/lib/site";
import { espaceDe } from "@/lib/sous-domaines";
import { AccueilApp } from "@/components/app/accueil-app";
import { Vitrine } from "@/components/vitrine/vitrine";

export const metadata: Metadata = {
  title: `${SITE.name} — Choisissez en confiance`,
  description: SITE.description,
};

export default async function HomePage() {
  const hote = (await headers()).get("host");
  // Domaine nu de production → vitrine ; app.* / localhost / previews → application.
  if (espaceDe(hote) === "vitrine") return <Vitrine />;

  const etablissements = await cataloguePublic();
  const laureats = AWARDS.laureats
    .map(({ categorie, slug }) => ({ categorie, nom: etablissements.find((e) => e.slug === slug)?.nom ?? "", slug }))
    .filter((l) => l.nom);

  return <AccueilApp etablissements={etablissements} laureats={laureats} annee={AWARDS.annee} />;
}
