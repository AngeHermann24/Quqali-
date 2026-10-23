import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { genererFacturePdf } from "./facture-pdf.ts";

const facture = {
  numero: "FAC-2026-00001",
  date: "2026-10-20T00:00:00.000Z",
  emetteur: { nom: "Quqliter", lignes: ["Abidjan, Côte d'Ivoire"] },
  client: { nom: "Résidence Les Cocotiers", lignes: ["Riviera 3, Cocody", "Konan Yao — Gérant"] },
  lignes: [
    { libelle: "Pack Premium — abonnement annuel (12 mois)", detail: "Du 20/10/2026 au 20/10/2027", montant: 459000 },
    { libelle: "Avoir prorata (pack précédent)", montant: -5000 },
  ],
  tva: 18,
  paiement: { moyen: "Orange Money", compte: "07 •• •• 12 34", reference: "QC-20261020-0001" },
  mention: "Le paiement n'influence jamais la note attribuée lors de l'audit.",
};

test("la facture est un PDF valide (en-tête, table xref exacte, fin de fichier)", () => {
  const octets = genererFacturePdf(facture);
  const pdf = Buffer.from(octets).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-1.4\n"));
  assert.ok(pdf.endsWith("%%EOF"));
  const startxref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
  assert.ok(pdf.slice(startxref).startsWith("xref\n0 7\n"));
  const offsets = [...pdf.slice(startxref).matchAll(/(\d{10}) 00000 n/g)].map((m) => Number(m[1]));
  assert.equal(offsets.length, 6);
  offsets.forEach((o, i) => assert.ok(pdf.slice(o).startsWith(`${i + 1} 0 obj`), `objet ${i + 1}`));
  const longueur = Number(/\/Length (\d+) >>\nstream\n/.exec(pdf)?.[1]);
  const debut = pdf.indexOf("stream\n") + 7;
  assert.equal(pdf.slice(debut + longueur, debut + longueur + 10), "\nendstream");
  if (process.env.FACTURE_SORTIE) writeFileSync(join(process.env.FACTURE_SORTIE || tmpdir(), "facture-test.pdf"), octets);
});

test("les accents français sont encodés en WinAnsi (é = e9, Côte = 43f474)", () => {
  const pdf = Buffer.from(genererFacturePdf(facture)).toString("latin1");
  assert.ok(pdf.includes("43f4746520"));
  assert.ok(pdf.includes("52e973696465"));
});
