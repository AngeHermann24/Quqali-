"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, List, Map as MapIcon, MapPin, RotateCcw, SearchX, Star } from "lucide-react";
import { type Etablissement, QUARTIERS_PAR_VILLE, SECTEURS, type Secteur, noteMoyenne } from "@/lib/data";
import type { Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { distanceKm, normaliser } from "@/lib/format";
import { estOuvert } from "@/lib/horaires";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { useHorloge } from "@/lib/use-config";
import { Modal } from "@/components/modal";
import { EtablissementCard } from "@/components/etablissement-card";
import { PhotoPlaceholder } from "@/components/ui";
import { BoutonFavori } from "@/components/app/favoris";
import { EtatVide } from "@/components/app/ui-app";

const CarteExplorer = dynamic(() => import("@/components/app/carte-explorer"), {
  ssr: false,
  loading: () => <div className="squelette absolute inset-0" aria-busy="true" />,
});

const SECTEURS_CHIPS: Secteur[] = ["restauration", "hotellerie", "sante"];
const NOTES_MIN = [4.0, 4.5, 4.8];
const QUARTIERS = QUARTIERS_PAR_VILLE["Abidjan"] ?? [];

export function Explorer({ etablissements }: { etablissements: Etablissement[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  const { aujourdhui } = useHorloge();

  const secteur = params.get("secteur") as Secteur | null;
  const quartier = params.get("quartier");
  const noteMin = Number(params.get("note")) > 0 ? Number(params.get("note")) : undefined;
  const ouvert = params.get("ouvert") === "1";
  const reservation = params.get("reservation") === "1";
  const vue = params.get("vue") === "liste" ? ("liste" as const) : ("carte" as const);
  const sel = params.get("sel");
  const tri = params.get("tri") === "distance" ? "distance" : "avis";

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [panneau, setPanneau] = useState<"quartier" | "note" | null>(null);
  const [carteKO, setCarteKO] = useState(false);
  const [cleCarte, setCleCarte] = useState(0);

  const maj = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") q.delete(k);
      else q.set(k, v);
    }
    const qs = q.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  /* ---------- Filtrage en direct ---------- */
  const visibles = useMemo(() => {
    const q = quartier && normaliser(quartier);
    const maintenant = aujourdhui ? new Date(aujourdhui) : null;
    return etablissements.filter(
      (e) =>
        !gestion?.[e.slug]?.suspendu &&
        (!secteur || e.secteur === secteur) &&
        (!q || normaliser(e.quartier).includes(q) || normaliser(e.commune).includes(q)) &&
        (noteMin === undefined || noteMoyenne(e.avis) >= noteMin) &&
        (!ouvert || (maintenant !== null && estOuvert(e.horaires, maintenant))) &&
        (!reservation || e.pack === "premium"),
    );
  }, [etablissements, gestion, secteur, quartier, noteMin, ouvert, reservation, aujourdhui]);

  const listeTriee = useMemo(() => {
    const avec = visibles.map((e) => ({ e, d: position ? distanceKm(position, e.coords) : null, n: noteMoyenne(e.avis) }));
    if (tri === "distance" && position) avec.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
    else avec.sort((a, b) => b.n - a.n || b.e.avis.length - a.e.avis.length);
    return avec;
  }, [visibles, tri, position]);

  const points = useMemo(() => visibles.map((e) => ({ slug: e.slug, nom: e.nom, coords: e.coords, secteur: e.secteur })), [visibles]);
  const selectionne = sel ? (visibles.find((e) => e.slug === sel) ?? null) : null;

  const nbFiltres = [quartier, noteMin !== undefined, ouvert, reservation].filter(Boolean).length;
  const reinitialiser = () => maj({ quartier: null, note: null, ouvert: null, reservation: null, sel: null });

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      {/* En-tête */}
      <header className="flex items-center justify-between px-5 pt-4">
        <Link href="/" aria-label="Retour à l'accueil" className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display text-lg font-extrabold text-ink">Explorer</h1>
        <button
          type="button"
          onClick={() => maj({ vue: vue === "carte" ? "liste" : null })}
          aria-label={vue === "carte" ? "Passer en vue liste" : "Passer en vue carte"}
          className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95"
        >
          {vue === "carte" ? <List className="size-5" aria-hidden /> : <MapIcon className="size-5" aria-hidden />}
        </button>
      </header>

      {/* Puces secteur */}
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-5" role="group" aria-label="Secteurs">
        <ChipSecteur actif={!secteur} onClick={() => maj({ secteur: null, sel: null })}>
          Tous
        </ChipSecteur>
        {SECTEURS_CHIPS.map((s) => (
          <ChipSecteur key={s} actif={secteur === s} onClick={() => maj({ secteur: s, sel: null })}>
            {SECTEURS[s].label}
          </ChipSecteur>
        ))}
      </div>

      {/* Filtres */}
      <div className="no-scrollbar mt-2.5 flex items-center gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Filtres">
        <ChipFiltre actif={!!quartier} label={quartier ?? "Quartier"} onClick={() => setPanneau("quartier")} fleche />
        <ChipFiltre actif={noteMin !== undefined} label={noteMin !== undefined ? `${String(noteMin).replace(".", ",")}+` : "Note"} onClick={() => setPanneau("note")} fleche />
        <ChipFiltre actif={ouvert} label="Ouvert maintenant" onClick={() => maj({ ouvert: ouvert ? null : "1", sel: null })} />
        <button
          type="button"
          onClick={() => maj({ reservation: reservation ? null : "1", sel: null })}
          aria-pressed={reservation}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95",
            reservation ? "bg-success text-white" : "border border-line bg-white text-ink",
          )}
        >
          {reservation && <Check className="size-3.5" aria-hidden />}
          Réservation en ligne
        </button>
        {nbFiltres > 0 && (
          <button type="button" onClick={reinitialiser} className="inline-flex shrink-0 items-center gap-1 px-1.5 py-2 text-xs font-bold text-muted transition active:scale-95">
            <RotateCcw className="size-3.5" aria-hidden />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Contenu : carte ou liste */}
      <div className="relative mt-1 flex-1 overflow-hidden">
        {carteKO && vue === "carte" ? null : vue === "carte" && visibles.length > 0 ? (
          <CarteExplorer
            key={cleCarte}
            points={points}
            activeSlug={sel}
            onSelect={(slug) => maj({ sel: slug })}
            onPosition={setPosition}
            onErreur={() => {
              setCarteKO(true);
              maj({ vue: "liste" });
            }}
          />
        ) : null}

        {vue === "carte" && visibles.length > 0 && !carteKO && (
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-[600]">
            {selectionne ? (
              <CarteFlottante e={selectionne} position={position} onFermer={() => maj({ sel: null })} />
            ) : (
              <p className="mx-auto w-fit rounded-full bg-white/90 px-4 py-2 text-center text-xs font-bold text-ink shadow-card backdrop-blur">
                {visibles.length} établissement{visibles.length > 1 ? "s" : ""} certifié{visibles.length > 1 ? "s" : ""} autour de vous
              </p>
            )}
          </div>
        )}

        {(vue === "liste" || carteKO) && (
          <div className="h-full overflow-y-auto px-5 pb-6">
            {carteKO && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-xs font-semibold text-ink">
                <span>Carte indisponible — affichage en liste.</span>
                <button
                  type="button"
                  onClick={() => {
                    setCarteKO(false);
                    setCleCarte((k) => k + 1);
                    maj({ vue: null });
                  }}
                  className="shrink-0 font-bold text-bleu"
                >
                  Réessayer
                </button>
              </div>
            )}
            {visibles.length === 0 ? (
              <EtatVide
                Icon={SearchX}
                titre="Aucun établissement ne correspond"
                detail="Élargissez votre recherche : tous les établissements listés sont audités à 80 % et plus."
                action={
                  <button type="button" onClick={reinitialiser} className="btn-hero mt-2">
                    Réinitialiser les filtres
                  </button>
                }
              />
            ) : (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 py-2.5 backdrop-blur">
                  <p className="text-xs font-bold text-muted" aria-live="polite">
                    {visibles.length} établissement{visibles.length > 1 ? "s" : ""} certifié{visibles.length > 1 ? "s" : ""}
                  </p>
                  <label htmlFor="tri" className="sr-only">
                    Trier par
                  </label>
                  <select
                    id="tri"
                    value={tri}
                    onChange={(e) => maj({ tri: e.target.value === "avis" ? null : e.target.value })}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="avis">Les mieux notés</option>
                    <option value="distance" disabled={!position}>
                      Les plus proches
                    </option>
                  </select>
                </div>
                <ul className="space-y-4">
                  {listeTriee.map(({ e, d }) => (
                    <li key={e.slug}>
                      <EtablissementCard etablissement={e} badgeRetire={!!gestion?.[e.slug]?.badgeRetire} />
                      {d !== null && (
                        <p className="mt-1.5 flex items-center gap-1 pl-1 text-[11px] font-semibold text-muted">
                          <MapPin className="size-3" aria-hidden /> {d.toFixed(1).replace(".", ",")} km
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {vue === "carte" && visibles.length === 0 && !carteKO && (
          <div className="absolute inset-0 z-[550] flex items-center justify-center bg-surface/95 p-6">
            <EtatVide
              Icon={SearchX}
              titre="Aucun établissement ne correspond"
              detail="Élargissez votre recherche : tous les établissements listés sont audités à 80 % et plus."
              action={
                <button type="button" onClick={reinitialiser} className="btn-hero mt-2">
                  Réinitialiser les filtres
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Panneaux de filtres */}
      <Modal open={panneau === "quartier"} onClose={() => setPanneau(null)} title="Quartier">
        <ul className="grid grid-cols-2 gap-2 pb-2">
          <li className="col-span-2">
            <button
              type="button"
              onClick={() => {
                maj({ quartier: null, sel: null });
                setPanneau(null);
              }}
              className={cn("w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition", !quartier ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              Tous les quartiers
            </button>
          </li>
          {QUARTIERS.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => {
                  maj({ quartier: q, sel: null });
                  setPanneau(null);
                }}
                className={cn("w-full truncate rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition", quartier === q ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={panneau === "note"} onClose={() => setPanneau(null)} title="Note minimale (avis clients)">
        <ul className="space-y-2 pb-2">
          <li>
            <button
              type="button"
              onClick={() => {
                maj({ note: null, sel: null });
                setPanneau(null);
              }}
              className={cn("w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition", noteMin === undefined ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              Toutes les notes
            </button>
          </li>
          {NOTES_MIN.map((n) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => {
                  maj({ note: String(n), sel: null });
                  setPanneau(null);
                }}
                className={cn("w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition", noteMin === n ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
              >
                <Star className="mr-1 inline size-4 fill-or text-or" aria-hidden /> {String(n).replace(".", ",")} et plus
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

/* ---------- Puces ---------- */
function ChipSecteur({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95",
        actif ? "bg-primary text-white shadow-card" : "bg-primary-soft/60 text-ink",
      )}
    >
      {children}
    </button>
  );
}

function ChipFiltre({ actif, label, onClick, fleche }: { actif: boolean; label: string; onClick: () => void; fleche?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95",
        actif ? "border-bleu bg-bleu/10 text-bleu" : "border-line bg-white text-ink",
      )}
    >
      {label}
      {fleche && <ChevronDown className="size-3.5 opacity-60" aria-hidden />}
    </button>
  );
}

/* ---------- Carte flottante de l'établissement sélectionné ---------- */
function CarteFlottante({ e, position, onFermer }: { e: Etablissement; position: [number, number] | null; onFermer: () => void }) {
  const router = useRouter();
  const debut = useRef<number | null>(null);
  const note = noteMoyenne(e.avis);
  const distance = position ? distanceKm(position, e.coords) : null;

  return (
    <article
      onTouchStart={(ev) => (debut.current = ev.touches[0].clientY)}
      onTouchEnd={(ev) => {
        if (debut.current !== null && ev.changedTouches[0].clientY - debut.current > 60) onFermer();
        debut.current = null;
      }}
      onClick={() => router.push(`/etablissements/${e.slug}`)}
      className="pointer-events-auto relative flex cursor-pointer items-center gap-3.5 rounded-[1.25rem] bg-white p-3 shadow-flottant transition animate-[monte_.35s_ease]"
    >
      <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl">
        <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-bold text-ink">{e.nom}</p>
        <p className="truncate text-xs text-muted">
          {e.sousType} · {e.commune}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-bold text-ink">
            <Star className="size-3.5 fill-or text-or" aria-hidden />
            {note > 0 ? note.toFixed(1).replace(".", ",") : "—"}
            <span className="font-normal text-muted">({e.avis.length} avis)</span>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-4 self-stretch py-0.5">
        <BoutonFavori slug={e.slug} plat className="-m-1" />
        {distance !== null && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
            <MapPin className="size-3" aria-hidden /> {distance.toFixed(1).replace(".", ",")} km
          </span>
        )}
      </div>
    </article>
  );
}
