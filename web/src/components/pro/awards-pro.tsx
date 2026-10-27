"use client";

import { Trophy } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { Chargement } from "@/components/espace/ui";
import { AwardsView } from "@/components/awards/awards-view";
import { EntetePro, StatusPillPro } from "@/components/pro/ui";

const SEUIL_NOMINATION = 85;

export function AwardsPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  const note = dossier?.audit?.global ?? 0;
  const nomine = note >= SEUIL_NOMINATION;

  return (
    <>
      <EntetePro titre="Awards Qualité+" action={dossier?.audit && <StatusPillPro statut={nomine ? "confirmee" : "annulee"} label={nomine ? "Nominé" : "Non nominé"} />} />
      <div className="space-y-4 px-5 pb-6">
        <div className="rounded-3xl border border-or/30 bg-or/10 p-4">
          <p className="flex items-start gap-2 text-sm font-bold text-ink">
            <Trophy className="mt-0.5 size-5 shrink-0 text-or" aria-hidden />
            {dossier?.audit
              ? nomine
                ? `Votre note d'évaluateurs (${Math.round(note)} %) vous place parmi les nominés de l'année.`
                : `Avec ${Math.round(note)} % d'évaluateurs, visez ${SEUIL_NOMINATION} % et plus pour être nominé.`
              : "Seuls les établissements certifiés participent aux Awards."}
          </p>
          <p className="mt-1.5 text-xs text-muted">Classement : 30 % avis clients · 70 % note des évaluateurs. Les avis de vos clients comptent — encouragez-les à laisser un avis après leur visite.</p>
        </div>
        <AwardsView sansLiens />
      </div>
    </>
  );
}
