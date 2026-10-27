"use client";

import { BarChart3, CreditCard, FileBadge, GraduationCap, TrendingUp, Users, Wallet } from "lucide-react";
import {
  TRANSACTIONS_DEMO,
  VENTES_FORMATIONS_DEMO,
  repartitionPaiements,
  revenusParMois,
  statistiquesFormations,
  statistiquesGlobales,
  type VenteFormation,
} from "@/lib/admin";
import { MOYENS } from "@/lib/abonnement";
import type { AvisClient } from "@/lib/avis";
import { ETABLISSEMENTS } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { FORMATIONS } from "@/lib/formations";
import { formatScore } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { formatFCFA } from "@/lib/pdf";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Bloc, Chargement, EspaceHeader } from "@/components/espace/ui";
import { useCandidatures, useGestion } from "@/components/admin/use-admin";

function Barre({ label, valeur, montant, max, ton = "bg-primary" }: { label: string; valeur: number; montant?: number; max: number; ton?: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-ink">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
        <span className={`block h-full rounded-full ${ton}`} style={{ width: `${Math.max(valeur > 0 ? 4 : 0, (valeur / max) * 100)}%` }} />
      </span>
      <span className="w-24 shrink-0 text-right text-sm font-semibold text-ink">
        {valeur}
        {montant !== undefined && <span className="block text-xs font-normal text-muted">{formatFCFA(montant)}</span>}
      </span>
    </li>
  );
}

export function StatistiquesAdmin() {
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();
  const { liste: candidatures, charge: c1 } = useCandidatures();
  const { gestion, charge: c2 } = useGestion();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [avisStock] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [etatsForm] = useStockage<Record<string, { achetees: string[] }>>(CLES.formationsPro);

  if (!aujourdhui || !c1 || !c2 || avisStock === undefined || dossier === undefined || etatsForm === undefined) return <Chargement />;

  const dossierAdmis = dossier?.statut === "admis" ? [dossier] : [];
  const avis = Object.values(avisStock ?? {}).flat();
  const transactions = [...(dossier?.transactions ?? []), ...TRANSACTIONS_DEMO];
  const stats = statistiquesGlobales({ etablissements: ETABLISSEMENTS, dossiersAdmis: dossierAdmis, candidatures, transactions, avis, gestion, aujourdhui, config });

  // Revenus : courbe mensuelle + répartitions
  const mois = revenusParMois(transactions, aujourdhui, 6);
  const maxMois = Math.max(1, ...mois.map((m) => m.total));
  const rep = repartitionPaiements(transactions);
  const maxMoyen = Math.max(1, ...[...rep.parMoyen.values()].map((v) => v.montant));

  // Abonnés par pack (établissements démo + dossier réel)
  const packs = [...ETABLISSEMENTS.map((e) => e.pack), ...dossierAdmis.filter((d) => d.abonnement).map((d) => d.abonnement!.pack)];
  const nbPremium = packs.filter((p) => p === "premium").length;
  const nbBasique = packs.length - nbPremium;
  const maxPack = Math.max(1, nbPremium, nbBasique);

  // Formations : ventes démo + achats réels stockés côté pro
  const ventesReelles: VenteFormation[] = Object.values(etatsForm ?? {}).flatMap((e) => e.achetees.map((formationId) => ({ formationId, date: aujourdhui, moyen: "orange" as const })));
  const statsForm = statistiquesFormations([...VENTES_FORMATIONS_DEMO, ...ventesReelles]);
  const topFormations = [...statsForm.parFormation.entries()].sort((a, b) => b[1] - a[1]);
  const maxForm = Math.max(1, ...topFormations.map(([, n]) => n));

  // Pipeline de certification
  const refuses = candidatures.filter((c) => c.statut === "refuse").length;
  const admisTotal = stats.certifies;
  const tauxReussite = admisTotal + refuses > 0 ? Math.round((admisTotal / (admisTotal + refuses)) * 100) : 0;
  const pipeline = [
    { label: "Dossiers soumis", valeur: stats.candidaturesEnAttente },
    { label: "Audits en cours", valeur: stats.enAudit },
    { label: "Établissements admis", valeur: admisTotal },
    { label: "Dossiers refusés", valeur: refuses },
  ];
  const maxPipe = Math.max(1, ...pipeline.map((p) => p.valeur));

  const kpis = [
    { icone: TrendingUp, titre: "Revenus du mois", valeur: formatFCFA(stats.revenusMois), sous: `${formatFCFA(stats.revenusTotal)} cumulés` },
    { icone: Wallet, titre: "Abonnés actifs", valeur: stats.abonnementsActifs, sous: `${nbPremium} Premium · ${nbBasique} Basique` },
    { icone: GraduationCap, titre: "Formations vendues", valeur: statsForm.ventes, sous: `${formatFCFA(statsForm.revenus)} encaissés` },
    { icone: FileBadge, titre: "Taux de réussite", valeur: `${tauxReussite} %`, sous: `${admisTotal} admis · ${refuses} refusé${refuses > 1 ? "s" : ""}` },
    { icone: Users, titre: "Note moyenne avis", valeur: stats.avisMoyenne !== null ? `${formatScore(stats.avisMoyenne)}/5` : "—", sous: `${stats.avisPublies} avis publiés` },
  ];

  return (
    <>
      <EspaceHeader role="Administration" titre="Statistiques" sousTitre="Revenus, abonnements, formations et pipeline de certification — chiffres de démonstration." />
      <div className="container-page space-y-5 py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.titre} className="card flex items-center gap-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <k.icone className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{k.titre}</span>
                <span className="block truncate font-display text-xl font-bold text-ink">{k.valeur}</span>
                <span className="block truncate text-xs text-muted">{k.sous}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Bloc titre="Revenus — 6 derniers mois" icone={<BarChart3 className="size-5" aria-hidden />}>
            <div className="flex h-40 items-end gap-3" role="img" aria-label="Histogramme des revenus mensuels">
              {mois.map((m) => (
                <div key={m.mois} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted">{m.total ? formatFCFA(m.total) : "—"}</span>
                  <span className="w-full max-w-14 rounded-t-lg bg-primary" style={{ height: `${m.total ? Math.max(6, (m.total / maxMois) * 100) : 2}%` }} />
                  <span className="text-[10px] font-medium text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </Bloc>

          <Bloc titre="Pipeline de certification" icone={<FileBadge className="size-5" aria-hidden />}>
            <ul className="space-y-3">
              {pipeline.map((p) => (
                <Barre key={p.label} label={p.label} valeur={p.valeur} max={maxPipe} />
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Score moyen des certifiés : <strong className="text-ink">{formatScore(stats.scoreMoyen)} %</strong> · seuil d&apos;admission 80 % — le paiement n&apos;influence jamais la note.
            </p>
          </Bloc>

          <Bloc titre="Abonnements" icone={<Wallet className="size-5" aria-hidden />}>
            <ul className="space-y-3">
              <Barre label={nomPack("premium")} valeur={nbPremium} max={maxPack} ton="bg-primary" />
              <Barre label={nomPack("basique")} valeur={nbBasique} max={maxPack} ton="bg-success" />
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Paiements par périodicité</p>
            <ul className="mt-2 space-y-3">
              {(["mensuel", "annuel"] as const).map((p) => {
                const v = rep.parPeriodicite.get(p) ?? { nombre: 0, montant: 0 };
                return <Barre key={p} label={p === "mensuel" ? "Mensuel" : "Annuel"} valeur={v.nombre} montant={v.montant} max={Math.max(1, rep.parPeriodicite.get("mensuel")?.nombre ?? 0, rep.parPeriodicite.get("annuel")?.nombre ?? 0)} />;
              })}
            </ul>
          </Bloc>

          <Bloc titre="Moyens de paiement" icone={<CreditCard className="size-5" aria-hidden />}>
            <ul className="space-y-3">
              {(Object.keys(MOYENS) as (keyof typeof MOYENS)[]).map((m) => {
                const v = rep.parMoyen.get(m) ?? { nombre: 0, montant: 0 };
                return <Barre key={m} label={MOYENS[m].label} valeur={v.nombre} montant={v.montant} max={maxMoyen} />;
              })}
            </ul>
            <p className="mt-4 text-xs text-muted">Barres proportionnelles au montant encaissé (transactions réussies).</p>
          </Bloc>
        </div>

        <Bloc titre={`Formations — ${statsForm.ventes} ventes · ${formatFCFA(statsForm.revenus)}`} icone={<GraduationCap className="size-5" aria-hidden />}>
          <ul className="space-y-3">
            {topFormations.map(([id, n]) => {
              const f = FORMATIONS.find((x) => x.id === id);
              return <Barre key={id} label={f?.titre ?? id} valeur={n} montant={n * (f?.prix ?? 0)} max={maxForm} ton="bg-success" />;
            })}
            {topFormations.length === 0 && <li className="text-sm text-muted">Aucune vente pour le moment.</li>}
          </ul>
          <p className="mt-4 text-xs text-muted">Capsules vidéo payantes vendues dans l&apos;espace pro. Les achats réels de cet appareil s&apos;ajoutent aux chiffres de démonstration.</p>
        </Bloc>
      </div>
    </>
  );
}
