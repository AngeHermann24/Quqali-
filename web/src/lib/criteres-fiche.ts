import type { CritereKey } from "./scores.ts";
import { CRITERES } from "./data.ts";

/* Anneaux de la fiche établissement : libellé affiché + critère d'audit mesuré.
   L'ordre suit la maquette (Qualité, Accueil, Propreté). Modifier ici pour
   changer les libellés ou les critères exposés aux usagers. */
export const ANNEAUX_FICHE: { cle: CritereKey; label: string }[] = [
  { cle: "gouvernance", label: "Qualité" },
  { cle: "accueil", label: "Accueil" },
  { cle: "hygiene", label: "Propreté" },
];

/** Explication d'un anneau (infobulle au toucher). */
export const aideCritere = (cle: CritereKey) => CRITERES.find((c) => c.key === cle)?.description ?? "";
