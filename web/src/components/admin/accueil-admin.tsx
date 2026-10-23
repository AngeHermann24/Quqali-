"use client";

import Link from "next/link";
import { BarChart3, BedDouble, Briefcase, Bus, ClipboardCheck, CreditCard, FileBadge, FileText, GraduationCap, ShieldCheck, ShoppingBag, Stethoscope, Trophy, UserCheck, Users, UtensilsCrossed } from "lucide-react";
import { TRANSACTIONS_DEMO, statistiquesGlobales } from "@/lib/admin";
import { ETABLISSEMENTS, SECTEURS } from "@/lib/data";
import type { AvisClient } from "@/lib/avis";
import { CLES, type Dossier } from "@/lib/espace";
import { formatFCFA } from "@/lib/pdf";
import { formatScore } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { useCandidatures, useCandidaturesPartenaires, useGestion } from "@/components/admin/use-admin";

const ICONES = { hotellerie: BedDouble, restauration: UtensilsCrossed, sante: Stethoscope, services: Briefcase, education: GraduationCap, commerce: ShoppingBag, transport: Bus };

export function AccueilAdmin() {
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();
  const { liste: candidatures, charge: c1 } = useCandidatures();
  const { liste: partenaires, charge: c2 } = useCandidaturesPartenaires();
  const { gestion, charge: c3 } = useGestion();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [avisStock] = useStockage<Record<string, AvisClient[]>>(CLES.avis);

  if (!aujourdhui || !c1 || !c2 || !c3 || avisStock === undefined || dossier === undefined) return <Chargement />;

  const dossierAdmis = dossier?.statut === "admis" ? [dossier] : [];
  const avis = Object.values(avisStock ?? {}).flat();
  const transactions = [...(dossier?.transactions ?? []), ...TRANSACTIONS_DEMO];
  const stats = statistiquesGlobales({ etablissements: ETABLISSEMENTS, dossiersAdmis: dossierAdmis, candidatures, transactions, avis, gestion, aujourdhui, config });
  const maxSecteur = Math.max(1, ...Object.values(stats.parSecteur));

  const alertes = [
    stats.candidaturesEnAttente > 0 && { label: `${stats.candidaturesEnAttente} candidature${stats.candidaturesEnAttente > 1 ? "s" : ""} d'établissement à traiter`, href: "/admin/candidatures" },
    stats.enAudit > 0 && { label: `${stats.enAudit} audit${stats.enAudit > 1 ? "s" : ""} en cours — résultat à enregistrer`, href: "/admin/candidatures" },
    partenaires.filter((p) => p.statut === "soumis" || p.statut === "entretien").length > 0 && {
      label: `${partenaires.filter((p) => p.statut === "soumis" || p.statut === "entretien").length} candidature(s) d'accompagnateur`,
      href: "/admin/candidatures?onglet=partenaires",
    },
    stats.avisEnAttente > 0 && { label: `${stats.avisEnAttente} avis en attente de modération`, href: "/admin/moderation" },
    stats.suspendus + stats.badgesRetires > 0 && { label: `${stats.suspendus} suspension${stats.suspendus > 1 ? "s" : ""}, ${stats.badgesRetires} badge${stats.badgesRetires > 1 ? "s" : ""} retiré${stats.badgesRetires > 1 ? "s" : ""}`, href: "/admin/etablissements" },
  ].filter(Boolean) as { label: string; href: string }[];

  const kpis = [
    { icone: ShieldCheck, titre: "Certifiés", valeur: stats.certifies, sous: `score moyen ${formatScore(stats.scoreMoyen)} %` },
    { icone: ClipboardCheck, titre: "Candidatures", valeur: stats.candidaturesEnAttente, sous: `${stats.enAudit} audit(s) en cours`, href: "/admin/candidatures" },
    { icone: Users, titre: "Avis vérifiés", valeur: stats.avisPublies, sous: stats.avisMoyenne !== null ? `${formatScore(stats.avisMoyenne)}/5 · ${stats.avisEnAttente} à modérer` : `${stats.avisEnAttente} à modérer`, href: "/admin/moderation" },
    { icone: CreditCard, titre: "Revenus", valeur: formatFCFA(stats.revenusMois), sous: `${formatFCFA(stats.revenusTotal)} cumulés · ${stats.abonnementsActifs} abonnés`, href: "/admin/abonnements" },
  ];

  const sections = [
    { href: "/admin/candidatures", icone: FileBadge, titre: "Candidatures", description: "Valider les dossiers, démarrer les audits, enregistrer les résultats." },
    { href: "/admin/agents", icone: UserCheck, titre: "Agents & affectations", description: "Assigner les audits et les accompagnements dans le respect de l'indépendance." },
    { href: "/admin/etablissements", icone: ShieldCheck, titre: "Établissements", description: "Suspendre une fiche, retirer ou remettre le badge qualité." },
    { href: "/admin/abonnements", icone: CreditCard, titre: "Abonnements & paiements", description: "Suivre les packs, les transactions et les suspensions d'impayés." },
    { href: "/admin/moderation", icone: Users, titre: "Modération", description: "Avis signalés et en vérification : publier ou rejeter." },
    { href: "/admin/awards", icone: Trophy, titre: "Awards", description: "Dashboard des votes : 30 % clients, 70 % évaluateurs." },
    { href: "/admin/tarifs", icone: BarChart3, titre: "Tarifs", description: "Prix des packs, remise annuelle, TVA et délais de grâce." },
    { href: "/admin/brochures", icone: FileText, titre: "Brochures PDF", description: "Affiches pour les gares et cartes avis avec QR code." },
  ];

  return (
    <>
      <EspaceHeader role="Administration" titre="Back-office Qualité+" sousTitre="Pilotage de la plateforme : candidatures, audits, établissements, paiements et réputation." />
      <div className="container-page space-y-5 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const contenu = (
              <div className="card flex h-full items-center gap-3 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <k.icone className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{k.titre}</span>
                  <span className="block truncate font-display text-xl font-bold text-ink">{k.valeur}</span>
                  <span className="block text-xs text-muted">{k.sous}</span>
                </span>
              </div>
            );
            return k.href ? <Link key={k.titre} href={k.href}>{contenu}</Link> : <div key={k.titre}>{contenu}</div>;
          })}
        </div>

        {alertes.length > 0 && (
          <Bloc titre="À traiter" icone={<ClipboardCheck className="size-5" aria-hidden />}>
            <ul className="space-y-2">
              {alertes.map((a) => (
                <li key={a.href + a.label}>
                  <Link href={a.href} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm font-medium text-ink transition hover:border-primary">
                    {a.label}
                    <Pastille ton="alerte">À faire</Pastille>
                  </Link>
                </li>
              ))}
            </ul>
          </Bloc>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Bloc titre="Établissements par secteur" icone={<BarChart3 className="size-5" aria-hidden />}>
            <ul className="space-y-3">
              {(Object.keys(SECTEURS) as (keyof typeof SECTEURS)[]).map((s) => {
                const Icone = ICONES[s];
                return (
                  <li key={s} className="flex items-center gap-3">
                    <Icone className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="w-24 shrink-0 text-sm text-ink">{SECTEURS[s].label}</span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${(stats.parSecteur[s] / maxSecteur) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right font-semibold text-ink">{stats.parSecteur[s]}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Score moyen de la plateforme : <strong className="text-ink">{formatScore(stats.scoreMoyen)} %</strong> · {stats.suspendus} suspendu{stats.suspendus > 1 ? "s" : ""} · {stats.badgesRetires} badge retiré
            </p>
          </Bloc>
          <Bloc titre="Réputation" icone={<Users className="size-5" aria-hidden />}>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [stats.avisTotal, "avis reçus"],
                [stats.avisPublies, "publiés"],
                [stats.avisEnAttente, "en attente"],
              ].map(([v, l]) => (
                <div key={String(l)} className="rounded-xl bg-surface p-3">
                  <p className="font-display text-2xl font-bold text-ink">{v}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Note moyenne des avis publiés : <strong className="text-ink">{stats.avisMoyenne !== null ? `${formatScore(stats.avisMoyenne)}/5` : "—"}</strong>
            </p>
          </Bloc>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="card group flex flex-col p-5 transition hover:border-primary">
              <s.icone className="size-6 text-primary" aria-hidden />
              <span className="mt-3 font-display font-semibold text-ink group-hover:text-primary">{s.titre}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{s.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
