export type CritereKey = "hygiene" | "accueil" | "presentation" | "gouvernance";
export type Scores = Record<CritereKey, number>;

/** Pondération du référentiel d'audit (étape 3) : source unique de vérité. */
export const POIDS: Record<CritereKey, number> = { hygiene: 30, accueil: 25, presentation: 20, gouvernance: 25 };

export function scoreGlobal(s: Scores) {
  const brut = (Object.keys(POIDS) as CritereKey[]).reduce((t, k) => t + (s[k] * POIDS[k]) / 100, 0);
  return Math.floor(brut * 10 + 1e-9) / 10;
}
