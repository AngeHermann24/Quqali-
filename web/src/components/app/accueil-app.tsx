"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { CalendarCheck, Compass, Search, ShieldCheck, Trophy, X } from "lucide-react";
import { type Etablissement, SECTEURS, SECTEUR_LIST, type Secteur, scoreGlobal } from "@/lib/data";
import { type CompteClient } from "@/lib/avis";
import { etatPublic, type Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { normaliser } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { Carte } from "@/components/map";
import type { MapPoint } from "@/components/map-view";
import { BottomSheet } from "@/components/app/bottom-sheet";
import { Splash } from "@/components/app/splash";
import { BoutonFavori } from "@/components/app/favoris";
import { PhotoPlaceholder, SECTEUR_ICONS } from "@/components/ui";

const MOTS_SECTEUR: [RegExp, Secteur][] = [
  [/hotel|auberge|dormir|r.sidence|lodge/, "hotellerie"],
  [/restau|resto|manger|maquis|alloco|cuisine/, "restauration"],
  [/sant|cliniq|h.pital|soin|m.dec|pharmacie/, "sante"],
  [/coiff|pressing|salon|garage|r.para|beaut|tresse/, "services"],
  [/.cole|formation|institut|scolaire|cr.che|cours/, "education"],
  [/centre commercial|mall|galerie|boutique|march|shopping/, "commerce"],
  [/bus|transport|navette|taxi|voyage|billet/, "transport"],
];

const TUILES = [
  { href: "/etablissements", label: "Explorer", Icon: Compass },
  { href: "/etablissements?reservation=1", label: "Réservable", Icon: CalendarCheck },
  { href: "/awards", label: "Awards", Icon: Trophy },
  { href: "/methodologie", label: "La méthode", Icon: ShieldCheck },
];

export function AccueilApp({
  etablissements,
  laureats,
  annee,
}: {
  etablissements: Etablissement[];
  laureats: { categorie: string; nom: string; slug: string }[];
  annee: number;
}) {
  const router = useRouter();
  const [compte] = useStockage<CompteClient>(CLES.compte);
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  const [q, setQ] = useState("");
  const [secteur, setSecteur] = useState<Secteur | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const suspendus = useMemo(() => new Set(Object.keys(gestion ?? {}).filter((s) => etatPublic(gestion?.[s]) === "suspendu")), [gestion]);

  const visibles = useMemo(
    () => etablissements.filter((e) => !suspendus.has(e.slug) && (!secteur || e.secteur === secteur)),
    [etablissements, suspendus, secteur],
  );
  const pointsFiltres = useMemo<MapPoint[]>(
    () =>
      visibles.map((e) => ({
        slug: e.slug,
        nom: e.nom,
        coords: e.coords,
        score: scoreGlobal(e.scores),
        sousTitre: `${SECTEURS[e.secteur].label} · ${e.commune}`,
        secteur: e.secteur,
      })),
    [visibles],
  );
  const aLaUne = useMemo(
    () => etablissements.filter((e) => e.aLaUne && !suspendus.has(e.slug)).sort((a, b) => scoreGlobal(b.scores) - scoreGlobal(a.scores)),
    [etablissements, suspendus],
  );

  const selectionne = selection ? (etablissements.find((e) => e.slug === selection) ?? null) : null;
  const prenom = compte?.nom.trim().split(/\s+/)[0];

  const chercher = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    let texte = normaliser(q.trim());
    for (const [re, s] of MOTS_SECTEUR) {
      if (re.test(texte)) {
        params.set("secteur", s);
        texte = texte.replace(re, "").trim();
        break;
      }
    }
    if (!params.get("secteur") && secteur) params.set("secteur", secteur);
    if (texte) params.set("quartier", q.trim());
    const qs = params.toString();
    router.push(`/etablissements${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="relative h-dvh overflow-hidden lg:h-[calc(100dvh-4rem)]">
      <Splash />

      {/* Carte plein écran */}
      <div className="absolute inset-0">
        <Carte
          points={pointsFiltres}
          activeSlug={selection}
          onSelect={(slug) => setSelection(slug)}
        />
      </div>

      {/* Barre de recherche flottante */}
      <form onSubmit={chercher} className="verre absolute inset-x-4 top-4 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 shadow-flottant" role="search">
        <Search className="size-5 shrink-0 text-primary" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Où allez-vous aujourd'hui ?"
          aria-label="Rechercher un quartier ou un secteur"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" className="btn-hero px-5 py-2.5 text-sm">
          Aller
        </button>
      </form>

      {/* Puces secteur */}
      <div className="no-scrollbar absolute inset-x-0 top-[76px] z-40 flex gap-2 overflow-x-auto px-4">
        {SECTEUR_LIST.map((s) => {
          const Icon = SECTEUR_ICONS[s];
          const on = secteur === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSecteur(on ? null : s)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-flottant transition active:scale-95",
                on ? "text-white [background:linear-gradient(135deg,#1E3A8A,#2D4DB0_45%,#16A34A)]" : "verre text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {SECTEURS[s].label}
            </button>
          );
        })}
      </div>

      {/* Mini-fiche de l'établissement sélectionné sur la carte */}
      {selectionne && (
        <div className="verre absolute inset-x-4 bottom-[46%] z-40 mx-auto flex max-w-md items-center gap-3 rounded-3xl p-3 shadow-flottant sm:bottom-auto sm:top-32">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <PhotoPlaceholder secteur={selectionne.secteur} className="absolute inset-0" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-bold text-ink">{selectionne.nom}</p>
            <p className="truncate text-xs text-muted">
              {SECTEURS[selectionne.secteur].label} · {selectionne.commune}
            </p>
            <p className="mt-0.5 text-xs font-bold text-success">{scoreGlobal(selectionne.scores)} % certifié</p>
          </div>
          <Link href={`/etablissements/${selectionne.slug}`} className="btn-hero shrink-0 px-4 py-2.5 text-xs">
            Voir
          </Link>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setSelection(null)}
            className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-white text-muted shadow-card"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Panneau du bas */}
      <BottomSheet>
        <p className="font-display text-xl font-extrabold text-ink">
          {prenom ? (
            <>
              Bonjour <span className="text-success">{prenom}</span>,
            </>
          ) : (
            "Bonjour,"
          )}
        </p>
        <p className="text-sm text-muted">que cherchez-vous ?</p>

        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {TUILES.map(({ href, label, Icon }) => (
            <Link
              key={href + label}
              href={href}
              className="rounded-2xl bg-surface px-1 py-3 text-center text-[11px] font-bold text-ink transition active:scale-95"
            >
              <span className="mx-auto mb-1.5 grid size-9 place-items-center rounded-xl bg-white text-primary shadow-card">
                <Icon className="size-4.5" aria-hidden />
              </span>
              {label}
            </Link>
          ))}
        </div>

        <p className="mt-6 font-display font-bold text-ink">Les mieux notés près de vous</p>
        <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {aLaUne.map((e) => (
            <Link
              key={e.slug}
              href={`/etablissements/${e.slug}`}
              className="w-[64%] shrink-0 snap-start overflow-hidden rounded-3xl border border-line bg-white shadow-card transition active:scale-[0.98] sm:w-56"
            >
              <div className="relative h-24">
                <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
                <span className="badge-brille absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-white">
                  Certifié
                </span>
                <BoutonFavori slug={e.slug} className="absolute top-2 right-2" />
              </div>
              <div className="p-3">
                <p className="truncate font-display text-sm font-bold text-ink">{e.nom}</p>
                <p className="truncate text-xs text-muted">
                  {SECTEURS[e.secteur].label} · {e.commune}
                </p>
                <p className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-success">● {scoreGlobal(e.scores)} %</span>
                  <span className="text-muted">{e.avis.length} avis</span>
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Awards */}
        <Link
          href="/awards"
          className="mt-6 block overflow-hidden rounded-3xl p-5 text-white shadow-survol [background:linear-gradient(135deg,#16296B,#1E3A8A_55%,#14532D)]"
        >
          <p className="flex items-center gap-2 font-display text-sm font-bold text-or">
            <Trophy className="size-4" aria-hidden /> Awards {annee}
          </p>
          <p className="mt-1 font-display text-lg font-extrabold">Le palmarès des meilleurs établissements</p>
          <ul className="mt-3 space-y-1.5">
            {laureats.slice(0, 3).map((l) => (
              <li key={l.categorie} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
                <span className="text-white/75">{l.categorie}</span>
                <span className="truncate font-bold">{l.nom}</span>
              </li>
            ))}
          </ul>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-success-bright">
            Voir le palmarès complet →
          </span>
        </Link>

        {/* Comment ça marche — condensé */}
        <div className="mt-6 rounded-3xl bg-surface p-5">
          <p className="font-display font-bold text-ink">Un label qui se mérite</p>
          <ol className="mt-3 space-y-2.5 text-sm text-muted">
            <li className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              Audit sur place par un agent indépendant
            </li>
            <li className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">2</span>
              Publié seulement si la note atteint 80 %
            </li>
            <li className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">3</span>
              Contrôles réguliers — le badge peut être retiré
            </li>
          </ol>
          <Link href="/methodologie" className="mt-3 inline-block text-sm font-bold text-primary">
            Notre méthodologie →
          </Link>
        </div>
      </BottomSheet>
    </div>
  );
}
