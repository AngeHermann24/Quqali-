import "server-only";
import { cache } from "react";
import type { Prisma, Etablissement as LigneEtab, Avis as LigneAvis } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ETABLISSEMENTS as DEMO, type Etablissement, type Avis, type Secteur, type Filtres, noteMoyenne, scoreGlobal } from "@/lib/data";
import { normaliser } from "@/lib/format";
import type { GestionEtablissement } from "@/lib/admin";

type AvecAvis = Prisma.EtablissementGetPayload<{ include: { avis: true } }>;

/** true quand la base est configurée (env présentes). En l'absence : repli sur les données démo. */
export const baseActive = () => Boolean(process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL);

const versAvis = (a: LigneAvis): Avis => ({
  auteur: a.auteur,
  date: a.date.toISOString().slice(0, 10),
  note: a.note,
  commentaire: a.commentaire,
  reponse: a.reponse ?? undefined,
});

/** Reconstruit la forme `Etablissement` utilisée par toute l'app depuis une ligne DB. */
export function versEtablissement(l: AvecAvis): Etablissement {
  return {
    slug: l.slug,
    nom: l.nom,
    secteur: l.secteur as Secteur,
    sousType: l.sousType,
    ville: l.ville,
    commune: l.commune,
    quartier: l.quartier,
    adresse: l.adresse,
    coords: [l.lat ?? 0, l.lng ?? 0],
    pack: l.pack as Etablissement["pack"],
    aLaUne: l.aLaUne,
    scores: l.scores as Etablissement["scores"],
    dateAudit: l.dateAudit.toISOString().slice(0, 10),
    prochainControle: l.prochainControle.toISOString().slice(0, 10),
    description: l.description,
    services: l.services as string[],
    horaires: l.horaires as Etablissement["horaires"],
    telephone: l.telephone,
    whatsapp: l.whatsapp,
    prix: l.prix,
    avis: l.avis.filter((a) => a.statut === "publie").map(versAvis),
    awards: (l.awards as string[] | null) ?? [],
    visite3d: l.visite3d ?? undefined,
  };
}

/** État de gestion admin dérivé des colonnes de la ligne. */
export const gestionDe = (l: Pick<LigneEtab, "slug" | "suspenduLe" | "badgeRetireLe" | "niveauForce">): GestionEtablissement => ({
  suspendu: l.suspenduLe?.toISOString(),
  badgeRetire: l.badgeRetireLe?.toISOString(),
  niveau: (l.niveauForce as GestionEtablissement["niveau"]) ?? undefined,
});

const AVEC_AVIS = { avis: { orderBy: { date: "desc" } } } satisfies Prisma.EtablissementInclude;

/** Catalogue complet (non suspendu côté public — la suspension se gère côté consommateur via `gestionDe`). */
export const listeEtablissements = cache(async (): Promise<AvecAvis[]> =>
  baseActive() ? prisma.etablissement.findMany({ include: AVEC_AVIS }) : ([] as unknown as AvecAvis[]),
);

/** Un établissement par slug. */
export const etablissementParSlug = cache(async (slug: string) =>
  baseActive() ? prisma.etablissement.findUnique({ where: { slug }, include: AVEC_AVIS }) : null,
);

/** Liste au format `Etablissement` legacy — repli démo si pas de base. */
export async function cataloguePublic(): Promise<Etablissement[]> {
  if (!baseActive()) return DEMO;
  const lignes = await listeEtablissements();
  return lignes.map(versEtablissement);
}

/** Un établissement par slug — repli démo si pas de base. */
export async function fichePublique(slug: string): Promise<Etablissement | null> {
  if (!baseActive()) return DEMO.find((e) => e.slug === slug) ?? null;
  const ligne = await etablissementParSlug(slug);
  return ligne ? versEtablissement(ligne) : null;
}

/** Recherche équivalente à `rechercher()` mais sur la base. */
export async function rechercherDb(f: Filtres): Promise<Etablissement[]> {
  const tous = await cataloguePublic();
  const quartier = f.quartier && normaliser(f.quartier);
  const liste = tous.filter(
    (e) =>
      (!f.secteur || e.secteur === f.secteur) &&
      (!f.ville || e.ville === f.ville) &&
      (!quartier || normaliser(e.quartier).includes(quartier) || normaliser(e.commune).includes(quartier)) &&
      (!f.noteMin || scoreGlobal(e.scores) >= f.noteMin) &&
      (!f.reservation || e.pack === "premium"),
  );
  const tris = {
    note: (a: Etablissement, b: Etablissement) => scoreGlobal(b.scores) - scoreGlobal(a.scores),
    avis: (a: Etablissement, b: Etablissement) => noteMoyenne(b.avis) - noteMoyenne(a.avis) || b.avis.length - a.avis.length,
    nom: (a: Etablissement, b: Etablissement) => a.nom.localeCompare(b.nom, "fr"),
  } as const;
  return liste.sort(tris[f.tri]);
}
