"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, ChevronDown, ClipboardCheck, FileText, MapPin, Play, ShieldCheck, UserCheck, X } from "lucide-react";
import { candidatsAgent, demarrerAudit, enregistrerResultatAudit, liensDuDossier, refuserDossier, transitionPartenaire, type CandidatPartenaire } from "@/lib/admin";
import { CLES, DOCUMENTS_REQUIS, ETAPES_PARTENAIRE, INTERVENANTS, MISSIONS, STATUTS, etatInitial, liensPartenaire, maintenant, nomIntervenant } from "@/lib/espace";
import type { Dossier, EtatMission, StatutDossier } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { CRITERES, SECTEURS, type Scores } from "@/lib/data";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { useCandidatures, useCandidaturesPartenaires } from "@/components/admin/use-admin";

const TONS_STATUT: Record<StatutDossier, "primaire" | "succes" | "alerte" | "neutre"> = { soumis: "primaire", en_audit: "primaire", admis: "succes", refuse: "alerte" };

export function CandidaturesAdmin() {
  const params = useSearchParams();
  const [onglet, setOnglet] = useState<"etablissements" | "partenaires">(params.get("onglet") === "partenaires" ? "partenaires" : "etablissements");
  return (
    <>
      <EspaceHeader role="Administration" titre="Candidatures" sousTitre="Validation des dossiers, démarrage des audits et enregistrement des résultats." />
      <div className="container-page space-y-5 py-6">
        <div className="flex gap-2">
          {(
            [
              ["etablissements", "Établissements", Building2],
              ["partenaires", "Accompagnateurs", UserCheck],
            ] as const
          ).map(([id, label, Icone]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOnglet(id)}
              className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium", onglet === id ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              <Icone className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
        {onglet === "etablissements" ? <ListeEtablissements /> : <ListePartenaires />}
      </div>
    </>
  );
}

function ListeEtablissements() {
  const { liste, maj, charge } = useCandidatures();
  const [etats] = useStockage<Record<string, EtatMission>>(CLES.missions);
  if (!charge || etats === undefined) return <Chargement />;
  const etatsMissions = { ...Object.fromEntries(MISSIONS.map((m) => [m.id, etatInitial(m)])), ...etats };
  const liensMissions = liensPartenaire(etatsMissions);
  const ordre: StatutDossier[] = ["soumis", "en_audit", "admis", "refuse"];
  const tries = [...liste].sort((a, b) => ordre.indexOf(a.statut) - ordre.indexOf(b.statut) || b.historique.at(-1)!.date.localeCompare(a.historique.at(-1)!.date));

  return (
    <div className="space-y-4">
      {tries.map((d) => (
        <CarteCandidature key={d.id} dossier={d} liensMissions={liensMissions} onMaj={maj} />
      ))}
    </div>
  );
}

function CarteCandidature({ dossier: d, liensMissions, onMaj }: { dossier: Dossier; liensMissions: ReturnType<typeof liensPartenaire>; onMaj: (d: Dossier) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [agent, setAgent] = useState("");
  const [acc, setAcc] = useState("");
  const [scores, setScores] = useState<Scores>({ hygiene: 80, accueil: 80, presentation: 80, gouvernance: 80 });

  const liens = [...liensMissions, ...liensDuDossier(d)];
  const agents = candidatsAgent({ id: d.id, secteur: d.secteur }, INTERVENANTS, liens, d.agentAuditId);
  const accompagnateurs = INTERVENANTS.filter((i) => i.roles.includes("accompagnateur") && i.secteurs.includes(d.secteur));
  const scoreSaisi = CRITERES.reduce((t, c) => t + (scores[c.key] * c.poids) / 100, 0);

  const demarrer = () => agent && onMaj(demarrerAudit(d, agent, maintenant()));
  const enregistrer = () => onMaj(enregistrerResultatAudit(d, scores, maintenant()));
  const assignerAcc = () => acc && onMaj({ ...d, accompagnement: d.accompagnement ? { ...d.accompagnement, accompagnateurId: acc } : undefined });

  return (
    <article className="card p-4">
      <button type="button" className="flex w-full flex-wrap items-center gap-3 text-left" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-ink">{d.nom}</span>
            <Pastille ton={TONS_STATUT[d.statut]}>{STATUTS[d.statut].label}</Pastille>
            <span className="chip bg-surface text-muted">Parcours {d.parcours}</span>
          </span>
          <span className="mt-1 block text-sm text-muted">
            {d.sousType} · {SECTEURS[d.secteur].label} · <MapPin className="inline size-3.5" aria-hidden /> {d.commune}, {d.ville} · dossier du {formatDate(d.historique[0].date)}
          </span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 text-muted transition", ouvert && "rotate-180")} aria-hidden />
      </button>

      {ouvert && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">{d.description}</p>
              <p className="mt-2 text-sm text-ink">
                <strong>Responsable :</strong> {d.responsable.nom} ({d.responsable.fonction}) · {d.responsable.telephone} · {d.responsable.email}
              </p>
              <p className="mt-1 text-sm text-muted">
                {d.adresse}, {d.quartier}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Documents ({d.documents.length})</p>
              <ul className="mt-1 space-y-1">
                {DOCUMENTS_REQUIS[d.secteur].map((req) => {
                  const fourni = d.documents.find((doc) => doc.type === req.type);
                  return (
                    <li key={req.type} className="flex items-center gap-2 text-sm">
                      <FileText className={cn("size-4", fourni ? "text-success" : "text-muted")} aria-hidden />
                      <span className={fourni ? "text-ink" : "text-muted line-through"}>{req.label}</span>
                      {req.obligatoire && !fourni && <Pastille ton="alerte">Manquant</Pastille>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {d.accompagnement && (
            <div className="rounded-xl bg-surface p-3 text-sm">
              <p className="font-semibold text-ink">
                Demande d&apos;accompagnement {d.accompagnement.mode === "partenaire" ? "par un partenaire" : "par nos équipes"}
                {d.accompagnement.accompagnateurId ? ` — ${nomIntervenant(d.accompagnement.accompagnateurId)}` : " — non assignée"}
              </p>
              <p className="mt-1 text-muted">
                Besoins : {d.accompagnement.besoins.join(", ")} · {d.accompagnement.disponibilites}
              </p>
              {d.accompagnement.mode === "partenaire" && !d.accompagnement.accompagnateurId && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select className="input max-w-64 py-2" value={acc} onChange={(e) => setAcc(e.target.value)} aria-label="Choisir un accompagnateur">
                    <option value="">Choisir un accompagnateur…</option>
                    {accompagnateurs.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline px-3 py-2" disabled={!acc} onClick={assignerAcc}>
                    Affecter
                  </button>
                </div>
              )}
            </div>
          )}

          {d.statut === "soumis" && (
            <div className="space-y-3 rounded-xl border border-line p-3">
              <p className="text-sm font-semibold text-ink">Affecter un agent évaluateur puis démarrer l&apos;audit</p>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input max-w-72 py-2" value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Choisir l'agent évaluateur">
                  <option value="">Choisir un agent…</option>
                  {agents.filter((c) => c.eligible).map((c) => (
                    <option key={c.intervenant.id} value={c.intervenant.id}>
                      {c.intervenant.nom}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary px-3 py-2" disabled={!agent} onClick={demarrer}>
                  <Play className="size-4" aria-hidden /> Démarrer l&apos;audit
                </button>
                <button type="button" className="btn btn-outline px-3 py-2" onClick={() => onMaj(refuserDossier(d, maintenant()))}>
                  <X className="size-4" aria-hidden /> Refuser (pièces)
                </button>
              </div>
              {agents.some((c) => !c.eligible) && (
                <ul className="space-y-1">
                  {agents
                    .filter((c) => !c.eligible)
                    .map((c) => (
                      <li key={c.intervenant.id} className="text-xs text-muted">
                        <span className="line-through">{c.intervenant.nom}</span> — {c.motif}
                      </li>
                    ))}
                </ul>
              )}
              <p className="text-xs text-muted">L&apos;agent doit être indépendant, habilité au secteur, et ne pas avoir réalisé le dernier audit.</p>
            </div>
          )}

          {d.statut === "en_audit" && (
            <div className="space-y-3 rounded-xl border border-line p-3">
              <p className="text-sm font-semibold text-ink">
                Audit en cours — agent : {nomIntervenant(d.agentAuditId)}. Saisir les notes du rapport (0–100) :
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CRITERES.map((c) => (
                  <label key={c.key} className="text-sm">
                    <span className="label">
                      {c.label} <span className="text-muted">({c.poids} %)</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input"
                      value={scores[c.key]}
                      onChange={(e) => setScores({ ...scores, [c.key]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm">
                  Note globale calculée : <strong className={cn("font-display text-lg", scoreSaisi >= 80 ? "text-success" : "text-ink")}>{formatScore(scoreSaisi)} %</strong>
                  <span className="text-muted"> — {scoreSaisi >= 80 ? "admission automatique" : "refus automatique (< 80 %)"}</span>
                </p>
                <button type="button" className="btn btn-primary px-3 py-2" onClick={enregistrer}>
                  <ClipboardCheck className="size-4" aria-hidden /> Enregistrer le résultat
                </button>
              </div>
            </div>
          )}

          {d.audit && (
            <p className="text-sm text-muted">
              Audit du {formatDate(d.audit.date)} par {nomIntervenant(d.agentAuditId)} : <strong className="text-ink">{formatScore(d.audit.global)} %</strong>
            </p>
          )}

          <ul className="flex flex-wrap gap-2 text-xs text-muted">
            {d.historique.map((h, i) => (
              <li key={i} className="rounded-full bg-surface px-2.5 py-1">
                {STATUTS[h.statut].label} · {formatDate(h.date)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

const TONS_PART: Record<CandidatPartenaire["statut"], "primaire" | "succes" | "alerte" | "neutre"> = { soumis: "primaire", entretien: "primaire", valide: "succes", refuse: "alerte" };
const LIB_PART: Record<CandidatPartenaire["statut"], string> = { soumis: "Soumis", entretien: "Entretien", valide: "Validé", refuse: "Refusé" };

function ListePartenaires() {
  const { liste, maj, charge } = useCandidaturesPartenaires();
  if (!charge) return <Chargement />;
  const suivant = { soumis: "entretien", entretien: "valide" } as const;

  return (
    <div className="space-y-4">
      <Bloc titre={`Candidatures d'accompagnateurs (${liste.length})`} icone={<UserCheck className="size-5" aria-hidden />}>
        <ul className="space-y-3">
          {liste.map((p) => (
            <li key={p.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {p.nom}
                    <Pastille ton={TONS_PART[p.statut]}>{LIB_PART[p.statut]}</Pastille>
                    {p.agentHabilite && <span className="chip bg-primary-soft text-primary">Habilité audit</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {p.secteurs.map((s) => SECTEURS[s].label).join(", ")} · {p.zones.join(", ")} · {p.experience} ans · {p.certifications}
                  </p>
                  <p className="text-xs text-muted">
                    {p.telephone} · {p.email} · réf. {p.references}
                  </p>
                </div>
                <div className="flex gap-2">
                  {suivant[p.statut as keyof typeof suivant] && (
                    <button type="button" className="btn btn-primary px-3 py-2" onClick={() => maj(transitionPartenaire(p, suivant[p.statut as keyof typeof suivant], maintenant()))}>
                      <ShieldCheck className="size-4" aria-hidden /> Passer à « {LIB_PART[suivant[p.statut as keyof typeof suivant]]} »
                    </button>
                  )}
                  {p.statut !== "valide" && p.statut !== "refuse" && (
                    <button type="button" className="btn btn-outline px-3 py-2" onClick={() => maj(transitionPartenaire(p, "refuse", maintenant()))}>
                      <X className="size-4" aria-hidden /> Refuser
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                {ETAPES_PARTENAIRE.find((e) => e.statut === p.statut)?.description}
              </p>
            </li>
          ))}
        </ul>
      </Bloc>
      <p className="text-sm text-muted">
        Un accompagnateur validé reçoit des missions selon ses secteurs et zones. Règle d&apos;indépendance : il n&apos;audite jamais ses propres clients — vérifiée à chaque affectation.
      </p>
    </div>
  );
}
