"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Compass,
  EllipsisVertical,
  Heart,
  HeartOff,
  List,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react";
import { type Etablissement, SECTEURS, type Secteur, getEtablissement, noteMoyenne } from "@/lib/data";
import { type Gestion, etatPublic } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { distanceKm, itineraire } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { Modal } from "@/components/modal";
import { PhotoPlaceholder } from "@/components/ui";
import { useCompteClient } from "@/components/avis/use-avis";
import { useFavoris } from "@/components/app/favoris";

type Tri = "recents" | "notes" | "proches" | "alpha";
type PanneauMenu = "trier" | null;

const TRIS: { id: Tri; label: string }[] = [
  { id: "recents", label: "Ajoutés récemment" },
  { id: "notes", label: "Les mieux notés" },
  { id: "proches", label: "Les plus proches" },
  { id: "alpha", label: "Ordre alphabétique" },
];

const LIBELLES_PUCES: Partial<Record<Secteur, string>> = { restauration: "Restaurants", hotellerie: "Hôtels", sante: "Santé" };
const LIBELLES_TYPES: Partial<Record<Secteur, string>> = { restauration: "Restaurant", hotellerie: "Hôtel", sante: "Santé" };
const SECTEURS_PRINCIPAUX: Secteur[] = ["restauration", "hotellerie", "sante"];

const LARGUEUR_RETRAIT = 92;

export function FavorisUsager() {
  const router = useRouter();
  const params = useSearchParams();
  const { favoris, retirer, ajouter, retirerPlusieurs, charge } = useFavoris();
  const { compte } = useCompteClient();
  const [gestion] = useStockage<Gestion>(CLES.gestion);

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [menu, setMenu] = useState<PanneauMenu>(null);
  const [edition, setEdition] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [menuLigne, setMenuLigne] = useState<string | null>(null);
  const [bandeauCompte, setBandeauCompte] = useState(false);
  const [fermant, setFermant] = useState<string | null>(null);
  const [toast, setToast] = useState<{ slug: string; index: number } | null>(null);
  const minuteurToast = useRef<number | null>(null);

  /* ---------- URL : secteur + tri ---------- */
  const brutSecteur = params.get("secteur") ?? "tous";
  const secteur = (brutSecteur === "tous" || brutSecteur in SECTEURS ? brutSecteur : "tous") as Secteur | "tous";
  const brutTri = params.get("tri") ?? "recents";
  const tri = (TRIS.some((t) => t.id === brutTri) ? brutTri : "recents") as Tri;
  const majUrl = (cle: "secteur" | "tri", valeur: string) => {
    const p = new URLSearchParams(params.toString());
    if (valeur === "tous" || valeur === "recents") p.delete(cle);
    else p.set(cle, valeur);
    router.replace(`/favoris${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  /* ---------- Géolocalisation silencieuse ---------- */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  /* ---------- Bandeau connexion (une fois par session) ---------- */
  useEffect(() => {
    const t = window.setTimeout(() => {
      setBandeauCompte(!compte && sessionStorage.getItem("ql-favoris-bandeau") !== "1");
    }, 0);
    return () => clearTimeout(t);
  }, [compte]);

  /* ---------- Données ---------- */
  const items = favoris
    .map((slug, index) => ({ slug, index, e: getEtablissement(slug), etat: etatPublic(gestion?.[slug]) }))
    .filter((x) => x.e != null) as { slug: string; index: number; e: Etablissement; etat: ReturnType<typeof etatPublic> }[];

  const compteurs = items.reduce<Record<string, number>>((acc, x) => {
    if (x.etat === "actif") acc[x.e.secteur] = (acc[x.e.secteur] ?? 0) + 1;
    return acc;
  }, {});
  const secteursPresents = SECTEURS_PRINCIPAUX.concat(
    (Object.keys(SECTEURS) as Secteur[]).filter((s) => !SECTEURS_PRINCIPAUX.includes(s) && (compteurs[s] ?? 0) > 0),
  );

  const visibles = items
    .filter((x) => secteur === "tous" || x.e.secteur === secteur)
    .sort((a, b) => {
      if (tri === "notes") return noteMoyenne(b.e.avis) - noteMoyenne(a.e.avis);
      if (tri === "alpha") return a.e.nom.localeCompare(b.e.nom, "fr");
      if (tri === "proches" && position)
        return distanceKm(position, a.e.coords) - distanceKm(position, b.e.coords);
      return a.index - b.index; // récents (ordre d'ajout)
    });

  /* ---------- Retrait + annulation ---------- */
  const annoncer = () => {
    if (minuteurToast.current) clearTimeout(minuteurToast.current);
    minuteurToast.current = window.setTimeout(() => setToast(null), 5000);
  };
  const retirerUn = (slug: string) => {
    navigator.vibrate?.(15);
    const index = favoris.indexOf(slug);
    setToast({ slug, index });
    annoncer();
    setFermant(slug);
    window.setTimeout(() => {
      retirer(slug);
      setFermant((f) => (f === slug ? null : f));
    }, 260);
  };
  const annuler = () => {
    if (!toast) return;
    navigator.vibrate?.(15);
    ajouter(toast.slug, toast.index);
    if (minuteurToast.current) clearTimeout(minuteurToast.current);
    setToast(null);
  };
  const retirerSelection = () => {
    navigator.vibrate?.(15);
    retirerPlusieurs([...selection]);
    setSelection(new Set());
    setEdition(false);
  };

  const libSecteur = (s: Secteur | "tous") => (s === "tous" ? "établissements" : (LIBELLES_PUCES[s] ?? SECTEURS[s].label).toLowerCase());
  const menuEtablissement = menuLigne ? getEtablissement(menuLigne) : null;

  return (
    <div className="pb-28">
      {/* ---------- En-tête ---------- */}
      <header className="flex items-center justify-between px-5 pt-4">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label="Retour"
          className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="font-display text-lg font-extrabold text-primary">Favoris</h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === "trier" ? null : "trier")}
            aria-label="Trier et modifier la liste"
            aria-expanded={menu === "trier"}
            className="relative grid size-10 place-items-center rounded-full text-ink transition active:scale-95"
          >
            <List className="size-5" aria-hidden />
            <Heart className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 fill-primary text-primary" aria-hidden />
          </button>
          {menu === "trier" && (
            <>
              <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenu(null)} />
              <div className="absolute top-11 right-0 z-40 w-60 rounded-2xl border border-line bg-white p-2 shadow-lg">
                <p className="label px-2 pt-1">Trier par</p>
                {TRIS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      majUrl("tri", id);
                      setMenu(null);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-surface"
                  >
                    {label}
                    {tri === id && <Check className="size-4 text-success" aria-hidden />}
                  </button>
                ))}
                <div className="my-1.5 h-px bg-line" />
                <button
                  type="button"
                  onClick={() => {
                    setEdition(true);
                    setMenu(null);
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-surface"
                >
                  Modifier la liste
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ---------- Bandeau connexion ---------- */}
      {bandeauCompte && (
        <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl bg-primary-soft p-3.5">
          <Heart className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
          <p className="flex-1 text-xs leading-relaxed text-ink/80">
            <Link href="/connexion?suivant=%2Ffavoris" className="font-bold text-primary underline underline-offset-2">
              Connectez-vous
            </Link>{" "}
            pour retrouver vos favoris sur tous vos appareils.
          </p>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => {
              sessionStorage.setItem("ql-favoris-bandeau", "1");
              setBandeauCompte(false);
            }}
            className="grid size-7 place-items-center rounded-full text-ink/50 transition active:scale-90"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* ---------- Puces secteur ---------- */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Filtrer par secteur">
        <Puce active={secteur === "tous"} compte={items.length} onClick={() => majUrl("secteur", "tous")}>
          Tous
        </Puce>
        {secteursPresents.map((s) => (
          <Puce key={s} active={secteur === s} compte={compteurs[s] ?? 0} onClick={() => majUrl("secteur", s)}>
            {LIBELLES_PUCES[s] ?? SECTEURS[s].label}
          </Puce>
        ))}
      </div>

      {/* ---------- Liste ---------- */}
      {!charge ? (
        <div className="mt-4 space-y-1 px-5" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 py-3">
              <div className="squelette size-[4.5rem] shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="squelette h-4 w-36 rounded-full" />
                <div className="squelette h-3 w-28 rounded-full" />
                <div className="squelette h-3 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-surface text-muted">
            <Heart className="size-9" aria-hidden />
          </span>
          <p className="mt-5 font-display text-lg font-bold text-ink">Aucun favori pour l&apos;instant</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted">Touchez le cœur sur un établissement pour le retrouver ici.</p>
          <Link href="/etablissements" className="btn btn-success mt-7 rounded-full px-6 py-3.5 font-display font-bold">
            <Compass className="size-5" aria-hidden /> Explorer les établissements
          </Link>
        </div>
      ) : visibles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">Aucun {libSecteur(secteur)} dans vos favoris</p>
          <button type="button" onClick={() => majUrl("secteur", "tous")} className="btn btn-outline mt-6 rounded-full px-6 py-3 font-bold">
            Voir tous mes favoris
          </button>
        </div>
      ) : (
        <ul className="mt-2" role="list">
          {visibles.map(({ slug, e, etat }) => (
            <LigneFavori
              key={slug}
              e={e}
              indisponible={etat !== "actif"}
              fermant={fermant === slug}
              enEdition={edition}
              selectionne={selection.has(slug)}
              onSelectionne={() => setSelection((s) => (s.has(slug) ? (s.delete(slug), new Set(s)) : new Set(s).add(slug)))}
              distance={position ? distanceKm(position, e.coords) : null}
              onRetirer={() => retirerUn(slug)}
              onMenu={() => setMenuLigne(slug)}
            />
          ))}
        </ul>
      )}

      {/* ---------- Barre « Modifier la liste » ---------- */}
      {edition && charge && items.length > 0 && (
        <div className="fixed bottom-[4.5rem] left-1/2 z-40 flex w-[calc(100%-2.5rem)] max-w-[380px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-lg">
          <button type="button" disabled={selection.size === 0} onClick={retirerSelection} className="btn flex-1 bg-danger py-3 text-sm font-bold text-white disabled:opacity-40">
            Retirer ({selection.size})
          </button>
          <button type="button" onClick={() => { setEdition(false); setSelection(new Set()); }} className="btn btn-outline flex-1 py-3 text-sm font-bold">
            Terminer
          </button>
        </div>
      )}

      {/* ---------- Menu rapide de la ligne ---------- */}
      <Modal open={!!menuEtablissement} onClose={() => setMenuLigne(null)} title={menuEtablissement?.nom ?? ""}>
        <div className="space-y-1 pb-2">
          <ActionMenu Icon={Compass} label="Ouvrir la fiche" onClick={() => { setMenuLigne(null); router.push(`/etablissements/${menuLigne}`); }} />
          <ActionMenu
            Icon={Navigation}
            label="Itinéraire"
            onClick={() => {
              if (menuEtablissement) window.open(itineraire(menuEtablissement.coords), "_blank");
              setMenuLigne(null);
            }}
          />
          {menuEtablissement && (
            <a
              href={`tel:${menuEtablissement.telephone.replace(/\s/g, "")}`}
              onClick={() => setMenuLigne(null)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              <Phone className="size-4.5 text-success" aria-hidden /> Appeler
            </a>
          )}
          <ActionMenu
            Icon={HeartOff}
            label="Retirer des favoris"
            danger
            onClick={() => {
              const slug = menuLigne!;
              setMenuLigne(null);
              retirerUn(slug);
            }}
          />
        </div>
      </Modal>

      {/* ---------- Toast annulation ---------- */}
      <div
        aria-live="polite"
        className={cn(
          "fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-3 text-sm text-white shadow-lg transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        Retiré des favoris
        <button type="button" onClick={annuler} className="rounded-full bg-white/15 px-3 py-1 font-bold text-white transition active:scale-95">
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ---------- Puce secteur ---------- */
function Puce({ active, compte, onClick, children }: { active: boolean; compte: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95",
        active ? "bg-primary text-white" : "bg-primary-soft/60 text-ink/80",
      )}
    >
      {children}
      {compte > 0 && <span className={cn("text-[10px] font-bold", active ? "text-white/75" : "text-muted")}>{compte}</span>}
    </button>
  );
}

/* ---------- Ligne favori avec balayage ---------- */
function LigneFavori({
  e,
  indisponible,
  fermant,
  enEdition,
  selectionne,
  onSelectionne,
  distance,
  onRetirer,
  onMenu,
}: {
  e: Etablissement;
  indisponible: boolean;
  fermant: boolean;
  enEdition: boolean;
  selectionne: boolean;
  onSelectionne: () => void;
  distance: number | null;
  onRetirer: () => void;
  onMenu: () => void;
}) {
  const router = useRouter();
  const [dx, setDx] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const tactile = useRef({ x: 0, y: 0, actif: false, bloque: false, appuiLong: 0 });

  const debut = (t: React.Touch) => {
    tactile.current = { x: t.clientX, y: t.clientY, actif: !indisponible && !enEdition, bloque: false, appuiLong: window.setTimeout(onMenu, 550) };
  };
  const bouger = (t: React.Touch) => {
    const c = tactile.current;
    if (!c.actif) return;
    const deltaX = t.clientX - c.x;
    const deltaY = t.clientY - c.y;
    if (!c.bloque && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      c.bloque = true;
      clearTimeout(c.appuiLong);
    }
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) clearTimeout(c.appuiLong);
    if (c.bloque) setDx(Math.min(0, Math.max(-LARGUEUR_RETRAIT * 1.3, (ouvert ? -LARGUEUR_RETRAIT : 0) + deltaX)));
  };
  const fin = () => {
    clearTimeout(tactile.current.appuiLong);
    if (!tactile.current.actif) return;
    tactile.current.actif = false;
    const o = dx < -LARGUEUR_RETRAIT / 2;
    setOuvert(o);
    setDx(o ? -LARGUEUR_RETRAIT : 0);
  };

  const moyenne = noteMoyenne(e.avis);
  return (
    <li className={cn("relative overflow-hidden transition-all duration-300", fermant ? "pointer-events-none max-h-0 opacity-0" : "max-h-32")}>
      {/* Action « Retirer » révélée par le balayage */}
      <button
        type="button"
        onClick={onRetirer}
        aria-label={`Retirer ${e.nom} des favoris`}
        className="absolute inset-y-0 right-0 flex w-[92px] items-center justify-center gap-1.5 bg-red-600 text-sm font-bold text-white"
      >
        <HeartOff className="size-4.5" aria-hidden /> Retirer
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (ouvert) {
            setOuvert(false);
            setDx(0);
          } else if (enEdition) onSelectionne();
          else if (!indisponible) router.push(`/etablissements/${e.slug}`);
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") ev.currentTarget.click();
        }}
        onTouchStart={(ev) => debut(ev.touches[0])}
        onTouchMove={(ev) => bouger(ev.touches[0])}
        onTouchEnd={fin}
        onTouchCancel={fin}
        onContextMenu={(ev) => {
          ev.preventDefault();
          onMenu();
        }}
        aria-label={indisponible ? `${e.nom} — plus disponible` : `Ouvrir la fiche de ${e.nom}`}
        className={cn(
          "relative flex cursor-pointer items-center gap-3.5 border-b border-line bg-white px-5 py-3 transition-transform duration-200 last:border-0",
          indisponible && "opacity-50",
        )}
        style={{ transform: `translateX(${dx}px)` }}
      >
        {enEdition && (
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition", selectionne ? "border-success bg-success text-white" : "border-line bg-white")} aria-hidden>
            {selectionne && <Check className="size-3.5" />}
          </span>
        )}
        <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl">
          <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-bold text-ink">{e.nom}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {LIBELLES_TYPES[e.secteur] ?? e.sousType} · {e.commune}
          </p>
          {indisponible ? (
            <p className="mt-1 text-xs font-bold text-muted">Plus disponible</p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-[13px]">
              <Star className="size-3.5 fill-or text-or" aria-hidden />
              <span className="font-bold text-ink">{moyenne > 0 ? moyenne.toFixed(1).replace(".", ",") : "—"}</span>
              <span className="text-muted">({e.avis.length} avis)</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {indisponible ? (
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onRetirer();
              }}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-red-600"
            >
              Retirer
            </button>
          ) : (
            <>
              {distance !== null && <span className="text-[13px] font-semibold text-muted">{distance.toFixed(1).replace(".", ",")} km</span>}
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onMenu();
                }}
                aria-label={`Options pour ${e.nom}`}
                className="grid size-11 place-items-center rounded-full text-muted transition active:scale-90"
              >
                <EllipsisVertical className="size-5" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/* ---------- Action du menu rapide ---------- */
function ActionMenu({ Icon, label, onClick, danger }: { Icon: typeof Compass; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition hover:bg-surface", danger ? "text-red-600" : "text-ink")}>
      <Icon className={cn("size-4.5", danger ? "text-red-600" : "text-primary")} aria-hidden /> {label}
    </button>
  );
}
