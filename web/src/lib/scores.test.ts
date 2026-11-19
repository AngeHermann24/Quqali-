import assert from "node:assert/strict";
import { test } from "node:test";
import { COULEUR_NIVEAU, SEUIL_BON, SEUIL_EXCELLENT, niveauScore, scoreGlobal } from "./scores.ts";

test("scoreGlobal : pondération du référentiel", () => {
  assert.equal(scoreGlobal({ hygiene: 100, accueil: 100, presentation: 100, gouvernance: 100 }), 100);
  assert.equal(scoreGlobal({ hygiene: 0, accueil: 0, presentation: 0, gouvernance: 0 }), 0);
  // 30 % × 90 + 25 % × 80 + 20 % × 70 + 25 % × 80 = 81
  assert.equal(scoreGlobal({ hygiene: 90, accueil: 80, presentation: 70, gouvernance: 80 }), 81);
});

test("niveauScore : seuils des trois niveaux", () => {
  assert.equal(niveauScore(SEUIL_EXCELLENT), "excellent");
  assert.equal(niveauScore(95), "excellent");
  assert.equal(niveauScore(SEUIL_EXCELLENT - 0.1), "bon");
  assert.equal(niveauScore(SEUIL_BON), "bon");
  assert.equal(niveauScore(SEUIL_BON - 0.1), "ameliorer");
  assert.equal(niveauScore(0), "ameliorer");
});

test("COULEUR_NIVEAU : bleu excellent, vert bon, rouge à améliorer", () => {
  assert.equal(COULEUR_NIVEAU.excellent, "#1E3A8A");
  assert.equal(COULEUR_NIVEAU.bon, "#16A34A");
  assert.equal(COULEUR_NIVEAU.ameliorer, "#DC2626");
});
