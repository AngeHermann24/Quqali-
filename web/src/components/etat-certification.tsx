"use client";

import { AlertTriangle, BadgeX } from "lucide-react";
import { etatPublic, type Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { CertifiedBadge } from "@/components/ui";

/** Badge « Qualité certifiée » public : masqué si l'administration a retiré le badge ou suspendu la fiche. */
export function BadgePublic({ slug, size = "lg" }: { slug: string; size?: "sm" | "lg" }) {
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  if (gestion === undefined) return null;
  const etat = etatPublic(gestion?.[slug]);
  if (etat === "actif") return <CertifiedBadge size={size} />;
  return (
    <span className="chip bg-ink text-white">
      <BadgeX className="size-4" aria-hidden /> {etat === "suspendu" ? "Certification suspendue" : "Badge retiré"}
    </span>
  );
}

/** Bandeau explicatif affiché en tête de fiche quand la certification est retirée ou suspendue. */
export function BandeauGestion({ slug, nom }: { slug: string; nom: string }) {
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  if (gestion === undefined) return null;
  const g = gestion?.[slug];
  const etat = etatPublic(g);
  if (etat === "actif") return null;
  return (
    <div className="container-page mt-4">
      <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-4 text-sm text-ink">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {etat === "suspendu"
          ? `${nom} est suspendu de la plateforme depuis le ${formatDate(g!.suspendu!)} : sa certification Qualité+ n'est plus en vigueur.`
          : `Le badge « Qualité certifiée » de ${nom} a été retiré le ${formatDate(g!.badgeRetire!)} : l'établissement fait l'objet d'un contrôle de conformité.`}
      </p>
    </div>
  );
}
