import assert from "node:assert/strict";
import { test } from "node:test";
import { couvreHeure, couvreJour, estOuvert } from "./horaires.ts";

// 25/10/2026 = dimanche : a(jour, h) = ce jour de la semaine à l'heure voulue (heure locale).
const a = (jour: number, h: number, m = 0) => {
  const d = new Date(2026, 9, 25 + jour, h, m, 0, 0);
  return d;
};

test("couvreJour : libellés courants", () => {
  assert.equal(couvreJour("Tous les jours", 0), true);
  assert.equal(couvreJour("Lundi – Samedi", 6), true);
  assert.equal(couvreJour("Lundi – Samedi", 0), false);
  assert.equal(couvreJour("Dimanche", 0), true);
  assert.equal(couvreJour("Dimanche", 1), false);
  assert.equal(couvreJour("Mardi – Dimanche", 0), true); // plage à cheval
  assert.equal(couvreJour("Mardi – Dimanche", 1), false);
  assert.equal(couvreJour("Consultations Lun – Sam", 3), true);
  assert.equal(couvreJour("Réception", 4), true); // pas de jour → tous les jours
});

test("couvreHeure : plages, 24 h, fermé", () => {
  assert.equal(couvreHeure("24 h/24, 7 j/7", 300), true);
  assert.equal(couvreHeure("Fermé", 800), false);
  assert.equal(couvreHeure("07:00 – 21:00", 20 * 60), true);
  assert.equal(couvreHeure("07:00 – 21:00", 21 * 60), false);
  assert.equal(couvreHeure("11:30 – 15:00 · 19:00 – 23:00", 16 * 60), false);
  assert.equal(couvreHeure("11:30 – 15:00 · 19:00 – 23:00", 20 * 60), true);
  assert.equal(couvreHeure("17:00 – 01:00", 30), true); // passe minuit
  assert.equal(couvreHeure("17:00 – 01:00", 2 * 60), false);
});

test("estOuvert : combinaisons réelles des fiches", () => {
  const akwaba = [
    { jours: "Lundi – Vendredi", heures: "11:30 – 15:00 · 19:00 – 23:00" },
    { jours: "Samedi", heures: "19:00 – 23:30" },
    { jours: "Dimanche", heures: "Fermé" },
  ];
  assert.equal(estOuvert(akwaba, a(1, 12)), true); // lundi midi
  assert.equal(estOuvert(akwaba, a(1, 16)), false); // lundi 16 h
  assert.equal(estOuvert(akwaba, a(6, 20)), true); // samedi soir
  assert.equal(estOuvert(akwaba, a(0, 12)), false); // dimanche : fermé

  const clinique = [
    { jours: "Urgences", heures: "24 h/24, 7 j/7" },
    { jours: "Consultations Lun – Sam", heures: "07:30 – 19:00" },
  ];
  assert.equal(estOuvert(clinique, a(0, 3)), true); // urgences 24/7

  const tantie = [{ jours: "Tous les jours", heures: "17:00 – 01:00" }];
  assert.equal(estOuvert(tantie, a(2, 0, 30)), true); // mercredi 00:30 (service de mardi soir)
  assert.equal(estOuvert(tantie, a(2, 10)), false);
});
