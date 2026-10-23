"use client";

import { useMemo } from "react";
import { CLES, type DossierPartenaire, type EtatMission, MISSIONS, etatInitial, liensPartenaire } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";

export function usePartenaire() {
  const [partenaire, setPartenaire] = useStockage<DossierPartenaire>(CLES.partenaire);
  const [stockes, setStockes] = useStockage<Record<string, EtatMission>>(CLES.missions);

  const etats = useMemo(() => Object.fromEntries(MISSIONS.map((m) => [m.id, stockes?.[m.id] ?? etatInitial(m)])), [stockes]);
  const liens = useMemo(() => liensPartenaire(etats), [etats]);
  const majMission = (id: string, partiel: Partial<EtatMission>) => setStockes({ ...etats, [id]: { ...etats[id], ...partiel } });
  const reinitialiser = () => {
    setPartenaire(null);
    setStockes(null);
  };

  return { partenaire, setPartenaire, etats, liens, majMission, reinitialiser, pret: partenaire !== undefined && stockes !== undefined };
}
