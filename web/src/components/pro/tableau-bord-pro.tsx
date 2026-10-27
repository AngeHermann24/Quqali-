"use client";

import Link from "next/link";
import { AlarmClock, Bell, CalendarClock, ChevronRight, Crown, Eye, FileWarning, MessageSquareText, Star } from "lucide-react";
import { etatAbonnement } from "@/lib/abonnement";
import type { AvisClient } from "@/lib/avis";
import { CLES, type Dossier, ajouterJours, avisDemo } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { aAcces, packActif } from "@/lib/pro-service";
import { SITE, cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { useReservations } from "@/components/reservation/use-reservations";
import { Chargement } from "@/components/espace/ui";
import { BadgeCertifiePro, KpiCard, LockedFeature, RingScorePro } from "@/components/pro/ui";

/** Valeurs de démonstration stables, dérivées de l'identifiant de l'établissement. */
const graine = (id: string) => [...id].reduce((s, c) => s + c.charCodeAt(0), 0);

export function TableauBordPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const { config } = useConfigTarifs();
  const { aujourdhui } = useHorloge();

  if (dossier === undefined || avisTous === undefined || !aujourdhui) return <Chargement />;

  if (!dossier)
    return (
      <div className="px-5 py-10">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Pas encore de fiche</h1>
          <p className="mt-2 text-sm text-muted">Votre tableau de bord s&apos;activera une fois votre établissement publié.</p>
          <Link href="/pro/parcours" className="btn btn-primary mt-5">Suivre mon parcours</Link>
        </div>
      </div>
    );

  return <Contenu dossier={dossier} avisRecus={avisTous?.[dossier.id] ?? []} aujourdhui={aujourdhui} config={config} />;
}

function Contenu({ dossier, avisRecus, aujourdhui, config }: { dossier: Dossier; avisRecus: AvisClient[]; aujourdhui: string; config: ReturnType<typeof useConfigTarifs>["config"] }) {
  const { reservations } = useReservations(dossier.id, dossier.nom, dossier.secteur);

  const demo = avisDemo();
  const tousLesAvis = [...avisRecus, ...demo];
  const nbAvis = tousLesAvis.length;
  const moyenne = nbAvis ? tousLesAvis.reduce((s, a) => s + a.note, 0) / nbAvis : 0;
  const sansReponse = tousLesAvis.filter((a) => !dossier.reponsesAvis[a.id]).length;

  const aujourd = aujourdhui.slice(0, 10);
  const duJour = reservations.filter((r) => (r.date ?? r.arrivee ?? "").slice(0, 10) === aujourd);
  const aConfirmer = reservations.filter((r) => r.statut === "en_attente").length;

  const premium = aAcces(dossier, "reservations");
  const pack = packActif(dossier);
  const etatAb = etatAbonnement(dossier.abonnement, aujourdhui, config);

  // Prochain contrôle qualité : 6 mois après le dernier audit (démo).
  const prochainControle = dossier.audit ? ajouterJours(dossier.audit.date, 182) : undefined;
  const joursControle = prochainControle ? Math.round((new Date(prochainControle).getTime() - new Date(aujourd).getTime()) / 86400000) : null;

  const s = graine(dossier.id);
  const vues = 700 + (s % 1400);
  const varVues = 4 + (s % 22);
  const varNote = (s % 7) - 2;
  const nbDuJour = premium ? 3 + (s % 9) : 0;
  const varResa = 10 + (s % 40);

  const alertes = [
    sansReponse > 0 && { Icon: MessageSquareText, texte: `${sansReponse} avis sans réponse`, href: "/pro/avis", ton: "bg-primary-soft text-primary" },
    premium && aConfirmer > 0 && { Icon: AlarmClock, texte: `${aConfirmer} réservation${aConfirmer > 1 ? "s" : ""} à confirmer`, href: "/pro/reservations", ton: "bg-or/15 text-[#b45309]" },
    dossier.abonnement && etatAb.statut !== "actif" && { Icon: Crown, texte: etatAb.statut === "expire_bientot" ? `Abonnement expire le ${formatDate(dossier.abonnement.fin)}` : "Paiement en attente", href: "/pro/abonnement", ton: "bg-danger/10 text-danger" },
    joursControle !== null && joursControle <= 60 && joursControle > 0 && { Icon: CalendarClock, texte: `Contrôle qualité dans ${joursControle} j`, href: "/pro/controles", ton: "bg-primary-soft text-primary" },
    dossier.audit && dossier.audit.global < SITE.seuil && { Icon: FileWarning, texte: "Note sous le seuil de 80 %", href: "/pro/controles", ton: "bg-danger/10 text-danger" },
  ].filter(Boolean) as { Icon: typeof Eye; texte: string; href: string; ton: string }[];

  return (
    <>
      {/* Salutation */}
      <div className="px-5 pt-5">
        <p className="font-display text-xl font-extrabold text-ink">Bonjour, {dossier.nom}</p>
        <p className="text-sm text-muted">Voici un aperçu de votre activité.</p>
      </div>

      {/* Alertes à traiter */}
      {alertes.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {alertes.map(({ Icon, texte, href, ton }) => (
            <Link key={texte} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap", ton)}>
              <Icon className="size-4" aria-hidden /> {texte} <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-3.5 px-5 py-5">
        {/* Note globale */}
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-5">
            <RingScorePro valeur={dossier.audit?.global ?? Math.round(moyenne * 20)} taille={104} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Note globale</p>
              <p className={cn("mt-1 text-sm font-bold", varNote >= 0 ? "text-success" : "text-danger")}>
                {varNote >= 0 ? "+" : ""}{varNote} pt <span className="font-normal text-muted">vs mois dernier</span>
              </p>
              <BadgeCertifiePro className="mt-2" />
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                <Star className="size-3.5 fill-or text-or" aria-hidden /> {moyenne.toFixed(1).replace(".", ",")} · {nbAvis} avis
              </p>
            </div>
          </div>
        </div>

        {/* KPI : vues + avis */}
        <div className="grid grid-cols-2 gap-3.5">
          <KpiCard label="Vues de la fiche" valeur={vues.toLocaleString("fr-FR")} variation={varVues} icone={<Eye className="size-4 text-muted" aria-hidden />} />
          <KpiCard label="Nouveaux avis" valeur={nbAvis} variation={5} icone={<MessageSquareText className="size-4 text-muted" aria-hidden />} />
        </div>

        {/* Réservations du jour — Premium */}
        {premium ? (
          <Link href="/pro/reservations" className="block rounded-3xl border border-line bg-white p-4 shadow-card transition active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Réservations du jour</p>
              <CalendarClock className="size-4 text-muted" aria-hidden />
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">{Math.max(duJour.length, nbDuJour)}</p>
            <p className="mt-0.5 text-xs font-bold text-success">
              +{varResa} % <span className="font-normal text-muted">vs hier</span>
            </p>
            {aConfirmer > 0 && <p className="mt-2 text-xs font-bold text-[#b45309]">{aConfirmer} en attente de confirmation →</p>}
          </Link>
        ) : (
          <LockedFeature titre="Réservations en ligne" detail="Suivez vos réservations du jour et gérez les disponibilités." />
        )}

        {/* Abonnement */}
        <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><Crown className="size-5" aria-hidden /></span>
              <div>
                <p className="text-sm font-bold text-ink">{dossier.abonnement ? `Pack ${nomPack(pack ?? dossier.abonnement.pack)}` : "Aucun abonnement"}</p>
                <p className="text-xs text-muted">
                  {dossier.abonnement
                    ? etatAb.statut === "actif"
                      ? `Expire le ${formatDate(dossier.abonnement.fin)}`
                      : etatAb.statut === "expire_bientot"
                        ? `Expire bientôt — ${formatDate(dossier.abonnement.fin)}`
                        : "Paiement en attente"
                    : "Choisissez un pack pour rester publié"}
                </p>
              </div>
            </div>
            <Link href="/pro/abonnement" className="shrink-0 rounded-xl bg-bleu px-4 py-2 text-xs font-bold text-white transition active:scale-95">Gérer</Link>
          </div>
        </div>

        {/* Prochain contrôle */}
        {prochainControle && (
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success"><CalendarClock className="size-5" aria-hidden /></span>
                <div>
                  <p className="text-sm font-bold text-ink">Prochain contrôle</p>
                  <p className="text-xs text-muted">{formatDate(prochainControle)}</p>
                </div>
              </div>
              {joursControle !== null && (
                <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-bold", joursControle > 30 ? "bg-surface text-muted" : "bg-or/15 text-[#b45309]")}>
                  {joursControle > 0 ? `Dans ${joursControle} jours` : "Dû"}
                </span>
              )}
            </div>
          </div>
        )}

        <p className="flex items-start gap-1.5 text-[11px] text-muted">
          <Bell className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Les indicateurs de démonstration sont calculés à partir de la date du jour.
        </p>
      </div>
    </>
  );
}
