"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, FilePlus2, FileSearch, Footprints, Handshake, PartyPopper, ClipboardCheck, CreditCard } from "lucide-react";
import { CLES, type Dossier, ajouterJours, auditSimule, maintenant, nomIntervenant } from "@/lib/espace";
import { INTERVENANTS } from "@/lib/espace";
import { assignerAgent } from "@/lib/regles";
import { etatAbonnement } from "@/lib/abonnement";
import { formatDate, formatScore } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Chargement, PanneauDemo } from "@/components/espace/ui";
import { EntetePro, ProgressBarPro, StepperPro, type EtapeStepper } from "@/components/pro/ui";

/** Trois créneaux proposés, calculés à partir d'aujourd'hui (J+3, J+4, J+7). */
const creneaux = (aujourdhui: string) => [
  `${ajouterJours(aujourdhui, 3).slice(0, 10)}T09:00`,
  `${ajouterJours(aujourdhui, 4).slice(0, 10)}T14:00`,
  `${ajouterJours(aujourdhui, 7).slice(0, 10)}T10:30`,
];
const NOMS_ETAPES = ["Dossier", "Validé", "Audit", "Résultat", "Paiement", "Publié"] as const;

/** Écran 2 — Mon parcours : stepper 6 étapes, étape actuelle, prochaines étapes. */
export function ParcoursPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();

  if (dossier === undefined || !aujourdhui) return <Chargement />;

  if (!dossier)
    return (
      <div className="bg-surface px-5">
        <EntetePro titre="Mon parcours" />
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <Footprints className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Votre parcours de certification</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Déposez votre dossier : un agent évaluateur indépendant visitera votre établissement. À partir de {SITE.seuil} %, vous choisissez votre pack et votre fiche est publiée.
          </p>
          <Link href="/pro/inscription" className="btn btn-success mt-6 w-full">
            <FilePlus2 className="size-4" aria-hidden /> Déposer mon dossier
          </Link>
        </div>
      </div>
    );

  const changer = (statut: Dossier["statut"], partiel: Partial<Dossier> = {}) =>
    setDossier({ ...dossier, ...partiel, statut, historique: [...dossier.historique, { statut, date: maintenant() }] });

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

  // Stepper horizontal : 6 étapes dérivées du statut
  const etapes: EtapeStepper[] = [
    { label: NOMS_ETAPES[0], etat: "fait" },
    { label: NOMS_ETAPES[1], etat: dossier.statut === "soumis" ? "actuel" : "fait" },
    { label: NOMS_ETAPES[2], etat: audite ? "fait" : dossier.statut === "en_audit" ? "actuel" : "a_venir" },
    { label: NOMS_ETAPES[3], etat: admis ? "fait" : refuse ? "echec" : "a_venir" },
    { label: NOMS_ETAPES[4], etat: publie ? "fait" : admis ? "actuel" : "a_venir" },
    { label: NOMS_ETAPES[5], etat: publie ? "fait" : "a_venir" },
  ];
  const indice = etapes.findIndex((e) => e.etat === "actuel" || e.etat === "echec" || e.etat === "a_venir");
  const etapeActuelle = indice === -1 ? 5 : indice;
  const progression = (etapeActuelle / 5) * 100;

  const descriptions: Record<number, { titre: string; detail: string }> = {
    0: { titre: "Dossier en préparation", detail: "Complétez vos informations et envoyez vos documents." },
    1: { titre: "Dossier soumis", detail: "Votre dossier a été reçu et est en cours d'examen par notre équipe." },
    2: { titre: "Audit sur place", detail: dossier.creneauAudit ? `Visite le ${formatDate(dossier.creneauAudit)} · Agent ${nomIntervenant(dossier.agentAuditId)}` : "Choisissez votre créneau de visite ci-dessous." },
    3: { titre: "Résultat de l'audit", detail: `Le seuil d'admission est de ${SITE.seuil} %.` },
    4: { titre: "Paiement de l'abonnement", detail: "Choisissez votre pack — le paiement n'influence jamais la note." },
    5: { titre: refuse ? "Score sous le seuil" : "Publication", detail: refuse ? "Plan d'action et accompagnement disponibles." : "Votre fiche devient visible dans l'app usager." },
  };

  // Prochaines étapes selon la situation
  const prochaines: { titre: string; delai: string; Icon: typeof FileSearch; href?: string }[] = [];
  if (dossier.statut === "soumis") {
    prochaines.push({ titre: "Examen du dossier", delai: "Dans 2 jours", Icon: FileSearch }, { titre: "Audit sur place", delai: "À programmer", Icon: CalendarClock });
  } else if (dossier.statut === "en_audit") {
    prochaines.push(
      { titre: "Audit sur place", delai: dossier.creneauAudit ? formatDate(dossier.creneauAudit) : "À programmer", Icon: CalendarClock, href: "/pro/audit" },
      { titre: "Résultat de l'audit", delai: "Sous 48 h après la visite", Icon: ClipboardCheck },
    );
  } else if (admis && !dossier.abonnement) {
    prochaines.push({ titre: "Choisir mon abonnement", delai: "Maintenant", Icon: CreditCard, href: "/pro/abonnement" });
  } else if (refuse && !acc) {
    prochaines.push({ titre: "Demander un accompagnement", delai: "Plan d'action personnalisé", Icon: Handshake, href: "/pro/accompagnement" });
  } else if (refuse && acc?.pretLe) {
    prochaines.push({ titre: "Réaudit", delai: "Prêt à être programmé", Icon: CalendarClock });
  }

  return (
    <div className="bg-surface">
      <EntetePro titre="Mon parcours" />
      <p className="px-5 text-center text-xs text-muted">Suivez chaque étape jusqu&apos;à la publication de votre établissement.</p>

      <div className="space-y-5 px-5 py-5">
        {publie && (
          <div className="rounded-3xl border border-success/30 bg-success-soft/60 p-5 text-center [animation:pop_.45s_ease_both]">
            <PartyPopper className="mx-auto size-10 text-success" aria-hidden />
            <p className="mt-2 font-display text-lg font-bold text-ink">Félicitations, vous êtes certifié&nbsp;!</p>
            <p className="text-sm text-muted">Votre établissement est visible avec le badge « Qualité certifiée ».</p>
            <Link href="/pro" className="btn btn-success mt-4 w-full">
              Voir mon tableau de bord
            </Link>
          </div>
        )}

        {/* Stepper 6 étapes */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <StepperPro etapes={etapes} />
        </section>

        {/* Étape actuelle */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Étape actuelle</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <ClipboardCheck className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink">{descriptions[etapeActuelle].titre}</p>
              <p className="text-xs text-muted">{descriptions[etapeActuelle].detail}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ProgressBarPro valeur={Math.max(progression, 8)} className="flex-1" />
            <span className="text-xs font-bold text-muted">{etapeActuelle + 1}/6</span>
          </div>
        </section>

        {/* Créneau d'audit */}
        {dossier.statut === "en_audit" && !dossier.creneauAudit && (
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <CalendarClock className="size-4 text-primary" aria-hidden /> Choisissez votre créneau d&apos;audit
            </h2>
            <p className="mt-1 text-xs text-muted">L&apos;agent se déplace sur place à la date choisie. Rappel SMS la veille.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {creneaux(aujourdhui).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDossier({ ...dossier, creneauAudit: c })}
                  className="rounded-2xl border border-line px-2 py-3 text-center text-xs font-semibold text-ink transition hover:border-bleu active:scale-[0.97]"
                >
                  {formatDate(c)}
                  <span className="block text-[10px] font-normal text-muted">
                    {new Date(c).getUTCHours()} h{String(new Date(c).getUTCMinutes()).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Prochaines étapes */}
        {prochaines.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink">Prochaines étapes</h2>
            <ul className="mt-3 space-y-2.5">
              {prochaines.map(({ titre, delai, Icon, href }) => {
                const corps = (
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{titre}</span>
                      <span className="text-xs text-muted">{delai}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted" aria-hidden />
                  </span>
                );
                return (
                  <li key={titre} className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
                    {href ? <Link href={href}>{corps}</Link> : corps}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {dossier.audit && (
          <Link href="/pro/resultat" className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card transition active:scale-[0.99]">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
                <ClipboardCheck className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">Résultat de l&apos;audit : {formatScore(dossier.audit.global)} %</span>
                <span className="text-xs text-muted">Détail par critère et rapport PDF</span>
              </span>
            </span>
            <ChevronRight className="size-4 text-muted" aria-hidden />
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
    </div>
  );
}
