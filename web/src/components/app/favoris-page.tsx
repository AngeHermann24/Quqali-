"use client";

import Link from "next/link";
import { Compass, Heart } from "lucide-react";
import { getEtablissement } from "@/lib/data";
import { BoutonFavori, useFavoris } from "@/components/app/favoris";
import { EtablissementCard } from "@/components/etablissement-card";

export function FavorisUsager() {
  const { favoris, charge } = useFavoris();
  const etablissements = favoris.map(getEtablissement).filter((e) => e != null);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Mes favoris</h1>
      <p className="mt-1 text-sm text-muted">Vos établissements certifiés gardés sous la main.</p>

      {!charge ? (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="squelette h-36 rounded-3xl" />
          ))}
        </div>
      ) : etablissements.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-surface text-muted">
            <Heart className="size-9" aria-hidden />
          </span>
          <p className="mt-5 font-display text-lg font-bold text-ink">Aucun favori pour l&apos;instant</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted">
            Touchez le cœur sur une fiche ou une carte pour garder un établissement ici.
          </p>
          <Link href="/etablissements" className="btn-hero mt-7">
            <Compass className="size-5" aria-hidden /> Explorer les établissements
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {etablissements.map((e) => (
            <div key={e.slug} className="relative">
              <EtablissementCard etablissement={e} />
              <BoutonFavori slug={e.slug} className="absolute top-3 right-3 z-10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
