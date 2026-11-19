"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ETABLISSEMENTS, type Etablissement, type Filtres, noteMoyenne, scoreGlobal } from "@/lib/data";
import { normaliser } from "@/lib/format";
import type { Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { lireStockage } from "@/lib/stockage";

interface EtatCatalogue {
  etablissements: Etablissement[];
  gestion: Gestion;
  /** "db" = base Supabase, "demo" = données locales (localStorage pour la gestion). */
  source: "db" | "demo";
  charge: boolean;
  rafraichir: () => void;
}

const CatalogueContexte = createContext<EtatCatalogue | null>(null);

/** Recherche identique à `rechercher()` de data.ts, mais sur le catalogue courant (démo ou DB). */
function rechercherDans(liste: Etablissement[], f: Filtres) {
  const quartier = f.quartier && normaliser(f.quartier);
  const resultats = liste.filter(
    (e) =>
      (!f.secteur || e.secteur === f.secteur) &&
      (!f.ville || e.ville === f.ville) &&
      (!quartier || normaliser(e.quartier).includes(quartier) || normaliser(e.commune).includes(quartier)) &&
      (!f.noteMin || scoreGlobal(e.scores) >= f.noteMin) &&
      (!f.reservation || e.pack === "premium"),
  );
  const tris = {
    note: (a: Etablissement, b: Etablissement) => scoreGlobal(b.scores) - scoreGlobal(a.scores),
    avis: (a: Etablissement, b: Etablissement) => noteMoyenne(b.avis) - noteMoyenne(a.avis) || b.avis.length - a.avis.length,
    nom: (a: Etablissement, b: Etablissement) => a.nom.localeCompare(b.nom, "fr"),
  } as const;
  return [...resultats].sort(tris[f.tri]);
}

/** Rend le catalogue (démo instantané → DB dès que /api/catalogue répond) + la gestion admin effective. */
export function FournisseurCatalogue({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatCatalogue>({
    etablissements: ETABLISSEMENTS,
    gestion: {},
    source: "demo",
    charge: false,
    rafraichir: () => {},
  });

  const charger = useCallback(async () => {
    // Gestion locale immédiate (comportement démo historique).
    const locale = lireStockage<Gestion>(CLES.gestion) ?? {};
    try {
      const res = await fetch("/api/catalogue", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { etablissements: Etablissement[]; gestion: Gestion; source: "db" | "demo" };
      setEtat({
        etablissements: data.etablissements,
        gestion: data.source === "db" ? data.gestion : locale,
        source: data.source,
        charge: true,
        rafraichir: charger,
      });
    } catch {
      setEtat((e) => ({ ...e, gestion: locale, charge: true }));
    }
  }, []);

  useEffect(() => {
    void charger();
    // En mode démo, la gestion vit dans le localStorage : écouter les changements inter-onglets.
    const sync = () => setEtat((e) => (e.source === "demo" ? { ...e, gestion: lireStockage<Gestion>(CLES.gestion) ?? {} } : e));
    window.addEventListener("storage", sync);
    window.addEventListener("qualite-stockage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("qualite-stockage", sync);
    };
  }, [charger]);

  const valeur = useMemo<EtatCatalogue>(() => ({ ...etat, rafraichir: charger }), [etat, charger]);
  return <CatalogueContexte.Provider value={valeur}>{children}</CatalogueContexte.Provider>;
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContexte);
  const fallback = useMemo<EtatCatalogue>(
    () => ({ etablissements: ETABLISSEMENTS, gestion: {}, source: "demo", charge: false, rafraichir: () => {} }),
    [],
  );
  const etat = ctx ?? fallback;

  return useMemo(
    () => ({
      ...etat,
      getEtablissement: (slug: string) => etat.etablissements.find((e) => e.slug === slug),
      rechercher: (f: Filtres) => rechercherDans(etat.etablissements, f),
      villes: [...new Set(etat.etablissements.map((e) => e.ville))].sort(),
      quartiersParVille: Object.fromEntries(
        [...new Set(etat.etablissements.map((e) => e.ville))].map((v) => [
          v,
          [...new Set(etat.etablissements.filter((e) => e.ville === v).map((e) => e.quartier))].sort(),
        ]),
      ) as Record<string, string[]>,
    }),
    [etat],
  );
}

