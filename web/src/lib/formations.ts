import type { CritereKey } from "./data";

/** Capsule vidéo d'une formation payante (démo : lecture simulée). */
export interface Capsule {
  id: string;
  titre: string;
  /** Durée affichée, ex. « 4 min ». */
  duree: string;
  /** Accessible sans achat (aperçu gratuit). */
  apercu?: boolean;
}

export interface Formation {
  id: string;
  titre: string;
  theme: CritereKey | "audit";
  description: string;
  prix: number;
  capsules: Capsule[];
}

/** Catalogue de formations Qualité+ Pro — alignées sur la grille d'audit. */
export const FORMATIONS: Formation[] = [
  {
    id: "hygiene-irreprochable",
    titre: "Hygiène irréprochable",
    theme: "hygiene",
    description: "Les 20 points du critère Hygiène : nettoyage, chaîne du froid, sanitaires, certificats.",
    prix: 7900,
    capsules: [
      { id: "h1", titre: "Ce que l'agent contrôle vraiment", duree: "4 min", apercu: true },
      { id: "h2", titre: "Monter un plan de nettoyage émargé", duree: "6 min" },
      { id: "h3", titre: "Cuisine et chaîne du froid", duree: "7 min" },
      { id: "h4", titre: "Sanitaires, linge et linge de toilette", duree: "5 min" },
      { id: "h5", titre: "Dératisation : le certificat qui sauve des points", duree: "4 min" },
    ],
  },
  {
    id: "art-de-l-accueil",
    titre: "L'art de l'accueil",
    theme: "accueil",
    description: "Salutation, gestion de l'attente, réclamations : transformer chaque arrivée en confiance.",
    prix: 5900,
    capsules: [
      { id: "a1", titre: "Accueillir en 30 secondes", duree: "4 min", apercu: true },
      { id: "a2", titre: "Gérer la file d'attente sans friction", duree: "5 min" },
      { id: "a3", titre: "Réclamations : le geste commercial qui rassure", duree: "6 min" },
      { id: "a4", titre: "Le suivi client après la visite", duree: "4 min" },
    ],
  },
  {
    id: "presentation-personnel",
    titre: "Présentation du personnel",
    theme: "presentation",
    description: "Tenues, badges, langage : l'image professionnelle qui monte votre note.",
    prix: 4900,
    capsules: [
      { id: "p1", titre: "Tenues et badges : la règle du jeu", duree: "3 min", apercu: true },
      { id: "p2", titre: "Langage, posture, regards", duree: "5 min" },
      { id: "p3", titre: "Hygiène personnelle au poste", duree: "4 min" },
    ],
  },
  {
    id: "gouvernance-conformite",
    titre: "Gouvernance & conformité",
    theme: "gouvernance",
    description: "Documents, registres, affichage des prix : la conformité sans stress avant le contrôle.",
    prix: 9900,
    capsules: [
      { id: "g1", titre: "Vos documents à jour en une journée", duree: "5 min", apercu: true },
      { id: "g2", titre: "Affichage des prix et mentions obligatoires", duree: "4 min" },
      { id: "g3", titre: "Les registres que l'agent demande toujours", duree: "6 min" },
      { id: "g4", titre: "Se préparer au contrôle inopiné", duree: "5 min" },
    ],
  },
  {
    id: "reussir-son-audit",
    titre: "Réussir son audit Qualité+",
    theme: "audit",
    description: "Le déroulement complet de la visite d'audit et les 80 points de la grille, critère par critère.",
    prix: 6900,
    capsules: [
      { id: "r1", titre: "Comment se déroule la visite", duree: "4 min", apercu: true },
      { id: "r2", titre: "Les 80 points de la grille en détail", duree: "8 min" },
      { id: "r3", titre: "Le jour J : checklist minute par minute", duree: "6 min" },
      { id: "r4", titre: "Après l'audit : lire le rapport et agir", duree: "5 min" },
    ],
  },
];

/** Progression 0–100 d'une formation (capsules visionnées). */
export function progressionFormation(f: Formation, vues: string[]): number {
  if (f.capsules.length === 0) return 0;
  const faites = f.capsules.filter((c) => vues.includes(`${f.id}/${c.id}`)).length;
  return Math.round((faites / f.capsules.length) * 100);
}

/** Une capsule est lisible si la formation est achetée ou si c'est l'aperçu gratuit. */
export function capsuleLisible(f: Formation, c: Capsule, achetees: string[]): boolean {
  return !!c.apercu || achetees.includes(f.id);
}

/** Durée totale affichée (somme des minutes des capsules). */
export function dureeTotale(f: Formation): number {
  return f.capsules.reduce((s, c) => s + (parseInt(c.duree, 10) || 0), 0);
}
