"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { List, Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react";
import { type Etablissement, type Filtres, SECTEURS, SECTEUR_LIST, type Tri, filtresVersQuery, scoreGlobal } from "@/lib/data";
import type { Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { SITE, cn } from "@/lib/site";
import { EtablissementCard } from "@/components/etablissement-card";
import { Carte } from "@/components/map";
import { Modal } from "@/components/modal";

const TRIS: { value: Tri; label: string }[] = [
  { value: "note", label: "Meilleure note" },
  { value: "avis", label: "Avis clients" },
  { value: "nom", label: "Nom (A → Z)" },
];

const NOTES = [undefined, 85, 90];

interface Props {
  filtres: Filtres;
  resultats: Etablissement[];
  villes: string[];
  quartiersParVille: Record<string, string[]>;
}

export function ResultsView({ filtres, resultats, villes, quartiersParVille }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [vue, setVue] = useState<"liste" | "carte">("liste");
  const [actif, setActif] = useState<string | null>(null);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [gestion] = useStockage<Gestion>(CLES.gestion);

  // Les fiches suspendues par l'administration disparaissent des résultats publics.
  const visibles = useMemo(() => resultats.filter((e) => !gestion?.[e.slug]?.suspendu), [resultats, gestion]);

  const points = useMemo(
    () =>
      visibles.map((e) => ({
        slug: e.slug,
        nom: e.nom,
        coords: e.coords,
        score: scoreGlobal(e.scores),
        sousTitre: `${e.sousType} · ${e.commune}`,
      })),
    [visibles],
  );

  const appliquer = (partiel: Partial<Filtres>) => {
    const query = filtresVersQuery({ ...filtres, ...partiel });
    startTransition(() => router.push(`/etablissements${query ? `?${query}` : ""}`, { scroll: false }));
  };

  const actifs = [
    filtres.ville && { label: filtres.ville, reset: { ville: undefined, quartier: undefined } },
    filtres.quartier && { label: filtres.quartier, reset: { quartier: undefined } },
    filtres.noteMin && { label: `Note ≥ ${filtres.noteMin} %`, reset: { noteMin: undefined } },
    filtres.reservation && { label: "Réservation en ligne", reset: { reservation: undefined } },
  ].filter(Boolean) as { label: string; reset: Partial<Filtres> }[];

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-page space-y-3 py-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {[undefined, ...SECTEUR_LIST].map((s) => (
              <button
                key={s ?? "tous"}
                type="button"
                onClick={() => appliquer({ secteur: s })}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                  filtres.secteur === s ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-primary",
                )}
              >
                {s ? SECTEURS[s].label : "Tous"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFiltresOuverts(true)} className="btn btn-outline px-3 py-2">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filtres
              {actifs.length > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-white">{actifs.length}</span>
              )}
            </button>
            <p className="flex-1 truncate text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-ink">{visibles.length}</span> certifié{visibles.length > 1 ? "s" : ""}
            </p>
            <label htmlFor="tri" className="sr-only">
              Trier par
            </label>
            <select
              id="tri"
              value={filtres.tri}
              onChange={(e) => appliquer({ tri: e.target.value as Tri })}
              className="rounded-xl border border-line bg-white py-2 pr-8 pl-3 text-sm font-medium text-ink focus:border-primary focus:outline-none"
            >
              {TRIS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {actifs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actifs.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => appliquer(f.reset)}
                  className="chip bg-primary-soft text-primary hover:bg-primary hover:text-white"
                >
                  {f.label} <X className="size-3.5" aria-label="Retirer" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cn("container-page grid grid-cols-1 gap-6 py-5 transition-opacity lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]", pending && "opacity-60")}>
        <div className={cn(vue === "carte" && "hidden lg:block")}>
          {visibles.length ? (
            <ul className="space-y-4">
              {visibles.map((e) => (
                <li key={e.slug} id={`carte-${e.slug}`} onMouseEnter={() => setActif(e.slug)} onMouseLeave={() => setActif(null)}>
                  <EtablissementCard etablissement={e} layout="horizontal" active={actif === e.slug} badgeRetire={!!gestion?.[e.slug]?.badgeRetire} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <SearchX className="size-10 text-muted" aria-hidden />
              <p className="mt-4 font-display font-semibold text-ink">Aucun établissement certifié ne correspond</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Élargissez votre recherche : seuls les établissements audités à {SITE.seuil} % et plus figurent sur la plateforme.
              </p>
              <button type="button" onClick={() => appliquer({ secteur: undefined, ville: undefined, quartier: undefined, noteMin: undefined, reservation: undefined })} className="btn btn-primary mt-5">
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        <div className={cn("lg:block", vue === "liste" && "hidden")}>
          <div className="h-[calc(100dvh-15rem)] overflow-hidden rounded-2xl border border-line shadow-card lg:sticky lg:top-44 lg:h-[calc(100dvh-12rem)]">
            <Carte
              points={points}
              activeSlug={actif}
              onSelect={(slug) => {
                setActif(slug);
                document.getElementById(`carte-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVue((v) => (v === "liste" ? "carte" : "liste"))}
        className="btn btn-primary fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full px-5 py-3 shadow-card-hover lg:hidden"
      >
        {vue === "liste" ? <MapIcon className="size-4" aria-hidden /> : <List className="size-4" aria-hidden />}
        {vue === "liste" ? "Voir la carte" : "Voir la liste"}
      </button>

      <Modal open={filtresOuverts} onClose={() => setFiltresOuverts(false)} title="Filtres">
        <FiltresForm
          initial={filtres}
          villes={villes}
          quartiersParVille={quartiersParVille}
          onApply={(f) => {
            setFiltresOuverts(false);
            appliquer(f);
          }}
        />
      </Modal>
    </>
  );
}

function FiltresForm({
  initial,
  villes,
  quartiersParVille,
  onApply,
}: {
  initial: Filtres;
  villes: string[];
  quartiersParVille: Record<string, string[]>;
  onApply: (f: Partial<Filtres>) => void;
}) {
  const [ville, setVille] = useState(initial.ville ?? "");
  const [quartier, setQuartier] = useState(initial.quartier ?? "");
  const [noteMin, setNoteMin] = useState(initial.noteMin);
  const [reservation, setReservation] = useState(!!initial.reservation);
  const quartiers = ville ? quartiersParVille[ville] ?? [] : [...new Set(Object.values(quartiersParVille).flat())].sort((a, b) => a.localeCompare(b, "fr"));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ ville: ville || undefined, quartier: quartier || undefined, noteMin, reservation: reservation || undefined });
      }}
    >
      <div>
        <label htmlFor="f-ville" className="label">
          Ville
        </label>
        <select
          id="f-ville"
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
        <label htmlFor="f-quartier" className="label">
          Commune ou quartier
        </label>
        <select id="f-quartier" className="input" value={quartier} onChange={(e) => setQuartier(e.target.value)}>
          <option value="">Tous</option>
          {quartier && !quartiers.includes(quartier) && <option>{quartier}</option>}
          {quartiers.map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="label">Note de gouvernance minimum</legend>
        <div className="grid grid-cols-3 gap-2">
          {NOTES.map((n) => (
            <button
              key={n ?? "tous"}
              type="button"
              onClick={() => setNoteMin(n)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                noteMin === n ? "border-success bg-success text-white" : "border-line text-ink hover:border-success",
              )}
            >
              {n ? `≥ ${n} %` : `≥ ${SITE.seuil} %`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Tous les établissements listés ont obtenu au moins {SITE.seuil} % à l&apos;audit.</p>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line p-3.5">
        <span>
          <span className="block text-sm font-semibold text-ink">Réservation en ligne</span>
          <span className="block text-xs text-muted">Établissements Premium uniquement</span>
        </span>
        <input type="checkbox" checked={reservation} onChange={(e) => setReservation(e.target.checked)} className="size-5 accent-primary" />
      </label>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          className="btn btn-outline flex-1 py-3"
          onClick={() => onApply({ ville: undefined, quartier: undefined, noteMin: undefined, reservation: undefined })}
        >
          Réinitialiser
        </button>
        <button type="submit" className="btn btn-primary flex-1 py-3">
          Appliquer
        </button>
      </div>
    </form>
  );
}
