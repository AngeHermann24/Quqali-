"use client";

import { AlertTriangle, BadgeX } from "lucide-react";
import { etatPublic, niveauEffectif } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { fmt } from "@/lib/langue";
import { useCatalogue } from "@/components/catalogue";
import { useLangue } from "@/components/langue";
import { CertifiedBadge } from "@/components/ui";

/** Badge « Qualité certifiée » public : masqué si l'administration a retiré le badge ou suspendu la fiche. */
export function BadgePublic({ slug, size = "lg", score }: { slug: string; size?: "sm" | "lg"; score?: number }) {
  const { gestion, charge } = useCatalogue();
  const { t } = useLangue();
  if (!charge) return null;
  const etat = etatPublic(gestion[slug]);
  if (etat === "actif") return <CertifiedBadge size={size} niveau={score === undefined ? undefined : niveauEffectif(score, gestion[slug])} />;
  return (
    <span className="chip bg-ink text-white">
      <BadgeX className="size-4" aria-hidden /> {etat === "suspendu" ? t.certifSuspendue : t.badgeRetire}
    </span>
  );
}

/** Bandeau explicatif affiché en tête de fiche quand la certification est retirée ou suspendue. */
export function BandeauGestion({ slug, nom }: { slug: string; nom: string }) {
  const { gestion, charge } = useCatalogue();
  const { t, locale } = useLangue();
  if (!charge) return null;
  const g = gestion[slug];
  const etat = etatPublic(g);
  if (etat === "actif") return null;
  return (
    <div className="container-page mt-4">
      <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-4 text-sm text-ink">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {etat === "suspendu"
          ? fmt(t.suspenduDepuis, { n: nom, date: formatDate(g!.suspendu!, locale) })
          : fmt(t.badgeRetireLe, { n: nom, date: formatDate(g!.badgeRetire!, locale) })}
      </p>
    </div>
  );
}
