"use client";

import { type AvisClient, type CompteClient, type StatutAvis, creerAvis, modererAvis, codeVisiteDemo, telephoneNorm, type PreuveVisite, type SaisieAvis } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import type { Reservation } from "@/lib/reservation";
import { useStockage } from "@/lib/stockage";

export function useCompteClient() {
  const [compte, setCompte] = useStockage<CompteClient>(CLES.compte);
  const creer = (nom: string, telephone: string, email?: string) =>
    setCompte({ id: `c-${Date.now()}`, nom, telephone, email: email || undefined, creeLe: new Date().toISOString() });
  return { compte, creer, charge: compte !== undefined };
}

export function useAvis(etablissementId: string) {
  const [tous, setTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [reservations] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const avis = tous?.[etablissementId] ?? [];

  const reservationsElegibles = (compte: CompteClient) =>
    (reservations?.[etablissementId] ?? []).filter(
      (r) => (r.statut === "confirmee" || r.statut === "honoree") && telephoneNorm(r.client.telephone) === telephoneNorm(compte.telephone),
    );

  const soumettre = (compte: CompteClient, saisie: Omit<SaisieAvis, "compte">, personnel?: Record<string, number>) => {
    const maintenant = new Date().toISOString();
    const contexte = {
      etablissementId,
      avisExistants: avis,
      codesValides: [codeVisiteDemo(etablissementId)],
      reservationsElegibles: reservationsElegibles(compte).map((r) => r.id),
      avisDuCompte: Object.values(tous ?? {}).flat().filter((a) => a.compteId === compte.id),
      telephoneResponsable: undefined,
    };
    const nouveau = creerAvis({ compte, ...saisie }, contexte, maintenant, avis.length + 1, personnel);
    setTous((prec) => ({ ...prec, [etablissementId]: [nouveau, ...(prec?.[etablissementId] ?? [])] }));
    return nouveau;
  };

  const changerStatut = (id: string, statut: StatutAvis, motif?: string) =>
    setTous((prec) => ({
      ...prec,
      [etablissementId]: (prec?.[etablissementId] ?? []).map((a) => (a.id === id ? { ...a, statut, motifRejet: motif ?? a.motifRejet } : a)),
    }));

  const evaluer = (compte: CompteClient, preuve: PreuveVisite) =>
    modererAvis(
      { compte, note: 5, commentaire: "x".repeat(25), preuve },
      {
        etablissementId,
        avisExistants: avis,
        codesValides: [codeVisiteDemo(etablissementId)],
        reservationsElegibles: reservationsElegibles(compte).map((r) => r.id),
        avisDuCompte: [],
      },
      new Date().toISOString(),
    );

  return { avis, tous: tous ?? {}, reservationsElegibles, soumettre, changerStatut, evaluer, charge: tous !== undefined && reservations !== undefined };
}
