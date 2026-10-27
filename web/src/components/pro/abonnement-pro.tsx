"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheck, CreditCard, Crown, Download, ShieldCheck, Smartphone } from "lucide-react";
import {
  type Abonnement,
  MOYENS,
  type MoyenPaiement,
  type Periodicite,
  type Transaction,
  devis,
  enregistrerPaiement,
  etatAbonnement,
  reference,
} from "@/lib/abonnement";
import type { Pack } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { formatFCFA } from "@/lib/facture-pdf";
import { formatDate } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Chargement } from "@/components/espace/ui";
import { telechargerFacture } from "@/components/paiement/facture";
import { TunnelPaiement } from "@/components/paiement/tunnel-paiement";
import { EntetePro, PanneauBas, PlanCard, StatusPillPro } from "@/components/pro/ui";
import { cn } from "@/lib/site";

const POINTS_BASIQUE = ["Fiche établissement", "Badge et note", "Avis clients", "Participation aux awards"];
const VERROUS_BASIQUE = ["Visite 3D", "Réservation en ligne", "Rapport mensuel IA"];
const POINTS_PREMIUM = [...POINTS_BASIQUE, "Visite 3D", "Réservation en ligne", "Rapport mensuel IA"];

const STATUTS_ABO: Record<string, { label: string; ton: string }> = {
  actif: { label: "Actif", ton: "confirmee" },
  expire_bientot: { label: "Expire bientôt", ton: "a_confirmer" },
  grace: { label: "Délai de grâce", ton: "a_confirmer" },
  suspendu: { label: "Suspendu", ton: "refusee" },
};

/** Écran 6 — Choix d'abonnement, paiement sécurisé et gestion. */
export function AbonnementPro() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();
  const [periodicite, setPeriodicite] = useState<Periodicite>("mensuel");
  const [paiement, setPaiement] = useState<{ pack: Pack; type: Transaction["type"] } | null>(null);
  const [resilie, setResilie] = useState(false);

  if (dossier === undefined || !aujourdhui) return <Chargement />;

  const ab = dossier?.abonnement;
  const etat = etatAbonnement(ab, aujourdhui, config);
  const prixMensuel = (p: Pack) => formatFCFA(config.prix[p]);
  const prixAnnuel = (p: Pack) => formatFCFA(Math.round(config.prix[p] * 12 * (1 - config.remiseAnnuelle / 100)));

  /** Souscription Basique : gratuite, sans paiement. */
  const choisirBasique = () => {
    if (!dossier) return;
    const { debut, fin } = devis(dossier, aujourdhui, config, { pack: "basique", periodicite, type: ab ? "changement" : "souscription" });
    const rang = (dossier.transactions?.length ?? 0) + 1;
    const tx: Transaction = {
      id: `tx-${rang}`,
      reference: reference(aujourdhui, rang),
      date: aujourdhui,
      type: ab ? "changement" : "souscription",
      pack: "basique",
      periodicite,
      periodeDebut: debut,
      periodeFin: fin,
      lignes: [{ libelle: `Abonnement Basique — ${periodicite === "annuel" ? "1 an" : "1 mois"}`, montant: 0 }],
      montant: 0,
      moyen: "wave",
      compte: "—",
      statut: "reussi",
    };
    const abonnement: Abonnement = { pack: "basique", periodicite, debut, fin, moyen: "wave", compte: "—", renouvellementAuto: false };
    setDossier(enregistrerPaiement(dossier, tx, abonnement));
    navigator.vibrate?.(12);
  };

  const finPaiement = (d: Dossier) => {
    setDossier(d);
    navigator.vibrate?.(15);
  };

  /* -------- Vue gestion (abonné) -------- */
  if (ab && etat.statut !== "aucun") {
    const statut = STATUTS_ABO[etat.statut] ?? { label: etat.statut, ton: "en_attente" };
    const transactions = dossier?.transactions ?? [];
    return (
      <div className="bg-surface">
        <EntetePro titre="Mon abonnement" onRetour={() => router.back()} />
        <div className="space-y-5 px-5 py-5">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("grid size-11 place-items-center rounded-2xl", ab.pack === "premium" ? "bg-primary text-or" : "bg-primary-soft text-primary")}>
                  <Crown className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-base font-bold text-ink">Pack {nomPack(ab.pack)}</p>
                  <p className="text-xs text-muted">Expire le {formatDate(ab.fin)} · {etat.joursRestants} jour{etat.joursRestants > 1 ? "s" : ""} restant{etat.joursRestants > 1 ? "s" : ""}</p>
                </div>
              </div>
              <StatusPillPro statut={statut.ton as "confirmee"} label={statut.label} />
            </div>
            {etat.statut === "suspendu" && <p className="mt-3 rounded-xl bg-danger/10 p-3 text-xs font-semibold text-danger">Abonnement suspendu après impayé — régularisez pour retrouver votre visibilité.</p>}
            {etat.statut === "grace" && <p className="mt-3 rounded-xl bg-or/15 p-3 text-xs font-semibold text-[#b45309]">Période de grâce jusqu&apos;au {formatDate(etat.finGrace!)} — votre fiche reste visible.</p>}
            <div className="mt-4 flex gap-2">
              {ab.pack === "basique" ? (
                <button type="button" onClick={() => setPaiement({ pack: "premium", type: "changement" })} className="btn btn-success flex-1">
                  <Crown className="size-4" aria-hidden /> Passer Premium
                </button>
              ) : (
                <button type="button" onClick={() => setPaiement({ pack: ab.pack, type: "renouvellement" })} className="btn btn-success flex-1">
                  Renouveler
                </button>
              )}
              {ab.pack === "premium" && (
                <button type="button" onClick={choisirBasique} className="rounded-2xl border-2 border-line px-4 text-sm font-bold text-muted">
                  Passer Basique
                </button>
              )}
            </div>
            <label className="mt-4 flex items-center justify-between rounded-2xl bg-surface p-3.5 text-sm font-semibold text-ink">
              Renouvellement automatique
              <input
                type="checkbox"
                checked={ab.renouvellementAuto && !resilie}
                onChange={(e) => {
                  setResilie(!e.target.checked);
                  setDossier({ ...dossier, abonnement: { ...ab, renouvellementAuto: e.target.checked } });
                }}
                className="size-5 accent-success"
              />
            </label>
            {resilie && <p className="mt-2 text-[11px] text-muted">Résiliation programmée : votre pack reste actif jusqu&apos;au {formatDate(ab.fin)}.</p>}
          </section>

          {/* Historique + factures */}
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="font-display text-sm font-bold text-ink">Historique et factures</h2>
            {transactions.length === 0 && <p className="mt-3 text-sm text-muted">Pack Basique gratuit — aucun paiement à afficher.</p>}
            <ul className="mt-3 divide-y divide-line">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {nomPack(tx.pack)} {tx.periodicite === "annuel" ? "annuel" : "mensuel"} · {formatFCFA(tx.montant)}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(tx.date)} · {MOYENS[tx.moyen].label} {tx.compte} · réf. {tx.reference}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPillPro statut={tx.statut === "reussi" ? "confirmee" : "refusee"} label={tx.statut === "reussi" ? "Payé" : "Échoué"} />
                    {tx.facture && (
                      <button type="button" onClick={() => telechargerFacture(dossier!, tx, config.tva)} aria-label={`Télécharger la facture ${tx.facture}`} className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
                        <Download className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="flex items-start gap-1.5 px-1 text-[11px] text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden /> Le paiement n&apos;influence jamais votre note.
          </p>
        </div>

        <PanneauBas ouvert={!!paiement} titre="Paiement" onFermer={() => setPaiement(null)}>
          {paiement && dossier && (
            <TunnelPaiement dossier={dossier} config={config} aujourdhui={aujourdhui} choix={{ ...paiement, periodicite: ab.periodicite }} onTermine={finPaiement} onFermer={() => setPaiement(null)} />
          )}
        </PanneauBas>
      </div>
    );
  }

  /* -------- Vue choix (écran 6 du design) -------- */
  return (
    <div className="bg-surface">
      <EntetePro titre="Choisissez votre abonnement" onRetour={() => router.back()} />

      <div className="space-y-5 px-5 py-5">
        {/* Périodicité */}
        {config.remiseAnnuelle > 0 && (
          <div className="mx-auto grid w-fit grid-cols-2 rounded-full bg-white p-1 shadow-card" role="tablist">
            {(["mensuel", "annuel"] as const).map((p) => (
              <button key={p} type="button" role="tab" aria-selected={periodicite === p} onClick={() => setPeriodicite(p)} className={cn("rounded-full px-5 py-2 text-xs font-bold transition", periodicite === p ? "bg-bleu text-white" : "text-muted")}>
                {p === "mensuel" ? "Mensuel" : `Annuel (−${config.remiseAnnuelle} %)`}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <PlanCard nom="Basique" prix={periodicite === "annuel" ? `${prixAnnuel("basique")} / an` : "Gratuit"} points={POINTS_BASIQUE} pointsVerrouilles={VERROUS_BASIQUE} onChoisir={choisirBasique} />
          <PlanCard
            nom="Premium"
            premium
            prix={`${periodicite === "annuel" ? prixAnnuel("premium") : prixMensuel("premium")} ${periodicite === "annuel" ? "/ an" : "/ mois"}`}
            points={POINTS_PREMIUM}
            onChoisir={() => setPaiement({ pack: "premium", type: "souscription" })}
          />
        </div>

        {/* Paiement sécurisé */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <ShieldCheck className="size-4 text-success" aria-hidden /> Paiement sécurisé
          </h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(Object.keys(MOYENS) as MoyenPaiement[]).map((m) => (
              <div key={m} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line py-3">
                {MOYENS[m].type === "carte" ? <CreditCard className="size-5 text-primary" aria-hidden /> : <Smartphone className="size-5 text-primary" aria-hidden />}
                <span className="text-center text-[10px] font-bold leading-tight text-ink">{MOYENS[m].label}</span>
              </div>
            ))}
          </div>
          <ul className="mt-3.5 space-y-1.5 text-xs text-muted">
            <li className="flex items-start gap-1.5">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden /> Vous recevrez une facture PDF après chaque paiement.
            </li>
            <li className="flex items-start gap-1.5">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden /> Le paiement n&apos;influence jamais votre note.
            </li>
          </ul>
        </section>
      </div>

      <PanneauBas ouvert={!!paiement} titre="Paiement" onFermer={() => setPaiement(null)}>
        {paiement && dossier && (
          <TunnelPaiement dossier={dossier} config={config} aujourdhui={aujourdhui} choix={{ ...paiement, periodicite }} onTermine={finPaiement} onFermer={() => setPaiement(null)} />
        )}
      </PanneauBas>
    </div>
  );
}
