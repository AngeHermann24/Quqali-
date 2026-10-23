"use client";

import { useMemo } from "react";
import { etatAbonnement } from "@/lib/abonnement";
import { scoreGlobal } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { ETABLISSEMENTS_DEMO_PREMIUM, type EtablissementGere } from "@/lib/reservation-demo";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";

export function useEtablissementsGeres() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { config } = useConfigTarifs();
  const { aujourdhui } = useHorloge();

  const premiumActif = !!(
    dossier &&
    aujourdhui &&
    dossier.statut === "admis" &&
    dossier.abonnement?.pack === "premium" &&
    etatAbonnement(dossier.abonnement, aujourdhui, config).visible
  );

  const options = useMemo<EtablissementGere[]>(() => {
    const demos = ETABLISSEMENTS_DEMO_PREMIUM.map((e) => ({
      id: e.slug,
      nom: e.nom,
      secteur: e.secteur,
      commune: e.commune,
      noteLabel: scoreGlobal(e.scores),
      noteDate: formatDate(e.dateAudit),
      visite3d: e.visite3d,
      demo: true,
    }));
    if (!dossier || !premiumActif) return demos;
    return [
      {
        id: dossier.id,
        nom: dossier.nom,
        secteur: dossier.secteur,
        commune: dossier.commune,
        noteLabel: dossier.audit?.global ?? null,
        noteDate: dossier.audit ? formatDate(dossier.audit.date) : undefined,
        visite3d: dossier.visite3d,
        demo: false,
      },
      ...demos,
    ];
  }, [dossier, premiumActif]);

  return { dossier, setDossier, premiumActif, options, charge: dossier !== undefined && aujourdhui !== null };
}
