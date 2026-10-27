import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type Abonnement,
  CONFIG_DEFAUT,
  type Transaction,
  creditProrata,
  devis,
  enregistrerPaiement,
  etatAbonnement,
  montantPeriode,
  prochainePeriode,
  traiterEcheances,
  validerCarte,
  validerNumero,
} from "./abonnement.ts";

const ab: Abonnement = {
  pack: "premium",
  periodicite: "mensuel",
  debut: "2026-10-01T00:00:00.000Z",
  fin: "2026-11-01T00:00:00.000Z",
  moyen: "orange",
  compte: "07 •• •• 12 34",
  renouvellementAuto: false,
};
const tx = (statut: "reussi" | "echoue"): Transaction => ({
  id: "tx-1",
  reference: "QC-1",
  date: ab.debut,
  type: "souscription",
  pack: "premium",
  periodicite: "mensuel",
  periodeDebut: ab.debut,
  periodeFin: ab.fin,
  lignes: [{ libelle: "Pack", montant: 45000 }],
  montant: 45000,
  moyen: "orange",
  compte: ab.compte,
  statut,
});

test("prix configurables : mensuel et annuel avec remise", () => {
  assert.equal(montantPeriode(CONFIG_DEFAUT, "basique", "mensuel"), 0);
  assert.equal(montantPeriode(CONFIG_DEFAUT, "premium", "annuel"), 305000);
  const config = { ...CONFIG_DEFAUT, prix: { basique: 20000, premium: 60000 }, remiseAnnuelle: 0 };
  assert.equal(montantPeriode(config, "premium", "annuel"), 720000);
});

test("cycle de vie : actif → rappels → grâce → suspension automatique", () => {
  assert.equal(etatAbonnement(ab, "2026-10-05T00:00:00.000Z", CONFIG_DEFAUT).statut, "actif");
  const bientot = etatAbonnement(ab, "2026-10-25T00:00:00.000Z", CONFIG_DEFAUT);
  assert.equal(bientot.statut, "expire_bientot");
  assert.deepEqual(bientot.rappels.map((r) => [r.jours, r.envoye]), [[15, true], [7, true], [1, false]]);
  const grace = etatAbonnement(ab, "2026-11-03T00:00:00.000Z", CONFIG_DEFAUT);
  assert.equal(grace.statut, "grace");
  assert.equal(grace.visible, true);
  const suspendu = etatAbonnement(ab, "2026-11-08T00:00:00.000Z", CONFIG_DEFAUT);
  assert.equal(suspendu.statut, "suspendu");
  assert.equal(suspendu.visible, false);
});

test("le paiement ne modifie jamais la note (réussi, échoué ou prélèvement automatique)", () => {
  const audit = Object.freeze({ date: "2026-09-01", global: 85.3, scores: Object.freeze({ hygiene: 88, accueil: 84, presentation: 86, gouvernance: 83 }) });
  const dossier = { id: "etab-1", statut: "admis", audit, abonnement: ab, transactions: [] as Transaction[] };
  for (const resultat of [
    enregistrerPaiement(dossier, tx("reussi"), { ...ab, fin: "2026-12-01T00:00:00.000Z" }),
    enregistrerPaiement(dossier, tx("echoue")),
    traiterEcheances({ ...dossier, abonnement: { ...ab, renouvellementAuto: true } }, "2026-11-02T00:00:00.000Z", CONFIG_DEFAUT, true),
    traiterEcheances({ ...dossier, abonnement: { ...ab, renouvellementAuto: true } }, "2027-02-02T00:00:00.000Z", CONFIG_DEFAUT),
  ]) {
    assert.equal(resultat.audit, audit);
    assert.equal(resultat.statut, "admis");
  }
});

test("un paiement échoué ne prolonge pas l'abonnement ; un paiement réussi le prolonge", () => {
  assert.equal(enregistrerPaiement({ abonnement: ab }, tx("echoue"), { ...ab, fin: "2027-01-01T00:00:00.000Z" }).abonnement, ab);
  assert.equal(enregistrerPaiement({ abonnement: ab }, tx("reussi"), { ...ab, fin: "2027-01-01T00:00:00.000Z" }).abonnement?.fin, "2027-01-01T00:00:00.000Z");
});

test("renouvellement automatique : rattrape les échéances, ou s'arrête à l'échec", () => {
  const auto = { abonnement: { ...ab, renouvellementAuto: true }, transactions: [] as Transaction[] };
  const ok = traiterEcheances(auto, "2027-01-15T00:00:00.000Z", CONFIG_DEFAUT);
  assert.equal(ok.abonnement?.fin, "2027-02-01T00:00:00.000Z");
  assert.equal(ok.transactions?.length, 3);
  const ko = traiterEcheances(auto, "2027-01-15T00:00:00.000Z", CONFIG_DEFAUT, true);
  assert.equal(ko.abonnement?.fin, ab.fin);
  assert.equal(etatAbonnement(ko.abonnement, "2027-01-15T00:00:00.000Z", CONFIG_DEFAUT).statut, "suspendu");
  assert.equal(traiterEcheances(ko, "2027-01-16T00:00:00.000Z", CONFIG_DEFAUT).transactions?.length, 1);
});

test("renouvellement : continuité de période, ou redémarrage après suspension", () => {
  assert.equal(prochainePeriode(ab, "2026-10-20T00:00:00.000Z", "mensuel", CONFIG_DEFAUT).debut, ab.fin);
  assert.equal(prochainePeriode(ab, "2026-12-20T00:00:00.000Z", "annuel", CONFIG_DEFAUT).debut, "2026-12-20T00:00:00.000Z");
  assert.equal(creditProrata(ab, tx("reussi"), "2026-10-16T12:00:00.000Z"), 22500);
});

test("changement de pack : avoir au prorata, reliquat converti en jours (aucun crédit perdu)", () => {
  const annuel: Abonnement = { ...ab, periodicite: "annuel", debut: "2026-10-01T00:00:00.000Z", fin: "2027-10-01T00:00:00.000Z" };
  const paiement = { ...tx("reussi"), montant: 459000, periodicite: "annuel" as const };
  const montee = devis({ abonnement: { ...annuel, pack: "basique" }, transactions: [{ ...paiement, montant: 153000 }] }, "2026-10-01T00:00:00.000Z", CONFIG_DEFAUT, { pack: "premium", periodicite: "annuel", type: "changement" });
  assert.equal(montee.total, 305000 - 153000);
  assert.equal(montee.joursOfferts, 0);
  const configPayante = { ...CONFIG_DEFAUT, prix: { basique: 15000, premium: 60000 } };
  const descente = devis({ abonnement: annuel, transactions: [paiement] }, "2026-10-01T00:00:00.000Z", configPayante, { pack: "basique", periodicite: "mensuel", type: "changement" });
  assert.equal(descente.total, 0);
  assert.ok(descente.joursOfferts > 800, `jours offerts : ${descente.joursOfferts}`);
  const renouvellement = devis({ abonnement: ab, transactions: [] }, "2026-10-20T00:00:00.000Z", CONFIG_DEFAUT, { pack: "premium", periodicite: "mensuel", type: "renouvellement" });
  assert.deepEqual([renouvellement.debut, renouvellement.total], [ab.fin, 29900]);
});

test("validation des numéros Mobile Money et des cartes", () => {
  assert.equal(validerNumero("orange", "+225 07 08 09 10 11"), null);
  assert.match(validerNumero("orange", "05 08 09 10 11") ?? "", /Orange Money/);
  assert.equal(validerNumero("mtn", "0508091011"), null);
  assert.equal(validerNumero("wave", "01 02 03 04 05"), null);
  assert.ok(validerNumero("wave", "12345"));
  assert.equal(validerCarte("4242 4242 4242 4242", "12/29", "2026-10-20T00:00:00.000Z"), null);
  assert.ok(validerCarte("4242 4242 4242 4241", "12/29", "2026-10-20T00:00:00.000Z"));
  assert.ok(validerCarte("4242 4242 4242 4242", "09/26", "2026-10-20T00:00:00.000Z"));
});
