"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { SECTEURS, SECTEUR_LIST, type Secteur, filtresVersQuery } from "@/lib/data";
import { cn } from "@/lib/site";
import { SECTEUR_ICONS } from "@/components/ui";

export function HomeSearch({ villes, quartiersParVille }: { villes: string[]; quartiersParVille: Record<string, string[]> }) {
  const router = useRouter();
  const [secteur, setSecteur] = useState<Secteur | undefined>();
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const suggestions = ville ? quartiersParVille[ville] : [...new Set(Object.values(quartiersParVille).flat())];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/etablissements?${filtresVersQuery({ secteur, ville: ville || undefined, quartier: quartier || undefined })}`);
  };

  const options: { value?: Secteur; label: string; Icon: typeof LayoutGrid }[] = [
    { label: "Tous", Icon: LayoutGrid },
    ...SECTEUR_LIST.map((s) => ({ value: s, label: SECTEURS[s].label, Icon: SECTEUR_ICONS[s] })),
  ];

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-3 text-left shadow-card-hover sm:p-4">
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-surface p-1.5" role="radiogroup" aria-label="Secteur">
        {options.map(({ value, label, Icon }) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={secteur === value}
            onClick={() => setSecteur(value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm",
              secteur === value ? "bg-primary text-white shadow-sm" : "text-ink/70 hover:bg-white",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
        <div>
          <label htmlFor="ville" className="label">
            Ville
          </label>
          <select
            id="ville"
            className="input"
            value={ville}
            onChange={(e) => {
              setVille(e.target.value);
              setQuartier("");
            }}
          >
            <option value="">Toutes les villes</option>
            {villes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quartier" className="label">
            Commune ou quartier
          </label>
          <input
            id="quartier"
            className="input"
            list="quartiers"
            placeholder="Ex. Cocody, Zone 4, Angré…"
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
          />
          <datalist id="quartiers">
            {suggestions.map((q) => (
              <option key={q} value={q} />
            ))}
          </datalist>
        </div>
        <button type="submit" className="btn btn-success self-end py-3 text-base sm:px-6">
          <Search className="size-5" aria-hidden />
          Rechercher
        </button>
      </div>
    </form>
  );
}
