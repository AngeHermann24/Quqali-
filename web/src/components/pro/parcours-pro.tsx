"use client";

import Link from "next/link";
import { CalendarClock, Check, FilePlus2, Footprints, Handshake, PartyPopper } from "lucide-react";
import { CLES, type Dossier, STATUTS, auditSimule, maintenant, nomIntervenant } from "@/lib/espace";
import { INTERVENANTS } from "@/lib/espace";
import { assignerAgent } from "@/lib/regles";
import { etatAbonnement } from "@/lib/abonnement";
import { formatDate, formatScore } from "@/lib/format";
import { SITE, cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Bloc, Chargement, EspaceHeader, PanneauDemo, Pastille } from "@/components/espace/ui";

const CRENEAUX = ["2026-11-06T09:00", "2026-11-07T14:00", "2026-11-10T10:30"];

export function ParcoursPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();

  if (dossier === undefined || !aujourdhui) return <Chargement />;

  if (!dossier)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <Footprints className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Votre parcours de certification</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Déposez votre dossier : un agent évaluateur indépendant visitera votre établissement. À partir de {SITE.seuil} %, vous choisissez votre pack et votre fiche est publiée.
          </p>
          <Link href="/pro/inscription" className="btn btn-primary mt-6 w-full">
            <FilePlus2 className="size-4" aria-hidden /> Déposer mon dossier
          </Link>
        </div>
      </div>
    );

  const changer = (statut: Dossier["statut"], partiel: Partial<Dossier> = {}) =>
    setDossier({ ...dossier, ...partiel, statut, historique: [...dossier.historique, { statut, date: maintenant() }] });
  const dateStatut = (s: Dossier["statut"]) => dossier.historique.findLast((h) => h.statut === s)?.date;

  const etatAb = etatAbonnement(dossier.abonnement, aujourdhui, config);
  const admis = dossier.statut === "admis";
  const refuse = dossier.statut === "refuse";
  const audite = admis || refuse;
  const publie = admis && !!dossier.abonnement && etatAb.visible;
  const acc = dossier.accompagnement;

  const lancerAudit = () => {
    const liens = acc ? [{ accompagnateurId: acc.accompagnateurId, etablissementId: dossier.id }] : [];
    const { agent } = assignerAgent({ id: dossier.id, secteur: dossier.secteur, commune: dossier.commune }, INTERVENANTS, liens, dossier.agentAuditId);
    changer("en_audit", { agentAuditId: acc?.agentReauditId ?? agent?.id });
  };

  const etapes = [
    { label: "Dossier soumis", description: STATUTS.soumis.description, date: formatDate(dateStatut("soumis")!), etat: "fait" as const },
    {
      label: "Dossier validé",
      description: dossier.statut === "soumis" ? "Vérification des documents en cours par nos équipes." : "Pièces conformes, un agent vous est assigné.",
      etat: dossier.statut === "soumis" ? ("actuel" as const) : ("fait" as const),
    },
    {
      label: "Audit programmé",
      description: dossier.creneauAudit
        ? `Visite le ${formatDate(dossier.creneauAudit)} · Agent ${nomIntervenant(dossier.agentAuditId)}`
        : dossier.statut === "en_audit"
          ? "Choisissez votre créneau ci-dessous."
          : "Créneau à convenir avec l'agent évaluateur.",
      date: dossier.creneauAudit ? formatDate(dossier.creneauAudit) : undefined,
      etat: dossier.statut === "soumis" ? ("a_venir" as const) : dossier.statut === "en_audit" ? ("actuel" as const) : ("fait" as const),
    },
    {
      label: "Audit réalisé",
      description: "Notation sur place : hygiène, accueil, présentation, gouvernance.",
      etat: audite ? ("fait" as const) : ("a_venir" as const),
    },
    {
      label: audite ? `Résultat : ${formatScore(dossier.audit!.global)} %` : `Résultat (seuil ${SITE.seuil} %)`,
      description: refuse ? "Sous le seuil — plan d'action et accompagnement disponibles." : undefined,
      etat: admis ? ("fait" as const) : refuse ? ("echec" as const) : ("a_venir" as const),
    },
    {
      label: "Paiement du pack",
      description: "Basique ou Premium — le paiement n'influence jamais la note.",
      etat: publie ? ("fait" as const) : admis ? ("actuel" as const) : ("a_venir" as const),
    },
    {
      label: "Publié",
      description: publie ? "Votre fiche est visible avec le badge « Qualité certifiée »." : "Votre fiche devient visible dans l'app usager.",
      etat: publie ? ("fait" as const) : ("a_venir" as const),
    },
  ];

  return (
    <>
      <EspaceHeader
        role="Mon parcours"
        titre={dossier.nom}
        sousTitre={`${dossier.sousType} · ${dossier.quartier}, ${dossier.commune}`}
        actions={<Pastille ton={publie ? "succes" : "primaire"}>{publie ? "Publié" : STATUTS[dossier.statut].label}</Pastille>}
      />

      <div className="container-page max-w-2xl space-y-5 py-6">
        {publie && (
          <div className="card border-success/30 bg-success-soft/60 p-5 text-center [animation:pop_.45s_ease_both]">
            <PartyPopper className="mx-auto size-10 text-success" aria-hidden />
            <p className="mt-2 font-display text-lg font-bold text-ink">Félicitations, vous êtes certifié !</p>
            <p className="text-sm text-muted">Votre établissement est visible avec le badge « Qualité certifiée ». Pilotez-le depuis l&apos;onglet Accueil.</p>
          </div>
        )}

        <Bloc titre="Votre certification, étape par étape">
          <Chemin etapes={etapes} />
        </Bloc>

        {dossier.statut === "en_audit" && !dossier.creneauAudit && (
          <Bloc titre="Choisissez votre créneau d'audit" icone={<CalendarClock className="size-5" aria-hidden />}>
            <p className="mb-3 text-sm text-muted">L&apos;agent se déplace sur place à la date choisie. Rappel SMS la veille.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {CRENEAUX.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDossier({ ...dossier, creneauAudit: c })}
                  className="card px-3 py-3.5 text-center text-sm font-semibold text-ink transition hover:border-primary active:scale-[0.97]"
                >
                  {formatDate(c)}
                  <span className="block text-xs font-normal text-muted">{new Date(c).getUTCHours()} h{String(new Date(c).getUTCMinutes()).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          </Bloc>
        )}

        {dossier.audit && (
          <Link href="/pro/resultat" className="card flex items-center justify-between p-5 transition hover:border-primary/40">
            <span className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-2xl", admis ? "bg-success-soft text-success" : "bg-amber-100 text-amber-700")}>
                <Check className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-ink">Résultat de l&apos;audit : {formatScore(dossier.audit.global)} %</span>
                <span className="text-xs text-muted">Détail par critère et rapport PDF</span>
              </span>
            </span>
            <span className="font-display text-xl font-bold text-primary">→</span>
          </Link>
        )}

        {admis && !dossier.abonnement && (
          <Link href="/pro/abonnement" className="btn btn-success w-full">
            Choisir mon pack et publier ma fiche
          </Link>
        )}

        {refuse && !acc && (
          <Link href="/pro/accompagnement" className="btn btn-primary w-full">
            <Handshake className="size-4" aria-hidden /> Demander un accompagnement
          </Link>
        )}

        <PanneauDemo>
          {dossier.statut === "soumis" && (
            <button type="button" className="btn btn-primary" onClick={lancerAudit}>
              Valider le dossier et assigner un agent
            </button>
          )}
          {dossier.statut === "en_audit" && dossier.creneauAudit && (
            <>
              <button type="button" className="btn btn-success" onClick={() => changer("admis", { audit: auditSimule("admis") })}>
                Résultat : admis
              </button>
              <button type="button" className="btn btn-outline" onClick={() => changer("refuse", { audit: auditSimule("refuse") })}>
                Résultat : refusé
              </button>
            </>
          )}
          {dossier.statut === "en_audit" && !dossier.creneauAudit && <p className="text-xs text-muted">Choisissez d&apos;abord un créneau ci-dessus.</p>}
          {refuse && acc?.pretLe && (
            <button type="button" className="btn btn-primary" onClick={lancerAudit}>
              Lancer le réaudit
            </button>
          )}
        </PanneauDemo>
      </div>
    </>
  );
}

/** Chemin vertical animé : ligne verte qui avance, étape courante pulsante. */
function Chemin({ etapes }: { etapes: { label: string; description?: string; date?: string; etat: "fait" | "actuel" | "echec" | "a_venir" }[] }) {
  const nbFait = etapes.findIndex((e) => e.etat !== "fait");
  const atteint = nbFait === -1 ? etapes.length - 1 : nbFait;
  return (
    <ol className="relative space-y-0">
      <span className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-line" aria-hidden />
      <span
        className="absolute top-4 left-[15px] w-0.5 bg-success transition-all duration-700 ease-out"
        style={{ height: `${Math.max(0, (atteint / (etapes.length - 1)) * 100) - 4}%` }}
        aria-hidden
      />
      {etapes.map((e, i) => (
        <li key={e.label} className="relative flex gap-3 pb-6 last:pb-0">
          <span
            className={cn(
              "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
              e.etat === "fait" && "bg-success text-white",
              e.etat === "actuel" && "bg-primary text-white ring-4 ring-primary-soft",
              e.etat === "echec" && "bg-red-600 text-white",
              e.etat === "a_venir" && "border-2 border-line bg-white text-muted",
            )}
          >
            {e.etat === "fait" ? <Check className="size-4" aria-hidden /> : i + 1}
            {e.etat === "actuel" && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" aria-hidden />}
          </span>
          <div className="min-w-0 pt-1">
            <p className={cn("text-sm font-semibold", e.etat === "a_venir" ? "text-muted" : "text-ink")}>{e.label}</p>
            {e.description && <p className="text-xs leading-relaxed text-muted">{e.description}</p>}
            {e.date && <p className="mt-0.5 text-xs font-medium text-primary">{e.date}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
