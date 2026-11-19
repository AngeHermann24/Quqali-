"use server";

import { Prisma } from "@prisma/client";
import type { Dossier, DossierPartenaire, EtatMission, Mission } from "@/lib/espace";
import type { Abonnement, Transaction } from "@/lib/abonnement";
import type { Secteur } from "@/lib/data";
import { prisma } from "@/lib/db";
import { profilRequis } from "@/lib/auth";

type Resultat<T = undefined> = T extends undefined ? { ok: boolean; erreur?: string } : { ok: boolean; erreur?: string; valeur?: T };

/* ---------- Conversion DB → forme `Dossier` legacy ---------- */

const INCLUDE_DOSSIER = {
  documents: true,
  accompagnement: { include: { actions: true } },
  abonnement: true,
  transactions: { orderBy: { date: "desc" as const } },
  membres: true,
  reponsesAvis: true,
} satisfies Prisma.DossierInclude;

type LigneDossier = Prisma.DossierGetPayload<{ include: typeof INCLUDE_DOSSIER }>;

function versDossier(d: LigneDossier): Dossier {
  return {
    id: d.id,
    nom: d.nom,
    secteur: d.secteur as Secteur,
    sousType: d.sousType,
    description: d.description,
    ville: d.ville,
    commune: d.commune,
    quartier: d.quartier,
    adresse: d.adresse,
    coords: d.lat != null && d.lng != null ? [d.lat, d.lng] : undefined,
    responsable: d.responsable as Dossier["responsable"],
    horaires: (d.horaires as string | undefined) ?? undefined,
    capacites: (d.capacites as Dossier["capacites"]) ?? undefined,
    prepaAudit: (d.prepaAudit as Dossier["prepaAudit"]) ?? undefined,
    documents: d.documents.map((doc) => ({ type: doc.type, nom: doc.nom })),
    parcours: d.parcours as Dossier["parcours"],
    statut: d.statut as Dossier["statut"],
    historique: d.historique as Dossier["historique"],
    agentAuditId: d.agentAuditId ?? undefined,
    creneauAudit: d.creneauAudit?.toISOString(),
    audit: (d.audit as Dossier["audit"]) ?? undefined,
    abonnement: d.abonnement
      ? {
          pack: d.abonnement.pack as Abonnement["pack"],
          periodicite: d.abonnement.periodicite as Abonnement["periodicite"],
          debut: d.abonnement.debut.toISOString(),
          fin: d.abonnement.fin.toISOString(),
          moyen: d.abonnement.moyen as Abonnement["moyen"],
          compte: d.abonnement.compte,
          renouvellementAuto: d.abonnement.renouvellementAuto,
        }
      : undefined,
    transactions: d.transactions.map(
      (t): Transaction => ({
        id: t.id,
        reference: t.reference,
        date: t.date.toISOString(),
        type: t.type as Transaction["type"],
        pack: t.pack as Transaction["pack"],
        periodicite: t.periodicite as Transaction["periodicite"],
        periodeDebut: t.periodeDebut.toISOString(),
        periodeFin: t.periodeFin.toISOString(),
        lignes: t.lignes as unknown as Transaction["lignes"],
        montant: t.montant,
        moyen: t.moyen as Transaction["moyen"],
        compte: t.compte,
        statut: t.statut as Transaction["statut"],
        motif: t.motif ?? undefined,
        facture: t.facture ?? undefined,
      }),
    ),
    visite3d: d.visite3d ?? undefined,
    services: (d.services as string[] | null) ?? undefined,
    modifications: (d.modifications as Dossier["modifications"]) ?? undefined,
    reponsesAvis: Object.fromEntries(d.reponsesAvis.map((r) => [r.avisId, r.texte])),
    accompagnement: d.accompagnement
      ? {
          mode: d.accompagnement.mode as "nous" | "partenaire",
          accompagnateurId: d.accompagnement.accompagnateurId ?? "",
          besoins: d.accompagnement.besoins as Dossier["accompagnement"] extends infer A ? (A extends { besoins: infer B } ? B : never) : never,
          disponibilites: d.accompagnement.disponibilites,
          message: d.accompagnement.message,
          dateDemande: d.accompagnement.dateDemande.toISOString(),
          plan: d.accompagnement.actions.map((a) => ({
            id: a.id,
            critere: a.critere as never,
            action: a.action,
            echeance: a.echeance.toISOString(),
            fait: a.fait,
          })),
          pretLe: d.accompagnement.pretLe?.toISOString(),
          dateReaudit: d.accompagnement.dateReaudit?.toISOString(),
          agentReauditId: d.accompagnement.agentReauditId ?? undefined,
        }
      : undefined,
  };
}

/* ---------- Dossier pro ---------- */

/** Sauvegarde complète du dossier côté pro (sémantique « tout remplacer » du localStorage ; statut/audit/agent restent gérés par l'admin). */
export async function synchroniserDossier(d: Dossier): Promise<Resultat> {
  const profil = await profilRequis();
  const existant = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  const scalaires = {
    nom: d.nom,
    secteur: d.secteur,
    sousType: d.sousType,
    description: d.description,
    ville: d.ville,
    commune: d.commune,
    quartier: d.quartier,
    adresse: d.adresse,
    lat: d.coords?.[0] ?? null,
    lng: d.coords?.[1] ?? null,
    responsable: d.responsable as unknown as Prisma.InputJsonValue,
    horaires: (d.horaires ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    capacites: (d.capacites ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    prepaAudit: (d.prepaAudit ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    parcours: d.parcours,
    visite3d: d.visite3d ?? null,
    services: (d.services ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    modifications: (d.modifications ?? Prisma.JsonNull) as Prisma.InputJsonValue,
  };
  const id = existant
    ? existant.id
    : (
        await prisma.dossier.create({
          data: { ...scalaires, compteId: profil.id, statut: d.statut ?? "soumis", historique: (d.historique ?? [{ statut: "soumis", date: new Date().toISOString() }]) as unknown as Prisma.InputJsonValue },
          select: { id: true },
        })
      ).id;

  if (existant) await prisma.dossier.update({ where: { id }, data: scalaires });

  // Sous-objets : remplacement complet.
  await prisma.documentJoint.deleteMany({ where: { dossierId: id } });
  if (d.documents.length) await prisma.documentJoint.createMany({ data: d.documents.map((doc) => ({ dossierId: id, type: doc.type, nom: doc.nom })) });

  await prisma.membreEquipe.deleteMany({ where: { dossierId: id } });

  await prisma.reponseAvis.deleteMany({ where: { dossierId: id } });
  const reponses = Object.entries(d.reponsesAvis ?? {});
  if (reponses.length) await prisma.reponseAvis.createMany({ data: reponses.map(([avisId, texte]) => ({ dossierId: id, avisId, texte })) });

  await prisma.abonnement.deleteMany({ where: { dossierId: id } });
  if (d.abonnement)
    await prisma.abonnement.create({
      data: {
        dossierId: id,
        pack: d.abonnement.pack,
        periodicite: d.abonnement.periodicite,
        debut: new Date(d.abonnement.debut),
        fin: new Date(d.abonnement.fin),
        moyen: d.abonnement.moyen,
        compte: d.abonnement.compte,
        renouvellementAuto: d.abonnement.renouvellementAuto,
      },
    });

  await prisma.transaction.deleteMany({ where: { dossierId: id } });
  if (d.transactions?.length)
    await prisma.transaction.createMany({
      data: d.transactions.map((t) => ({
        id: t.id,
        dossierId: id,
        reference: t.reference,
        date: new Date(t.date),
        type: t.type,
        pack: t.pack,
        periodicite: t.periodicite,
        periodeDebut: new Date(t.periodeDebut),
        periodeFin: new Date(t.periodeFin),
        lignes: t.lignes as unknown as Prisma.InputJsonValue,
        montant: t.montant,
        moyen: t.moyen,
        compte: t.compte,
        statut: t.statut,
        motif: t.motif ?? null,
        facture: t.facture ?? null,
      })),
    });

  if (d.accompagnement) {
    const acc = d.accompagnement;
    await prisma.accompagnement.upsert({
      where: { dossierId: id },
      update: { mode: acc.mode, accompagnateurId: acc.accompagnateurId || null, besoins: acc.besoins as unknown as Prisma.InputJsonValue, disponibilites: acc.disponibilites, message: acc.message, pretLe: acc.pretLe ? new Date(acc.pretLe) : null, dateReaudit: acc.dateReaudit ? new Date(acc.dateReaudit) : null, agentReauditId: acc.agentReauditId ?? null },
      create: { dossierId: id, mode: acc.mode, accompagnateurId: acc.accompagnateurId || null, besoins: acc.besoins as unknown as Prisma.InputJsonValue, disponibilites: acc.disponibilites, message: acc.message, dateDemande: new Date(acc.dateDemande), pretLe: acc.pretLe ? new Date(acc.pretLe) : null, dateReaudit: acc.dateReaudit ? new Date(acc.dateReaudit) : null, agentReauditId: acc.agentReauditId ?? null },
    });
    const accId = (await prisma.accompagnement.findUnique({ where: { dossierId: id }, select: { id: true } }))!.id;
    await prisma.actionPlan.deleteMany({ where: { accompagnementId: accId } });
    if (acc.plan.length) await prisma.actionPlan.createMany({ data: acc.plan.map((a) => ({ accompagnementId: accId, critere: a.critere, action: a.action, echeance: new Date(a.echeance), fait: a.fait })) });
  }

  return { ok: true };
}

export async function monDossier(): Promise<Dossier | null> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, include: INCLUDE_DOSSIER });
  return d ? versDossier(d) : null;
}

/** Soumission initiale du dossier de certification (inscription établissement). */
export async function soumettreDossier(brouillon: Omit<Dossier, "statut" | "historique" | "reponsesAvis" | "id">): Promise<Resultat<Dossier>> {
  const profil = await profilRequis();
  if (await prisma.dossier.findUnique({ where: { compteId: profil.id } })) return { ok: false, erreur: "Un dossier existe déjà pour ce compte." };
  const maintenant = new Date().toISOString();
  const d = await prisma.dossier.create({
    data: {
      compteId: profil.id,
      nom: brouillon.nom,
      secteur: brouillon.secteur,
      sousType: brouillon.sousType,
      description: brouillon.description,
      ville: brouillon.ville,
      commune: brouillon.commune,
      quartier: brouillon.quartier,
      adresse: brouillon.adresse,
      lat: brouillon.coords?.[0] ?? null,
      lng: brouillon.coords?.[1] ?? null,
      responsable: brouillon.responsable as unknown as Prisma.InputJsonValue,
      horaires: brouillon.horaires ?? Prisma.DbNull,
      capacites: (brouillon.capacites ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      prepaAudit: (brouillon.prepaAudit ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      parcours: brouillon.parcours,
      statut: "soumis",
      historique: [{ statut: "soumis", date: maintenant }] as unknown as Prisma.InputJsonValue,
      documents: { create: brouillon.documents.map((doc) => ({ type: doc.type, nom: doc.nom })) },
    },
    include: INCLUDE_DOSSIER,
  });
  return { ok: true, valeur: versDossier(d) };
}

/** Mise à jour de champs libres du dossier (fiche publique, prépa audit, visite 3D, services). */
export async function majDossier(champs: {
  description?: string;
  horaires?: string;
  coords?: [number, number];
  capacites?: Dossier["capacites"];
  prepaAudit?: Dossier["prepaAudit"];
  visite3d?: string | null;
  services?: string[];
  responsable?: Dossier["responsable"];
  creneauAudit?: string | null;
  journalModification?: string; // nom du champ modifié → entrée d'historique
}): Promise<Resultat> {
  const profil = await profilRequis();
  const data: Prisma.DossierUpdateInput = {};
  if (champs.description !== undefined) data.description = champs.description;
  if (champs.horaires !== undefined) data.horaires = champs.horaires;
  if (champs.coords) {
    data.lat = champs.coords[0];
    data.lng = champs.coords[1];
  }
  if (champs.capacites !== undefined) data.capacites = champs.capacites as unknown as Prisma.InputJsonValue;
  if (champs.prepaAudit !== undefined) data.prepaAudit = champs.prepaAudit as unknown as Prisma.InputJsonValue;
  if (champs.visite3d !== undefined) data.visite3d = champs.visite3d;
  if (champs.services !== undefined) data.services = champs.services as unknown as Prisma.InputJsonValue;
  if (champs.responsable !== undefined) data.responsable = champs.responsable as unknown as Prisma.InputJsonValue;
  if (champs.creneauAudit !== undefined) data.creneauAudit = champs.creneauAudit ? new Date(champs.creneauAudit) : null;
  if (champs.journalModification) {
    const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { modifications: true } });
    const actuelles = (d?.modifications as { date: string; champ: string }[] | null) ?? [];
    data.modifications = [...actuelles, { date: new Date().toISOString(), champ: champs.journalModification }] as unknown as Prisma.InputJsonValue;
  }
  await prisma.dossier.update({ where: { compteId: profil.id }, data });
  return { ok: true };
}

/* ---------- Documents ---------- */

export async function ajouterDocument(type: string, nom: string): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  await prisma.documentJoint.create({ data: { dossierId: d.id, type, nom } });
  return { ok: true };
}

export async function retirerDocument(type: string, nom: string): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  await prisma.documentJoint.deleteMany({ where: { dossierId: d.id, type, nom } });
  return { ok: true };
}

/* ---------- Abonnement & transactions ---------- */

export async function majAbonnement(abo: Abonnement | null): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  if (!abo) {
    await prisma.abonnement.deleteMany({ where: { dossierId: d.id } });
    return { ok: true };
  }
  await prisma.abonnement.upsert({
    where: { dossierId: d.id },
    update: {
      pack: abo.pack,
      periodicite: abo.periodicite,
      debut: new Date(abo.debut),
      fin: new Date(abo.fin),
      moyen: abo.moyen,
      compte: abo.compte,
      renouvellementAuto: abo.renouvellementAuto,
    },
    create: {
      dossierId: d.id,
      pack: abo.pack,
      periodicite: abo.periodicite,
      debut: new Date(abo.debut),
      fin: new Date(abo.fin),
      moyen: abo.moyen,
      compte: abo.compte,
      renouvellementAuto: abo.renouvellementAuto,
    },
  });
  return { ok: true };
}

export async function ajouterTransaction(t: Transaction): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  await prisma.transaction.create({
    data: {
      id: t.id,
      reference: t.reference,
      dossierId: d.id,
      date: new Date(t.date),
      type: t.type,
      pack: t.pack,
      periodicite: t.periodicite,
      periodeDebut: new Date(t.periodeDebut),
      periodeFin: new Date(t.periodeFin),
      lignes: t.lignes as unknown as Prisma.InputJsonValue,
      montant: t.montant,
      moyen: t.moyen,
      compte: t.compte,
      statut: t.statut,
      motif: t.motif ?? null,
      facture: t.facture ?? null,
    },
  });
  return { ok: true };
}

/* ---------- Accompagnement ---------- */

export async function majAccompagnement(acc: Dossier["accompagnement"] | null): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  if (!acc) {
    await prisma.accompagnement.deleteMany({ where: { dossierId: d.id } });
    return { ok: true };
  }
  const ligne = await prisma.accompagnement.upsert({
    where: { dossierId: d.id },
    update: {
      mode: acc.mode,
      accompagnateurId: acc.accompagnateurId || null,
      besoins: acc.besoins as unknown as Prisma.InputJsonValue,
      disponibilites: acc.disponibilites,
      message: acc.message,
      pretLe: acc.pretLe ? new Date(acc.pretLe) : null,
      dateReaudit: acc.dateReaudit ? new Date(acc.dateReaudit) : null,
      agentReauditId: acc.agentReauditId ?? null,
    },
    create: {
      dossierId: d.id,
      mode: acc.mode,
      accompagnateurId: acc.accompagnateurId || null,
      besoins: acc.besoins as unknown as Prisma.InputJsonValue,
      disponibilites: acc.disponibilites,
      message: acc.message,
      dateDemande: new Date(acc.dateDemande),
      pretLe: acc.pretLe ? new Date(acc.pretLe) : null,
      dateReaudit: acc.dateReaudit ? new Date(acc.dateReaudit) : null,
      agentReauditId: acc.agentReauditId ?? null,
    },
  });
  // Plan d'actions : remplacement complet (les ids changent si le plan est régénéré).
  await prisma.actionPlan.deleteMany({ where: { accompagnementId: ligne.id } });
  if (acc.plan.length) {
    await prisma.actionPlan.createMany({
      data: acc.plan.map((a) => ({
        id: a.id.length > 25 ? undefined : a.id, // les ids générés côté client restent si courts
        accompagnementId: ligne.id,
        critere: a.critere,
        action: a.action,
        echeance: new Date(a.echeance),
        fait: a.fait,
      })),
    });
  }
  return { ok: true };
}

/* ---------- Équipe ---------- */

export async function majEquipe(membres: { nom: string; tel: string; role: string }[]): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  await prisma.membreEquipe.deleteMany({ where: { dossierId: d.id } });
  if (membres.length) await prisma.membreEquipe.createMany({ data: membres.map((m) => ({ dossierId: d.id, ...m })) });
  return { ok: true };
}

export async function monEquipe(): Promise<{ nom: string; tel: string; role: string }[]> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, include: { membres: true } });
  return d?.membres.map((m) => ({ nom: m.nom, tel: m.tel, role: m.role })) ?? [];
}

/* ---------- Réponses aux avis ---------- */

export async function repondreAvisPro(avisId: string, texte: string | null): Promise<Resultat> {
  const profil = await profilRequis();
  const d = await prisma.dossier.findUnique({ where: { compteId: profil.id }, select: { id: true } });
  if (!d) return { ok: false, erreur: "Dossier introuvable." };
  if (!texte) {
    await prisma.reponseAvis.deleteMany({ where: { dossierId: d.id, avisId } });
    await prisma.avis.updateMany({ where: { id: avisId }, data: { reponse: null } });
    return { ok: true };
  }
  await prisma.reponseAvis.upsert({
    where: { avisId },
    update: { texte },
    create: { dossierId: d.id, avisId, texte },
  });
  await prisma.avis.update({ where: { id: avisId }, data: { reponse: texte } });
  return { ok: true };
}

/* ---------- Formations ---------- */

export async function acheterFormation(formationId: string, moyen: string): Promise<Resultat> {
  const profil = await profilRequis();
  await prisma.venteFormation.create({ data: { compteId: profil.id, formationId, moyen } });
  return { ok: true };
}

export async function mesFormations(): Promise<string[]> {
  const profil = await profilRequis();
  const lignes = await prisma.venteFormation.findMany({ where: { compteId: profil.id } });
  return lignes.map((v) => v.formationId);
}

/* ---------- Partenaire : dossier ---------- */

const versPartenaire = (p: Prisma.DossierPartenaireGetPayload<Record<string, never>>): DossierPartenaire => ({
  id: "moi",
  nom: p.nom,
  telephone: p.telephone,
  email: p.email,
  secteurs: p.secteurs as DossierPartenaire["secteurs"],
  zones: p.zones as string[],
  experience: p.experience,
  certifications: p.certifications,
  references: p.references,
  agentHabilite: p.agentHabilite,
  documents: p.documents as unknown as DossierPartenaire["documents"],
  statut: p.statut as DossierPartenaire["statut"],
  historique: p.historique as DossierPartenaire["historique"],
});

export async function monDossierPartenaire(): Promise<DossierPartenaire | null> {
  const profil = await profilRequis();
  const p = await prisma.dossierPartenaire.findUnique({ where: { compteId: profil.id } });
  return p ? versPartenaire(p) : null;
}

export async function soumettreCandidaturePartenaire(d: Omit<DossierPartenaire, "id" | "statut" | "historique">): Promise<Resultat> {
  const profil = await profilRequis();
  await prisma.dossierPartenaire.upsert({
    where: { compteId: profil.id },
    update: {
      nom: d.nom,
      telephone: d.telephone,
      email: d.email,
      secteurs: d.secteurs as unknown as Prisma.InputJsonValue,
      zones: d.zones as unknown as Prisma.InputJsonValue,
      experience: d.experience,
      certifications: d.certifications,
      references: d.references,
      agentHabilite: d.agentHabilite,
      documents: d.documents as unknown as Prisma.InputJsonValue,
    },
    create: {
      compteId: profil.id,
      nom: d.nom,
      telephone: d.telephone,
      email: d.email,
      secteurs: d.secteurs as unknown as Prisma.InputJsonValue,
      zones: d.zones as unknown as Prisma.InputJsonValue,
      experience: d.experience,
      certifications: d.certifications,
      references: d.references,
      agentHabilite: d.agentHabilite,
      documents: d.documents as unknown as Prisma.InputJsonValue,
      statut: "soumis",
      historique: [{ statut: "soumis", date: new Date().toISOString() }] as unknown as Prisma.InputJsonValue,
    },
  });
  return { ok: true };
}

/* ---------- Partenaire : missions ---------- */

const versMission = (m: Prisma.MissionGetPayload<Record<string, never>>): { mission: Mission; etat: EtatMission } => ({
  mission: {
    id: m.id,
    etablissementId: m.etablissementId ?? "",
    etablissement: m.etablissementNom,
    secteur: m.secteur as Mission["secteur"],
    commune: m.commune,
    diagnostic: m.diagnostic as Mission["diagnostic"],
    besoins: m.besoins as Mission["besoins"],
    demandeLe: m.demandeLe.toISOString().slice(0, 10),
    statutInitial: m.statut as Mission["statutInitial"],
    resultatReaudit: m.resultatReaudit ?? undefined,
  },
  etat: {
    statut: m.statut as EtatMission["statut"],
    faits: m.faits as string[],
    seances: m.seances as EtatMission["seances"],
    accepteeLe: m.accepteeLe?.toISOString(),
    pretLe: m.pretLe?.toISOString(),
    agentReauditId: m.agentReauditId ?? undefined,
    resultatReaudit: m.resultatReaudit ?? undefined,
  },
});

export async function mesMissions(): Promise<{ mission: Mission; etat: EtatMission }[]> {
  const profil = await profilRequis();
  const partenaire = await prisma.dossierPartenaire.findUnique({ where: { compteId: profil.id } });
  if (!partenaire) return [];
  const lignes = await prisma.mission.findMany({ where: { partenaireId: partenaire.id }, orderBy: { demandeLe: "desc" } });
  return lignes.map(versMission);
}

export async function majMission(id: string, etat: EtatMission): Promise<Resultat> {
  const profil = await profilRequis();
  const partenaire = await prisma.dossierPartenaire.findUnique({ where: { compteId: profil.id } });
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission || (partenaire && mission.partenaireId !== partenaire.id)) return { ok: false, erreur: "Mission introuvable." };
  await prisma.mission.update({
    where: { id },
    data: {
      statut: etat.statut,
      faits: etat.faits as unknown as Prisma.InputJsonValue,
      seances: etat.seances as unknown as Prisma.InputJsonValue,
      accepteeLe: etat.accepteeLe ? new Date(etat.accepteeLe) : null,
      pretLe: etat.pretLe ? new Date(etat.pretLe) : null,
      agentReauditId: etat.agentReauditId ?? null,
      resultatReaudit: etat.resultatReaudit ?? null,
    },
  });
  return { ok: true };
}
