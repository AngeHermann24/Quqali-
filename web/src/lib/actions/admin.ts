"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { roleRequis } from "@/lib/auth";
import type { NiveauQualite, Scores } from "@/lib/scores";
import { type CandidatPartenaire, demarrerAudit, enregistrerResultatAudit, refuserDossier } from "@/lib/admin";
import type { Dossier, StatutDossier } from "@/lib/espace";
import type { ConfigTarifs } from "@/lib/abonnement";

type Resultat = { ok: boolean; erreur?: string };

/* ---------- Gestion des établissements (ex-CLES.gestion → colonnes Etablissement) ---------- */

export async function suspendreEtablissement(slug: string, suspendre: boolean): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.etablissement.update({
    where: { slug },
    data: { suspenduLe: suspendre ? new Date() : null },
  });
  return { ok: true };
}

export async function basculerBadge(slug: string, retirer: boolean): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.etablissement.update({
    where: { slug },
    data: { badgeRetireLe: retirer ? new Date() : null },
  });
  return { ok: true };
}

export async function forcerNiveauEtablissement(slug: string, niveau: NiveauQualite | null): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.etablissement.update({ where: { slug }, data: { niveauForce: niveau } });
  return { ok: true };
}

/* ---------- Candidatures (dossiers admin) ---------- */

const versDossier = (d: {
  id: string;
  statut: string;
  historique: Prisma.JsonValue;
  agentAuditId: string | null;
  audit: Prisma.JsonValue;
}): Pick<Dossier, "id" | "statut" | "historique" | "agentAuditId" | "audit"> => ({
  id: d.id,
  statut: d.statut as StatutDossier,
  historique: d.historique as Dossier["historique"],
  agentAuditId: d.agentAuditId ?? undefined,
  audit: (d.audit as Dossier["audit"]) ?? undefined,
});

export async function demarrerAuditDossier(dossierId: string, agentId: string): Promise<Resultat> {
  await roleRequis("admin");
  const d = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  try {
    const maj = demarrerAudit(versDossier(d), agentId, new Date().toISOString());
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { statut: maj.statut, agentAuditId: agentId, historique: maj.historique as unknown as Prisma.InputJsonValue },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Transition impossible." };
  }
}

export async function enregistrerResultat(dossierId: string, scores: Scores): Promise<Resultat> {
  await roleRequis("admin");
  const d = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  try {
    const maj = enregistrerResultatAudit(versDossier(d), scores, new Date().toISOString());
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        statut: maj.statut,
        audit: maj.audit as unknown as Prisma.InputJsonValue,
        historique: maj.historique as unknown as Prisma.InputJsonValue,
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Transition impossible." };
  }
}

export async function refuserCandidature(dossierId: string): Promise<Resultat> {
  await roleRequis("admin");
  const d = await prisma.dossier.findUnique({ where: { id: dossierId } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  try {
    const maj = refuserDossier(versDossier(d), new Date().toISOString());
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { statut: maj.statut, historique: maj.historique as unknown as Prisma.InputJsonValue },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Transition impossible." };
  }
}

/* ---------- Candidatures partenaires ---------- */

export async function transitionPartenaireAdmin(id: string, statut: string): Promise<Resultat> {
  await roleRequis("admin");
  const p = await prisma.dossierPartenaire.findUnique({ where: { id } });
  if (!p) return { ok: false, erreur: "Candidature introuvable." };
  const historique = [...(p.historique as { statut: string; date: string }[]), { statut, date: new Date().toISOString() }];
  await prisma.dossierPartenaire.update({ where: { id }, data: { statut, historique: historique as unknown as Prisma.InputJsonValue } });
  return { ok: true };
}

/* ---------- Affectations d'audits (ex-CLES.affectations → AuditPlanifie.agentId) ---------- */

export async function affecterAgent(auditId: string, agentId: string): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.auditPlanifie.update({ where: { id: auditId }, data: { agentId } });
  return { ok: true };
}

/* ---------- Tarifs ---------- */

export async function majTarifs(config: ConfigTarifs): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.config.upsert({
    where: { cle: "tarifs" },
    update: { valeur: config as unknown as Prisma.InputJsonValue },
    create: { cle: "tarifs", valeur: config as unknown as Prisma.InputJsonValue },
  });
  return { ok: true };
}

/* ---------- Modération des avis ---------- */

export async function modererAvisAction(avisId: string, statut: StatutAvisAdmin, motif?: string): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.avis.update({ where: { id: avisId }, data: { statut, motifRejet: motif ?? null } });
  return { ok: true };
}

export type StatutAvisAdmin = "publie" | "en_verification" | "rejete" | "signale";

/* ---------- Demandes « Autre » ---------- */

export async function majDemandeService(id: string, statut: string): Promise<Resultat> {
  await roleRequis("admin");
  await prisma.demandeService.update({ where: { id }, data: { statut } });
  return { ok: true };
}

/* ---------- Lectures admin ---------- */

type DossierComplet = Prisma.DossierGetPayload<{ include: { documents: true; accompagnement: { include: { actions: true } }; abonnement: true; transactions: true; reponsesAvis: true } }>;

const versDossierComplet = (d: DossierComplet): Dossier => ({
  id: d.id,
  nom: d.nom,
  secteur: d.secteur as Dossier["secteur"],
  sousType: d.sousType,
  description: d.description,
  ville: d.ville,
  commune: d.commune,
  quartier: d.quartier,
  adresse: d.adresse,
  coords: d.lat != null && d.lng != null ? [d.lat, d.lng] : undefined,
  responsable: d.responsable as Dossier["responsable"],
  horaires: (d.horaires as string | null) ?? undefined,
  capacites: (d.capacites as Dossier["capacites"]) ?? undefined,
  prepaAudit: (d.prepaAudit as Record<string, boolean> | null) ?? undefined,
  documents: d.documents.map((doc) => ({ type: doc.type, nom: doc.nom })),
  parcours: d.parcours as Dossier["parcours"],
  statut: d.statut as StatutDossier,
  historique: d.historique as Dossier["historique"],
  agentAuditId: d.agentAuditId ?? undefined,
  creneauAudit: d.creneauAudit?.toISOString(),
  audit: (d.audit as Dossier["audit"]) ?? undefined,
  abonnement: d.abonnement ? ({ ...d.abonnement, debut: d.abonnement.debut.toISOString(), fin: d.abonnement.fin.toISOString() } as unknown as Dossier["abonnement"]) : undefined,
  transactions: d.transactions.map((t) => ({ ...t, date: t.date.toISOString(), lignes: t.lignes as never }) as unknown as Dossier["transactions"] extends (infer U)[] | undefined ? U : never),
  visite3d: d.visite3d ?? undefined,
  services: (d.services as string[] | null) ?? undefined,
  modifications: (d.modifications as Dossier["modifications"]) ?? undefined,
  reponsesAvis: Object.fromEntries(d.reponsesAvis.map((r) => [r.avisId, r.texte])),
  accompagnement: d.accompagnement
    ? {
        mode: d.accompagnement.mode as "nous" | "partenaire",
        accompagnateurId: d.accompagnement.accompagnateurId ?? "",
        besoins: d.accompagnement.besoins as never,
        disponibilites: d.accompagnement.disponibilites,
        message: d.accompagnement.message,
        dateDemande: d.accompagnement.dateDemande.toISOString(),
        plan: d.accompagnement.actions.map((a) => ({ id: a.id, critere: a.critere as never, action: a.action, echeance: a.echeance.toISOString().slice(0, 10), fait: a.fait })),
        pretLe: d.accompagnement.pretLe?.toISOString(),
        dateReaudit: d.accompagnement.dateReaudit?.toISOString(),
        agentReauditId: d.accompagnement.agentReauditId ?? undefined,
      }
    : undefined,
});

const INCLUDE_DOSSIER = { documents: true, accompagnement: { include: { actions: true } }, abonnement: true, transactions: true, reponsesAvis: true } satisfies Prisma.DossierInclude;

/** Tous les dossiers de certification (remplace la démo + localStorage côté admin). */
export async function dossiersAdmin(): Promise<Dossier[]> {
  await roleRequis("admin");
  const lignes = await prisma.dossier.findMany({ include: INCLUDE_DOSSIER, orderBy: { creeLe: "asc" } });
  return lignes.map(versDossierComplet);
}

/** Candidatures partenaires (accompagnateurs). */
export async function candidatsPartenairesAdmin(): Promise<CandidatPartenaire[]> {
  await roleRequis("admin");
  const lignes = await prisma.dossierPartenaire.findMany({ orderBy: { creeLe: "asc" } });
  return lignes.map((p) => ({
    id: p.id,
    nom: p.nom,
    telephone: p.telephone,
    email: p.email,
    secteurs: p.secteurs as CandidatPartenaire["secteurs"],
    zones: p.zones as string[],
    experience: p.experience,
    certifications: p.certifications,
    references: p.references,
    agentHabilite: p.agentHabilite,
    documents: (p.documents as { type: string; nom: string }[]) ?? [],
    statut: p.statut as CandidatPartenaire["statut"],
    historique: p.historique as CandidatPartenaire["historique"],
  }));
}

/** Affectations auditId → agentId (remplace CLES.affectations). */
export async function affectationsAdmin(): Promise<Record<string, string>> {
  await roleRequis("admin");
  const lignes = await prisma.auditPlanifie.findMany({ where: { agentId: { not: null } }, select: { id: true, agentId: true } });
  return Object.fromEntries(lignes.map((l) => [l.id, l.agentId!]));
}

/** Configuration tarifaire en base (null si jamais enregistrée → défauts). */
export async function tarifsAdmin(): Promise<ConfigTarifs | null> {
  await roleRequis("admin");
  const c = await prisma.config.findUnique({ where: { cle: "tarifs" } });
  return (c?.valeur as ConfigTarifs | null) ?? null;
}

/** Avis à modérer (tous statuts sauf publiés automatiquement par la démo). */
export async function avisModerationAdmin(): Promise<{ id: string; etablissementId: string; auteur: string; note: number; commentaire: string; statut: string; motifRejet: string | null; date: string }[]> {
  await roleRequis("admin");
  const lignes = await prisma.avis.findMany({ orderBy: { date: "desc" }, take: 200 });
  return lignes.map((a) => ({ id: a.id, etablissementId: a.etablissementId, auteur: a.auteur, note: a.note, commentaire: a.commentaire, statut: a.statut, motifRejet: a.motifRejet, date: a.date.toISOString().slice(0, 10) }));
}

/** Demandes « Autre » (ménage, ateliers…) déposées publiquement. */
export async function demandesServicesAdmin(): Promise<{ id: string; service: string; type: string; nom: string; telephone: string; quartier: string; statut: string; creeLe: string }[]> {
  await roleRequis("admin");
  const lignes = await prisma.demandeService.findMany({ orderBy: { creeLe: "desc" }, take: 200 });
  return lignes.map((d) => ({ id: d.id, service: d.service, type: d.type, nom: d.nom, telephone: d.telephone, quartier: d.quartier, statut: d.statut, creeLe: d.creeLe.toISOString() }));
}
