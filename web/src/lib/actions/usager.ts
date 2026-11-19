"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { profilRequis, utilisateurCourant } from "@/lib/auth";
import {
  type AvisClient,
  type CompteClient,
  type PreuveVisite,
  type StatutAvis,
  codeVisiteDemo,
  creerAvis,
  telephoneNorm,
} from "@/lib/avis";
import type { Secteur } from "@/lib/data";
import {
  CONFIG_RESERVATION_DEFAUT,
  type ConfigReservation,
  type Demande,
  type Reservation,
  type StatutReservation,
  changerStatut,
  creerReservation,
  verifierDemande,
} from "@/lib/reservation";

type Resultat<T = undefined> = T extends undefined ? { ok: boolean; erreur?: string } : { ok: boolean; erreur?: string; valeur?: T };

/* ---------- Gestion publique (suspensions, retraits, niveaux forcés — visibles de tous) ---------- */

export async function gestionPublique(): Promise<Record<string, { suspendu?: string; badgeRetire?: string; niveau?: string }>> {
  const lignes = await prisma.etablissement.findMany({ select: { slug: true, suspenduLe: true, badgeRetireLe: true, niveauForce: true } });
  const out: Record<string, { suspendu?: string; badgeRetire?: string; niveau?: string }> = {};
  for (const l of lignes) {
    if (l.suspenduLe || l.badgeRetireLe || l.niveauForce)
      out[l.slug] = {
        suspendu: l.suspenduLe?.toISOString(),
        badgeRetire: l.badgeRetireLe?.toISOString(),
        niveau: l.niveauForce ?? undefined,
      };
  }
  return out;
}

/* ---------- Favoris ---------- */

export async function basculerFavori(slug: string, ajouter: boolean): Promise<Resultat> {
  const profil = await profilRequis();
  if (ajouter) {
    await prisma.favori.upsert({
      where: { compteId_etablissementId: { compteId: profil.id, etablissementId: slug } },
      update: {},
      create: { compteId: profil.id, etablissementId: slug },
    });
  } else {
    await prisma.favori.deleteMany({ where: { compteId: profil.id, etablissementId: slug } });
  }
  return { ok: true };
}

export async function listeFavoris(): Promise<string[]> {
  const profil = await utilisateurCourant();
  if (!profil) return [];
  const lignes = await prisma.favori.findMany({ where: { compteId: profil.id }, orderBy: { creeLe: "desc" } });
  return lignes.map((f) => f.etablissementId);
}

/* ---------- Avis ---------- */

const versAvisClient = (a: {
  id: string;
  etablissementId: string;
  compteId: string | null;
  auteur: string;
  date: Date;
  note: number;
  criteres: Prisma.JsonValue;
  personnel: Prisma.JsonValue;
  commentaire: string;
  preuve: Prisma.JsonValue;
  statut: string;
  motifRejet: string | null;
}): AvisClient => ({
  id: a.id,
  etablissementId: a.etablissementId,
  compteId: a.compteId ?? "",
  auteur: a.auteur,
  date: a.date.toISOString(),
  note: a.note,
  criteres: (a.criteres as Record<string, number> | null) ?? undefined,
  personnel: (a.personnel as Record<string, number> | null) ?? undefined,
  commentaire: a.commentaire,
  preuve: a.preuve as PreuveVisite,
  statut: a.statut as StatutAvis,
  motifRejet: a.motifRejet ?? undefined,
});

const versCompte = (p: { id: string; nom: string; telephone: string | null; email: string; creeLe: Date }): CompteClient => ({
  id: p.id,
  nom: p.nom,
  telephone: p.telephone ?? "",
  email: p.email,
  creeLe: p.creeLe.toISOString(),
});

/** Dépôt d'avis : règles de modération `creerAvis` exécutées côté serveur sur données réelles. */
export async function deposerAvis(entree: {
  etablissementSlug: string;
  note: number;
  criteres?: Record<string, number>;
  personnel?: Record<string, number>;
  commentaire: string;
  preuve: PreuveVisite;
}): Promise<Resultat<AvisClient>> {
  const profil = await profilRequis();
  const etab = await prisma.etablissement.findUnique({ where: { slug: entree.etablissementSlug }, include: { avis: true } });
  if (!etab) return { ok: false, erreur: "Établissement introuvable." };

  const [resas, codes, avisDuCompte] = await Promise.all([
    prisma.reservation.findMany({ where: { etablissementId: etab.id, compteId: profil.id, statut: { in: ["confirmee", "honoree"] } } }),
    prisma.visite.findMany({ where: { etablissementId: etab.id } }),
    prisma.avis.findMany({ where: { compteId: profil.id } }),
  ]);

  const contexte = {
    etablissementId: etab.id,
    avisExistants: etab.avis.map(versAvisClient),
    codesValides: [codeVisiteDemo(etab.id), ...codes.map((v) => v.code)],
    reservationsElegibles: resas.map((r) => r.id),
    avisDuCompte: avisDuCompte.map(versAvisClient),
  };
  const compte = versCompte(profil);
  const maintenant = new Date().toISOString();
  const nouveau = creerAvis(
    { compte, note: entree.note, criteres: entree.criteres, commentaire: entree.commentaire, preuve: entree.preuve },
    contexte,
    maintenant,
    etab.avis.length + 1,
    entree.personnel,
  );

  const cree = await prisma.avis.create({
    data: {
      etablissementId: etab.id,
      compteId: profil.id,
      auteur: nouveau.auteur,
      note: nouveau.note,
      criteres: (nouveau.criteres ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      personnel: (nouveau.personnel ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      commentaire: nouveau.commentaire,
      preuve: nouveau.preuve as unknown as Prisma.InputJsonValue,
      statut: nouveau.statut,
      motifRejet: nouveau.motifRejet ?? null,
    },
  });
  return { ok: true, valeur: versAvisClient(cree) };
}

/** Tous les avis du compte connecté (tous statuts confondus). */
export async function mesAvis(): Promise<AvisClient[]> {
  const profil = await profilRequis();
  const lignes = await prisma.avis.findMany({ where: { compteId: profil.id }, orderBy: { date: "desc" } });
  return lignes.map(versAvisClient);
}

/** Avis publics d'un établissement (+ en vérification du compte connecté pour affichage « en attente »). */
export async function avisEtablissement(slug: string): Promise<AvisClient[]> {
  const lignes = await prisma.avis.findMany({
    where: { etablissementId: slug, statut: { in: ["publie", "en_verification", "signale"] } },
    orderBy: { date: "desc" },
  });
  return lignes.map(versAvisClient);
}

/* ---------- Réservations ---------- */

const versReservation = (r: {
  id: string;
  reference: string;
  etablissementId: string;
  secteur: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string | null;
  commentaire: string | null;
  details: Prisma.JsonValue;
  statut: string;
  montant: number | null;
  motifRefus: string | null;
  historique: Prisma.JsonValue;
  creeLe: Date;
}): Reservation => ({
  ...(r.details as unknown as Demande),
  id: r.id,
  reference: r.reference,
  etablissementId: r.etablissementId,
  secteur: r.secteur as Secteur,
  client: { nom: r.clientNom, telephone: r.clientTelephone, email: r.clientEmail ?? undefined },
  commentaire: r.commentaire ?? undefined,
  creeLe: r.creeLe.toISOString(),
  statut: r.statut as StatutReservation,
  montant: r.montant ?? undefined,
  motifRefus: r.motifRefus ?? undefined,
  historique: r.historique as Reservation["historique"],
});

/** Création de réservation : `verifierDemande` + `creerReservation` côté serveur. */
export async function demanderReservation(entree: { etablissementSlug: string; secteur: Secteur; details: Demande }): Promise<Resultat<Reservation>> {
  const profil = await utilisateurCourant();
  const etab = await prisma.etablissement.findUnique({ where: { slug: entree.etablissementSlug } });
  if (!etab) return { ok: false, erreur: "Établissement introuvable." };

  const config = (etab.configReservation as ConfigReservation | null) ?? CONFIG_RESERVATION_DEFAUT;
  const existantes = (await prisma.reservation.findMany({ where: { etablissementId: etab.id } })).map(versReservation);
  const maintenant = new Date().toISOString();

  const erreur = verifierDemande(entree.secteur, config, entree.details, existantes, maintenant);
  if (erreur) return { ok: false, erreur };

  const cree = creerReservation(etab.id, entree.secteur, config, entree.details, existantes.length + 1, maintenant);
  const ligne = await prisma.reservation.create({
    data: {
      id: cree.id,
      reference: cree.reference,
      etablissementId: etab.id,
      compteId: profil?.id ?? null,
      secteur: entree.secteur,
      clientNom: entree.details.client.nom,
      clientTelephone: entree.details.client.telephone,
      clientEmail: entree.details.client.email ?? null,
      commentaire: entree.details.commentaire ?? null,
      details: entree.details as unknown as Prisma.InputJsonValue,
      statut: cree.statut,
      montant: cree.montant ?? null,
      historique: cree.historique as unknown as Prisma.InputJsonValue,
    },
  });
  return { ok: true, valeur: versReservation(ligne) };
}

/** Réservations du compte connecté (ou par téléphone normalisé pour les résas invité). */
export async function mesReservations(telephone?: string): Promise<Reservation[]> {
  const profil = await utilisateurCourant();
  const tel = telephoneNorm(telephone ?? profil?.telephone ?? "");
  const lignes = await prisma.reservation.findMany({
    where: profil ? { OR: [{ compteId: profil.id }, { clientTelephone: { contains: tel } }] } : { clientTelephone: { contains: tel } },
    orderBy: { creeLe: "desc" },
  });
  return lignes.filter((r) => !tel || telephoneNorm(r.clientTelephone) === tel).map(versReservation);
}

/** Toutes les réservations d'un établissement (usage pro/admin — l'appelant contrôle le rôle). */
export async function reservationsEtablissement(slug: string): Promise<Reservation[]> {
  const lignes = await prisma.reservation.findMany({ where: { etablissementId: slug }, orderBy: { creeLe: "desc" } });
  return lignes.map(versReservation);
}

/** Changement de statut (annulation usager, confirmation pro). Les transitions restent gouvernées par `changerStatut`. */
export async function changerStatutReservation(id: string, statut: StatutReservation, motif?: string): Promise<Resultat<Reservation>> {
  const ligne = await prisma.reservation.findUnique({ where: { id } });
  if (!ligne) return { ok: false, erreur: "Réservation introuvable." };
  try {
    const maj = changerStatut(versReservation(ligne), statut, new Date().toISOString(), motif);
    const sauvee = await prisma.reservation.update({
      where: { id },
      data: {
        statut: maj.statut,
        motifRefus: maj.motifRefus ?? null,
        historique: maj.historique as unknown as Prisma.InputJsonValue,
      },
    });
    return { ok: true, valeur: versReservation(sauvee) };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Transition impossible." };
  }
}

/* ---------- Demandes « Autre » (ménage, ateliers…) ---------- */

export async function deposerDemandeService(entree: {
  service: string;
  type: string;
  nom: string;
  telephone: string;
  quartier: string;
}): Promise<Resultat> {
  if (!entree.nom.trim() || !entree.telephone.trim()) return { ok: false, erreur: "Nom et téléphone requis." };
  const profil = await utilisateurCourant();
  await prisma.demandeService.create({
    data: {
      compteId: profil?.id ?? null,
      service: entree.service,
      type: entree.type,
      nom: entree.nom.trim(),
      telephone: entree.telephone.trim(),
      quartier: entree.quartier.trim(),
    },
  });
  return { ok: true };
}
