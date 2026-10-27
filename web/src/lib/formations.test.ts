import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FORMATIONS, capsuleLisible, dureeTotale, progressionFormation } from "./formations.ts";

describe("formations", () => {
  const f = FORMATIONS[0];

  it("chaque formation a un prix et des capsules dont un aperçu gratuit", () => {
    for (const fo of FORMATIONS) {
      assert.ok(fo.prix > 0, fo.id);
      assert.ok(fo.capsules.length >= 3, fo.id);
      assert.ok(fo.capsules.some((c) => c.apercu), fo.id);
    }
  });

  it("progression : 0 % sans vue, 100 % quand toutes sont vues", () => {
    assert.equal(progressionFormation(f, []), 0);
    const toutes = f.capsules.map((c) => `${f.id}/${c.id}`);
    assert.equal(progressionFormation(f, toutes), 100);
    assert.equal(progressionFormation(f, [toutes[0]]), Math.round(100 / f.capsules.length));
  });

  it("une capsule payante exige l'achat ; l'aperçu reste gratuit", () => {
    const payante = f.capsules.find((c) => !c.apercu)!;
    const gratuite = f.capsules.find((c) => c.apercu)!;
    assert.equal(capsuleLisible(f, payante, []), false);
    assert.equal(capsuleLisible(f, payante, [f.id]), true);
    assert.equal(capsuleLisible(f, gratuite, []), true);
  });

  it("dureeTotale additionne les minutes", () => {
    assert.equal(dureeTotale(f), f.capsules.reduce((s, c) => s + parseInt(c.duree, 10), 0));
  });
});
