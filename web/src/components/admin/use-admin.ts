"use client";

import { useMemo } from "react";
import { CANDIDATURES_PARTENAIRES_DEMO, DOSSIERS_CANDIDATURES_DEMO, type CandidatPartenaire, type Gestion } from "@/lib/admin";
import { CLES, type Dossier, type DossierPartenaire } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";

/** Candidatures d'établissements : exemples démo + le vrai dossier déposé ici. */
export function useCandidatures() {
  const [stockees, setStockees] = useStockage<Dossier[]>(CLES.candidatures);
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const liste = useMemo(() => [...(stockees ?? DOSSIERS_CANDIDATURES_DEMO), ...(dossier ? [dossier] : [])], [stockees, dossier]);
  const maj = (d: Dossier) => {
    if (dossier && d.id === dossier.id) setDossier(d);
    else setStockees((prec) => (prec ?? DOSSIERS_CANDIDATURES_DEMO).map((x) => (x.id === d.id ? d : x)));
  };
  return { liste, maj, charge: stockees !== undefined && dossier !== undefined };
}

export function useCandidaturesPartenaires() {
  const [stockees, setStockees] = useStockage<CandidatPartenaire[]>(CLES.candidaturesPartenaires);
  const [moi, setMoi] = useStockage<DossierPartenaire>(CLES.partenaire);
  const liste = useMemo<CandidatPartenaire[]>(() => [...(stockees ?? CANDIDATURES_PARTENAIRES_DEMO), ...(moi ? [{ ...moi, id: "moi" }] : [])], [stockees, moi]);
  const maj = (p: CandidatPartenaire) => {
    if (moi && p.id === "moi") setMoi({ ...p, id: "moi" });
    else setStockees((prec) => (prec ?? CANDIDATURES_PARTENAIRES_DEMO).map((x) => (x.id === p.id ? p : x)));
  };
  return { liste, maj, charge: stockees !== undefined && moi !== undefined };
}

export function useGestion() {
  const [gestion, setGestion] = useStockage<Gestion>(CLES.gestion);
  return { gestion: gestion ?? {}, setGestion, charge: gestion !== undefined };
}

/** Affectation des audits planifiés : auditId → agentId. */
export function useAffectations() {
  const [affectations, setAffectations] = useStockage<Record<string, string>>(CLES.affectations);
  const affecter = (auditId: string, agentId: string) => setAffectations((prec) => ({ ...prec, [auditId]: agentId }));
  return { affectations: affectations ?? {}, affecter, charge: affectations !== undefined };
}
