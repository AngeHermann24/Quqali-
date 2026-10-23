"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, Gauge, ShieldCheck } from "lucide-react";
import { CLES, type Dossier, ajouterJours } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { ScoreBars } from "@/components/scores";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

export function ControlesPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  if (!dossier?.audit)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <Gauge className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Aucun contrôle pour l&apos;instant</h1>
          <p className="mt-2 text-sm text-muted">Les contrôles réguliers commencent après la publication de votre fiche.</p>
          <Link href="/pro/parcours" className="btn btn-primary mt-5">
            Voir mon parcours
          </Link>
        </div>
      </div>
    );

  const a = dossier.audit;
  const sousSeuil = a.global < SITE.seuil;
  const prochainAnnuel = ajouterJours(a.date, 365);

  return (
    <>
      <EspaceHeader role="Contrôles" titre="Contrôles réguliers" sousTitre="La certification se maintient : des visites ont lieu après l'admission" />
      <div className="container-page max-w-2xl space-y-5 py-6">
        {sousSeuil && (
          <div className="card border-amber-300 bg-amber-50 p-5">
            <p className="flex items-center gap-2 font-semibold text-amber-800">
              <AlertTriangle className="size-5" aria-hidden /> Votre dernière note est passée sous {SITE.seuil} %
            </p>
            <p className="mt-1.5 text-sm text-amber-800/80">
              Pas de panique : un plan de correction vous est proposé et un nouveau contrôle confirmera votre progression. Le badge est suspendu si la note
              reste sous le seuil au prochain contrôle.
            </p>
          </div>
        )}

        <Bloc titre="Dernier audit" icone={<ShieldCheck className="size-5" aria-hidden />} action={<Pastille ton={sousSeuil ? "alerte" : "succes"}>{formatScore(a.global)} %</Pastille>}>
          <p className="mb-4 text-sm text-muted">Réalisé le {formatDate(a.date)} par un agent évaluateur indépendant.</p>
          <ScoreBars scores={a.scores} />
        </Bloc>

        <Bloc titre="À venir" icone={<CalendarCheck className="size-5" aria-hidden />}>
          <ul className="space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
              <span>
                <span className="block font-semibold text-ink">Contrôle annuel</span>
                <span className="text-xs text-muted">Même grille complète que l&apos;audit d&apos;admission</span>
              </span>
              <Pastille ton="primaire">{formatDate(prochainAnnuel)}</Pastille>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line p-3.5">
              <span>
                <span className="block font-semibold text-ink">Contrôle inopiné</span>
                <span className="text-xs text-muted">Visite surprise possible à tout moment — c&apos;est ce qui rend le label crédible</span>
              </span>
              <Pastille ton="neutre">Aléatoire</Pastille>
            </li>
          </ul>
        </Bloc>

        <Bloc>
          <p className="text-sm leading-relaxed text-muted">
            Si un contrôle passe sous {SITE.seuil} %, vous recevez le détail des points à corriger, un délai pour agir et un nouveau passage est planifié.
            Le badge n&apos;est retiré qu&apos;en dernier recours.
          </p>
        </Bloc>
      </div>
    </>
  );
}
