"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageSquareText,
  Navigation,
  Phone,
  Rotate3d,
  Star,
  X,
} from "lucide-react";
import { type Etablissement, noteMoyenne, scoreGlobal } from "@/lib/data";
import { etatPublic, type Gestion } from "@/lib/admin";
import { ANNEAUX_FICHE, aideCritere } from "@/lib/criteres-fiche";
import { CLES } from "@/lib/espace";
import { distanceKm, formatDate, formatScore, itineraire } from "@/lib/format";
import { fmt, galerieDe, secteurPluriel, tv, type CleStr } from "@/lib/langue";
import { useLangue } from "@/components/langue";
import { couvreJour, estOuvert, plageDuJour, prochaineHeure } from "@/lib/horaires";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { useHorloge } from "@/lib/use-config";
import { analyserLien3D } from "@/lib/visite3d";
import { Modal } from "@/components/modal";
import { Carte } from "@/components/map";
import { PhotoPlaceholder, SECTEUR_ICONS, Stars } from "@/components/ui";
import { BadgePublic, BandeauGestion } from "@/components/etat-certification";
import { EtablissementCard } from "@/components/etablissement-card";
import { SectionAvis } from "@/components/avis/section-avis";
import { RingScore, SECTEUR_COULEURS } from "@/components/app/ui-app";
import { useFavoris } from "@/components/app/favoris";


const TITRE_PHOTOS: Record<string, CleStr> = {
  restauration: "photosRestaurant",
  hotellerie: "photosHotel",
  sante: "photosClinique",
};

/** Anneau de score → sa clé de traduction (même ordre que la maquette). */
const CLE_ANNEAU: Record<string, CleStr> = {
  gouvernance: "anneauQualite",
  accueil: "anneauAccueil",
  hygiene: "anneauProprete",
};

const lienMaps = (coords: [number, number]) =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ? `https://maps.apple.com/?daddr=${coords[0]},${coords[1]}` : itineraire(coords);

export function FicheEtablissement({ e, similaires }: { e: Etablissement; similaires: Etablissement[] }) {
  const router = useRouter();
  const { langue, t, locale } = useLangue();
  const galerie = galerieDe(langue);
  const { aujourdhui } = useHorloge();
  const [gestion] = useStockage<Gestion>(CLES.gestion);
  const { estFavori, toggle, charge: favCharge } = useFavoris();

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [visionneuse, setVisionneuse] = useState<number | null>(null);
  const [visite, setVisite] = useState(false);
  const [infoCertif, setInfoCertif] = useState(false);
  const [toutAvis, setToutAvis] = useState(false);
  const [lirePlus, setLirePlus] = useState(false);

  const maintenant = aujourdhui ? new Date(aujourdhui) : null;
  const ouvert = maintenant ? estOuvert(e.horaires, maintenant) : null;
  const plage = maintenant ? plageDuJour(e.horaires, maintenant) : null;
  const reouverture = maintenant && ouvert === false ? prochaineHeure(e.horaires, maintenant) : null;
  const moyenne = noteMoyenne(e.avis);
  const score = scoreGlobal(e.scores);
  const distance = position ? distanceKm(position, e.coords) : null;
  const favori = favCharge && estFavori(e.slug);
  const premium = e.pack === "premium";
  const gestionEtat = etatPublic(gestion?.[e.slug]);

  // Géolocalisation silencieuse pour la distance.
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const ouvrirReservation = () => {
    navigator.vibrate?.(15);
    router.push(`/reserver/${e.slug}`);
  };

  const retour = () => (window.history.length > 1 ? router.back() : router.push("/etablissements"));

  return (
    <div className="relative pb-44">
      {/* ---------- Photo d'en-tête ---------- */}
      <Galerie e={e} ouvert={ouvert} plage={plage} reouverture={reouverture} favori={favori} onFavori={() => toggle(e.slug)} onRetour={retour} onPhoto={(i) => setVisionneuse(i)} />

      <BandeauGestion slug={e.slug} nom={e.nom} />

      {/* ---------- Bloc identité ---------- */}
      <div className="relative z-10 -mt-7 rounded-t-[1.75rem] bg-white px-5 pt-5 shadow-[0_-8px_24px_rgb(15_23_42/0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold text-primary">{e.nom}</h1>
              <button
                type="button"
                onClick={() => setInfoCertif(true)}
                aria-label={t.savoirCertif}
                className="badge-brille grid size-6 shrink-0 place-items-center rounded-full bg-bleu text-white"
              >
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-sm font-semibold text-muted">
              {e.sousType} · {e.ville} {e.commune}
            </p>
            <button
              type="button"
              onClick={() => document.getElementById("avis")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-2 flex items-center gap-1.5 text-sm"
              aria-label={t.voirAvis}
            >
              <Star className="size-4.5 fill-or text-or" aria-hidden />
              <span className="font-bold text-ink">{moyenne > 0 ? formatScore(moyenne, locale) : "—"}</span>
              <span className="font-semibold text-bleu">({tv(t.avisNb, e.avis.length)})</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.open(lienMaps(e.coords), "_blank", "noopener")}
            aria-label={distance !== null ? `${t.itineraire} — ${formatScore(distance, locale)} km` : t.itineraire}
            className="flex shrink-0 flex-col items-center gap-0.5 pt-1 text-bleu transition active:scale-90"
          >
            <Navigation className="size-5.5 text-sky-400" aria-hidden />
            {distance !== null && <span className="text-[11px] font-bold text-muted">{formatScore(distance, locale)} km</span>}
          </button>
        </div>

        {/* ---------- Anneaux de score ---------- */}
        <div className="mt-5 flex items-start justify-around">
          {ANNEAUX_FICHE.map(({ cle }) => (
            <Anneau key={cle} valeur={e.scores[cle]} label={t[CLE_ANNEAU[cle]] ?? cle} aide={aideCritere(cle)} />
          ))}
        </div>

        {/* ---------- Adresse / Contact ---------- */}
        <div className="mt-6 divide-y divide-line">
          <LigneInfo
            Icon={MapPin}
            titre={t.adresse}
            valeur={`${e.adresse}`}
            onClick={() => window.open(lienMaps(e.coords), "_blank", "noopener")}
            ariaLabel={t.ouvrirItineraire}
          />
          <LigneTel titre={t.contact} numero={e.telephone} />
        </div>

        {/* ---------- Photos ---------- */}
        <section className="mt-7">
          <h2 className="font-display text-lg font-bold text-ink">{TITRE_PHOTOS[e.secteur] ? t[TITRE_PHOTOS[e.secteur]] : t.photosEtab}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {galerie.slice(0, 3).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setVisionneuse(i)}
                aria-label={i === 2 ? fmt(t.voirPhotos, { n: galerie.length }) : `${t.photoMot} : ${label}`}
                className="relative aspect-square overflow-hidden rounded-2xl transition active:scale-[0.97]"
              >
                <PhotoPlaceholder secteur={e.secteur} label={label} className="absolute inset-0" />
                {i === 2 && galerie.length > 3 && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/55 text-white">
                    <span className="flex items-center gap-1.5 font-display font-bold">
                      <ImageIcon className="size-4" aria-hidden /> +{galerie.length - 3}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ---------- À propos ---------- */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">{t.aPropos}</h2>
          <p className={cn("mt-2 text-sm leading-relaxed text-ink/85", !lirePlus && "line-clamp-3")}>{e.description}</p>
          {e.description.length > 140 && (
            <button type="button" onClick={() => setLirePlus(!lirePlus)} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-bleu">
              {lirePlus ? t.lireMoins : t.lirePlus} <ChevronDown className={cn("size-3.5 transition", lirePlus && "rotate-180")} aria-hidden />
            </button>
          )}
          <p className="mt-3 text-sm font-semibold text-ink">{e.prix}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {e.services.map((s) => (
              <li key={s} className="chip bg-surface text-xs text-ink">
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Visite 3D (Premium uniquement) ---------- */}
        {premium && e.visite3d && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">{t.visite3d}</h2>
              <span className="chip bg-primary-soft text-primary">Premium</span>
            </div>
            <button type="button" onClick={() => setVisite(true)} className="group relative mt-3 block w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-left text-white">
              <span className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
              <span className="absolute -bottom-12 -left-8 size-36 rounded-full bg-success/20" />
              <span className="relative flex items-center gap-4 p-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Rotate3d className="size-7" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold">{t.visiter3d}</span>
                  <span className="mt-0.5 block text-xs text-white/75">{t.visite3dDesc}</span>
                </span>
              </span>
            </button>
          </section>
        )}

        {/* ---------- Horaires ---------- */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">{t.horaires}</h2>
          <dl className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {e.horaires.map((h) => {
              const courant = maintenant ? couvreJour(h.jours, maintenant.getDay()) : false;
              return (
                <div key={h.jours} className={cn("flex justify-between gap-4 px-4 py-3 text-sm", courant && "bg-success-soft/50 font-bold")}>
                  <dt className={cn("flex items-center gap-2", courant ? "text-ink" : "text-muted")}>
                    {courant && <span className="size-1.5 rounded-full bg-success" aria-hidden />}
                    {h.jours}
                  </dt>
                  <dd className={h.heures === "Fermé" ? "text-muted" : "text-right text-ink"}>{h.heures === "Fermé" ? t.ferme : h.heures}</dd>
                </div>
              );
            })}
          </dl>
        </section>

        {/* ---------- Avis vérifiés ---------- */}
        <section id="avis" className="mt-8 scroll-mt-4">
          <h2 className="font-display text-lg font-bold text-ink">{t.avisVerifies}</h2>
          {e.avis.length > 0 && (
            <div className="mt-3 flex items-center gap-4 rounded-2xl bg-surface p-4">
              <p className="font-display text-4xl font-bold text-ink">{moyenne > 0 ? formatScore(moyenne, locale) : "—"}</p>
              <div className="flex-1">
                <Stars value={moyenne} size="md" />
                <Repartition avis={e.avis} />
              </div>
            </div>
          )}
          {toutAvis ? (
            <div className="mt-4">
              <SectionAvis etablissementId={e.slug} nom={e.nom} secteur={e.secteur} avisDemo={e.avis} />
            </div>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {e.avis.slice(-3).map((a) => (
                  <li key={a.auteur + a.date} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-semibold text-primary">{a.auteur[0]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{a.auteur}</p>
                        <p className="text-xs text-muted">{formatDate(a.date, locale)}</p>
                      </div>
                      <Stars value={a.note} />
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/85">{a.commentaire}</p>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setToutAvis(true)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-line py-3 text-sm font-bold text-bleu transition active:scale-[0.98]">
                <MessageSquareText className="size-4" aria-hidden /> {t.voirTousAvis}
              </button>
            </>
          )}
        </section>

        {/* ---------- Localisation ---------- */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-ink">{t.localisation}</h2>
            <button type="button" onClick={() => window.open(lienMaps(e.coords), "_blank", "noopener")} className="flex items-center gap-1 text-sm font-bold text-bleu">
              <Navigation className="size-4" aria-hidden /> {t.itineraire}
            </button>
          </div>
          <div className="mt-3 h-52 overflow-hidden rounded-2xl border border-line">
            <Carte interactive={false} points={[{ slug: e.slug, nom: e.nom, coords: e.coords, score, sousTitre: e.adresse }]} activeSlug={e.slug} />
          </div>
        </section>

        {/* ---------- Similaires ---------- */}
        {similaires.length > 0 && (
          <section className="mt-9">
            <h2 className="font-display text-lg font-bold text-ink">{fmt(t.autresX, { s: secteurPluriel(e.secteur, langue).toLowerCase() })}</h2>
            <div className="mt-3 space-y-4">
              {similaires.map((s) => (
                <EtablissementCard key={s.slug} etablissement={s} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ---------- Barre d'action fixe ---------- */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {premium ? (
          <button type="button" onClick={ouvrirReservation} className="btn-hero w-full !bg-none bg-success text-base shadow-[0_10px_28px_rgb(22_163_74/0.35)]" style={{ backgroundImage: "linear-gradient(135deg,#16A34A,#22C55E)" }}>
            <CalendarDays className="size-5" aria-hidden /> {t.reserver}
          </button>
        ) : (
          <a href={`tel:${e.telephone.replace(/\s/g, "")}`} className="btn-hero w-full !bg-none text-base" style={{ backgroundImage: "linear-gradient(135deg,#16A34A,#22C55E)" }}>
            <Phone className="size-5" aria-hidden /> {t.appeler}
          </a>
        )}
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => window.open(lienMaps(e.coords), "_blank", "noopener")}
            className="btn py-3 text-sm font-bold text-white shadow-card"
            style={{ background: "#0F9F8F" }}
          >
            <Navigation className="size-4.5" aria-hidden /> {t.itineraire}
          </button>
          <a href={`tel:${e.telephone.replace(/\s/g, "")}`} className="btn border border-line bg-white py-3 text-sm font-bold text-primary">
            <Phone className="size-4.5 text-success" aria-hidden /> {t.appeler}
          </a>
        </div>
      </div>

      {/* ---------- Panneaux ---------- */}
      <Modal open={infoCertif} onClose={() => setInfoCertif(false)} title={t.certifTitre}>
        <div className="space-y-3 pb-2 text-sm text-ink/85">
          <p className="flex gap-3 rounded-2xl bg-success-soft p-4 font-semibold text-success-dark">
            <BadgeCheck className="size-6 shrink-0" aria-hidden />
            {t.certifTexte}
          </p>
          <p>
            {t.noteGouvernance} : <strong className="text-ink">{formatScore(score, locale)} %</strong> — {fmt(t.auditDu, { n: formatDate(e.dateAudit, locale) })},{" "}
            {fmt(t.prochainControleLe, { n: formatDate(e.prochainControle, locale) })}.
          </p>
          <BadgePublic slug={e.slug} size="sm" score={score} />
          {gestionEtat === "badge_retire" && <p className="text-xs text-muted">{t.badgeRetireTexte}</p>}
        </div>
      </Modal>

      {visite && premium && e.visite3d && <Visionneuse3D lien={e.visite3d} nom={e.nom} onFermer={() => setVisite(false)} />}
      {visionneuse !== null && <VisionneusePhotos e={e} depart={visionneuse} onFermer={() => setVisionneuse(null)} />}
    </div>
  );
}

/* ---------- Galerie d'en-tête ---------- */
function Galerie({
  e,
  ouvert,
  plage,
  reouverture,
  favori,
  onFavori,
  onRetour,
  onPhoto,
}: {
  e: Etablissement;
  ouvert: boolean | null;
  plage: string | null;
  reouverture: string | null;
  favori: boolean;
  onFavori: () => void;
  onRetour: () => void;
  onPhoto: (i: number) => void;
}) {
  const { langue, t } = useLangue();
  const galerie = galerieDe(langue);
  const [index, setIndex] = useState(0);
  const [eclat, setEclat] = useState(0);
  const tap = useRef<{ t: number; n: number; timer: number | null }>({ t: 0, n: 0, timer: null });
  const Icon = SECTEUR_ICONS[e.secteur];
  const couleur = SECTEUR_COULEURS[e.secteur] ?? "#16A34A";

  /* Simple tap → ouvre la photo (après délai) ; double tap → favori. */
  const doubleTap = (i: number, t: number) => {
    if (t - tap.current.t < 350) {
      tap.current.n++;
      if (tap.current.timer) clearTimeout(tap.current.timer);
      if (tap.current.n >= 2) {
        if (!favori) {
          onFavori();
          setEclat((x) => x + 1);
        }
        tap.current.n = 0;
        tap.current.t = 0;
        return;
      }
    } else tap.current.n = 1;
    tap.current.t = t;
    tap.current.timer = window.setTimeout(() => onPhoto(i), 340);
  };

  const coeur = () => {
    onFavori();
    if (!favori) setEclat((x) => x + 1);
  };

  return (
    <header className="relative h-[38dvh] min-h-64 overflow-hidden">
      <div
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
        onScroll={(ev) => {
          const el = ev.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {galerie.slice(0, 5).map((label, i) => (
          <button key={label} type="button" tabIndex={-1} onClick={(ev) => doubleTap(i, ev.timeStamp)} className="relative h-full w-full shrink-0 snap-start" aria-label={fmt(t.photoDoubleTap, { n: label })}>
            <PhotoPlaceholder secteur={e.secteur} label={label} className="absolute inset-0" />
          </button>
        ))}
      </div>

      {/* Dégradés de lisibilité */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/55 to-transparent" />

      {/* Retour + favori */}
      <button
        type="button"
        onClick={(ev) => {
          ev.stopPropagation();
          onRetour();
        }}
        aria-label={t.retour}
        className="absolute top-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-ink/35 text-white backdrop-blur transition active:scale-90"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={(ev) => {
          ev.stopPropagation();
          coeur();
        }}
        aria-label={favori ? t.retirerFavoris : t.ajouterFavoris}
        aria-pressed={favori}
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white text-ink shadow-flottant transition active:scale-90"
      >
        {eclat > 0 && (
          <span key={eclat} className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className="eclat" style={{ transform: `rotate(${i * 45}deg) translateY(-20px)` }} />
            ))}
          </span>
        )}
        <Heart key={`c${eclat}`} className={cn("size-5", favori ? "fill-danger text-danger fav-pop" : "text-ink/60")} aria-hidden />
      </button>

      {/* Pastille d'état */}
      <div className="absolute bottom-12 left-4 z-10 flex items-center">
        <span className={cn("z-[1] grid size-9 place-items-center rounded-full text-white shadow-flottant", ouvert === false ? "bg-muted" : "")} style={ouvert === false ? {} : { background: couleur }}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="-ml-3 rounded-r-full bg-primary/85 py-1.5 pr-3.5 pl-6 text-xs font-bold text-white backdrop-blur">
          {ouvert === false ? `${t.ferme}${reouverture ? ` · ${fmt(t.ouvreA, { n: reouverture })}` : ""}` : `${t.ouvertChip}${plage ? ` · ${plage}` : ""}`}
        </span>
      </div>

      {/* Points de la galerie */}
      <div className="absolute bottom-13 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" aria-hidden>
        {galerie.slice(0, 5).map((_, i) => (
          <span key={i} className={cn("size-1.5 rounded-full transition", i === index ? "w-3.5 bg-white" : "bg-white/50")} />
        ))}
      </div>
    </header>
  );
}

/* ---------- Anneau + infobulle ---------- */
function Anneau({ valeur, label, aide }: { valeur: number; label: string; aide: string }) {
  const { t, locale } = useLangue();
  const [bulle, setBulle] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setBulle(!bulle)} aria-label={fmt(t.anneauAria, { label, valeur: formatScore(valeur, locale) })} className="transition active:scale-95">
        <RingScore valeur={valeur} label={label} taille={74} />
      </button>
      {bulle && (
        <p role="tooltip" className="absolute -top-2 left-1/2 z-20 w-44 -translate-x-1/2 -translate-y-full rounded-2xl bg-ink px-3 py-2 text-[11px] leading-snug font-medium text-white shadow-flottant" onClick={() => setBulle(false)}>
          {aide}
        </p>
      )}
    </div>
  );
}

/* ---------- Ligne d'information ---------- */
function LigneInfo({ Icon, titre, valeur, onClick, ariaLabel }: { Icon: typeof MapPin; titre: string; valeur: string; onClick?: () => void; ariaLabel: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="flex w-full items-center gap-3.5 py-4 text-left transition active:opacity-70">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-primary">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">{titre}</span>
        <span className="block truncate text-sm font-semibold text-bleu">{valeur}</span>
      </span>
    </button>
  );
}

function LigneTel({ titre, numero }: { titre: string; numero: string }) {
  const { t } = useLangue();
  const [copie, setCopie] = useState(false);
  const maintien = useRef<number | null>(null);
  const copier = () => {
    navigator.clipboard?.writeText(numero).then(() => {
      setCopie(true);
      navigator.vibrate?.(10);
      setTimeout(() => setCopie(false), 2500);
    });
  };
  return (
    <a
      href={`tel:${numero.replace(/\s/g, "")}`}
      aria-label={`${titre} : ${numero} — ${t.appeler}`}
      onTouchStart={() => (maintien.current = window.setTimeout(copier, 500))}
      onTouchEnd={() => maintien.current && clearTimeout(maintien.current)}
      onTouchMove={() => maintien.current && clearTimeout(maintien.current)}
      onContextMenu={(ev) => {
        ev.preventDefault();
        copier();
      }}
      className="relative flex w-full items-center gap-3.5 py-4 text-left transition active:opacity-70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-primary">
        <Phone className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">{titre}</span>
        <span className="block truncate text-sm font-semibold text-bleu">{numero}</span>
      </span>
      {copie && (
        <span role="status" className="absolute right-0 rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white shadow-flottant">
          {t.numeroCopie}
        </span>
      )}
    </a>
  );
}

/* ---------- Répartition des notes ---------- */
function Repartition({ avis }: { avis: { note: number }[] }) {
  const compte = [0, 0, 0, 0, 0];
  for (const a of avis) compte[Math.min(4, Math.max(0, Math.round(a.note) - 1))]++;
  const max = Math.max(1, ...compte);
  return (
    <div className="mt-2 space-y-1">
      {[5, 4, 3, 2, 1].map((n) => (
        <div key={n} className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="w-2 font-bold">{n}</span>
          <Star className="size-2.5 fill-or text-or" aria-hidden />
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-or" style={{ width: `${(compte[n - 1] / max) * 100}%` }} />
          </span>
          <span className="w-4 text-right">{compte[n - 1]}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Visionneuse photos ---------- */
function VisionneusePhotos({ e, depart, onFermer }: { e: Etablissement; depart: number; onFermer: () => void }) {
  const { langue, t } = useLangue();
  const galerie = galerieDe(langue);
  const [index, setIndex] = useState(depart);
  const [zoom, setZoom] = useState(1);
  const pince = useRef<{ d: number; z: number } | null>(null);
  const debutY = useRef<number | null>(null);
  const contRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contRef.current?.scrollTo({ left: depart * contRef.current.clientWidth });
    const ev = (k: KeyboardEvent) => k.key === "Escape" && onFermer();
    document.addEventListener("keydown", ev);
    return () => document.removeEventListener("keydown", ev);
  }, [depart, onFermer]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={fmt(t.photosDe, { n: e.nom })}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <p className="text-sm font-bold">
          {index + 1} / {galerie.length}
        </p>
        <button type="button" onClick={onFermer} aria-label={t.fermer} className="grid size-10 place-items-center rounded-full bg-white/10 transition active:scale-90">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div
        ref={contRef}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(ev) => {
          const el = ev.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
          setZoom(1);
        }}
        onTouchStart={(ev) => {
          if (ev.touches.length === 2) {
            const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
            pince.current = { d, z: zoom };
          } else debutY.current = ev.touches[0].clientY;
        }}
        onTouchMove={(ev) => {
          if (ev.touches.length === 2 && pince.current) {
            const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
            setZoom(Math.min(3, Math.max(1, pince.current.z * (d / pince.current.d))));
          }
        }}
        onTouchEnd={(ev) => {
          pince.current = null;
          if (debutY.current !== null && ev.changedTouches[0].clientY - debutY.current > 90) onFermer();
          debutY.current = null;
        }}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
      >
        {galerie.map((label) => (
          <div key={label} className="grid h-full w-full shrink-0 snap-start place-items-center overflow-hidden">
            <div className="size-full transition-transform duration-150" style={{ transform: `scale(${zoom})` }}>
              <PhotoPlaceholder secteur={e.secteur} label={label} className="size-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 pb-6" aria-hidden>
        {galerie.map((_, i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i === index ? "w-3.5 bg-white" : "bg-white/40")} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Visionneuse 3D plein écran ---------- */
function Visionneuse3D({ lien, nom, onFermer }: { lien: string; nom: string; onFermer: () => void }) {
  const { t } = useLangue();
  const analyse = analyserLien3D(lien);
  if ("erreur" in analyse) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={`${t.visite3d} — ${nom}`}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-white">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Rotate3d className="size-4" aria-hidden /> {t.visite3d}
        </p>
        <button type="button" onClick={onFermer} aria-label={t.fermer} className="grid size-10 place-items-center rounded-full bg-white/10 transition active:scale-90">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <p className="px-4 pb-2 text-center text-xs text-white/60">{t.glisserExplorer}</p>
      <iframe
        src={analyse.url}
        title={`${t.visite3d} — ${nom}`}
        className="flex-1 border-0"
        allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-fullscreen"
      />
      <p className="px-4 py-3 text-center text-[11px] text-white/50">{fmt(t.visiteFournie, { n: analyse.fournisseur })}</p>
    </div>
  );
}
