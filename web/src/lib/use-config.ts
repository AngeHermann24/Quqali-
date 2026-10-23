"use client";

import { useMemo } from "react";
import { CONFIG_DEFAUT, type ConfigTarifs } from "@/lib/abonnement";
import { CLES } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";

export function useConfigTarifs() {
  const [stocke, setConfig] = useStockage<ConfigTarifs>(CLES.config);
  const config = useMemo<ConfigTarifs>(() => ({ ...CONFIG_DEFAUT, ...stocke, prix: { ...CONFIG_DEFAUT.prix, ...stocke?.prix } }), [stocke]);
  return { config, setConfig, personnalise: !!stocke, charge: stocke !== undefined };
}

export function useHorloge() {
  const [stocke, setDecalage] = useStockage<number>(CLES.horloge);
  const decalage = stocke ?? 0;
  const aujourdhui = useMemo(() => {
    if (stocke === undefined) return null;
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + (stocke ?? 0));
    return d.toISOString();
  }, [stocke]);
  return { decalage, aujourdhui, setDecalage, charge: aujourdhui !== null };
}
