import { genererQr } from "./qrcode.ts";
import { BLEU, BLANC, ENCRE, GRIS, SURFACE, VERT, assemblerPdf, couleur, creerCanvas } from "./pdf.ts";

export const URL_SITE = "https://quqliter.ci";
const ACCENT = couleur(0x7e, 0xe2, 0xa4);

const bandeau = (canvas: ReturnType<typeof creerCanvas>, sousTitre: string) => {
  const { rect, texte } = canvas;
  rect(0, 722, 595, 120, BLEU);
  texte(50, 795, "Quali", { taille: 30, gras: true, c: BLANC });
  texte(50 + 60, 795, "CI", { taille: 30, gras: true, c: ACCENT });
  texte(50, 772, "Le label de confiance des établissements de Côte d'Ivoire", { taille: 11, c: BLANC });
  texte(545, 772, sousTitre, { taille: 9, c: BLANC, droite: true });
};

/** Affiche A4 destinée aux gares routières et d'Uptown : QR vers la plateforme. */
export function genererAfficheGarePdf({ lieu, url = URL_SITE }: { lieu: string; url?: string }): Uint8Array {
  const canvas = creerCanvas();
  const { rect, texte, trait, qr } = canvas;
  const matrice = genererQr(url);
  const m = 5.4;
  const cote = (matrice.taille + 8) * m;
  const cx = (595 - cote) / 2;

  bandeau(canvas, "Affiche de sensibilisation — gares");
  texte(297, 680, "Voyagez l'esprit tranquille", { taille: 26, gras: true, centre: 297 });
  texte(297, 655, "Hôtels, restaurants et cliniques audités sur place, près de chez vous.", { taille: 12, c: ENCRE, centre: 297 });

  rect(cx - 14, 330, cote + 28, cote + 28, SURFACE);
  qr(cx, 330 + 14, m, matrice.modules);

  texte(297, 305, "Scannez le code pour trouver un établissement certifié", { taille: 13, gras: true, c: BLEU, centre: 297 });
  texte(297, 287, url.replace(/^https?:\/\//, ""), { taille: 11, c: GRIS, centre: 297 });

  const lignes = [
    "Un audit sur place par un agent indépendant, pas un simple avis en ligne.",
    "Seuls les établissements notés 80 % et plus affichent le badge Quqliter.",
    "Vos avis vérifiés comptent pour 30 % des Awards de fin d'année.",
  ];
  let y = 240;
  for (const l of lignes) {
    rect(50, y - 2, 6, 6, VERT);
    texte(66, y, l, { taille: 10.5 });
    y -= 24;
  }
  trait(50, y - 4, 545, y - 4, BLEU, 1.5);
  texte(50, y - 24, `Diffusé par Quqliter — ${lieu || "gares routières"}.`, { taille: 9, c: GRIS });
  texte(545, y - 24, "Gratuit pour les usagers. Le paiement n'influence jamais la note.", { taille: 9, c: GRIS, droite: true });
  return assemblerPdf(canvas.ops.join("\n"));
}

/** Carte à poser au comptoir : QR vers la fiche + code de visite de secours. */
export function genererCarteAvisPdf({ nom, url, code }: { nom: string; url: string; code: string }): Uint8Array {
  const canvas = creerCanvas();
  const { rect, texte, trait, qr } = canvas;
  const matrice = genererQr(url);
  const m = 4.6;
  const cote = (matrice.taille + 8) * m;

  bandeau(canvas, "Carte avis vérifié — comptoir");
  texte(297, 678, nom, { taille: 22, gras: true, centre: 297 });
  texte(297, 654, "Votre avis compte : il est vérifié et pèse 30 % dans les Awards Quqliter.", { taille: 11, c: ENCRE, centre: 297 });

  rect(60, 380, cote + 20, cote + 20, SURFACE);
  qr(60 + 10, 380 + 10, m, matrice.modules);

  const x = 60 + cote + 50;
  texte(x, 560, "Comment laisser votre avis", { taille: 14, gras: true, c: BLEU });
  const etapes = [
    "1. Scannez le QR code avec votre téléphone.",
    "2. Créez votre compte en 30 secondes.",
    `3. Saisissez le code de visite : ${code}`,
    "4. Notez votre expérience en toute liberté.",
  ];
  let y = 534;
  for (const e of etapes) {
    texte(x, y, e, { taille: 10.5 });
    y -= 22;
  }
  trait(x, y + 4, 545, y + 4, SURFACE, 1);
  texte(x, y - 14, "Pas de smartphone ? Notez le code et donnez votre", { taille: 9.5, c: GRIS });
  texte(x, y - 27, "avis plus tard depuis quqliter.ci.", { taille: 9.5, c: GRIS });

  rect(50, 300, 495, 42, SURFACE);
  texte(66, 322, "Un seul avis par visite : chaque avis est rattaché à une visite réelle.", { taille: 10, c: ENCRE });
  texte(66, 308, "Cet établissement est certifié Quqliter : audit sur place, note ≥ 80 %.", { taille: 10, c: ENCRE });

  rect(50, 70, 495, 1.5, VERT);
  texte(50, 54, `${url.replace(/^https?:\/\//, "")} — avis vérifiés Quqliter`, { taille: 8.5, c: GRIS });
  texte(545, 54, "Document généré par Quqliter", { taille: 8.5, c: GRIS, droite: true });
  return assemblerPdf(canvas.ops.join("\n"));
}
