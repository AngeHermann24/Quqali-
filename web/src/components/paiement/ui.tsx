"use client";

import { type Periodicite, montantPeriode, type ConfigTarifs } from "@/lib/abonnement";
import type { Pack } from "@/lib/data";
import { formatFCFA } from "@/lib/facture-pdf";
import { cn } from "@/lib/site";

export function ChoixPeriodicite({ valeur, onChange, remise, clair = false }: { valeur: Periodicite; onChange: (p: Periodicite) => void; remise: number; clair?: boolean }) {
  return (
    <div className={cn("inline-flex rounded-full p-1", clair ? "bg-white/15" : "bg-surface")} role="radiogroup" aria-label="Périodicité">
      {(["mensuel", "annuel"] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={valeur === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            valeur === p ? "bg-white text-primary shadow-sm" : clair ? "text-white" : "text-ink/70",
          )}
        >
          {p === "mensuel" ? "Mensuel" : "Annuel"}
          {p === "annuel" && remise > 0 && <span className="ml-1.5 rounded-full bg-success px-1.5 py-0.5 text-[10px] text-white">−{remise} %</span>}
        </button>
      ))}
    </div>
  );
}

export function Prix({ config, pack, periodicite, grand = false }: { config: ConfigTarifs; pack: Pack; periodicite: Periodicite; grand?: boolean }) {
  const total = montantPeriode(config, pack, periodicite);
  const parMois = periodicite === "annuel" ? Math.round(total / 12) : total;
  return (
    <div>
      <p className={cn("font-display font-bold text-ink", grand ? "text-3xl" : "text-xl")}>
        {formatFCFA(parMois)}
        <span className="text-sm font-medium text-muted"> / mois</span>
      </p>
      <p className="text-xs text-muted">{periodicite === "annuel" ? `Soit ${formatFCFA(total)} facturés par an` : "Sans engagement, facturé chaque mois"}</p>
    </div>
  );
}

export const MOYENS_AFFICHES = ["Orange Money", "MTN MoMo", "Wave", "Visa / Mastercard"];
