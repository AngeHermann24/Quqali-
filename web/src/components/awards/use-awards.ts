"use client";

import { useMemo } from "react";
import { etatAbonnement } from "@/lib/abonnement";
import { ETABLISSEMENTS, type Secteur, scoreGlobal } from "@/lib/data";
import type { Gestion } from "@/lib/admin";
import type { AvisClient } from "@/lib/avis";
import { CATEGORIES, type CandidatAward, type VoteClient, classement } from "@/lib/awards";
import { CLES, type Dossier } from "@/lib/espace";
import { avisDemo } from "@/lib/ia/donnees-demo";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";

const notePersonnelle = (a: AvisClient) => {
  const v = a.personnel ? Object.values(a.personnel) : [];
  return v.length ? v.reduce((s, n) => s + n, 0) / v.length : undefined;
};

export function useAwards() {
  const { aujourdhui } = useHorloge();
  const [avisStock] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [gestionStock] = useStockage<Gestion>(CLES.gestion);
  const { config } = useConfigTarifs();

  return useMemo(() => {
    if (!aujourdhui || avisStock === undefined || gestionStock === undefined) return { charge: false as const };
    const stock = avisStock ?? {};
    const gestion = gestionStock ?? {};
    const annee = aujourdhui.slice(0, 4);
    const moisMax = Number(aujourdhui.slice(5, 7));

    const votesStockes = (id: string): VoteClient[] =>
      (stock[id] ?? [])
        .filter((a) => a.statut === "publie" && a.date.startsWith(annee))
        .map((a) => ({ note: a.note, personnel: notePersonnelle(a) }));

    const votesDemo = (id: string, secteur: Secteur, avis: { note: number }[]): VoteClient[] => {
      const generes: VoteClient[] = [];
      for (let m = 1; m <= moisMax; m++)
        for (const a of avisDemo(secteur, `${annee}-${String(m).padStart(2, "0")}`, id)) generes.push({ note: a.note });
      return [...avis.map((a) => ({ note: a.note })), ...generes];
    };

    const candidats: CandidatAward[] = ETABLISSEMENTS.map((e) => ({
      id: e.slug,
      nom: e.nom,
      slug: e.slug,
      secteur: e.secteur,
      global: scoreGlobal(e.scores),
      accueil: e.scores.accueil,
      hygiene: e.scores.hygiene,
      eligible: !gestion[e.slug]?.suspendu && !gestion[e.slug]?.badgeRetire,
    }));
    const votes = new Map<string, VoteClient[]>(
      ETABLISSEMENTS.map((e) => [e.slug, [...votesDemo(e.slug, e.secteur, e.avis), ...votesStockes(e.slug)]]),
    );

    if (dossier?.statut === "admis" && dossier.audit) {
      const visible = !dossier.abonnement || etatAbonnement(dossier.abonnement, aujourdhui, config).visible;
      candidats.push({
        id: dossier.id,
        nom: dossier.nom,
        secteur: dossier.secteur,
        global: dossier.audit.global,
        accueil: dossier.audit.scores.accueil,
        hygiene: dossier.audit.scores.hygiene,
        eligible: dossier.audit.global >= 80 && visible && !gestion[dossier.id]?.suspendu && !gestion[dossier.id]?.badgeRetire,
      });
      votes.set(dossier.id, votesStockes(dossier.id));
    }

    const toutes = [...votes.values()].flat();
    const moyenneReference = toutes.length ? toutes.reduce((s, v) => s + v.note, 0) / toutes.length : 3.8;
    const classements = CATEGORIES.map((categorie) => ({ categorie, lignes: classement(categorie, candidats, votes, moyenneReference) }));

    const totalVotes = [...votes.values()].reduce((s, v) => s + v.length, 0);
    const enVerification = Object.values(stock).flat().filter((a) => a.statut === "en_verification" || a.statut === "signale").length;
    return { charge: true as const, annee, classements, totalVotes, enVerification };
  }, [aujourdhui, avisStock, dossier, gestionStock, config]);
}
