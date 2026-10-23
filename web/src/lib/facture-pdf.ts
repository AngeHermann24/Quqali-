import { BLEU, BLANC, GRIS, SURFACE, VERT, assemblerPdf, couleur, creerCanvas, dateFr, formatFCFA, largeur } from "./pdf.ts";

export { formatFCFA } from "./pdf.ts";

export interface DonneesFacture {
  numero: string;
  date: string;
  emetteur: { nom: string; lignes: string[] };
  client: { nom: string; lignes: string[] };
  lignes: { libelle: string; detail?: string; montant: number }[];
  tva: number;
  paiement: { moyen: string; compte: string; reference: string };
  mention: string;
}

export function genererFacturePdf(f: DonneesFacture): Uint8Array {
  const { ops, rect, texte, trait } = creerCanvas();

  rect(0, 762, 595, 80, BLEU);
  texte(50, 805, "Quali", { taille: 24, gras: true, c: BLANC });
  texte(50 + largeur("Quali", 24, true), 805, "CI", { taille: 24, gras: true, c: couleur(0x7e, 0xe2, 0xa4) });
  texte(50, 784, "Le label de confiance des établissements de Côte d'Ivoire", { taille: 9, c: BLANC });
  texte(545, 805, "FACTURE", { taille: 20, gras: true, c: BLANC, droite: true });
  texte(545, 784, `N° ${f.numero}`, { taille: 10, c: BLANC, droite: true });

  texte(50, 725, "ÉMETTEUR", { taille: 8, gras: true, c: GRIS });
  texte(50, 710, f.emetteur.nom, { gras: true });
  f.emetteur.lignes.forEach((l, i) => texte(50, 696 - i * 13, l, { taille: 9, c: GRIS }));
  texte(320, 725, "FACTURÉ À", { taille: 8, gras: true, c: GRIS });
  texte(320, 710, f.client.nom, { gras: true });
  f.client.lignes.forEach((l, i) => texte(320, 696 - i * 13, l, { taille: 9, c: GRIS }));

  rect(50, 600, 495, 34, SURFACE);
  texte(62, 612, `Date : ${dateFr(f.date)}`, { taille: 9 });
  texte(220, 612, `Référence : ${f.paiement.reference}`, { taille: 9 });
  texte(533, 612, "PAYÉE", { taille: 10, gras: true, c: VERT, droite: true });

  texte(50, 570, "DÉSIGNATION", { taille: 8, gras: true, c: GRIS });
  texte(545, 570, "MONTANT TTC", { taille: 8, gras: true, c: GRIS, droite: true });
  trait(50, 562, 545, 562, BLEU, 1.5);
  let y = 540;
  for (const l of f.lignes) {
    texte(50, y, l.libelle);
    if (l.detail) texte(50, y - 13, l.detail, { taille: 8.5, c: GRIS });
    texte(545, y, formatFCFA(l.montant), { droite: true, gras: true });
    y -= l.detail ? 38 : 26;
    trait(50, y + 12, 545, y + 12);
  }

  const total = f.lignes.reduce((s, l) => s + l.montant, 0);
  const ht = Math.round(total / (1 + f.tva / 100));
  y -= 10;
  for (const [label, valeur] of [
    ["Total HT", ht],
    [`TVA (${f.tva} %)`, total - ht],
  ] as const) {
    texte(400, y, label, { taille: 9, c: GRIS });
    texte(545, y, formatFCFA(valeur), { taille: 9, droite: true });
    y -= 16;
  }
  rect(390, y - 12, 155, 26, BLEU);
  texte(400, y - 3, "Total TTC", { gras: true, c: BLANC });
  texte(537, y - 3, formatFCFA(total), { gras: true, c: BLANC, droite: true });

  y -= 60;
  texte(50, y, "Règlement", { taille: 8, gras: true, c: GRIS });
  texte(50, y - 15, `${f.paiement.moyen} · ${f.paiement.compte}`, { taille: 9 });

  rect(50, 70, 495, 1.5, VERT);
  texte(50, 54, f.mention, { taille: 8.5, c: GRIS });
  texte(50, 40, "Document généré automatiquement. Prototype : aucune valeur fiscale.", { taille: 7.5, c: GRIS });

  return assemblerPdf(ops.join("\n"));
}
