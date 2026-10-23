/**
 * Primitives de génération PDF sans dépendance (Helvetica, WinAnsi).
 * Factures, affiches et cartes s'appuient sur ces fonctions.
 */

const SPECIAUX: Record<string, number> = { "€": 0x80, "…": 0x85, "–": 0x96, "—": 0x97, "‘": 0x27, "’": 0x27, "“": 0x22, "”": 0x22, "œ": 0x9c, "Œ": 0x8c, "•": 0x95, "\u202f": 0x20, "\u00a0": 0x20 };

const winAnsi = (texte: string) => [...texte].map((c) => SPECIAUX[c] ?? (c.charCodeAt(0) <= 0xff ? c.charCodeAt(0) : 0x3f));

const hex = (texte: string) => `<${winAnsi(texte).map((b) => b.toString(16).padStart(2, "0")).join("")}>`;

const COMMUNES: Record<string, number> = { " ": 278, ".": 278, ",": 278, "-": 333, "%": 889, "(": 333, ")": 333, "/": 278, ":": 333, "°": 400 };
const REGULIER: Record<string, number> = { I: 278, J: 500, L: 556, F: 611, T: 611, E: 667, M: 833, W: 944, O: 778, Q: 778, G: 778, C: 722, i: 222, l: 222, j: 222, f: 278, t: 278, r: 333, m: 833, w: 722 };
const GRAS: Record<string, number> = { I: 278, J: 556, L: 611, F: 611, T: 611, E: 667, M: 833, W: 944, O: 778, Q: 778, G: 778, i: 278, l: 278, j: 278, f: 333, t: 333, r: 389, m: 889, w: 778 };
const largeurCar = (c: string, gras: boolean) => COMMUNES[c] ?? (gras ? GRAS : REGULIER)[c] ?? (/\d/.test(c) ? 556 : /[A-ZÀ-Ý]/.test(c) ? (gras ? 722 : 667) : gras ? 611 : 556);
export const largeur = (texte: string, taille: number, gras = false) => ([...texte].reduce((s, c) => s + largeurCar(c, gras), 0) * taille) / 1000;

export const couleur = (r: number, g: number, b: number) => `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
export const BLEU = couleur(0x1e, 0x3a, 0x8a);
export const VERT = couleur(0x16, 0xa3, 0x4a);
export const ENCRE = couleur(0x0f, 0x17, 0x2a);
export const GRIS = couleur(0x64, 0x74, 0x8b);
export const SURFACE = couleur(0xf5, 0xf7, 0xfb);
export const BLANC = "1 1 1";

export const formatFCFA = (n: number) => `${n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} FCFA`;
export const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

/** Zone de dessin : origine en bas à gauche (coordonnées PDF). */
export function creerCanvas() {
  const ops: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, c: string) => ops.push(`${c} rg ${x} ${y} ${w} ${h} re f`);
  const texte = (x: number, y: number, t: string, { taille = 10, gras = false, c = ENCRE, droite = false, centre = 0 } = {}) =>
    ops.push(`BT ${c} rg /${gras ? "F2" : "F1"} ${taille} Tf ${(droite ? x - largeur(t, taille, gras) : centre ? x - largeur(t, taille, gras) / 2 : x).toFixed(1)} ${y} Td ${hex(t)} Tj ET`);
  const trait = (x1: number, y1: number, x2: number, y2: number, c = couleur(0xe2, 0xe8, 0xf0), w = 1) => ops.push(`${c} RG ${w} w ${x1} ${y1} m ${x2} ${y2} l S`);
  /** Dessine un QR : x, y = coin bas-gauche du code, m = taille d'un module en points. */
  const qr = (x: number, y: number, m: number, matrice: boolean[][]) => {
    const n = matrice.length;
    rect(x - 4 * m, y - 4 * m, (n + 8) * m, (n + 8) * m, BLANC);
    for (let ligne = 0; ligne < n; ligne++) for (let col = 0; col < n; col++) if (matrice[ligne][col]) rect(x + col * m, y + (n - 1 - ligne) * m, m, m, ENCRE);
  };
  return { ops, rect, texte, trait, qr };
}

/** Assemble le flux de contenu en document PDF A4 (595 × 842 pt). */
export function assemblerPdf(contenu: string): Uint8Array {
  const objets = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${contenu.length} >>\nstream\n${contenu}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const positions = objets.map((o, i) => {
    const position = pdf.length;
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
    return position;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n${positions.map((p) => `${String(p).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Uint8Array.from(pdf, (c) => c.charCodeAt(0));
}
