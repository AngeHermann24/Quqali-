"use client";

import { Check } from "lucide-react";
import { CLES } from "@/lib/espace";
import { LANGUES, LISTE_LANGUES, LOCALES, TRAD_APP, TRAD_PROFIL, fmt, tv, type Langue, type TradApp } from "@/lib/langue";
import { useStockage } from "@/lib/stockage";

/** Langue d'interface persistée — défaut français, "fr" tant que le stockage n'est pas lu (SSR). */
export function useLangue() {
  const [stock, setLangue] = useStockage<Langue>(CLES.langue);
  const langue: Langue = stock && LANGUES[stock] ? stock : "fr";
  const t = { ...TRAD_APP[langue], ...TRAD_PROFIL[langue] } as TradApp;
  return { langue, setLangue, t, dir: LANGUES[langue].dir, locale: LOCALES[langue], fmt, tv };
}

/** Liste des cinq langues — utilisée dans Modal (usager) et PanneauBas (pro). */
export function ListeLangues({ langue, onChoisir }: { langue: Langue; onChoisir: (l: Langue) => void }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {LISTE_LANGUES.map((l) => (
        <li key={l}>
          <button
            type="button"
            onClick={() => onChoisir(l)}
            aria-pressed={l === langue}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-surface"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{LANGUES[l].natif}</span>
              <span className="text-xs text-muted">{LANGUES[l].label}</span>
            </span>
            {l === langue && <Check className="size-4 shrink-0 text-success" aria-hidden />}
          </button>
        </li>
      ))}
    </ul>
  );
}
