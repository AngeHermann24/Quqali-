/* Seed Qualité+ : injecte les données de démonstration dans Supabase.
   Usage : npx tsx prisma/seed.ts  (après `prisma db push` ou `migrate dev`). */
import { PrismaClient, Prisma } from "@prisma/client";
import { ETABLISSEMENTS } from "../src/lib/data";
import { INTERVENANTS } from "../src/lib/intervenants";
import { MISSIONS, etatInitial } from "../src/lib/espace";
import { DOSSIERS_CANDIDATURES_DEMO, CANDIDATURES_PARTENAIRES_DEMO, TRANSACTIONS_DEMO, VENTES_FORMATIONS_DEMO } from "../src/lib/admin";
import { AUDITS_PROPOSES } from "../src/lib/espace";
import { CONFIG_DEFAUT } from "../src/lib/abonnement";

const prisma = new PrismaClient();

const dt = (iso: string) => new Date(iso);

async function main() {
  console.log("→ Intervenants");
  for (const i of INTERVENANTS) {
    await prisma.intervenant.upsert({
      where: { id: i.id },
      update: { nom: i.nom, roles: i.roles, secteurs: i.secteurs, zones: i.zones },
      create: { id: i.id, nom: i.nom, roles: i.roles, secteurs: i.secteurs, zones: i.zones },
    });
  }

  console.log("→ Établissements");
  for (const e of ETABLISSEMENTS) {
    await prisma.etablissement.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        id: e.slug, // le slug sert de clé primaire : les liens existants restent valides
        slug: e.slug,
        nom: e.nom,
        secteur: e.secteur,
        sousType: e.sousType,
        ville: e.ville,
        commune: e.commune,
        quartier: e.quartier,
        adresse: e.adresse,
        lat: e.coords[0],
        lng: e.coords[1],
        pack: e.pack,
        aLaUne: e.aLaUne ?? false,
        scores: e.scores,
        dateAudit: dt(e.dateAudit),
        prochainControle: dt(e.prochainControle),
        description: e.description,
        services: e.services,
        horaires: e.horaires,
        telephone: e.telephone,
        whatsapp: e.whatsapp,
        prix: e.prix,
        awards: e.awards ?? [],
        visite3d: e.visite3d ?? null,
      },
    });
  }

  console.log("→ Candidatures démo (dossiers)");
  for (const d of DOSSIERS_CANDIDATURES_DEMO) {
    const existant = await prisma.dossier.findUnique({ where: { id: d.id } });
    if (existant) continue;
    await prisma.dossier.create({
      data: {
        id: d.id,
        compteId: null, // dossier démo : pas de compte propriétaire
        nom: d.nom,
        secteur: d.secteur,
        sousType: d.sousType,
        description: d.description,
        ville: d.ville,
        commune: d.commune,
        quartier: d.quartier,
        adresse: d.adresse,
        responsable: d.responsable,
        parcours: d.parcours,
        statut: d.statut,
        historique: d.historique,
        agentAuditId: d.agentAuditId ?? null,
        audit: d.audit ?? undefined,
        documents: { create: d.documents.map((doc) => ({ type: doc.type, nom: doc.nom })) },
        accompagnement: d.accompagnement
          ? {
              create: {
                mode: d.accompagnement.mode,
                accompagnateurId: d.accompagnement.accompagnateurId || null,
                besoins: d.accompagnement.besoins,
                disponibilites: d.accompagnement.disponibilites,
                message: d.accompagnement.message,
                dateDemande: dt(d.accompagnement.dateDemande),
              },
            }
          : undefined,
      },
    });
  }

  console.log("→ Partenaires démo");
  for (const p of CANDIDATURES_PARTENAIRES_DEMO) {
    const existant = await prisma.dossierPartenaire.findUnique({ where: { id: p.id } });
    if (existant) continue;
    await prisma.dossierPartenaire.create({
      data: {
        id: p.id,
        compteId: null,
        nom: p.nom,
        telephone: p.telephone,
        email: p.email,
        secteurs: p.secteurs,
        zones: p.zones,
        experience: p.experience,
        certifications: p.certifications,
        references: p.references,
        agentHabilite: p.agentHabilite,
        documents: p.documents as unknown as Prisma.InputJsonValue,
        statut: p.statut,
        historique: p.historique,
      },
    });
  }

  console.log("→ Missions démo");
  for (const m of MISSIONS) {
    const existant = await prisma.mission.findUnique({ where: { id: m.id } });
    if (existant) continue;
    const etat = etatInitial(m);
    const etab = await prisma.etablissement.findUnique({ where: { slug: m.etablissementId } });
    await prisma.mission.create({
      data: {
        id: m.id,
        etablissementId: etab?.id ?? null,
        etablissementNom: m.etablissement,
        secteur: m.secteur,
        commune: m.commune,
        diagnostic: m.diagnostic,
        besoins: m.besoins,
        demandeLe: dt(m.demandeLe),
        statut: etat.statut,
        faits: etat.faits,
        seances: etat.seances,
        accepteeLe: etat.accepteeLe ? dt(etat.accepteeLe) : null,
        pretLe: etat.pretLe ? dt(etat.pretLe) : null,
        agentReauditId: etat.agentReauditId ?? null,
        resultatReaudit: etat.resultatReaudit ?? null,
      },
    });
  }

  console.log("→ Audits planifiés");
  for (const a of AUDITS_PROPOSES) {
    const existant = await prisma.auditPlanifie.findUnique({ where: { id: a.id } });
    if (existant) continue;
    const etab = await prisma.etablissement.findUnique({ where: { slug: a.etablissementId } });
    if (!etab) continue;
    await prisma.auditPlanifie.create({
      data: { id: a.id, etablissementId: etab.id, type: a.type, date: dt(a.date) },
    });
  }

  console.log("→ Transactions démo");
  for (const t of TRANSACTIONS_DEMO) {
    const existant = await prisma.transaction.findUnique({ where: { id: t.id } });
    if (existant) continue;
    await prisma.transaction.create({
      data: {
        id: t.id,
        reference: t.reference,
        date: dt(t.date),
        type: t.type,
        pack: t.pack,
        periodicite: t.periodicite,
        periodeDebut: dt(t.periodeDebut),
        periodeFin: dt(t.periodeFin),
        lignes: t.lignes as unknown as Prisma.InputJsonValue,
        montant: t.montant,
        moyen: t.moyen,
        compte: t.compte,
        statut: t.statut,
        facture: t.facture ?? null,
      },
    });
  }

  console.log("→ Ventes formations démo");
  for (const v of VENTES_FORMATIONS_DEMO) {
    const deja = await prisma.venteFormation.findFirst({ where: { formationId: v.formationId, date: dt(v.date) } });
    if (deja) continue;
    await prisma.venteFormation.create({
      data: { compteId: null, formationId: v.formationId, date: dt(v.date), moyen: v.moyen },
    });
  }

  console.log("→ Config tarifs");
  await prisma.config.upsert({
    where: { cle: "tarifs" },
    update: {},
    create: { cle: "tarifs", valeur: CONFIG_DEFAUT as unknown as Prisma.InputJsonValue },
  });

  console.log("✔ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
