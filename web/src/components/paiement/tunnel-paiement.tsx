"use client";

import { type FormEvent, useState } from "react";
import { ArrowLeft, CircleCheck, CircleX, CreditCard, Download, Smartphone } from "lucide-react";
import {
  type Abonnement,
  type ConfigTarifs,
  MOYENS,
  type MoyenPaiement,
  type Periodicite,
  type Transaction,
  devis,
  enregistrerPaiement,
  masquer,
  numeroFacture,
  reference,
  resultatSimule,
  validerCarte,
  validerNumero,
} from "@/lib/abonnement";
import type { Pack } from "@/lib/data";
import type { Dossier } from "@/lib/espace";
import { formatFCFA } from "@/lib/facture-pdf";
import { formatDate } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { cn } from "@/lib/site";
import { telechargerFacture } from "@/components/paiement/facture";

export interface ChoixPaiement {
  pack: Pack;
  periodicite: Periodicite;
  type: Transaction["type"];
}

type Etape = "moyen" | "saisie" | "confirmation" | "resultat";

export function TunnelPaiement({
  dossier,
  config,
  aujourdhui,
  choix,
  onTermine,
  onFermer,
}: {
  dossier: Dossier;
  config: ConfigTarifs;
  aujourdhui: string;
  choix: ChoixPaiement;
  onTermine: (d: Dossier) => void;
  onFermer: () => void;
}) {
  const [etape, setEtape] = useState<Etape>("moyen");
  const [moyen, setMoyen] = useState<MoyenPaiement>(dossier.abonnement?.moyen ?? "orange");
  const [compte, setCompte] = useState("");
  const [expiration, setExpiration] = useState("");
  const [erreur, setErreur] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const ab = dossier.abonnement;
  const { lignes, total, ...periode } = devis(dossier, aujourdhui, config, choix);
  const info = MOYENS[moyen];

  const valider = (e: FormEvent) => {
    e.preventDefault();
    const probleme = info.type === "carte" ? validerCarte(compte, expiration, aujourdhui) : validerNumero(moyen, compte);
    if (probleme) return setErreur(probleme);
    setErreur("");
    setEtape("confirmation");
  };

  const confirmer = () => {
    const resultat = resultatSimule(moyen, compte);
    const rang = (dossier.transactions?.length ?? 0) + 1;
    const nbFactures = dossier.transactions?.filter((x) => x.facture).length ?? 0;
    const tx: Transaction = {
      id: `tx-${rang}`,
      reference: reference(aujourdhui, rang),
      date: aujourdhui,
      type: choix.type,
      pack: choix.pack,
      periodicite: choix.periodicite,
      periodeDebut: periode.debut,
      periodeFin: periode.fin,
      lignes,
      montant: total,
      moyen,
      compte: masquer(moyen, compte),
      statut: resultat.reussi ? "reussi" : "echoue",
      motif: resultat.motif,
      facture: resultat.reussi ? numeroFacture(aujourdhui, nbFactures + 1) : undefined,
    };
    const abonnement: Abonnement = {
      pack: choix.pack,
      periodicite: choix.periodicite,
      debut: periode.debut,
      fin: periode.fin,
      moyen,
      compte: tx.compte,
      renouvellementAuto: ab?.renouvellementAuto ?? true,
    };
    const maj = enregistrerPaiement(dossier, tx, abonnement);
    onTermine(maj);
    setTransaction(tx);
    setEtape("resultat");
  };

  return (
    <div className="space-y-5">
      {etape !== "resultat" && (
        <div className="rounded-2xl bg-surface p-4 text-sm">
          {lignes.map((l) => (
            <div key={l.libelle} className="flex justify-between gap-3">
              <span className="text-ink">{l.libelle}</span>
              <span className={cn("shrink-0 font-semibold", l.montant < 0 ? "text-success-dark" : "text-ink")}>{formatFCFA(l.montant)}</span>
            </div>
          ))}
          <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
            <span className="text-xs text-muted">
              Du {formatDate(periode.debut)} au {formatDate(periode.fin)}
            </span>
            <span className="font-display text-xl font-bold text-primary">{formatFCFA(total)}</span>
          </div>
        </div>
      )}

      {etape === "moyen" && (
        <>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="label">Moyen de paiement</legend>
            {(Object.keys(MOYENS) as MoyenPaiement[]).map((m) => (
              <label
                key={m}
                className={cn("flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition", moyen === m ? "border-primary bg-primary-soft text-primary" : "border-line text-ink")}
              >
                <input type="radio" name="moyen" className="sr-only" checked={moyen === m} onChange={() => setMoyen(m)} />
                {MOYENS[m].type === "carte" ? <CreditCard className="size-4" aria-hidden /> : <Smartphone className="size-4" aria-hidden />}
                {MOYENS[m].label}
              </label>
            ))}
          </fieldset>
          <button type="button" className="btn btn-primary w-full py-3" onClick={() => setEtape("saisie")}>
            Continuer avec {info.label}
          </button>
        </>
      )}

      {etape === "saisie" && (
        <form onSubmit={valider} className="space-y-4" noValidate>
          {info.type === "carte" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label htmlFor="carte" className="label">
                  Numéro de carte
                </label>
                <input id="carte" inputMode="numeric" autoComplete="cc-number" className="input" placeholder="4242 4242 4242 4242" value={compte} onChange={(e) => setCompte(e.target.value)} />
              </div>
              <div>
                <label htmlFor="exp" className="label">
                  Expiration
                </label>
                <input id="exp" autoComplete="cc-exp" className="input" placeholder="MM/AA" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cvv" className="label">
                  CVV
                </label>
                <input id="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} className="input" placeholder="123" />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="numero" className="label">
                Numéro {info.label}
              </label>
              <input id="numero" type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder={moyen === "mtn" ? "05 00 00 00 00" : "07 00 00 00 00"} value={compte} onChange={(e) => setCompte(e.target.value)} />
            </div>
          )}
          {erreur && <p className="text-sm font-medium text-ink">{erreur}</p>}
          <div className="flex gap-3">
            <button type="button" className="btn btn-outline py-3" onClick={() => setEtape("moyen")}>
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <button type="submit" className="btn btn-success flex-1 py-3">
              Payer {formatFCFA(total)}
            </button>
          </div>
          <p className="text-xs text-muted">
            Prototype : {info.type === "carte" ? "la carte 4000 0000 0000 0002 simule un refus" : "un numéro finissant par 0000 simule un solde insuffisant"}. Aucun paiement réel.
          </p>
        </form>
      )}

      {etape === "confirmation" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            {info.type === "carte" ? <CreditCard className="size-7" aria-hidden /> : <Smartphone className="size-7 animate-pulse" aria-hidden />}
          </div>
          <p className="font-semibold text-ink">{info.type === "carte" ? "Authentification 3-D Secure" : `Confirmez sur votre téléphone (${masquer(moyen, compte)})`}</p>
          <p className="text-sm text-muted">{info.instruction}</p>
          {info.type === "carte" && <input aria-label="Code 3-D Secure" inputMode="numeric" maxLength={6} className="input text-center tracking-[0.5em]" placeholder="••••••" />}
          <button type="button" className="btn btn-success w-full py-3" onClick={confirmer}>
            {info.type === "carte" ? "Valider le code" : "J'ai confirmé le paiement"}
          </button>
        </div>
      )}

      {etape === "resultat" && transaction && (
        <div className="space-y-4 text-center">
          {transaction.statut === "reussi" ? (
            <>
              <CircleCheck className="mx-auto size-14 text-success" aria-hidden />
              <p className="font-display text-lg font-semibold text-ink">Paiement réussi</p>
              <p className="text-sm text-muted">
                Pack {nomPack(transaction.pack)} actif jusqu&apos;au {formatDate(transaction.periodeFin)}. Votre note reste inchangée.
              </p>
              <button type="button" className="btn btn-outline w-full" onClick={() => telechargerFacture(dossier, transaction, config.tva)}>
                <Download className="size-4" aria-hidden /> Télécharger la facture {transaction.facture}
              </button>
            </>
          ) : (
            <>
              <CircleX className="mx-auto size-14 text-ink" aria-hidden />
              <p className="font-display text-lg font-semibold text-ink">Paiement refusé</p>
              <p className="text-sm text-muted">{transaction.motif} Aucun montant n&apos;a été débité.</p>
            </>
          )}
          <button type="button" className="btn btn-primary w-full py-3" onClick={onFermer}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
