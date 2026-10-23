import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIES, PONDERATION, type VoteClient, classement, scoreClients, scoreFinal } from "./awards.ts";

const REF = 3.8;
const candidat = (id: string, secteur: "hotellerie" | "restauration" | "sante" = "hotellerie", partiel = {}) => ({ id, nom: `Etab ${id}`, secteur, global: 90, accueil: 88, hygiene: 92, eligible: true, ...partiel });
const cat = (id: string) => CATEGORIES.find((c) => c.id === id)!;

test("pondération : 30 % clients, 70 % évaluateurs", () => {
  assert.equal(PONDERATION.clients + PONDERATION.evaluateurs, 1);
  assert.equal(scoreFinal(60, 90), 81);
  assert.equal(scoreFinal(90, 90), 90);
});

test("lissage Bayésien : un seul avis parfait ne bat pas un historique solide", () => {
  const unAvis = scoreClients([{ note: 5 }], "global", REF);
  const beaucoup = scoreClients(Array.from({ length: 50 }, () => ({ note: 4.5 })), "global", REF);
  const aucun = scoreClients([], "global", REF);
  assert.equal(unAvis, 80);
  assert.ok(beaucoup > unAvis, `${beaucoup} > ${unAvis}`);
  assert.equal(aucun, 76);
});

test("catégories : filtrage par secteur, critères accueil et hygiène, éligibilité", () => {
  const hotel = candidat("h", "hotellerie");
  const resto = candidat("r", "restauration");
  const exclu = candidat("x", "hotellerie", { eligible: false });
  const votes = new Map<string, VoteClient[]>([["h", Array.from({ length: 10 }, () => ({ note: 5 }))]]);
  const hotels = classement(cat("hotel"), [hotel, resto, exclu], votes, REF);
  assert.deepEqual(hotels.map((l) => l.candidat.id), ["h"]);
  const accueil = classement(cat("accueil"), [hotel, resto], votes, REF);
  assert.equal(accueil.length, 2);
  assert.equal(accueil[0].scoreEvaluateurs, 88);
  assert.equal(classement(cat("hygiene"), [hotel], votes, REF)[0].scoreEvaluateurs, 92);
});

test("classement : score final calculé, lauréat, départage par votes puis nom", () => {
  const a = candidat("a", "restauration", { global: 90 });
  const b = candidat("b", "restauration", { global: 90 });
  const votes = new Map<string, VoteClient[]>([
    ["a", Array.from({ length: 20 }, () => ({ note: 5 }))],
    ["b", Array.from({ length: 20 }, () => ({ note: 4 }))],
  ]);
  const lignes = classement(cat("restaurant"), [a, b], votes, REF);
  assert.equal(lignes[0].candidat.id, "a");
  assert.ok(lignes[0].laureat && !lignes[1].laureat);
  assert.equal(lignes[0].nbVotes, 20);
  assert.equal(lignes[0].scoreFinal, Math.round((0.3 * lignes[0].scoreClients + 0.7 * 90) * 10) / 10);
});

test("catégorie accueil : les votes utilisent la note du personnel quand elle existe", () => {
  const notes: VoteClient[] = [
    { note: 2, personnel: 5 },
    { note: 2, personnel: 5 },
  ];
  const avecPersonnel = scoreClients(notes, "accueil", REF);
  const sansPersonnel = scoreClients(notes.map((v) => ({ note: v.note })), "accueil", REF);
  assert.ok(avecPersonnel > sansPersonnel);
});
