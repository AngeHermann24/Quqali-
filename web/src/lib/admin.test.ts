import { strict as assert } from "node:assert";
import { test } from "node:test";
import { CONFIG_DEFAUT } from "./abonnement.ts";
import {
  CANDIDATURES_PARTENAIRES_DEMO,
  DOSSIERS_CANDIDATURES_DEMO,
  TRANSACTIONS_DEMO,
  VENTES_FORMATIONS_DEMO,
  candidatsAgent,
  demarrerAudit,
  enregistrerResultatAudit,
  etatPublic,
  liensDuDossier,
  peutDemarrerAudit,
  refuserDossier,
  remettreBadge,
  repartitionPaiements,
  retablir,
  retirerBadge,
  revenusParMois,
  statistiquesFormations,
  statistiquesGlobales,
  suspendre,
  transitionPartenaire,
} from "./admin.ts";
import type { Gestion } from "./admin";
import type { AvisClient } from "./avis";
import type { Dossier } from "./espace";
import { INTERVENANTS } from "./intervenants.ts";

const soumis = () => structuredClone(DOSSIERS_CANDIDATURES_DEMO[0]);
const enAudit = () => structuredClone(DOSSIERS_CANDIDATURES_DEMO[1]);
const maintenant = "2026-10-23T10:00:00.000Z";

test("un dossier soumis ne passe en audit qu'avec un agent assigné", () => {
  const d = soumis();
  assert.strictEqual(peutDemarrerAudit(d), false);
  const pret = { ...d, agentAuditId: "ag-kone" };
  assert.strictEqual(peutDemarrerAudit(pret), true);
  const passe = demarrerAudit(pret, "ag-kone", maintenant);
  assert.strictEqual(passe.statut, "en_audit");
  assert.strictEqual(passe.agentAuditId, "ag-kone");
  assert.strictEqual(passe.historique.at(-1)?.statut, "en_audit");
  assert.throws(() => demarrerAudit(passe, "ag-kone", maintenant));
});

test("le résultat de l'audit tranche l'admission au seuil de 80 %", () => {
  const d = enAudit();
  const admis = enregistrerResultatAudit(d, { hygiene: 88, accueil: 84, presentation: 86, gouvernance: 83 }, maintenant);
  assert.strictEqual(admis.statut, "admis");
  assert.ok(admis.audit && admis.audit.global >= 80);
  const refuse = enregistrerResultatAudit(enAudit(), { hygiene: 78, accueil: 76, presentation: 72, gouvernance: 70 }, maintenant);
  assert.strictEqual(refuse.statut, "refuse");
  assert.throws(() => enregistrerResultatAudit(admis as never as Dossier & { statut: "admis" }, { hygiene: 90, accueil: 90, presentation: 90, gouvernance: 90 }, maintenant));
});

test("refus pour pièces réservé aux dossiers soumis", () => {
  assert.strictEqual(refuserDossier(soumis(), maintenant).statut, "refuse");
  assert.throws(() => refuserDossier(enAudit(), maintenant));
});

test("l'accompagnateur d'un établissement ne peut pas l'auditer", () => {
  const d = { ...soumis(), accompagnement: { ...soumis().accompagnement!, accompagnateurId: "ac-toure" } };
  const liens = liensDuDossier(d);
  assert.deepStrictEqual(liens, [{ accompagnateurId: "ac-toure", etablissementId: d.id }]);
  const candidats = candidatsAgent(d, INTERVENANTS, liens);
  const exclu = candidats.find((c) => c.intervenant.id === "ac-toure");
  assert.ok(exclu && !exclu.eligible && /indépendance/.test(exclu.motif ?? ""));
  assert.ok(candidats.some((c) => c.intervenant.id === "ag-kone" && c.eligible));
});

test("suspension et retrait de badge", () => {
  let g: Gestion = {};
  g = suspendre(g, "hotel-x", "2026-10-23");
  g = retirerBadge(g, "hotel-y", "2026-10-23");
  assert.strictEqual(etatPublic(g["hotel-x"]), "suspendu");
  assert.strictEqual(etatPublic(g["hotel-y"]), "badge_retire");
  g = retablir(g, "hotel-x");
  assert.strictEqual(etatPublic(g["hotel-x"]), "actif");
  g = remettreBadge(g, "hotel-y");
  assert.strictEqual(etatPublic(g["hotel-y"]), "actif");
  // Un établissement suspendu ET badge retiré est « suspendu » en priorité
  g = suspendre(retirerBadge({}, "hotel-z", "2026-10-23"), "hotel-z", "2026-10-24");
  assert.strictEqual(etatPublic(g["hotel-z"]), "suspendu");
});

test("candidature partenaire : transitions", () => {
  const p = transitionPartenaire(CANDIDATURES_PARTENAIRES_DEMO[0], "entretien", maintenant);
  assert.strictEqual(p.statut, "entretien");
  assert.strictEqual(p.historique.length, 2);
  assert.strictEqual(transitionPartenaire(p, "valide", maintenant).statut, "valide");
});

test("statistiques globales", () => {
  const avis: AvisClient[] = [
    { id: "a1", etablissementId: "e1", compteId: "c1", auteur: "A. K.", date: maintenant, note: 5, commentaire: "x".repeat(25), preuve: { type: "code", code: "VIS-1" }, statut: "publie" },
    { id: "a2", etablissementId: "e1", compteId: "c2", auteur: "B. K.", date: maintenant, note: 3, commentaire: "x".repeat(25), preuve: { type: "code", code: "VIS-1" }, statut: "signale" },
  ];
  const stats = statistiquesGlobales({
    etablissements: [
      { slug: "h1", nom: "H1", secteur: "hotellerie", scores: { hygiene: 90, accueil: 90, presentation: 90, gouvernance: 90 }, avis: [] },
      { slug: "r1", nom: "R1", secteur: "restauration", scores: { hygiene: 80, accueil: 80, presentation: 80, gouvernance: 80 }, avis: [] },
    ] as never,
    dossiersAdmis: [],
    candidatures: [{ statut: "soumis" }, { statut: "en_audit" }, { statut: "soumis" }],
    transactions: TRANSACTIONS_DEMO,
    avis,
    gestion: { h1: { suspendu: "2026-10-23" }, r1: { badgeRetire: "2026-10-23" } },
    aujourdhui: "2026-10-23",
    config: CONFIG_DEFAUT,
  });
  assert.deepStrictEqual(stats.parSecteur, { hotellerie: 1, restauration: 1, sante: 0, services: 0, education: 0, commerce: 0, transport: 0 });
  assert.strictEqual(stats.candidaturesEnAttente, 2);
  assert.strictEqual(stats.enAudit, 1);
  assert.strictEqual(stats.avisPublies, 1);
  assert.strictEqual(stats.avisEnAttente, 1);
  assert.strictEqual(stats.avisMoyenne, 5);
  assert.strictEqual(stats.suspendus, 1);
  assert.strictEqual(stats.badgesRetires, 1);
  assert.strictEqual(stats.revenusTotal, TRANSACTIONS_DEMO.reduce((s, t) => s + t.montant, 0));
  assert.ok(stats.revenusMois < stats.revenusTotal);
});

test("revenus par mois : fenêtre glissante ordonnée, échoués ignorés", () => {
  const mois = revenusParMois(TRANSACTIONS_DEMO, "2026-10-23", 3);
  assert.deepStrictEqual(mois.map((m) => m.mois), ["2026-08", "2026-09", "2026-10"]);
  assert.strictEqual(mois[0].total, 0);
  assert.strictEqual(mois[1].total, 60000);
  assert.strictEqual(mois[2].total, TRANSACTIONS_DEMO.filter((t) => t.date.startsWith("2026-10")).reduce((s, t) => s + t.montant, 0));
  const rep = repartitionPaiements(TRANSACTIONS_DEMO);
  assert.strictEqual(rep.parPack.get("premium")?.nombre, 4);
  assert.strictEqual(rep.parPeriodicite.get("annuel")?.nombre, 2);
  assert.strictEqual(rep.parMoyen.get("orange")?.montant, 459000 + 45000 + 45000);
});

test("statistiques formations : ventes, revenus au prix catalogue, classement", () => {
  const s = statistiquesFormations(VENTES_FORMATIONS_DEMO);
  assert.strictEqual(s.ventes, 8);
  assert.strictEqual(s.revenus, 7900 * 3 + 5900 * 2 + 6900 + 9900 + 4900);
  assert.strictEqual(s.parFormation.get("hygiene-irreprochable"), 3);
  assert.strictEqual(statistiquesFormations([]).revenus, 0);
});
