"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, CircleCheck, CreditCard, Download, EyeOff, History, Lock, RefreshCw, Repeat } from "lucide-react";
import { MOYENS, type Periodicite, type StatutAbonnement, etatAbonnement, montantPeriode, traiterEcheances } from "@/lib/abonnement";
import type { Pack } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { formatFCFA } from "@/lib/facture-pdf";
import { formatDate, formatScore } from "@/lib/format";
import { PACKS, nomPack } from "@/lib/packs";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Modal } from "@/components/modal";
import { telechargerFacture } from "@/components/paiement/facture";
import { type ChoixPaiement, TunnelPaiement } from "@/components/paiement/tunnel-paiement";
import { ChoixPeriodicite, Prix } from "@/components/paiement/ui";
import { ScoreRing } from "@/components/scores";
import { Bloc, Chargement, EspaceHeader, PanneauDemo, Pastille } from "@/components/espace/ui";

const BANNIERES: Record<Exclude<StatutAbonnement, "aucun">, { classe: string; Icone: typeof CircleCheck }> = {
  actif: { classe: "bg-success-soft text-success-dark", Icone: CircleCheck },
  expire_bientot: { classe: "bg-primary-soft text-primary", Icone: BellRing },
  grace: { classe: "bg-ink text-white", Icone: AlertTriangle },
  suspendu: { classe: "bg-ink text-white", Icone: EyeOff },
};

const TYPES = { souscription: "Souscription", renouvellement: "Renouvellement", renouvellement_auto: "Prélèvement automatique", changement: "Changement de pack" };
const JOUR = 24 * 60 * 60 * 1000;

export function TableauAbonnement() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const { config, charge: configChargee } = useConfigTarifs();
  const { aujourdhui, decalage, setDecalage, charge: horlogeChargee } = useHorloge();
  const [choix, setChoix] = useState<ChoixPaiement | null>(null);
  const [periodicite, setPeriodicite] = useState<Periodicite>("annuel");
  const [changerPack, setChangerPack] = useState(false);
  const [echecAuto, setEchecAuto] = useState(false);

  if (dossier === undefined || !configChargee || !horlogeChargee || !aujourdhui) return <Chargement />;

  if (!dossier || dossier.statut !== "admis")
    return (
      <>
        <EspaceHeader role="Espace établissement" titre="Abonnement et paiements" />
        <div className="container-page max-w-2xl py-12">
          <div className="card p-6 text-center">
            <Lock className="mx-auto size-10 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">Disponible après l&apos;admission</h2>
            <p className="mt-2 text-sm text-muted">
              Le pack se choisit uniquement après un audit réussi (80 % minimum). Ainsi, le paiement ne peut jamais influencer la note.
            </p>
            <Link href="/pro" className="btn btn-primary mt-6">
              Mon tableau de bord
            </Link>
          </div>
        </div>
      </>
    );

  const ab = dossier.abonnement;
  const etat = etatAbonnement(ab, aujourdhui, config);
  const transactions = dossier.transactions ?? [];
  const peutChoisir = !ab || etat.statut === "suspendu" || changerPack;

  const voyager = (jours: number) => {
    const cible = new Date();
    cible.setUTCDate(cible.getUTCDate() + jours);
    setDecalage(jours === 0 ? null : jours);
    setDossier(traiterEcheances(dossier, cible.toISOString(), config, echecAuto));
  };
  const joursJusqua = (iso: string, delta = 0) => Math.ceil((new Date(iso).getTime() - Date.now()) / JOUR) + delta;

  const banniere = etat.statut !== "aucun" && ab && (
    <div className={cn("flex items-start gap-3 rounded-2xl p-4", BANNIERES[etat.statut].classe)}>
      {(() => {
        const Icone = BANNIERES[etat.statut].Icone;
        return <Icone className="mt-0.5 size-5 shrink-0" aria-hidden />;
      })()}
      <div className="text-sm">
        {etat.statut === "actif" && <p className="font-semibold">Abonnement actif jusqu&apos;au {formatDate(ab.fin)}. Votre fiche est publiée.</p>}
        {etat.statut === "expire_bientot" && (
          <p className="font-semibold">
            Votre abonnement expire dans {etat.joursRestants} jour{etat.joursRestants > 1 ? "s" : ""} ({formatDate(ab.fin)}).
            {ab.renouvellementAuto ? " Il sera renouvelé automatiquement." : " Pensez à le renouveler."}
          </p>
        )}
        {etat.statut === "grace" && etat.finGrace && (
          <p className="font-semibold">Paiement en attente. Sans règlement, votre fiche sera masquée le {formatDate(etat.finGrace)}.</p>
        )}
        {etat.statut === "suspendu" && (
          <p className="font-semibold">Abonnement suspendu pour impayé : votre fiche est masquée du public.</p>
        )}
        {(etat.statut === "grace" || etat.statut === "suspendu") && dossier.audit && (
          <p className="mt-1 text-white/80">Votre note ({formatScore(dossier.audit.global)} %) est conservée et inchangée. Elle redeviendra visible dès le paiement.</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <EspaceHeader
        role="Espace établissement"
        titre="Abonnement et paiements"
        sousTitre={dossier.nom}
        actions={
          <Link href="/pro" className="btn btn-white">
            Tableau de bord
          </Link>
        }
      />

      <div className="container-page grid gap-5 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {banniere}

          {ab && !changerPack && etat.statut !== "suspendu" && (
            <Bloc titre="Mon abonnement" icone={<CreditCard className="size-5" aria-hidden />} action={<Pastille ton={etat.visible ? "succes" : "alerte"}>{etat.visible ? "Fiche publiée" : "Fiche masquée"}</Pastille>}>
              <div className="grid gap-4 sm:grid-cols-2">
                <dl className="space-y-2 text-sm">
                  <Ligne label="Pack" valeur={nomPack(ab.pack)} fort />
                  <Ligne label="Périodicité" valeur={ab.periodicite === "annuel" ? "Annuelle" : "Mensuelle"} />
                  <Ligne label="Période en cours" valeur={`${formatDate(ab.debut)} → ${formatDate(ab.fin)}`} />
                  <Ligne label="Prochain montant" valeur={formatFCFA(montantPeriode(config, ab.pack, ab.periodicite))} />
                  <Ligne label="Moyen de paiement" valeur={`${MOYENS[ab.moyen].label} · ${ab.compte}`} />
                </dl>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line p-3.5">
                    <span>
                      <span className="block text-sm font-semibold text-ink">Renouvellement automatique</span>
                      <span className="block text-xs text-muted">Prélèvement à l&apos;échéance sur {MOYENS[ab.moyen].label}</span>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={ab.renouvellementAuto}
                      onChange={(e) => setDossier({ ...dossier, abonnement: { ...ab, renouvellementAuto: e.target.checked } })}
                      className="size-5 accent-success"
                    />
                  </label>
                  <button type="button" className="btn btn-success w-full" onClick={() => setChoix({ pack: ab.pack, periodicite: ab.periodicite, type: "renouvellement" })}>
                    <RefreshCw className="size-4" aria-hidden /> Renouveler maintenant
                  </button>
                  <button type="button" className="btn btn-outline w-full" onClick={() => setChangerPack(true)}>
                    <Repeat className="size-4" aria-hidden /> Changer de pack
                  </button>
                </div>
              </div>
            </Bloc>
          )}

          {peutChoisir && (
            <Bloc
              id="choix"
              titre={ab && etat.statut !== "suspendu" ? "Changer de pack" : etat.statut === "suspendu" ? "Réactiver ma fiche" : "Choisir mon pack"}
              icone={<CreditCard className="size-5" aria-hidden />}
              action={
                changerPack && (
                  <button type="button" className="text-sm font-semibold text-primary" onClick={() => setChangerPack(false)}>
                    Annuler
                  </button>
                )
              }
            >
              <ChoixPeriodicite valeur={periodicite} onChange={setPeriodicite} remise={config.remiseAnnuelle} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PACKS.map((p) => {
                  const actuel = changerPack && ab?.pack === p.pack && ab.periodicite === periodicite;
                  return (
                    <div key={p.pack} className={cn("flex flex-col rounded-2xl border-2 p-4", p.pack === "premium" ? "border-primary/40" : "border-line")}>
                      <p className="font-display text-lg font-semibold text-primary">{p.nom}</p>
                      <div className="mt-2">
                        <Prix config={config} pack={p.pack} periodicite={periodicite} />
                      </div>
                      <ul className="mt-3 flex-1 space-y-1 text-xs text-muted">
                        {p.avantages.map((a) => (
                          <li key={a}>• {a}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        disabled={actuel}
                        className={cn("btn mt-4", p.pack === "premium" ? "btn-primary" : "btn-outline")}
                        onClick={() => setChoix({ pack: p.pack as Pack, periodicite, type: changerPack ? "changement" : "souscription" })}
                      >
                        {actuel ? "Pack actuel" : `Choisir ${p.nom}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              {changerPack && <p className="mt-3 text-xs text-muted">Le changement prend effet aujourd&apos;hui ; la période non consommée est déduite au prorata.</p>}
            </Bloc>
          )}

          <Bloc titre="Historique des paiements" icone={<History className="size-5" aria-hidden />}>
            {transactions.length ? (
              <ul className="divide-y divide-line">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {TYPES[tx.type]} · {nomPack(tx.pack)} {tx.periodicite === "annuel" ? "annuel" : "mensuel"}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(tx.date)} · {MOYENS[tx.moyen].label} {tx.compte} · réf. {tx.reference}
                      </p>
                      {tx.motif && <p className="text-xs font-medium text-ink">{tx.motif}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">{formatFCFA(tx.montant)}</span>
                      <Pastille ton={tx.statut === "reussi" ? "succes" : "alerte"}>{tx.statut === "reussi" ? "Payé" : "Échoué"}</Pastille>
                      {tx.facture && (
                        <button type="button" className="btn btn-outline px-3 py-1.5 text-xs" onClick={() => telechargerFacture(dossier, tx, config.tva)} aria-label={`Télécharger la facture ${tx.facture}`}>
                          <Download className="size-3.5" aria-hidden /> PDF
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Aucun paiement pour le moment.</p>
            )}
          </Bloc>
        </div>

        <div className="space-y-5">
          {dossier.audit && (
            <Bloc titre="Ma note" icone={<Lock className="size-5" aria-hidden />}>
              <div className="flex items-center gap-4">
                <ScoreRing value={dossier.audit.global} size={96} />
                <p className="text-sm text-muted">
                  Audit du {formatDate(dossier.audit.date)}. <strong className="text-ink">Le paiement n&apos;a aucun effet sur cette note</strong>, qu&apos;il soit réussi, échoué ou en retard.
                </p>
              </div>
            </Bloc>
          )}

          <Bloc titre="Rappels d'expiration" icone={<BellRing className="size-5" aria-hidden />}>
            {ab ? (
              <ul className="space-y-2">
                {etat.rappels.map((r) => (
                  <li key={r.jours} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
                    <span className="text-ink">
                      J−{r.jours} · {formatDate(r.date)}
                    </span>
                    <Pastille ton={r.envoye ? "succes" : "neutre"}>{r.envoye ? "Envoyé" : "Programmé"}</Pastille>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
                  <span className="text-ink">Suspension · {etat.finGrace && formatDate(etat.finGrace)}</span>
                  <Pastille ton={etat.statut === "suspendu" ? "alerte" : "neutre"}>{etat.statut === "suspendu" ? "Appliquée" : `J+${config.delaiGrace}`}</Pastille>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted">Les rappels seront programmés dès votre premier paiement.</p>
            )}
            <p className="mt-3 text-xs text-muted">Par SMS et e-mail à {dossier.responsable.email}.</p>
          </Bloc>

          <PanneauDemo>
            <p className="w-full text-xs text-ink">
              <CalendarClock className="mr-1 inline size-3.5" aria-hidden />
              Date simulée : <strong>{formatDate(aujourdhui)}</strong> {decalage ? `(J${decalage > 0 ? "+" : ""}${decalage})` : "(aujourd'hui)"}
            </p>
            <button type="button" className="btn btn-outline px-3 py-2 text-xs" onClick={() => voyager(decalage + 10)}>
              +10 jours
            </button>
            {ab && (
              <>
                <button type="button" className="btn btn-outline px-3 py-2 text-xs" onClick={() => voyager(joursJusqua(ab.fin, -1))}>
                  Veille de l&apos;échéance
                </button>
                <button type="button" className="btn btn-outline px-3 py-2 text-xs" onClick={() => voyager(joursJusqua(ab.fin, config.delaiGrace + 1))}>
                  Échéance + {config.delaiGrace + 1} j
                </button>
              </>
            )}
            {decalage !== 0 && (
              <button type="button" className="btn btn-outline px-3 py-2 text-xs" onClick={() => voyager(0)}>
                Revenir à aujourd&apos;hui
              </button>
            )}
            <label className="flex w-full items-center gap-2 text-xs text-ink">
              <input type="checkbox" checked={echecAuto} onChange={(e) => setEchecAuto(e.target.checked)} className="accent-primary" />
              Faire échouer le prochain prélèvement automatique
            </label>
          </PanneauDemo>
        </div>
      </div>

      <Modal open={choix !== null} onClose={() => setChoix(null)} title={choix ? `Paiement · Pack ${nomPack(choix.pack)}` : "Paiement"}>
        {choix && (
          <TunnelPaiement
            dossier={dossier}
            config={config}
            aujourdhui={aujourdhui}
            choix={choix}
            onTermine={(d) => {
              setDossier(d);
              setChangerPack(false);
            }}
            onFermer={() => setChoix(null)}
          />
        )}
      </Modal>
    </>
  );
}

function Ligne({ label, valeur, fort = false }: { label: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-right text-ink", fort ? "font-display text-base font-bold text-primary" : "font-medium")}>{valeur}</dd>
    </div>
  );
}
