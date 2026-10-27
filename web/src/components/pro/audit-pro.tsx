"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Bell, CalendarClock, Check, ClipboardList, FileCheck2, Info, Users } from "lucide-react";
import { CRITERES } from "@/lib/data";
import { CLES, type Dossier, ajouterJours, nomIntervenant } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useHorloge } from "@/lib/use-config";
import { CRITERE_ICONS } from "@/components/ui";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, PanneauBas, ToastPro } from "@/components/pro/ui";
import { cn } from "@/lib/site";

const PREPARATION = [
  { cle: "documents", label: "Documents prêts", detail: "Registre, autorisation, attestations à portée de main." },
  { cle: "personnel", label: "Personnel informé", detail: "L'équipe sait qu'un audit aura lieu et connaît les critères." },
  { cle: "locaux", label: "Locaux prêts", detail: "Espaces accessibles, propres et en ordre pour la visite." },
] as const;

const creneaux = (aujourdhui: string) => [
  `${ajouterJours(aujourdhui, 3).slice(0, 10)}T09:00`,
  `${ajouterJours(aujourdhui, 4).slice(0, 10)}T14:00`,
  `${ajouterJours(aujourdhui, 7).slice(0, 10)}T10:30`,
];

/** Écran 4 — Audit sur place : rendez-vous, critères (sans notes), préparation. */
export function AuditPro() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { aujourdhui } = useHorloge();
  const [choisir, setChoisir] = useState(false);
  const [grille, setGrille] = useState(false);
  const [toast, setToast] = useState(false);

  if (dossier === undefined || !aujourdhui) return <Chargement />;

  if (!dossier || (dossier.statut !== "en_audit" && !dossier.audit))
    return (
      <div className="bg-surface px-5">
        <EntetePro titre="Audit sur place" onRetour={() => router.back()} />
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <CalendarClock className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Pas encore d&apos;audit programmé</h1>
          <p className="mt-2 text-sm text-muted">Votre audit apparaîtra ici une fois votre dossier validé par notre équipe.</p>
          <Link href="/pro/parcours" className="btn btn-success mt-5 w-full">
            Voir mon parcours
          </Link>
        </div>
      </div>
    );

  const prepa = dossier.prepaAudit ?? {};
  const cocher = (cle: string) => {
    navigator.vibrate?.(6);
    setDossier({ ...dossier, prepaAudit: { ...prepa, [cle]: !prepa[cle] } });
  };
  const rdv = dossier.creneauAudit;
  const heure = (iso: string) => `${new Date(iso).getUTCHours()}h${String(new Date(iso).getUTCMinutes()).padStart(2, "0")}`;
  const fin = (iso: string) => heure(new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString());

  const prendreCreneau = (c: string) => {
    setDossier({ ...dossier, creneauAudit: c });
    setChoisir(false);
    navigator.vibrate?.(10);
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  };

  return (
    <div className="bg-surface">
      <EntetePro titre="Audit sur place" onRetour={() => router.back()} />
      <p className="px-5 text-center text-xs text-muted">Notre agent viendra dans votre établissement avec la grille de notation.</p>

      <div className="space-y-5 px-5 py-5">
        {/* Carte de rendez-vous */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <CalendarClock className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              {rdv ? (
                <>
                  <p className="font-display text-sm font-bold text-ink">{formatDate(rdv)}</p>
                  <p className="text-xs text-muted">
                    {heure(rdv)} – {fin(rdv)} · Agent {nomIntervenant(dossier.agentAuditId)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-sm font-bold text-ink">Créneau à convenir</p>
                  <p className="text-xs text-muted">Choisissez parmi les créneaux proposés — confirmation par l&apos;équipe.</p>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={() => setChoisir(true)} className="mt-3.5 w-full rounded-2xl border-2 border-bleu py-2.5 text-sm font-bold text-bleu transition active:scale-[0.98]">
            {rdv ? "Choisir un autre créneau" : "Choisir mon créneau"}
          </button>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
            <Bell className="size-3.5" aria-hidden /> Rappel par SMS et notification : J-2 et la veille.
          </p>
        </section>

        {/* Critères d'audit — sans notes avant la visite */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <ClipboardList className="size-4 text-primary" aria-hidden /> Critères d&apos;audit
          </h2>
          <ul className="mt-4 space-y-4">
            {CRITERES.map((c) => {
              const Icon = CRITERE_ICONS[c.key];
              const note = dossier.audit?.scores[c.key];
              return (
                <li key={c.key}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-ink">{c.label}</p>
                        <p className="text-[11px] font-semibold text-muted">{note !== undefined ? `${Math.round((note / 5) * 10) / 10}/20 pts` : "20 pts"}</p>
                      </div>
                      <p className="text-[11px] leading-snug text-muted">{c.description}</p>
                    </div>
                  </div>
                  {/* Avant l'audit : piste vide, aucune note affichée */}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface" role={note !== undefined ? "progressbar" : undefined} aria-hidden={note === undefined}>
                    {note !== undefined && <div className="h-full rounded-full bg-success" style={{ width: `${note}%` }} />}
                  </div>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => setGrille(true)} className="btn btn-success mt-5 w-full">
            Voir la grille complète
          </button>
        </section>

        {/* Liste de préparation */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Users className="size-4 text-primary" aria-hidden /> Préparer la visite
          </h2>
          <ul className="mt-3 space-y-2">
            {PREPARATION.map(({ cle, label, detail }) => {
              const fait = !!prepa[cle];
              return (
                <li key={cle}>
                  <button
                    type="button"
                    onClick={() => cocher(cle)}
                    aria-pressed={fait}
                    className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition", fait ? "border-success/40 bg-success-soft/50" : "border-line")}
                  >
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", fait ? "border-success bg-success text-white" : "border-line bg-white")}>
                      {fait && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    </span>
                    <span>
                      <span className={cn("block text-sm font-bold", fait ? "text-success" : "text-ink")}>{label}</span>
                      <span className="block text-[11px] text-muted">{detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Seuil d&apos;admission : {SITE.seuil} % — le score est la moyenne des 4 critères sur 20.
          </p>
        </section>
      </div>

      {/* Choisir un autre créneau — 3 propositions */}
      <PanneauBas ouvert={choisir} titre="Choisir un créneau" onFermer={() => setChoisir(false)}>
        <p className="mb-3 text-xs text-muted">Trois propositions — l&apos;équipe confirme le rendez-vous par SMS.</p>
        <div className="space-y-2.5">
          {creneaux(aujourdhui).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => prendreCreneau(c)}
              className={cn("flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition active:scale-[0.98]", rdv === c ? "border-bleu bg-primary-soft" : "border-line")}
            >
              <span>
                <span className="block text-sm font-bold text-ink">{formatDate(c)}</span>
                <span className="text-xs text-muted">{heure(c)} – {fin(c)}</span>
              </span>
              <FileCheck2 className="size-5 text-muted" aria-hidden />
            </button>
          ))}
        </div>
      </PanneauBas>

      {/* Grille complète — lecture seule */}
      <PanneauBas ouvert={grille} titre="Grille de notation" onFermer={() => setGrille(false)}>
        <p className="mb-3 text-xs text-muted">Chaque critère est noté sur 20 points. La moyenne fait votre score global.</p>
        <ul className="space-y-3">
          {CRITERES.map((c) => {
            const Icon = CRITERE_ICONS[c.key];
            return (
              <li key={c.key} className="rounded-2xl border border-line p-3.5">
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon className="size-4 text-primary" aria-hidden /> {c.label} <span className="ml-auto text-xs font-semibold text-muted">20 pts</span>
                </p>
                <ul className="mt-2 space-y-1">
                  {c.exemples.map((e) => (
                    <li key={e} className="flex items-start gap-1.5 text-xs text-muted">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden /> {e}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </PanneauBas>

      <ToastPro message="Créneau enregistré — confirmation par l'équipe" visible={toast} />
    </div>
  );
}
