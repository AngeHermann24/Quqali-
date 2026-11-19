"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { type Etablissement, noteMoyenne, scoreGlobal } from "@/lib/data";
import { niveauEffectif } from "@/lib/admin";
import { formatScore } from "@/lib/format";
import { tv } from "@/lib/langue";
import { useCatalogue } from "@/components/catalogue";
import { useLangue } from "@/components/langue";
import { cn } from "@/lib/site";
import { CertifiedBadge, PhotoPlaceholder, PremiumTag, ScorePill, Stars } from "@/components/ui";
import { BoutonFavori } from "@/components/app/favoris";

export function EtablissementCard({
  etablissement: e,
  layout = "vertical",
  active = false,
  badgeRetire = false,
}: {
  etablissement: Etablissement;
  layout?: "vertical" | "horizontal";
  active?: boolean;
  badgeRetire?: boolean;
}) {
  const { t, locale } = useLangue();
  const { gestion } = useCatalogue();
  const horizontal = layout === "horizontal";
  const moyenne = noteMoyenne(e.avis);
  const score = scoreGlobal(e.scores);
  const niveau = niveauEffectif(score, gestion?.[e.slug]);

  return (
    <Link
      href={`/etablissements/${e.slug}`}
      className={cn(
        "group card flex overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card-hover",
        horizontal ? "flex-row" : "flex-col",
        active && "ring-2 ring-primary",
      )}
    >
      <div className={cn("relative shrink-0", horizontal ? "w-32 sm:w-44" : "aspect-[4/3] w-full")}>
        <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
        {!badgeRetire && (
          <span className={cn("absolute top-3 left-3", horizontal && "hidden sm:block")}>
            <CertifiedBadge niveau={niveau} />
          </span>
        )}
        {e.pack === "premium" && <PremiumTag className={cn("absolute", horizontal ? "bottom-2 left-2" : "bottom-2.5 left-2.5")} />}
        <BoutonFavori slug={e.slug} className="absolute top-2.5 right-2.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display font-semibold text-ink group-hover:text-primary">{e.nom}</h3>
            <p className="truncate text-sm text-muted">{e.sousType}</p>
          </div>
          <ScorePill value={score} niveau={niveau} />
        </div>
        <p className="mt-2 flex items-center gap-1 truncate text-sm text-muted">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
          {e.quartier === e.commune ? e.commune : `${e.quartier}, ${e.commune}`}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted">
          {moyenne > 0 && (
            <span className="flex items-center gap-1">
              <Stars value={moyenne} />
              <span className="font-medium text-ink">{formatScore(moyenne, locale)}</span>({tv(t.avisNb, e.avis.length)})
            </span>
          )}
          <span className="truncate">{e.prix}</span>
        </div>
      </div>
    </Link>
  );
}
