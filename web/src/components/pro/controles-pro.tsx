"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { CLES, type Dossier, ajouterJours } from "@/lib/espace";
import { CRITERES } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, EtatVidePro, ProgressBarPro, StatusPillPro } from "@/components/pro/ui";

export function ControlesPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  if (!dossier?.audit)
    return (
      <div className="px-5 pt-5 pb-6">
        <EntetePro titre="Contrôles" />
        <EtatVidePro
          icone={<Gauge className="size-8" aria-hidden />}
          titre="Aucun contrôle pour l'instant"
          detail="Les contrôles réguliers commencent après la publication de votre fiche."
          action={
            <Link href="/pro/parcours" className="rounded-2xl bg-bleu px-5 py-2.5 text-sm font-bold text-white">
              Voir mon parcours
            </Link>
          }
        />
      </div>
    );

  const a = dossier.audit;
  const sousSeuil = a.global < SITE.seuil;
  const prochainAnnuel = ajouterJours(a.date, 365);

  return (
    <>
      <EntetePro titre="Contrôles" />
      <div className="space-y-3.5 px-5 pb-6">
        {sousSeuil && (
          <div className="rounded-3xl border border-or/40 bg-or/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[#b45309]">
              <AlertTriangle className="size-5" aria-hidden /> Note passée sous {SITE.seuil} %
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#b45309]/80">
              Pas de panique : un plan de correction vous est proposé et un nouveau contrôle confirmera votre progression. Le badge n&apos;est suspendu que si
              la note reste sous le seuil au prochain contrôle.
            </p>
          </div>
        )}

        {/* Dernier contrôle */}
        <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><ShieldCheck className="size-4 text-primary" aria-hidden /> Dernier audit</p>
            <StatusPillPro statut={sousSeuil ? "refusee" : "confirmee"} label={`${a.global} %`} />
          </div>
          <p className="mt-1 text-xs text-muted">Réalisé le {formatDate(a.date)} par un agent évaluateur indépendant.</p>
          <ul className="mt-3 space-y-2.5">
            {CRITERES.map((c) => (
              <li key={c.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{c.label}</span>
                  <span className="font-bold text-ink">{a.scores[c.key]}/20</span>
                </div>
                <ProgressBarPro valeur={a.scores[c.key] * 5} couleur={a.scores[c.key] >= 16 ? "bg-success" : a.scores[c.key] >= 12 ? "bg-or" : "bg-danger"} className="mt-1" />
              </li>
            ))}
          </ul>
          {sousSeuil && (
            <Link href="/pro/accompagnement" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-bleu text-sm font-bold text-white">
              <Sparkles className="size-4" aria-hidden /> Voir le plan de correction
            </Link>
          )}
        </div>

        {/* À venir */}
        <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><CalendarCheck className="size-4 text-primary" aria-hidden /> À venir</p>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
              <span>
                <span className="block text-sm font-bold text-ink">Contrôle annuel</span>
                <span className="text-xs text-muted">Même grille complète que l&apos;audit d&apos;admission</span>
              </span>
              <StatusPillPro statut="en_attente" label={formatDate(prochainAnnuel)} />
            </li>
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line p-3.5">
              <span>
                <span className="block text-sm font-bold text-ink">Contrôle inopiné</span>
                <span className="text-xs text-muted">Visite surprise possible à tout moment — c&apos;est ce qui rend le label crédible</span>
              </span>
              <StatusPillPro statut="annulee" label="Aléatoire" />
            </li>
          </ul>
        </div>

        <p className="rounded-3xl border border-line bg-white p-4 text-xs leading-relaxed text-muted shadow-card">
          Si un contrôle passe sous {SITE.seuil} %, vous recevez le détail des points à corriger, un délai pour agir et un nouveau passage est planifié.
          <strong className="text-ink"> Le badge n&apos;est retiré qu&apos;en dernier recours.</strong>
        </p>
      </div>
    </>
  );
}
