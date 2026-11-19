"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type CompteClient } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import { lireStockage } from "@/lib/stockage";
import { supabaseNavigateur } from "@/lib/supabase/client";

export interface CompteSession extends CompteClient {
  role?: string;
}

interface EtatSession {
  /** Compte usager connecté (forme CompteClient pour compatibilité) ou null. */
  compte: CompteSession | null;
  charge: boolean;
  /** "supabase" = auth réelle, "local" = mode démo localStorage. */
  mode: "supabase" | "local";
  rafraichir: () => void;
}

const SessionContexte = createContext<EtatSession>({ compte: null, charge: false, mode: "local", rafraichir: () => {} });

const SUPABASE_OK = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function profilDepuisApi(): Promise<CompteSession | null> {
  const res = await fetch("/api/moi", { cache: "no-store" });
  if (!res.ok) return null;
  const { profil } = (await res.json()) as { profil: CompteSession | null };
  return profil;
}

/** Fournit le compte usager : Supabase Auth si configuré, sinon repli localStorage (démo). */
export function FournisseurSession({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatSession>({ compte: null, charge: false, mode: SUPABASE_OK ? "supabase" : "local", rafraichir: () => {} });

  const chargerLocal = useCallback(() => {
    setEtat({ compte: lireStockage<CompteSession>(CLES.compte) ?? null, charge: true, mode: "local", rafraichir: chargerLocal });
  }, []);

  const chargerSupabase = useCallback(async () => {
    try {
      const profil = await profilDepuisApi();
      setEtat({ compte: profil, charge: true, mode: "supabase", rafraichir: chargerSupabase });
    } catch {
      setEtat({ compte: null, charge: true, mode: "supabase", rafraichir: chargerSupabase });
    }
  }, []);

  useEffect(() => {
    if (!SUPABASE_OK) {
      chargerLocal();
      const sync = () => chargerLocal();
      window.addEventListener("storage", sync);
      window.addEventListener("qualite-stockage", sync);
      return () => {
        window.removeEventListener("storage", sync);
        window.removeEventListener("qualite-stockage", sync);
      };
    }
    void chargerSupabase();
    const supabase = supabaseNavigateur();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => void chargerSupabase());
    return () => subscription.unsubscribe();
  }, [chargerLocal, chargerSupabase]);

  const valeur = useMemo<EtatSession>(
    () => ({ ...etat, rafraichir: etat.mode === "supabase" ? chargerSupabase : chargerLocal }),
    [etat, chargerLocal, chargerSupabase],
  );
  return <SessionContexte.Provider value={valeur}>{children}</SessionContexte.Provider>;
}

export function useSession() {
  return useContext(SessionContexte);
}
