"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, Minus } from "lucide-react";
import type { Periodicite } from "@/lib/abonnement";
import { COMPARATIF, PACKS } from "@/lib/packs";
import { cn } from "@/lib/site";
import { useConfigTarifs } from "@/lib/use-config";
import { ChoixPeriodicite, MOYENS_AFFICHES, Prix } from "@/components/paiement/ui";

export function ComparateurPacks() {
  const { config } = useConfigTarifs();
  const [periodicite, setPeriodicite] = useState<Periodicite>("mensuel");

  return (
    <>
      <div className="flex justify-center">
        <ChoixPeriodicite valeur={periodicite} onChange={setPeriodicite} remise={config.remiseAnnuelle} />
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        {PACKS.map((p) => (
          <div key={p.pack} className={cn("card relative flex flex-col p-6", p.pack === "premium" && "border-2 border-primary")}>
            {p.pack === "premium" && <span className="chip absolute -top-3 left-6 bg-success text-white">Recommandé</span>}
            <h2 className="font-display text-2xl font-bold text-primary">{p.nom}</h2>
            <p className="mt-1 text-sm text-muted">{p.accroche}</p>
            <div className="mt-5">
              <Prix config={config} pack={p.pack} periodicite={periodicite} grand />
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.avantages.map((a) => (
                <li key={a} className="flex gap-2 text-sm text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {a}
                </li>
              ))}
            </ul>
            <Link href="/pro/abonnement" className={cn("btn mt-6 py-3", p.pack === "premium" ? "btn-primary" : "btn-outline")}>
              Choisir {p.nom}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">Comparaison détaillée des packs</caption>
          <thead className="bg-surface text-left">
            <tr>
              <th scope="col" className="p-3 font-semibold text-ink sm:p-4">
                Fonctionnalités
              </th>
              <th scope="col" className="w-24 p-3 text-center font-semibold text-primary sm:w-32 sm:p-4">
                Basique
              </th>
              <th scope="col" className="w-24 p-3 text-center font-semibold text-primary sm:w-32 sm:p-4">
                Premium
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {COMPARATIF.map((ligne) => (
              <tr key={ligne.label} className={ligne.neutre ? "bg-success-soft/40" : undefined}>
                <th scope="row" className="p-3 text-left font-normal text-ink sm:p-4">
                  {ligne.label}
                </th>
                {[ligne.basique, ligne.premium].map((v, i) => (
                  <td key={i} className="p-3 text-center sm:p-4">
                    {typeof v === "string" ? (
                      <span className="text-xs font-semibold text-success-dark">{v}</span>
                    ) : v ? (
                      <Check className="mx-auto size-5 text-success" aria-label="Inclus" />
                    ) : (
                      <Minus className="mx-auto size-5 text-line" aria-label="Non inclus" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto mt-6 flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-ink">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Le pack change votre visibilité, jamais votre note : les agents n&apos;ont pas accès aux informations de paiement.
        </p>
        <ul className="flex flex-wrap gap-2">
          {MOYENS_AFFICHES.map((m) => (
            <li key={m} className="chip bg-surface text-ink">
              {m}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
