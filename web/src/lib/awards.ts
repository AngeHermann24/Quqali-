import type { Secteur } from "./data";

export type CategorieId = "hotel" | "restaurant" | "sante" | "services" | "education" | "commerce" | "transport" | "accueil" | "hygiene";
export type BaseEvaluateurs = "global" | "accueil" | "hygiene";

export const CATEGORIES: { id: CategorieId; nom: string; secteur?: Secteur; base: BaseEvaluateurs }[] = [
  { id: "hotel", nom: "Meilleur hôtel", secteur: "hotellerie", base: "global" },
  { id: "restaurant", nom: "Meilleur restaurant", secteur: "restauration", base: "global" },
  { id: "sante", nom: "Meilleur établissement de santé", secteur: "sante", base: "global" },
  { id: "services", nom: "Meilleure prestation de services", secteur: "services", base: "global" },
  { id: "education", nom: "Meilleur établissement éducatif", secteur: "education", base: "global" },
  { id: "commerce", nom: "Meilleur centre commercial", secteur: "commerce", base: "global" },
  { id: "transport", nom: "Meilleure compagnie de transport", secteur: "transport", base: "global" },
  { id: "accueil", nom: "Meilleur accueil", base: "accueil" },
  { id: "hygiene", nom: "Meilleure hygiène", base: "hygiene" },
];

export const PONDERATION = { clients: 0.3, evaluateurs: 0.7 } as const;
export const SEUIL_CONFIANCE = 5;

export interface VoteClient {
  note: number;
  personnel?: number;
}

export interface CandidatAward {
  id: string;
  nom: string;
  slug?: string;
  secteur: Secteur;
  global: number;
  accueil: number;
  hygiene: number;
  eligible: boolean;
}

const arrondi = (n: number) => Math.round(n * 10) / 10;

export const noteVote = (v: VoteClient, base: BaseEvaluateurs) => (base === "accueil" ? (v.personnel ?? v.note) : v.note);

/**
 * Moyenne des avis lissée (Bayes) : avec peu de votes, on se rapproche de la
 * moyenne de référence plutôt que de laisser un seul avis décider du palmarès.
 */
export function scoreClients(votes: VoteClient[], base: BaseEvaluateurs, moyenneReference: number) {
  const notes = votes.map((v) => noteVote(v, base));
  const moyenne = notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : moyenneReference;
  const lissee = (notes.length / (notes.length + SEUIL_CONFIANCE)) * moyenne + (SEUIL_CONFIANCE / (notes.length + SEUIL_CONFIANCE)) * moyenneReference;
  return arrondi(lissee * 20);
}

export const scoreEvaluateurs = (c: CandidatAward, base: BaseEvaluateurs) => c[base];
export const scoreFinal = (clients: number, evaluateurs: number) => arrondi(PONDERATION.clients * clients + PONDERATION.evaluateurs * evaluateurs);

export interface LigneClassement {
  rang: number;
  candidat: CandidatAward;
  nbVotes: number;
  scoreClients: number;
  scoreEvaluateurs: number;
  scoreFinal: number;
  laureat: boolean;
}

export function classement(categorie: (typeof CATEGORIES)[number], candidats: CandidatAward[], votesParEtab: Map<string, VoteClient[]>, moyenneReference: number) {
  const lignes = candidats
    .filter((c) => c.eligible && (!categorie.secteur || c.secteur === categorie.secteur))
    .map((c) => {
      const votes = votesParEtab.get(c.id) ?? [];
      const clients = scoreClients(votes, categorie.base, moyenneReference);
      const evaluateurs = scoreEvaluateurs(c, categorie.base);
      return { rang: 0, candidat: c, nbVotes: votes.length, scoreClients: clients, scoreEvaluateurs: evaluateurs, scoreFinal: scoreFinal(clients, evaluateurs), laureat: false };
    })
    .sort((a, b) => b.scoreFinal - a.scoreFinal || b.nbVotes - a.nbVotes || a.candidat.nom.localeCompare(b.candidat.nom, "fr"));
  lignes.forEach((l, i) => {
    l.rang = i + 1;
    l.laureat = i === 0;
  });
  return lignes;
}
