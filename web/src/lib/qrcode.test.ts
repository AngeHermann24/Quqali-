import { strict as assert } from "node:assert";
import { test } from "node:test";
import { genererQr } from "./qrcode.ts";

const finder = (m: boolean[][], cx: number, cy: number) => {
  // Anneau sombre + centre 3×3 sombre + séparateur clair
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      const attendu = d === 3 || d <= 1;
      assert.strictEqual(m[cy + dy][cx + dx], attendu, `finder (${cx},${cy}) dx=${dx} dy=${dy}`);
    }
};

test("taille de la matrice selon la version", () => {
  assert.strictEqual(genererQr("a".repeat(14)).taille, 21); // v1
  assert.strictEqual(genererQr("a".repeat(26)).taille, 25); // v2
  assert.strictEqual(genererQr("https://quqliter.ci").taille, 25); // 18 octets → v2
  assert.strictEqual(genererQr("https://quqliter.ci/etablissements/saveurs-d-akwaba#avis").taille, 33); // 55 octets → v4
});

test("motifs repères aux trois coins", () => {
  const { taille, modules } = genererQr("https://quqliter.ci");
  finder(modules, 3, 3);
  finder(modules, taille - 4, 3);
  finder(modules, 3, taille - 4);
});

test("lignes de synchronisation alternées", () => {
  const { taille, modules } = genererQr("test");
  for (let i = 8; i < taille - 8; i++) {
    assert.strictEqual(modules[6][i], i % 2 === 0);
    assert.strictEqual(modules[i][6], i % 2 === 0);
  }
});

test("module sombre et zone de format renseignés", () => {
  const { taille, modules } = genererQr("test");
  assert.strictEqual(modules[taille - 8][8], true);
  // Les deux copies des infos de format contiennent des modules sombres
  const colonne8 = Array.from({ length: taille }, (_, y) => modules[y][8]);
  assert.ok(colonne8.slice(0, 9).some(Boolean));
  const ligne8 = modules[8];
  assert.ok(ligne8.slice(taille - 8).some(Boolean));
});

test("déterministe et dépendant du contenu", () => {
  const a = genererQr("quqliter.ci");
  const b = genererQr("quqliter.ci");
  const c = genererQr("quqliter.ci/avis");
  assert.deepStrictEqual(a.modules, b.modules);
  assert.notDeepStrictEqual(a.modules, c.modules);
});

test("rejet des textes trop longs", () => {
  assert.throws(() => genererQr("a".repeat(107)), /trop long/);
  assert.doesNotThrow(() => genererQr("a".repeat(106)));
});

test("proportion de modules sombres raisonnable (QR lisible)", () => {
  const { modules } = genererQr("https://quqliter.ci/etablissements/saveurs-d-akwaba#avis");
  const sombres = modules.flat().filter(Boolean).length;
  const ratio = sombres / (modules.length * modules.length);
  assert.ok(ratio > 0.3 && ratio < 0.7, `ratio ${ratio}`);
});
