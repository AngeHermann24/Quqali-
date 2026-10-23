import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type AvisClient,
  type ContexteModeration,
  codeVisiteDemo,
  creerAvis,
  masquerNom,
  modererAvis,
  notesPersonnel,
  telephoneNorm,
} from "./avis.ts";

const compte = { id: "c1", nom: "Awa Koné", telephone: "07 08 09 10 11", creeLe: "2026-01-01" };
const MAINTENANT = "2026-11-15T10:00:00.000Z";
const ctx = (partiel: Partial<ContexteModeration> = {}): ContexteModeration => ({
  etablissementId: "etab",
  avisExistants: [],
  codesValides: [codeVisiteDemo("etab")],
  reservationsElegibles: [],
  avisDuCompte: [],
  ...partiel,
});
const saisie = (partiel = {}) => ({ compte, note: 4, commentaire: "Très bon accueil et locaux très propres.", preuve: { type: "code" as const, code: codeVisiteDemo("etab") }, ...partiel });
const avis = (a: Partial<AvisClient>) => ({ id: "x", etablissementId: "etab", compteId: "c1", auteur: "Awa K.", date: MAINTENANT, note: 4, commentaire: "...", preuve: { type: "code", code: "VIS-1" }, statut: "publie", ...a }) as AvisClient;

test("compte requis, masquage du nom, code de démo stable", () => {
  assert.equal(masquerNom("Awa Koné"), "Awa K.");
  assert.equal(masquerNom("Fatou"), "Fatou");
  assert.match(codeVisiteDemo("etab"), /^VIS-\d{4}$/);
  assert.equal(codeVisiteDemo("etab"), codeVisiteDemo("etab"));
});

test("preuve de visite obligatoire : code invalide, code déjà utilisé, réservation déjà notée", () => {
  assert.equal(modererAvis(saisie({ preuve: { type: "code", code: "FAUX-1" } }), ctx(), MAINTENANT).statut, "rejete");
  const deja = avis({ compteId: "c1", preuve: { type: "code", code: codeVisiteDemo("etab") } });
  assert.match(modererAvis(saisie(), ctx({ avisExistants: [deja] }), MAINTENANT).motif ?? "", /déjà publié un avis/);
  const autreCompte = avis({ compteId: "c2", preuve: { type: "reservation", ref: "RES-1" } });
  assert.match(
    modererAvis(saisie({ preuve: { type: "reservation", ref: "RES-1" } }), ctx({ avisExistants: [autreCompte], reservationsElegibles: ["RES-1"] }), MAINTENANT).motif ?? "",
    /un seul avis par visite/,
  );
  assert.equal(
    modererAvis(saisie({ preuve: { type: "reservation", ref: "RES-9" } }), ctx({ reservationsElegibles: [] }), MAINTENANT).motif,
    "Cette réservation est introuvable, non confirmée ou appartient à un autre compte.",
  );
});

test("anti-faux avis : texte court, lien, auto-évaluation, volume inhabituel", () => {
  assert.match(modererAvis(saisie({ commentaire: "Super." }), ctx(), MAINTENANT).motif ?? "", /20 caractères/);
  assert.match(modererAvis(saisie({ commentaire: "Allez voir https://concurrent.ci c'est mieux" }), ctx(), MAINTENANT).motif ?? "", /liens/);
  assert.equal(modererAvis(saisie(), ctx({ telephoneResponsable: "+225 07 08 09 10 11" }), MAINTENANT).statut, "rejete");
  const trois = [1, 2, 3].map((i) => avis({ id: `a${i}`, date: `${MAINTENANT.slice(0, 10)}T0${i}:00:00.000Z` }));
  const r = modererAvis(saisie(), ctx({ avisDuCompte: trois }), MAINTENANT);
  assert.equal(r.statut, "en_verification");
  assert.match(r.motif ?? "", /vérification/);
});

test("un avis propre est publié et porte le nom masqué", () => {
  const a = creerAvis(saisie(), ctx(), MAINTENANT, 1, { service: 5, accueil: 4 });
  assert.equal(a.statut, "publie");
  assert.equal(a.auteur, "Awa K.");
  assert.equal(a.personnel?.service, 5);
});

test("agrégation des notes du personnel", () => {
  const n = notesPersonnel([avis({ personnel: { service: 5, accueil: 4 } }), avis({ personnel: { service: 3 } }), avis({})]);
  assert.equal(n.nombre, 2);
  assert.deepEqual(n.parRole.find((r) => r.role === "service"), { role: "service", moyenne: 4, nombre: 2 });
  assert.equal(n.globale, 3.8);
  assert.equal(telephoneNorm("+225 07 08 09 10 11"), "0708091011");
});
