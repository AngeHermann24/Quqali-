"use client";

import { useEffect, useMemo, useState } from "react";
import { CANDIDATURES_PARTENAIRES_DEMO, DOSSIERS_CANDIDATURES_DEMO, type CandidatPartenaire, type Gestion } from "@/lib/admin";
import { affecterAgent, basculerBadge, candidatsPartenairesAdmin, demarrerAuditDossier, dossiersAdmin, enregistrerResultat, forcerNiveauEtablissement, refuserCandidature, suspendreEtablissement, transitionPartenaireAdmin, affectationsAdmin } from "@/lib/actions/admin";
import { gestionPublique } from "@/lib/actions/usager";
import { CLES, type Dossier, type DossierPartenaire } from "@/lib/espace";
import { useSession } from "@/components/session";
import { useStockage } from "@/lib/stockage";

/** Candidatures d'établissements : DB si Supabase, sinon exemples démo + dossier local. */
export function useCandidatures() {
  const { mode } = useSession();
  const [stockees, setStockees] = useStockage<Dossier[]>(CLES.candidatures);
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [db, setDb] = useState<Dossier[] | null>(null);

  useEffect(() => {
    if (mode !== "supabase") return;
    let actif = true;
    void dossiersAdmin()
      .then((l) => actif && setDb(l))
      .catch(() => actif && setDb([]));
    return () => {
      actif = false;
    };
  }, [mode]);

  const supabase = mode === "supabase" && db !== null;
  const liste = useMemo(() => (supabase ? db : [...(stockees ?? DOSSIERS_CANDIDATURES_DEMO), ...(dossier ? [dossier] : [])]), [supabase, db, stockees, dossier]);
  const maj = (d: Dossier) => {
    const avant = liste.find((x) => x.id === d.id);
    if (supabase) {
      setDb((p) => (p ?? []).map((x) => (x.id === d.id ? d : x)));
      if (avant?.statut !== d.statut) {
        if (d.statut === "en_audit" && d.agentAuditId) void demarrerAuditDossier(d.id, d.agentAuditId).catch(() => {});
        else if (d.statut === "admis" && d.audit) void enregistrerResultat(d.id, d.audit.scores).catch(() => {});
        else if (d.statut === "refuse") void refuserCandidature(d.id).catch(() => {});
      }
      return;
    }
    if (dossier && d.id === dossier.id) setDossier(d);
    else setStockees((prec) => (prec ?? DOSSIERS_CANDIDATURES_DEMO).map((x) => (x.id === d.id ? d : x)));
  };
  return { liste, maj, charge: supabase ? true : stockees !== undefined && dossier !== undefined };
}

export function useCandidaturesPartenaires() {
  const { mode } = useSession();
  const [stockees, setStockees] = useStockage<CandidatPartenaire[]>(CLES.candidaturesPartenaires);
  const [moi, setMoi] = useStockage<DossierPartenaire>(CLES.partenaire);
  const [db, setDb] = useState<CandidatPartenaire[] | null>(null);

  useEffect(() => {
    if (mode !== "supabase") return;
    let actif = true;
    void candidatsPartenairesAdmin()
      .then((l) => actif && setDb(l))
      .catch(() => actif && setDb([]));
    return () => {
      actif = false;
    };
  }, [mode]);

  const supabase = mode === "supabase" && db !== null;
  const liste = useMemo<CandidatPartenaire[]>(() => (supabase ? db : [...(stockees ?? CANDIDATURES_PARTENAIRES_DEMO), ...(moi ? [{ ...moi, id: "moi" }] : [])]), [supabase, db, stockees, moi]);
  const maj = (p: CandidatPartenaire) => {
    const avant = liste.find((x) => x.id === p.id);
    if (supabase) {
      setDb((prec) => (prec ?? []).map((x) => (x.id === p.id ? p : x)));
      if (avant?.statut !== p.statut) void transitionPartenaireAdmin(p.id, p.statut).catch(() => {});
      return;
    }
    if (moi && p.id === "moi") setMoi({ ...p, id: "moi" });
    else setStockees((prec) => (prec ?? CANDIDATURES_PARTENAIRES_DEMO).map((x) => (x.id === p.id ? p : x)));
  };
  return { liste, maj, charge: supabase ? true : stockees !== undefined && moi !== undefined };
}

export function useGestion() {
  const { mode } = useSession();
  const [local, setLocal] = useStockage<Gestion>(CLES.gestion);
  const gestion = local ?? {};

  // Mode Supabase : l'état de gestion vit dans les colonnes Etablissement — rechargé depuis la base.
  useEffect(() => {
    if (mode !== "supabase") return;
    let actif = true;
    void gestionPublique().then((g) => {
      if (actif) setLocal(g as Gestion);
    });
    return () => {
      actif = false;
    };
  }, [mode, setLocal]);

  /** Applique la nouvelle carte de gestion ; en mode base, propage chaque différence via les actions admin. */
  const setGestion = (maj: Gestion | ((p: Gestion | undefined) => Gestion)) => {
    const nouvelle = typeof maj === "function" ? maj(local ?? undefined) : maj;
    setLocal(nouvelle);
    if (mode !== "supabase") return;
    for (const slug of new Set([...Object.keys(gestion), ...Object.keys(nouvelle)])) {
      const a = gestion[slug];
      const b = nouvelle[slug];
      if ((a?.suspendu !== undefined) !== (b?.suspendu !== undefined)) void suspendreEtablissement(slug, b?.suspendu !== undefined).catch(() => {});
      if ((a?.badgeRetire !== undefined) !== (b?.badgeRetire !== undefined)) void basculerBadge(slug, b?.badgeRetire !== undefined).catch(() => {});
      if (a?.niveau !== b?.niveau) void forcerNiveauEtablissement(slug, b?.niveau ?? null).catch(() => {});
    }
  };

  return { gestion, setGestion, charge: local !== undefined || mode === "supabase" };
}

/** Affectation des audits planifiés : auditId → agentId. */
export function useAffectations() {
  const { mode } = useSession();
  const [affectations, setAffectations] = useStockage<Record<string, string>>(CLES.affectations);

  useEffect(() => {
    if (mode !== "supabase") return;
    let actif = true;
    void affectationsAdmin()
      .then((a) => actif && setAffectations(a))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [mode, setAffectations]);

  const affecter = (auditId: string, agentId: string) => {
    setAffectations((prec) => ({ ...prec, [auditId]: agentId }));
    if (mode === "supabase") void affecterAgent(auditId, agentId).catch(() => {});
  };
  return { affectations: affectations ?? {}, affecter, charge: affectations !== undefined };
}
