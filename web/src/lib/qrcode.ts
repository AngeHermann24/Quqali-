/**
 * Générateur de QR codes autonome : mode octet (UTF-8), versions 1 à 6,
 * correction d'erreurs niveau M, choix du masque par pénalité minimale.
 * Adapté de l'algorithme de référence de Nayuki (licence MIT).
 */

// Capacités niveau M : [codewords de données, codewords ECC par bloc, nombre de blocs]
const CAPACITES: [number, number, number][] = [
  [16, 10, 1], // v1 → 14 octets
  [28, 16, 1], // v2 → 26 octets
  [44, 26, 1], // v3 → 42 octets
  [64, 18, 2], // v4 → 62 octets
  [86, 24, 2], // v5 → 84 octets
  [108, 16, 4], // v6 → 106 octets
];
// Centres des motifs d'alignement par version (v1 : aucun)
const ALIGNEMENTS: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

// Arithmétique dans GF(256), polynôme primitif 0x11D
const EXP = new Array<number>(512).fill(0);
const LOG = new Array<number>(256).fill(0);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

// Polynôme diviseur Reed-Solomon de degré donné (sans le coefficient dominant)
function rsDiviseur(degre: number): number[] {
  const res = new Array<number>(degre).fill(0);
  res[degre - 1] = 1;
  let racine = 1;
  for (let i = 0; i < degre; i++) {
    for (let j = 0; j < degre; j++) {
      res[j] = gfMul(res[j], racine);
      if (j + 1 < degre) res[j] ^= res[j + 1];
    }
    racine = gfMul(racine, 0x02);
  }
  return res;
}

// Reste de la division (data · x^degre) mod diviseur
function rsReste(donnees: number[], diviseur: number[]): number[] {
  const res = new Array<number>(diviseur.length).fill(0);
  for (const d of donnees) {
    const facteur = d ^ res[0];
    res.copyWithin(0, 1);
    res[res.length - 1] = 0;
    if (facteur !== 0) for (let i = 0; i < res.length; i++) res[i] ^= gfMul(diviseur[i], facteur);
  }
  return res;
}

const MASQUES: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

export interface MatriceQr {
  taille: number;
  version: number;
  modules: boolean[][];
}

export function genererQr(texte: string): MatriceQr {
  const octets = [...new TextEncoder().encode(texte)];
  const version = CAPACITES.findIndex(([don]) => octets.length <= don - 2) + 1;
  if (!version) throw new Error(`Texte trop long pour un QR (maximum ${CAPACITES.at(-1)![0] - 2} octets).`);
  const [nbDonnees, eccParBloc, nbBlocs] = CAPACITES[version - 1];
  const taille = 21 + 4 * (version - 1);

  // Segments : mode octet (0100) + longueur (8 bits) + données + terminateur + remplissage
  const bits: number[] = [0, 1, 0, 0];
  for (let i = 7; i >= 0; i--) bits.push((octets.length >> i) & 1);
  for (const b of octets) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 0; i < 4 && bits.length < nbDonnees * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const donnees: number[] = [];
  for (let i = 0; i < bits.length; i += 8) donnees.push(bits.slice(i, i + 8).reduce((s, b) => (s << 1) | b, 0));
  for (let pad = 0xec; donnees.length < nbDonnees; pad ^= 0xec ^ 0x11) donnees.push(pad);

  // Blocs ECC + entrelacement
  const tailleBloc = nbDonnees / nbBlocs;
  const diviseur = rsDiviseur(eccParBloc);
  const blocsDonnees: number[][] = [];
  const blocsEcc: number[][] = [];
  for (let i = 0; i < nbBlocs; i++) {
    const bloc = donnees.slice(i * tailleBloc, (i + 1) * tailleBloc);
    blocsDonnees.push(bloc);
    blocsEcc.push(rsReste(bloc, diviseur));
  }
  const entrelaces: number[] = [];
  for (let j = 0; j < tailleBloc; j++) for (let i = 0; i < nbBlocs; i++) entrelaces.push(blocsDonnees[i][j]);
  for (let j = 0; j < eccParBloc; j++) for (let i = 0; i < nbBlocs; i++) entrelaces.push(blocsEcc[i][j]);

  // Matrice : modules[y][x], isFunction pour ne pas écraser les motifs
  const modules: boolean[][] = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const fonction: boolean[][] = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const placer = (x: number, y: number, sombre: boolean, estFonction = true) => {
    modules[y][x] = sombre;
    if (estFonction) fonction[y][x] = true;
  };
  const finders = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < taille && y >= 0 && y < taille) {
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          placer(x, y, d !== 2 && d !== 4);
        }
      }
  };
  // Timing (les finders écrasent les extrémités)
  for (let i = 0; i < taille; i++) {
    placer(6, i, i % 2 === 0);
    placer(i, 6, i % 2 === 0);
  }
  finders(3, 3);
  finders(taille - 4, 3);
  finders(3, taille - 4);
  // Alignement
  const pos = ALIGNEMENTS[version - 1];
  for (const py of pos)
    for (const px of pos) {
      const coin = (px === pos[0] && py === pos[0]) || (px === pos.at(-1) && py === pos[0]) || (px === pos[0] && py === pos.at(-1));
      if (!coin) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) placer(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  // Réservation des zones de format (dessinées après le masque) + module sombre
  const reserverFormat = () => {
    for (let i = 0; i <= 5; i++) placer(8, i, false);
    placer(8, 7, false);
    placer(8, 8, false);
    placer(7, 8, false);
    for (let i = 9; i < 15; i++) placer(14 - i, 8, false);
    for (let i = 0; i < 8; i++) placer(taille - 1 - i, 8, false);
    for (let i = 8; i < 15; i++) placer(8, taille - 15 + i, false);
    placer(8, taille - 8, true);
  };
  reserverFormat();

  // Placement des données en zigzag
  let bit = 0;
  const totalBits = entrelaces.length * 8;
  for (let right = taille - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const monte = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < taille; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = monte ? taille - 1 - vert : vert;
        if (!fonction[y][x] && bit < totalBits) {
          modules[y][x] = ((entrelaces[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
          bit++;
        }
      }
    }
  }

  // Infos de format : 5 bits (ECC M = 0b00 + masque) + BCH(15,5), XOR 0x5412
  const bitsFormat = (masque: number) => {
    const donnee = masque; // niveau M → les 2 bits ECC valent 00
    let rem = donnee;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    return ((donnee << 10) | rem) ^ 0x5412;
  };
  const dessinerFormat = (masque: number) => {
    const b = bitsFormat(masque);
    const get = (i: number) => ((b >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) modules[i][8] = get(i);
    modules[7][8] = get(6);
    modules[8][8] = get(7);
    modules[8][7] = get(8);
    for (let i = 9; i < 15; i++) modules[8][14 - i] = get(i);
    for (let i = 0; i < 8; i++) modules[8][taille - 1 - i] = get(i);
    for (let i = 8; i < 15; i++) modules[taille - 15 + i][8] = get(i);
    modules[taille - 8][8] = true;
  };

  // Pénalités (règles ISO 18004)
  const penalite = (): number => {
    let p = 0;
    // Règle 1 : séries ≥ 5 en ligne et en colonne
    for (const horizontal of [true, false]) {
      for (let a = 0; a < taille; a++) {
        let couleur = false;
        let serie = 0;
        for (let b = 0; b < taille; b++) {
          const c = horizontal ? modules[a][b] : modules[b][a];
          if (b === 0) {
            couleur = c;
            serie = 1;
          } else if (c === couleur) serie++;
          else {
            if (serie >= 5) p += 3 + (serie - 5);
            couleur = c;
            serie = 1;
          }
        }
        if (serie >= 5) p += 3 + (serie - 5);
      }
    }
    // Règle 2 : blocs 2×2 de même couleur
    for (let y = 0; y < taille - 1; y++)
      for (let x = 0; x < taille - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) p += 3;
      }
    // Règle 3 : motif 1011101 encadré de 4 modules clairs
    const motif = [true, false, true, true, true, false, true];
    for (const horizontal of [true, false]) {
      for (let a = 0; a < taille; a++) {
        const cell = (i: number) => (horizontal ? modules[a][i] : modules[i][a]);
        for (let i = 0; i + 7 <= taille; i++) {
          if (!motif.every((m, k) => cell(i + k) === m)) continue;
          const avant = i >= 4 && [0, 1, 2, 3].every((k) => !cell(i - 1 - k));
          const apres = i + 11 <= taille && [7, 8, 9, 10].every((k) => !cell(i + k));
          if (avant || apres) p += 40;
        }
      }
    }
    // Règle 4 : proportion de modules sombres
    const sombres = modules.flat().filter(Boolean).length;
    const total = taille * taille;
    p += Math.floor(Math.abs(sombres * 20 - total * 10) / total) * 10;
    return p;
  };

  // Essai des 8 masques, on garde la pénalité la plus faible
  const donneesBrutes = modules.map((r) => [...r]);
  let meilleur = { masque: 0, score: Infinity, matrice: donneesBrutes };
  for (let m = 0; m < 8; m++) {
    const essai = donneesBrutes.map((r) => [...r]);
    for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) if (!fonction[y][x] && MASQUES[m](x, y)) essai[y][x] = !essai[y][x];
    const sauvegarde = modules;
    for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) sauvegarde[y][x] = essai[y][x];
    dessinerFormat(m);
    const score = penalite();
    if (score < meilleur.score) meilleur = { masque: m, score, matrice: sauvegarde.map((r) => [...r]) };
  }
  return { taille, version, modules: meilleur.matrice };
}
