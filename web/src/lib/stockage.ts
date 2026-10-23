"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENEMENT = "qualite-stockage";

function abonner(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENEMENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENEMENT, callback);
  };
}

type Maj<T> = T | null | ((precedent: T | null) => T | null);

export function lireStockage<T>(cle: string): T | null {
  const brut = localStorage.getItem(cle);
  return brut ? (JSON.parse(brut) as T) : null;
}

export function ecrireStockage<T>(cle: string, maj: Maj<T>) {
  const valeur = typeof maj === "function" ? (maj as (p: T | null) => T | null)(lireStockage<T>(cle)) : maj;
  if (valeur === null) localStorage.removeItem(cle);
  else localStorage.setItem(cle, JSON.stringify(valeur));
  window.dispatchEvent(new Event(EVENEMENT));
}

export function useStockage<T>(cle: string): [T | null | undefined, (maj: Maj<T>) => void] {
  const brut = useSyncExternalStore(
    abonner,
    () => localStorage.getItem(cle),
    () => undefined,
  );
  const valeur = useMemo(() => (brut == null ? brut : (JSON.parse(brut) as T)), [brut]);
  const ecrire = useCallback((maj: Maj<T>) => ecrireStockage(cle, maj), [cle]);
  return [valeur, ecrire];
}
