export type CritereKey = "hygiene" | "accueil" | "presentation" | "gouvernance";
export type Scores = Record<CritereKey, number>;

/** Pondération du référentiel d'audit (étape 3) : source unique de vérité. */
export const POIDS: Record<CritereKey, number> = { hygiene: 30, accueil: 25, presentation: 20, gouvernance: 25 };

export function scoreGlobal(s: Scores) {
  const brut = (Object.keys(POIDS) as CritereKey[]).reduce((t, k) => t + (s[k] * POIDS[k]) / 100, 0);
  return Math.floor(brut * 10 + 1e-9) / 10;
}

/** Niveaux qualité affichés au public : excellent ≥ 90, bon ≥ seuil de certification (80), sinon à améliorer. */
export type NiveauQualite = "excellent" | "bon" | "ameliorer";

export const SEUIL_EXCELLENT = 90;
export const SEUIL_BON = 80;

export function niveauScore(score: number): NiveauQualite {
  if (score >= SEUIL_EXCELLENT) return "excellent";
  if (score >= SEUIL_BON) return "bon";
  return "ameliorer";
}

export const COULEUR_NIVEAU: Record<NiveauQualite, string> = {
  excellent: "#1E3A8A",
  bon: "#16A34A",
  ameliorer: "#DC2626",
};
