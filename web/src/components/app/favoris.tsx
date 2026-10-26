"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { CLES } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";

export function useFavoris() {
  const [favoris, setFavoris] = useStockage<string[]>(CLES.favoris);
  const liste = favoris ?? [];
  const retirer = (slug: string) => setFavoris((p) => (p ?? []).filter((s) => s !== slug));
  /** Réinsère un favori (annulation) à sa position initiale quand possible. */
  const ajouter = (slug: string, index?: number) =>
    setFavoris((p) => {
      const p0 = (p ?? []).filter((s) => s !== slug);
      return index === undefined ? [slug, ...p0] : [...p0.slice(0, index), slug, ...p0.slice(index)];
    });
  const retirerPlusieurs = (slugs: string[]) => setFavoris((p) => (p ?? []).filter((s) => !slugs.includes(s)));
  const toggle = (slug: string) => {
    setFavoris((p) => ((p ?? []).includes(slug) ? (p ?? []).filter((s) => s !== slug) : [slug, ...(p ?? [])]));
    navigator.vibrate?.(15);
  };
  return { favoris: liste, estFavori: (s: string) => liste.includes(s), toggle, retirer, ajouter, retirerPlusieurs, charge: favoris !== undefined };
}

export function BoutonFavori({ slug, className, plat = false }: { slug: string; className?: string; plat?: boolean }) {
  const { estFavori, toggle, charge } = useFavoris();
  const [pop, setPop] = useState(0);
  const favori = estFavori(slug);
  if (!charge) return null;
  return (
    <button
      type="button"
      aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={favori}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
        setPop((p) => p + 1);
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full transition active:scale-90",
        plat ? "text-muted" : "verre shadow-card",
        favori ? "text-red-500" : plat ? "text-muted" : "text-ink/70",
        className,
      )}
    >
      <Heart key={pop} className={cn("size-4.5", favori && "fill-red-500 fav-pop")} aria-hidden />
    </button>
  );
}
