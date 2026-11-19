"use client";

import { useEffect } from "react";
import { monDossier, synchroniserDossier } from "@/lib/actions/pro";
import { CLES, type Dossier } from "@/lib/espace";
import { useSession } from "@/components/session";
import { type Maj, useStockage } from "@/lib/stockage";

/**
 * Dossier de certification de l'établissement connecté.
 * Mode démo : localStorage. Mode Supabase : base + miroir local, écritures propagées via `synchroniserDossier`.
 * Même signature que `useStockage` pour remplacer `useStockage<Dossier>(CLES.dossier)`.
 */
export function useDossierPro(): [Dossier | null | undefined, (maj: Maj<Dossier>) => void] {
  const { mode } = useSession();
  const [local, setLocal] = useStockage<Dossier>(CLES.dossier);
  const supabase = mode === "supabase";

  useEffect(() => {
    if (!supabase) return;
    let actif = true;
    void monDossier()
      .then((d) => {
        if (actif && d) setLocal(d);
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [supabase, setLocal]);

  const setDossier = (maj: Maj<Dossier>) => {
    const prochain = typeof maj === "function" ? maj(local ?? null) : maj;
    setLocal(prochain);
    if (supabase && prochain) void synchroniserDossier(prochain).catch(() => {});
  };

  return [local, setDossier];
}
