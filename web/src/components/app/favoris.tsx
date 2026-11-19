"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { basculerFavori, listeFavoris } from "@/lib/actions/usager";
import { CLES } from "@/lib/espace";
import { useSession } from "@/components/session";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";

export function useFavoris() {
  const { mode, compte } = useSession();
  const [favoris, setFavoris] = useStockage<string[]>(CLES.favoris);
  const supabase = mode === "supabase" && !!compte;

  // Mode connecté : la liste vient de la base et se resynchronise à chaque connexion.
  useEffect(() => {
    if (mode === "supabase" && compte) void listeFavoris().then((slugs) => setFavoris(slugs));
  }, [mode, compte, setFavoris]);

  const sync = (slug: string, ajout: boolean) => {
    if (supabase) void basculerFavori(slug, ajout);
  };
  const liste = favoris ?? [];
  const retirer = (slug: string) => {
    setFavoris((p) => (p ?? []).filter((s) => s !== slug));
    sync(slug, false);
  };
  /** Réinsère un favori (annulation) à sa position initiale quand possible. */
  const ajouter = (slug: string, index?: number) => {
    setFavoris((p) => {
      const p0 = (p ?? []).filter((s) => s !== slug);
      return index === undefined ? [slug, ...p0] : [...p0.slice(0, index), slug, ...p0.slice(index)];
    });
    sync(slug, true);
  };
  const retirerPlusieurs = (slugs: string[]) => {
    setFavoris((p) => (p ?? []).filter((s) => !slugs.includes(s)));
    for (const s of slugs) sync(s, false);
  };
  const toggle = (slug: string) => {
    const ajout = !liste.includes(slug);
    setFavoris((p) => ((p ?? []).includes(slug) ? (p ?? []).filter((s) => s !== slug) : [slug, ...(p ?? [])]));
    sync(slug, ajout);
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
