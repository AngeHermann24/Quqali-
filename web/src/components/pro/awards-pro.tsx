"use client";

import { Trophy } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { AwardsView } from "@/components/awards/awards-view";

const SEUIL_NOMINATION = 85;

export function AwardsPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  const note = dossier?.audit?.global ?? 0;
  const nomine = note >= SEUIL_NOMINATION;

  return (
    <>
      <EspaceHeader
        role="Awards Quqliter"
        titre="La cérémonie de l'année"
        sousTitre="Classement : 30 % avis clients · 70 % note des évaluateurs"
        actions={<Pastille ton={nomine ? "succes" : "neutre"}>{dossier?.audit ? (nomine ? "Nominé" : "Non nominé") : "Non éligible"}</Pastille>}
      />
      <div className="container-page max-w-5xl space-y-6 py-6">
        <div className="card border-amber-200 bg-amber-50/60 p-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Trophy className="size-5 text-amber-500" aria-hidden />
            {dossier?.audit
              ? nomine
                ? `Votre note d'évaluateurs (${Math.round(note)} %) vous place parmi les nominés de l'année.`
                : `Avec ${Math.round(note)} % d'évaluateurs, visez ${SEUIL_NOMINATION} % et plus pour être nominé.`
              : "Seuls les établissements certifiés participent aux Awards."}
          </p>
          <p className="mt-1 text-sm text-muted">Les avis de vos clients comptent pour 30 % — encouragez-les à laisser un avis après leur visite.</p>
        </div>
        <AwardsView sansLiens />
      </div>
    </>
  );
}
