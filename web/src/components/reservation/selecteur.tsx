"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { EtablissementGere } from "@/lib/reservation-demo";

export function SelecteurEtablissement({
  options,
  valeur,
  onChange,
  premiumActif,
}: {
  options: EtablissementGere[];
  valeur: string;
  onChange: (id: string) => void;
  premiumActif: boolean;
}) {
  return (
    <div className="space-y-3">
      {!premiumActif && (
        <div className="flex flex-col gap-3 rounded-2xl bg-primary-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-ink">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Votre établissement n&apos;a pas de pack Premium actif. Explorez la fonctionnalité avec un établissement de démonstration.
          </p>
          <Link href="/pro/abonnement" className="btn btn-primary shrink-0 px-3 py-2">
            Passer en Premium
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor="etab-gere" className="text-sm font-semibold text-ink">
          Établissement
        </label>
        <select id="etab-gere" className="input sm:max-w-sm" value={valeur} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
              {o.demo ? " (démonstration)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
