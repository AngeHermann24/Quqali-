"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { CLES } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";

export function useFavoris() {
  const [favoris, setFavoris] = useStockage<string[]>(CLES.favoris);
  const toggle = (slug: string) => {
    setFavoris((p) => ((p ?? []).includes(slug) ? (p ?? []).filter((s) => s !== slug) : [...(p ?? []), slug]));
    navigator.vibrate?.(15);
  };
  return { favoris: favoris ?? [], estFavori: (s: string) => (favoris ?? []).includes(s), toggle, charge: favoris !== undefined };
}

export function BoutonFavori({ slug, className }: { slug: string; className?: string }) {
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
        "verre grid size-9 place-items-center rounded-full shadow-card transition active:scale-90",
        favori ? "text-red-500" : "text-ink/70",
        className,
      )}
    >
      <Heart key={pop} className={cn("size-4.5", favori && "fill-red-500 fav-pop")} aria-hidden />
    </button>
  );
}
