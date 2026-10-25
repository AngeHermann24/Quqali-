"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bell, ChevronDown, ChevronRight, MapPin, Navigation, Star, Trophy, User } from "lucide-react";
import { type Etablissement, SECTEURS, type Secteur, noteMoyenne, scoreGlobal } from "@/lib/data";
import { type CompteClient } from "@/lib/avis";
import { etatPublic, type Gestion } from "@/lib/admin";
import { CLES } from "@/lib/espace";
import { normaliser } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { PhotoPlaceholder, SECTEUR_ICONS } from "@/components/ui";
import { BadgeCertifie, SECTEUR_COULEURS, SearchBar, SectorTile } from "@/components/app/ui-app";
import { BoutonFavori } from "@/components/app/favoris";
import { Lancement } from "@/components/app/lancement";
import { useNotifications } from "@/components/app/notifications";

const MOTS_SECTEUR: [RegExp, Secteur][] = [
  [/hotel|auberge|dormir|r.sidence|lodge/, "hotellerie"],
  [/restau|resto|manger|maquis|alloco|cuisine/, "restauration"],
  [/sant|cliniq|h.pital|soin|m.dec|pharmacie/, "sante"],
  [/coiff|pressing|salon|garage|r.para|beaut|tresse/, "services"],
  [/.cole|formation|institut|scolaire|cr.che|cours/, "education"],
  [/centre commercial|mall|galerie|boutique|march|shopping/, "commerce"],
  [/bus|transport|navette|taxi|voyage|billet/, "transport"],
];

const SECTEURS_PRINCIPAUX: Secteur[] = ["restauration", "hotellerie", "sante"];
const SECTEURS_AUTRES: Secteur[] = ["services", "education", "commerce", "transport"];

const RACCOURCIS = [
  { href: "/etablissements?tri=avis", label: "Les mieux notés", Icon: Star },
  { href: "/etablissements", label: "Près de moi", Icon: Navigation },
  { href: "/awards", label: "Awards", Icon: Trophy },
];

export function AccueilApp({ etablissements }: { etablissements: Etablissement[]; laureats?: { categorie: string; nom: string; slug: string }[]; annee?: number }) {
  const router = useRouter();
  const [compte] = useStockage<CompteClient>(CLES.compte);
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  const { items: notifs } = useNotifications(compte);
  const [q, setQ] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);

  const suspendus = useMemo(() => new Set(Object.keys(gestion ?? {}).filter((s) => etatPublic(gestion?.[s]) === "suspendu")), [gestion]);
  const aLaUne = useMemo(
    () => etablissements.filter((e) => e.aLaUne && !suspendus.has(e.slug)).sort((a, b) => scoreGlobal(b.scores) - scoreGlobal(a.scores)),
    [etablissements, suspendus],
  );

  const initiales = compte?.nom
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const chercher = () => {
    const params = new URLSearchParams();
    let texte = normaliser(q.trim());
    for (const [re, s] of MOTS_SECTEUR) {
      if (re.test(texte)) {
        params.set("secteur", s);
        texte = texte.replace(re, "").trim();
        break;
      }
    }
    if (texte) params.set("quartier", q.trim());
    const qs = params.toString();
    router.push(`/etablissements${qs ? `?${qs}` : ""}`);
  };

  const localiser = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        router.push("/etablissements");
      },
      () => router.push("/etablissements"),
      { timeout: 4000 },
    );
  };

  return (
    <div className="pb-4">
      <Lancement />

      {/* En-tête : logo, notifications, avatar */}
      <header className="flex items-center justify-between px-5 pt-5">
        <span className="font-display text-xl font-extrabold text-ink">
          Qualité<span className="text-success">+</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition active:scale-95">
            <Bell className="size-5" aria-hidden />
            {notifs.some((n) => !n.lue) && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-danger" aria-hidden />}
          </Link>
          <Link href="/profil" aria-label="Mon profil" className="grid size-10 place-items-center rounded-full bg-primary font-bold text-white transition active:scale-95">
            {initiales ? <span className="text-sm">{initiales}</span> : <User className="size-5" aria-hidden />}
          </Link>
        </div>
      </header>

      {/* Localisation */}
      <button type="button" className="mt-3 flex items-center gap-1.5 px-5 text-sm font-semibold text-ink">
        <MapPin className="size-4 text-primary" aria-hidden />
        Abidjan
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>

      <div className="mt-4 px-5">
        <SearchBar valeur={q} onChange={setQ} onSubmit={chercher} />
      </div>

      {/* Tuiles secteurs */}
      <div className="mt-6 grid grid-cols-3 gap-3 px-5">
        {SECTEURS_PRINCIPAUX.map((s) => (
          <SectorTile key={s} secteur={s} onClick={() => router.push(`/etablissements?secteur=${s}`)} />
        ))}
      </div>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
        {SECTEURS_AUTRES.map((s) => {
          const Icon = SECTEUR_ICONS[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => router.push(`/etablissements?secteur=${s}`)}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-card transition active:scale-95"
            >
              <span className="grid size-7 place-items-center rounded-lg text-white" style={{ background: SECTEUR_COULEURS[s] }}>
                <Icon className="size-4" aria-hidden />
              </span>
              {SECTEURS[s].label}
            </button>
          );
        })}
      </div>

      {/* Raccourcis */}
      <div className="mt-5 grid grid-cols-3 px-5">
        {RACCOURCIS.map(({ href, label, Icon }) => (
          <Link
            key={label}
            href={href}
            onClick={label === "Près de moi" ? (e) => (e.preventDefault(), localiser()) : undefined}
            className="flex flex-col items-center gap-1.5 py-1 text-center text-[11px] font-bold text-ink transition active:scale-95"
          >
            <Icon className={cn("size-5", label === "Près de moi" ? "text-primary" : "text-or")} aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      {/* Établissements à la une */}
      <div className="mt-7 flex items-center justify-between px-5">
        <h2 className="font-display text-base font-bold text-ink">Établissements à la une</h2>
        <Link href="/etablissements" className="flex items-center gap-0.5 text-sm font-bold text-bleu">
          Voir tout <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-3 space-y-4 px-5">
        {aLaUne.slice(0, 6).map((e) => (
          <CarteUne key={e.slug} e={e} position={position} />
        ))}
      </div>
    </div>
  );
}

function CarteUne({ e, position }: { e: Etablissement; position: [number, number] | null }) {
  const note = noteMoyenne(e.avis);
  const distance = position ? distanceKm(position, e.coords) : null;
  const score = Math.round(scoreGlobal(e.scores));
  return (
    <Link href={`/etablissements/${e.slug}`} className="block overflow-hidden rounded-3xl border border-line bg-white shadow-card transition active:scale-[0.99]">
      <div className="relative h-44">
        <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
        <BadgeCertifie className="absolute top-3 right-3" />
        <span
          className="absolute -bottom-5 left-4 grid size-12 place-items-center rounded-full shadow-flottant"
          style={{ background: `conic-gradient(#16A34A ${score * 3.6}deg, #E5E9F2 0deg)` }}
          aria-label={`Score ${score} %`}
        >
          <span className="grid size-9 place-items-center rounded-full bg-white font-display text-[11px] font-extrabold text-ink">{score}%</span>
        </span>
      </div>
      <div className="p-4 pt-7">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display font-bold text-ink">{e.nom}</p>
            <p className="mt-0.5 text-xs text-muted">
              {e.sousType} · {e.commune}
            </p>
          </div>
          <BoutonFavori slug={e.slug} plat className="shrink-0" />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-bold text-ink">
            <Star className="size-4 fill-or text-or" aria-hidden />
            {note > 0 ? note.toFixed(1).replace(".", ",") : "—"}
            <span className="font-normal text-muted">({e.avis.length} avis)</span>
          </span>
          {distance !== null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-muted">
              <Navigation className="size-3.5" aria-hidden /> {distance.toFixed(1).replace(".", ",")} km
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
