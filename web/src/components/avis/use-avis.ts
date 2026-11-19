"use client";

import { useCallback, useEffect, useState } from "react";
import { type AvisClient, type CompteClient, type StatutAvis, creerAvis, modererAvis, codeVisiteDemo, telephoneNorm, type PreuveVisite, type SaisieAvis } from "@/lib/avis";
import { avisEtablissement, deposerAvis, mesAvis, mesReservations } from "@/lib/actions/usager";
import { CLES } from "@/lib/espace";
import type { Reservation } from "@/lib/reservation";
import { useSession } from "@/components/session";
import { useStockage } from "@/lib/stockage";

/** Compte usager : session Supabase si configurée, sinon stockage local (démo). */
export function useCompteClient() {
  const session = useSession();
  const [local, setLocal] = useStockage<CompteClient>(CLES.compte);
  const supabase = session.mode === "supabase";
  const compte = supabase ? session.compte : local;
  const creer = (nom: string, telephone: string, email?: string) => {
    if (supabase) return; // en mode réel, la création de compte passe par /connexion
    setLocal({ id: `c-${Date.now()}`, nom, telephone, email: email || undefined, creeLe: new Date().toISOString() });
  };
  return { compte, creer, charge: supabase ? session.charge : local !== undefined };
}

export function useAvis(etablissementId: string) {
  const { mode } = useSession();
  const [tous, setTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [reservations] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [db, setDb] = useState<{ avis: AvisClient[]; resas: Reservation[]; mesAvis: AvisClient[] } | null>(null);

  const chargerDb = useCallback(
    async (compte?: CompteClient | null) => {
      const [avis, resas, mes] = await Promise.all([avisEtablissement(etablissementId), compte ? mesReservations(compte.telephone) : Promise.resolve([]), compte ? mesAvis() : Promise.resolve([])]);
      return { avis, resas: resas.filter((r) => r.etablissementId === etablissementId), mesAvis: mes };
    },
    [etablissementId],
  );

  useEffect(() => {
    if (mode !== "supabase") return;
    let actif = true;
    void chargerDb().then((d) => {
      if (actif) setDb(d);
    });
    return () => {
      actif = false;
    };
  }, [mode, chargerDb]);

  const supabase = mode === "supabase";
  const avis = supabase ? (db?.avis ?? []) : (tous?.[etablissementId] ?? []);

  const reservationsElegibles = (compte: CompteClient) =>
    supabase
      ? (db?.resas ?? []).filter((r) => r.statut === "confirmee" || r.statut === "honoree")
      : (reservations?.[etablissementId] ?? []).filter(
          (r) => (r.statut === "confirmee" || r.statut === "honoree") && telephoneNorm(r.client.telephone) === telephoneNorm(compte.telephone),
        );

  const soumettre = (compte: CompteClient, saisie: Omit<SaisieAvis, "compte">, personnel?: Record<string, number>) => {
    if (supabase) {
      // Mode réel : validation serveur dans `deposerAvis`.
      return deposerAvis({ etablissementSlug: etablissementId, note: saisie.note, criteres: saisie.criteres, personnel, commentaire: saisie.commentaire, preuve: saisie.preuve }).then(
        (r) => {
          void chargerDb(compte).then(setDb);
          return r.valeur;
        },
      );
    }
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
    return Promise.resolve(nouveau);
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

  return {
    avis,
    tous: supabase ? { [etablissementId]: avis } : (tous ?? {}),
    reservationsElegibles,
    soumettre,
    changerStatut,
    evaluer,
    charge: supabase ? db !== null : tous !== undefined && reservations !== undefined,
  };
}
