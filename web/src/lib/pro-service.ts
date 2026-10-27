import type { Abonnement } from "./abonnement";
import type { Dossier } from "./espace";
import type { ComptePro } from "./pro-demo";

/**
 * Couche de services de l'app Pro — façade entre les écrans et les données.
 * Démo : localStorage via useStockage ; à brancher sur Supabase (RLS par
 * établissement) sans réécrire les écrans. Imports relatifs uniquement.
 */

export type DroitPro = "dossier" | "abonnement" | "avis" | "reservations" | "fiche" | "equipe" | "paiements";

/** Matrice des rôles — vérifiée côté serveur en production (RLS + policies). */
export const DROITS: Record<ComptePro["role"], DroitPro[]> = {
  gerant: ["dossier", "abonnement", "avis", "reservations", "fiche", "equipe", "paiements"],
  responsable: ["avis", "reservations", "fiche"],
  comptable: ["abonnement", "paiements"],
};

export function peut(role: ComptePro["role"], droit: DroitPro): boolean {
  return DROITS[role].includes(droit);
}

/** Session de démonstration : 90 jours. */
export const SESSION_JOURS = 90;
export function sessionValide(compte: ComptePro | null | undefined, maintenantIso: string): boolean {
  if (!compte?.creeLe) return false;
  return new Date(maintenantIso).getTime() - new Date(compte.creeLe).getTime() < SESSION_JOURS * 24 * 60 * 60 * 1000;
}

/** Le dossier est-il publié (visible côté usager) ? Détermine la navigation. */
export function estPublie(dossier: Dossier | null | undefined): boolean {
  return dossier?.statut === "admis" && !!dossier?.abonnement;
}

/** Pack actif de l'établissement. */
export function packActif(dossier: Dossier | null | undefined): "basique" | "premium" | null {
  const abo: Abonnement | undefined = dossier?.abonnement;
  if (!abo) return null;
  return abo.pack === "premium" ? "premium" : "basique";
}

/** Fonctionnalités réservées au pack Premium. */
export const FONCTIONS_PREMIUM = ["reservations", "visite3d", "rapportIa"] as const;
export type FonctionPremium = (typeof FONCTIONS_PREMIUM)[number];
export function aAcces(dossier: Dossier | null | undefined, fonction: FonctionPremium): boolean {
  void fonction; // toutes les fonctions Premium partagent la même règle pour l'instant
  return packActif(dossier) === "premium";
}
