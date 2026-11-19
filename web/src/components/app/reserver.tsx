"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  Image as ImageIcon,
  List,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { type Etablissement, type Secteur, noteMoyenne } from "@/lib/data";
import { CLES } from "@/lib/espace";
import { formatFCFA } from "@/lib/facture-pdf";
import { distanceKm, formatDate, formatScore, itineraire } from "@/lib/format";
import { fichierIcs } from "@/lib/ics";
import {
  type Demande,
  type Reservation,
  actives,
  ajouterJoursDate,
  disponibilitesHotel,
  disponibilitesRestaurant,
  disponibilitesSante,
  nuits,
} from "@/lib/reservation";
import { useCatalogue } from "@/components/catalogue";
import { fmt, tv, type CleAppFn, type CleStr } from "@/lib/langue";
import { useLangue } from "@/components/langue";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { useHorloge } from "@/lib/use-config";
import { Modal } from "@/components/modal";
import { PhotoPlaceholder, Stars } from "@/components/ui";
import { useCompteClient } from "@/components/avis/use-avis";
import { useReservations } from "@/components/reservation/use-reservations";
import { useFavoris } from "@/components/app/favoris";

const GALERIE_TOTAL = 15; // même galerie simulée que la fiche
const dateLongue = (date: string, locale = "fr-FR") =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(/^./, (c) => c.toUpperCase());

/** Libellés de l'écran Réservation par secteur — remplace reserver-config.ts (français fixe). */
const TITRE_SECTEUR: Record<Secteur, CleStr> = {
  restauration: "resaTitreTable",
  hotellerie: "resaTitreChambre",
  sante: "resaTitreRdv",
  services: "resaTitreRdv",
  education: "resaTitreGenerique",
  commerce: "resaTitreGenerique",
  transport: "resaTitreGenerique",
};
const OFFRE_SECTEUR: Record<Secteur, CleStr> = {
  restauration: "offreMenu",
  hotellerie: "offreChambres",
  sante: "offrePraticiens",
  services: "offreServices",
  education: "offreGenerique",
  commerce: "offreGenerique",
  transport: "offreGenerique",
};
const PERS_SECTEUR: Record<Secteur, CleStr> = {
  restauration: "nbPersonnesTitre",
  hotellerie: "chambreVoyageurs",
  sante: "specialiteTitre",
  services: "nbPersonnesTitre",
  education: "nbPersonnesTitre",
  commerce: "nbPersonnesTitre",
  transport: "nbPersonnesTitre",
};
const UNITE_SECTEUR: Record<Secteur, CleAppFn> = {
  restauration: "nbCouverts",
  hotellerie: "voyageursNb",
  sante: "nbPersonnes",
  services: "nbPersonnes",
  education: "nbPersonnes",
  commerce: "nbPersonnes",
  transport: "nbPersonnes",
};
const ICONES_ONGLETS: Partial<Record<Secteur, typeof UtensilsCrossed>> = {
  restauration: UtensilsCrossed,
  hotellerie: BedDouble,
  sante: Stethoscope,
};

type Panneau = "date" | "depart" | "heure" | "personnes" | "chambre" | "specialite" | "confirmation" | "annuler" | null;

export function Reserver({ e }: { e: Etablissement }) {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useLangue();
  const { aujourdhui } = useHorloge();
  const { compte, charge: compteCharge } = useCompteClient();
  const { reservations, config, creer, changer, charge } = useReservations(e.slug, e.nom, e.secteur);
  const { estFavori, toggle, charge: favCharge } = useFavoris();
  const [, setToutes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);

  const premium = e.pack === "premium";
  const moyenne = noteMoyenne(e.avis);
  const modifId = params.get("modifier");
  const modification = modifId ? (reservations.find((r) => r.id === modifId) ?? null) : null;

  /* ---------- Brouillon de session ---------- */
  const cleDraft = `resa-draft-${e.slug}`;
  const [date, setDate] = useState("");
  const [depart, setDepart] = useState("");
  const [heure, setHeure] = useState("");
  const [adultes, setAdultes] = useState(2);
  const [enfants, setEnfants] = useState(0);
  const [voyageurs, setVoyageurs] = useState(2);
  const [chambreId, setChambreId] = useState("");
  const [praticienId, setPraticienId] = useState("");
  const [brouillonPret, setBrouillonPret] = useState(false);

  const [onglet, setOnglet] = useState<"presentation" | "offre" | "avis" | "reservation">("reservation");
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [mois, setMois] = useState(0);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [eclat, setEclat] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreurResa, setErreurResa] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Reservation | null>(null);
  const [statutLive, setStatutLive] = useState<Reservation["statut"] | null>(null);
  const [rebours, setRebours] = useState(120);

  /* ---------- Restauration du brouillon / préremplissage ---------- */
  useEffect(() => {
    if (!charge || brouillonPret) return;
    const t = window.setTimeout(() => {
      if (modification) {
        setDate(modification.date ?? modification.arrivee ?? "");
        setDepart(modification.depart ?? "");
        setHeure(modification.heure ?? "");
        setAdultes(modification.couverts ?? 2);
        setVoyageurs(modification.voyageurs ?? 2);
        setChambreId(modification.chambreId ?? "");
        setPraticienId(modification.praticienId ?? "");
      } else {
        const brut = sessionStorage.getItem(cleDraft);
        if (brut) {
          try {
            const d = JSON.parse(brut) as { date?: string; depart?: string; heure?: string; adultes?: number; enfants?: number; voyageurs?: number; chambreId?: string; praticienId?: string };
            setDate(d.date ?? "");
            setDepart(d.depart ?? "");
            setHeure(d.heure ?? "");
            setAdultes(d.adultes ?? 2);
            setEnfants(d.enfants ?? 0);
            setVoyageurs(d.voyageurs ?? 2);
            setChambreId(d.chambreId ?? "");
            setPraticienId(d.praticienId ?? "");
          } catch {
            /* brouillon illisible : valeurs par défaut */
          }
        }
      }
      setBrouillonPret(true);
    }, 0);
    return () => clearTimeout(t);
  }, [charge, brouillonPret, modification, cleDraft]);

  useEffect(() => {
    if (!brouillonPret || modification) return;
    sessionStorage.setItem(cleDraft, JSON.stringify({ date, depart, heure, adultes, enfants, voyageurs, chambreId, praticienId }));
  }, [brouillonPret, modification, cleDraft, date, depart, heure, adultes, enfants, voyageurs, chambreId, praticienId]);

  /* ---------- Géolocalisation silencieuse ---------- */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const maintenant = aujourdhui ?? "";
  const jour = maintenant.slice(0, 10);
  const distance = position ? distanceKm(position, e.coords) : null;
  const favori = favCharge && estFavori(e.slug);

  /* ---------- Défauts intelligents : prochain créneau disponible ---------- */
  const premierCreneau = (() => {
    if (!charge || !jour) return null;
    for (let i = 0; i <= 14; i++) {
      const d = ajouterJoursDate(jour, i);
      const dispo = e.secteur === "sante"
        ? disponibilitesSante(config, praticienId || config.sante.praticiens[0]?.id || "", d, reservations, maintenant).filter((c) => c.libre)
        : disponibilitesRestaurant(config, d, reservations, maintenant).filter((c) => c.restants >= adultes + enfants);
      if (dispo.length) return { date: d, heure: dispo[0].heure };
    }
    return null;
  })();

  useEffect(() => {
    if (!brouillonPret || date || !premierCreneau) return;
    const t = window.setTimeout(() => {
      setDate((d) => d || premierCreneau.date);
      if (e.secteur === "hotellerie") setDepart((d) => d || ajouterJoursDate(premierCreneau.date, 2));
      else setHeure((h) => h || premierCreneau.heure);
      if (e.secteur === "sante" && !praticienId) setPraticienId(config.sante.praticiens[0]?.id ?? "");
      if (e.secteur === "hotellerie" && !chambreId) setChambreId(config.hotel.chambres[0]?.id ?? "");
    }, 0);
    return () => clearTimeout(t);
  }, [brouillonPret, date, premierCreneau, e.secteur, praticienId, chambreId, config]);

  /* ---------- Disponibilités ---------- */
  const creneauxJour = useMemo(() => {
    if (!date || e.secteur === "hotellerie") return [];
    return e.secteur === "sante"
      ? disponibilitesSante(config, praticienId, date, reservations, maintenant).map((c) => ({ service: t.creneaux, heure: c.heure, ok: c.libre }))
      : disponibilitesRestaurant(config, date, reservations, maintenant).map((c) => ({ service: c.service, heure: c.heure, ok: c.restants >= adultes + enfants }));
  }, [date, e.secteur, config, praticienId, reservations, maintenant, adultes, enfants, t]);

  const dispoHotel = useMemo(
    () => (e.secteur === "hotellerie" && date && depart ? disponibilitesHotel(config, date, depart, reservations) : []),
    [e.secteur, config, date, depart, reservations],
  );

  /** Jours où une réservation est impossible (calendrier). */
  const joursComplets = (() => {
    const indispo = new Set<string>();
    if (!jour || e.secteur === "hotellerie") return indispo;
    for (let i = 0; i <= config.horizonJours; i++) {
      const d = ajouterJoursDate(jour, i);
      const libres =
        e.secteur === "sante"
          ? disponibilitesSante(config, praticienId || config.sante.praticiens[0]?.id || "", d, reservations, maintenant).some((c) => c.libre)
          : disponibilitesRestaurant(config, d, reservations, maintenant).some((c) => c.restants > 0);
      if (!libres) indispo.add(d);
    }
    return indispo;
  })();

  const texteEnfants = enfants > 0 ? ` · ${tv(t.enfantNb, enfants)}` : "";
  const personnesTexte = `${tv(t.adulteNb, adultes)}${texteEnfants}`;
  const chambreChoisie = config.hotel.chambres.find((c) => c.id === chambreId);
  const praticienChoisi = config.sante.praticiens.find((p) => p.id === praticienId);
  const acompte = config.acompteRequis ?? 0;

  const pret =
    e.secteur === "hotellerie"
      ? !!date && !!depart && nuits(date, depart) >= 1 && !!chambreId && voyageurs >= 1
      : e.secteur === "sante"
        ? !!date && !!heure && !!praticienId
        : !!date && !!heure && adultes + enfants >= 1;

  /* ---------- Confirmation ---------- */
  const demande: Omit<Demande, "client"> =
    e.secteur === "hotellerie"
      ? { arrivee: date, depart, chambreId, nbChambres: 1, voyageurs }
      : e.secteur === "sante"
        ? { date, heure, praticienId }
        : { date, heure, couverts: adultes + enfants };

  const enregistrerModification = () => {
    setToutes((p) => ({
      ...p,
      [e.slug]: (p?.[e.slug] ?? []).map((r) => (r.id === modifId ? { ...r, ...demande, client: r.client } : r)),
    }));
    sessionStorage.removeItem(cleDraft);
    setResultat({ ...(modification as Reservation), ...demande, client: modification!.client });
    setStatutLive(modification!.statut);
  };

  const confirmer = () => {
    navigator.vibrate?.(15);
    if (!compte) {
      router.push(`/connexion?suivant=${encodeURIComponent(`/reserver/${e.slug}`)}`);
      return;
    }
    if (modification) {
      enregistrerModification();
      return;
    }
    // Anti-doublon : même établissement, même créneau, même usager.
    const tel = compte.telephone.replace(/\D/g, "").slice(-8);
    const doublon = actives(reservations).some(
      (r) =>
        r.client.telephone.replace(/\D/g, "").slice(-8) === tel &&
        (e.secteur === "hotellerie" ? r.arrivee === date && r.depart === depart : r.date === date && r.heure === heure),
    );
    if (doublon) return setErreurResa(t.dejaUneResa);
    if (acompte > 0) {
      // Étape de paiement (Orange Money, MTN MoMo, Wave, carte) — à implémenter avant activation de acompteRequis.
    }
    setErreurResa(null);
    setEnvoi(true);
    window.setTimeout(() => {
      const res = creer({ ...demande, client: { nom: compte.nom, telephone: compte.telephone, email: compte.email } });
      setEnvoi(false);
      if ("erreur" in res && res.erreur) return setErreurResa(res.erreur);
      if ("reservation" in res && res.reservation) {
        sessionStorage.removeItem(cleDraft);
        setResultat(res.reservation);
        setStatutLive(res.reservation.statut);
      }
    }, 700);
  };

  /* ---------- Compte à rebours + confirmation simulée en direct ---------- */
  useEffect(() => {
    if (!resultat || resultat.statut !== "en_attente" || statutLive !== "en_attente") return;
    const t = window.setInterval(() => setRebours((s) => Math.max(0, s - 1)), 1000);
    const confirm = window.setTimeout(() => {
      changer(resultat.id, "confirmee");
      setStatutLive("confirmee");
    }, 15000); // démo : la confirmation arrive vite pour la présentation
    return () => {
      clearInterval(t);
      clearTimeout(confirm);
    };
  }, [resultat, statutLive, changer]);

  const creneauxProches = useMemo(() => {
    if (!erreurResa || e.secteur === "hotellerie") return [];
    const base = heure ? Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3)) : 19 * 60;
    return creneauxJour
      .filter((c) => c.ok && c.heure !== heure)
      .sort((a, b) => Math.abs(Number(a.heure.slice(0, 2)) * 60 + Number(a.heure.slice(3)) - base) - Math.abs(Number(b.heure.slice(0, 2)) * 60 + Number(b.heure.slice(3)) - base))
      .slice(0, 3);
  }, [erreurResa, creneauxJour, heure, e.secteur]);

  /* ---------- Téléchargement .ics ---------- */
  const telechargerIcs = () => {
    if (!resultat) return;
    const blob = new Blob([fichierIcs(resultat, e.nom, e.adresse)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservation-${resultat.reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!charge || !compteCharge) return <SqueletteReserver />;

  /* ---------- Écran : réservation impossible (non Premium) ---------- */
  if (!premium)
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface text-muted">
          <CalendarDays className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-xl font-extrabold text-ink">{t.resaIndispo}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">{fmt(t.resaIndispoTexte, { n: e.nom })}</p>
        <a href={`tel:${e.telephone.replace(/\s/g, "")}`} className="btn-hero mt-6 w-full max-w-xs">
          <Phone className="size-5" aria-hidden /> {t.appelerEtab}
        </a>
        <Link href={`/etablissements/${e.slug}`} className="mt-4 text-sm font-bold text-bleu">
          {t.retourFiche}
        </Link>
      </div>
    );

  /* ---------- Écran : succès ---------- */
  if (resultat) {
    const confirmee = statutLive === "confirmee";
    const pers =
      e.secteur === "hotellerie"
        ? `${resultat.nbChambres ?? 1} × ${chambreChoisie?.nom ?? t.chambreDefaut} · ${tv(t.voyageursNb, resultat.voyageurs ?? 1)}`
        : e.secteur === "sante"
          ? praticienChoisi?.specialite ?? t.consultation
          : tv(t[UNITE_SECTEUR[e.secteur]], resultat.couverts ?? adultes + enfants);
    return (
      <div className="relative flex min-h-[85dvh] flex-col items-center overflow-hidden px-6 pt-10 pb-28 text-center">
        {/* Confettis bleus et verts */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 9) * 0.18}s`,
                background: i % 3 === 0 ? "#16A34A" : i % 3 === 1 ? "#1E3A8A" : "#22C55E",
              }}
            />
          ))}
        </div>
        <span className="grid size-20 place-items-center rounded-full bg-success-soft">
          <svg viewBox="0 0 52 52" className="size-14">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#16A34A" strokeWidth="3" className="cercle-succes" />
            <path d="M15 27l8 8 15-16" fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="coche-succes" />
          </svg>
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
          {modification ? t.modifsEnregistrees : confirmee ? t.notifConfirmee : t.demandeEnvoyee}
        </h1>
        {!confirmee && !modification && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-muted" aria-live="polite">
            <Clock className="size-4" aria-hidden /> {fmt(t.reponseAttendue, { n: `${Math.floor(rebours / 60)}:${String(rebours % 60).padStart(2, "0")}` })}
          </p>
        )}
        {confirmee && !modification && <p className="mt-1.5 text-sm font-semibold text-success">{t.confirmationRecue}</p>}

        <div className="mt-6 w-full max-w-sm rounded-3xl border border-line bg-white p-5 text-left shadow-card">
          <p className="font-display font-bold text-ink">{e.nom}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-muted">{t.dateLabel}</span>
              <span className="font-semibold text-ink">{e.secteur === "hotellerie" ? `${dateLongue(resultat.arrivee!, locale)} → ${dateLongue(resultat.depart!, locale)}` : dateLongue(resultat.date!, locale)}</span>
            </li>
            {resultat.heure && (
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t.heureLabel}</span>
                <span className="font-semibold text-ink">{resultat.heure}</span>
              </li>
            )}
            <li className="flex justify-between gap-3">
              <span className="text-muted">{t.personnesLabel}</span>
              <span className="font-semibold text-ink">{pers}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted">{t.reservationLabel}</span>
              <span className="font-mono text-xs font-bold text-primary">{resultat.reference}</span>
            </li>
          </ul>
        </div>

        <Link href="/reservations" className="btn-hero mt-7 w-full max-w-sm">
          {t.voirMesResas}
        </Link>
        <div className="mt-3 grid w-full max-w-sm grid-cols-2 gap-3">
          <button type="button" onClick={telechargerIcs} className="btn border border-line bg-white py-3 text-sm font-bold text-ink">
            <CalendarDays className="size-4.5 text-primary" aria-hidden /> {t.ajouterCalendrier}
          </button>
          <a href={itineraire(e.coords)} target="_blank" rel="noopener noreferrer" className="btn border border-line bg-white py-3 text-sm font-bold text-ink">
            <Navigation className="size-4.5 text-bleu" aria-hidden /> {t.itineraire}
          </a>
        </div>
      </div>
    );
  }

  const onglets = [
    { id: "presentation" as const, label: t.presentation, Icon: FileText },
    { id: "offre" as const, label: t[OFFRE_SECTEUR[e.secteur]], Icon: ICONES_ONGLETS[e.secteur] ?? List },
    { id: "avis" as const, label: t.avis, Icon: Star },
    { id: "reservation" as const, label: t.reservationsNav, Icon: CalendarDays },
  ];

  return (
    <div className="pb-28">
      {/* ---------- En-tête ---------- */}
      <header className="flex items-center justify-between px-5 pt-4">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(`/etablissements/${e.slug}`))}
          aria-label={t.retour}
          className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="flex min-w-0 items-center gap-1.5 font-display text-lg font-extrabold text-primary">
          <span className="truncate">{e.nom}</span>
          <BadgeCheck className="size-5 shrink-0 text-bleu" aria-hidden />
        </h1>
        <button
          type="button"
          onClick={() => {
            toggle(e.slug);
            if (!favori) setEclat((x) => x + 1);
          }}
          aria-label={favori ? t.retirerFavoris : t.ajouterFavoris}
          aria-pressed={favori}
          className="relative grid size-10 place-items-center rounded-full text-ink transition active:scale-90"
        >
          {eclat > 0 && (
            <span key={eclat} className="pointer-events-none absolute inset-0" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} className="eclat" style={{ transform: `rotate(${i * 45}deg) translateY(-20px)` }} />
              ))}
            </span>
          )}
          <Heart key={`c${eclat}`} className={cn("size-5.5", favori ? "fill-danger text-danger fav-pop" : "text-ink/60")} aria-hidden />
        </button>
      </header>

      {/* ---------- Carte récapitulative ---------- */}
      <div className="mx-5 mt-3 flex items-center gap-3.5 rounded-3xl border border-white/60 bg-white/80 p-3.5 shadow-card backdrop-blur">
        <div className="relative size-[5.5rem] shrink-0 overflow-hidden rounded-2xl">
          <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-lg bg-ink/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            <ImageIcon className="size-3" aria-hidden /> +{GALERIE_TOTAL - 3}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display font-bold text-ink">
            {e.nom} <BadgeCheck className="size-4 shrink-0 text-bleu" aria-hidden />
          </p>
          <p className="truncate text-xs text-muted">
            {e.sousType} · {e.ville} {e.commune}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-or text-or" aria-hidden />
            <span className="font-bold text-ink">{moyenne > 0 ? formatScore(moyenne, locale) : "—"}</span>
            <span className="font-semibold text-bleu">({tv(t.avisNb, e.avis.length)})</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {distance !== null && (
              <span className="chip border border-line bg-white text-[11px] font-semibold text-muted">
                <MapPin className="size-3 text-primary" aria-hidden /> {distance.toLocaleString(locale, { maximumFractionDigits: 1 })} km
              </span>
            )}
            <a href={`tel:${e.telephone.replace(/\s/g, "")}`} className="chip border border-line bg-white text-[11px] font-semibold text-muted transition active:scale-95" aria-label={fmt(t.appelerNom, { n: e.nom })}>
              <Phone className="size-3 text-success" aria-hidden /> {e.telephone}
            </a>
          </div>
        </div>
      </div>

      {/* ---------- Onglets ---------- */}
      <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto px-5" role="tablist" aria-label={t.sectionsAria}>
        {onglets.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={onglet === id}
            onClick={() => setOnglet(id)}
            className={cn(
              "relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-bold transition active:scale-95",
              onglet === id ? "bg-success text-white shadow-card" : "text-bleu",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
            <span className={cn("absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-success transition-all", onglet === id ? "scale-x-100" : "scale-x-0")} aria-hidden />
          </button>
        ))}
      </div>

      {/* ---------- Contenu des onglets ---------- */}
      <div className="px-5">
        {onglet === "presentation" && (
          <section className="mt-4 rounded-3xl border border-line bg-white p-5 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink">{t.aPropos}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{e.description}</p>
            <p className="mt-3 text-sm font-semibold text-ink">{e.prix}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {e.services.map((s) => (
                <li key={s} className="chip bg-surface text-xs text-ink">
                  {s}
                </li>
              ))}
            </ul>
            <Link href={`/etablissements/${e.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-bleu">
              {t.voirFicheComplete} <ChevronRight className="size-4" aria-hidden />
            </Link>
          </section>
        )}

        {onglet === "offre" && <OngletOffre e={e} config={config} />}

        {onglet === "avis" && (
          <section className="mt-4 space-y-4">
            {e.avis.length > 0 ? (
              <>
                <div className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4 shadow-card">
                  <p className="font-display text-4xl font-bold text-ink">{formatScore(moyenne, locale)}</p>
                  <div>
                    <Stars value={moyenne} size="md" />
                    <p className="mt-1 text-xs text-muted">{fmt(t.avisClientsVerifies, { n: e.avis.length })}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {e.avis.slice(-3).map((a) => (
                    <li key={a.auteur + a.date} className="rounded-2xl border border-line bg-white p-4">
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
                <Link href={`/etablissements/${e.slug}#avis`} className="flex items-center justify-center gap-1.5 rounded-2xl border border-line py-3 text-sm font-bold text-bleu">
                  {t.voirTousAvis}
                </Link>
              </>
            ) : (
              <p className="rounded-3xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">{t.aucunAvis}</p>
            )}
          </section>
        )}

        {onglet === "reservation" && (
          <div className="mt-4 space-y-4">
            {/* ---------- Carte réservation ---------- */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <CalendarDays className="size-5.5 text-ink" aria-hidden /> {modification ? t.modifierResa : t[TITRE_SECTEUR[e.secteur]]}
              </h2>
              <p className="mt-1 text-sm text-muted">{fmt(t.resaSousTitre, { n: e.nom })}</p>

              <div className="mt-4 space-y-3">
                <Champ
                  Icon={CalendarDays}
                  label={e.secteur === "hotellerie" ? t.dateArrivee : t.dateLabel}
                  valeur={date ? dateLongue(date, locale) : t.choisirDate}
                  vide={!date}
                  onClick={() => setPanneau("date")}
                />
                {e.secteur === "hotellerie" ? (
                  <Champ Icon={CalendarDays} label={t.dateDepart} valeur={depart ? dateLongue(depart, locale) : t.choisirDate} vide={!depart} onClick={() => setPanneau("depart")} />
                ) : (
                  <Champ Icon={Clock} label={t.heureLabel} valeur={heure || t.choisirHeure} vide={!heure} onClick={() => (date ? setPanneau("heure") : setPanneau("date"))} />
                )}
                {e.secteur === "hotellerie" ? (
                  <Champ
                    Icon={BedDouble}
                    label={t[PERS_SECTEUR[e.secteur]]}
                    valeur={chambreChoisie ? `${chambreChoisie.nom} · ${tv(t.voyageursNb, voyageurs)}` : t.choisirChambre}
                    vide={!chambreId}
                    onClick={() => setPanneau("chambre")}
                  />
                ) : e.secteur === "sante" ? (
                  <Champ
                    Icon={Stethoscope}
                    label={t[PERS_SECTEUR[e.secteur]]}
                    valeur={praticienChoisi ? `${praticienChoisi.specialite} — ${praticienChoisi.nom}` : t.choisirSpecialite}
                    vide={!praticienId}
                    onClick={() => setPanneau("specialite")}
                  />
                ) : (
                  <Champ Icon={Users} label={t[PERS_SECTEUR[e.secteur]]} valeur={personnesTexte} onClick={() => setPanneau("personnes")} />
                )}
              </div>

              {erreurResa && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5" role="alert">
                  <p className="text-sm font-semibold text-red-700">{erreurResa}</p>
                  {creneauxProches.length > 0 && (
                    <div className="mt-2.5 flex gap-2">
                      {creneauxProches.map((c) => (
                        <button
                          key={c.heure}
                          type="button"
                          onClick={() => {
                            setHeure(c.heure);
                            setErreurResa(null);
                          }}
                          className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-ink transition active:scale-95"
                        >
                          {c.heure}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={!pret || envoi}
                onClick={confirmer}
                className="btn btn-success mt-5 w-full rounded-2xl py-4 font-display text-base font-bold disabled:opacity-50"
                style={{ backgroundImage: "linear-gradient(135deg,#16A34A,#22C55E)" }}
              >
                {envoi ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> {t.confirmationEnCours}
                  </>
                ) : (
                  <>
                    <CalendarDays className="size-5" aria-hidden /> {modification ? t.enregistrerModifs : t.confirmerResa}
                  </>
                )}
              </button>

              {modification && (
                <button type="button" onClick={() => setPanneau("annuler")} className="mt-3 w-full text-center text-sm font-bold text-red-600">
                  {t.annulerLaResa}
                </button>
              )}
            </section>

            {/* ---------- Bloc Confirmation ---------- */}
            <button
              type="button"
              onClick={() => setPanneau("confirmation")}
              className="flex w-full items-center gap-3.5 rounded-3xl bg-primary-soft p-4 text-left transition active:scale-[0.98]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                <ShieldCheck className="size-5.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{t.confirmationBloc}</span>
                <span className="block text-xs leading-snug text-ink/70">
                  {config.autoConfirmation ? t.confImmediate : t.conf2min} {t.confSmsApp}
                  {acompte > 0 ? ` ${t.paiementSecurise}` : ""}
                </span>
              </span>
              <ChevronRight className="size-4.5 shrink-0 text-primary" aria-hidden />
            </button>

            {/* ---------- Recommandés près de vous ---------- */}
            <Recommandes e={e} position={position} locale={locale} />
          </div>
        )}
      </div>

      {/* ---------- Panneaux ---------- */}
      <Modal open={panneau === "date"} onClose={() => setPanneau(null)} title={e.secteur === "hotellerie" ? t.dateArrivee : t.dateLabel}>
        <Calendrier
          min={jour}
          max={ajouterJoursDate(jour, config.horizonJours)}
          indisponibles={joursComplets}
          valeur={date}
          mois={mois}
          onMois={setMois}
          onChoix={(d) => {
            setDate(d);
            setErreurResa(null);
            if (e.secteur === "hotellerie" && (!depart || depart <= d)) setDepart(ajouterJoursDate(d, 1));
            setPanneau(e.secteur === "hotellerie" ? "depart" : "heure");
          }}
        />
      </Modal>

      <Modal open={panneau === "depart"} onClose={() => setPanneau(null)} title={t.dateDepart}>
        <Calendrier
          min={date ? ajouterJoursDate(date, 1) : ajouterJoursDate(jour, 1)}
          max={ajouterJoursDate(jour, config.horizonJours)}
          indisponibles={new Set()}
          valeur={depart}
          mois={mois}
          onMois={setMois}
          onChoix={(d) => {
            setDepart(d);
            setPanneau(null);
          }}
        />
      </Modal>

      <Modal open={panneau === "heure"} onClose={() => setPanneau(null)} title={date ? fmt(t.creneauxDu, { n: dateLongue(date, locale) }) : t.heureLabel}>
        {creneauxJour.length === 0 ? (
          <p className="rounded-2xl bg-surface p-4 pb-2 text-center text-sm text-muted">{t.aucunCreneau}</p>
        ) : (
          <div className="space-y-4 pb-2">
            {Object.entries(creneauxJour.reduce<Record<string, typeof creneauxJour>>((acc, c) => ((acc[c.service] ??= []).push(c), acc), {})).map(([service, liste]) => (
              <div key={service}>
                <p className="label flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden /> {service}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {liste.map((c) => (
                    <button
                      key={c.heure}
                      type="button"
                      disabled={!c.ok}
                      onClick={() => {
                        setHeure(c.heure);
                        setErreurResa(null);
                        setPanneau(null);
                      }}
                      aria-pressed={heure === c.heure}
                      className={cn(
                        "rounded-xl border px-1 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-35",
                        heure === c.heure ? "border-success bg-success text-white" : "border-line text-ink",
                      )}
                    >
                      {c.heure}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={panneau === "personnes"} onClose={() => setPanneau(null)} title={t.nbPersonnesTitre}>
        <div className="space-y-4 pb-2">
          <Compteur label={t.adultes} valeur={adultes} min={1} max={config.restaurant.maxCouverts} onChange={setAdultes} />
          <Compteur label={t.enfants} valeur={enfants} min={0} max={Math.max(0, config.restaurant.maxCouverts - adultes)} onChange={setEnfants} />
          <p className="rounded-xl bg-surface p-3 text-center text-sm font-semibold text-ink">{personnesTexte}</p>
          <button type="button" onClick={() => setPanneau(null)} className="btn btn-success w-full py-3">
            {t.valider}
          </button>
        </div>
      </Modal>

      <Modal open={panneau === "chambre"} onClose={() => setPanneau(null)} title={t.chambreVoyageurs}>
        <div className="space-y-3 pb-2">
          {dispoHotel.map(({ chambre, restantes, totalParChambre, nuits: n }) => (
            <button
              key={chambre.id}
              type="button"
              disabled={restantes === 0 || chambre.capacite < voyageurs}
              onClick={() => setChambreId(chambre.id)}
              aria-pressed={chambreId === chambre.id}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition disabled:opacity-40",
                chambreId === chambre.id ? "border-success bg-success-soft" : "border-line",
              )}
            >
              <span>
                <span className="block text-sm font-bold text-ink">{chambre.nom}</span>
                <span className="block text-xs text-muted">
                  {fmt(t.persMax, { n: chambre.capacite })} · {formatFCFA(chambre.prix)} {t.parNuit} · {restantes ? (restantes <= 3 ? fmt(t.plusQue, { n: restantes }) : t.disponible) : t.complet}
                </span>
              </span>
              <span className="text-right text-sm font-bold text-ink">
                {formatFCFA(totalParChambre)}
                <span className="block text-[11px] font-normal text-muted">{tv(t.nuites, n)}</span>
              </span>
            </button>
          ))}
          <Compteur label={t.voyageurs} valeur={voyageurs} min={1} max={6} onChange={setVoyageurs} />
          <button type="button" onClick={() => setPanneau(null)} className="btn btn-success w-full py-3">
            {t.valider}
          </button>
        </div>
      </Modal>

      <Modal open={panneau === "specialite"} onClose={() => setPanneau(null)} title={t.specialiteTitre}>
        <div className="space-y-2 pb-2">
          {config.sante.praticiens.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPraticienId(p.id);
                setHeure("");
                setPanneau(null);
              }}
              aria-pressed={praticienId === p.id}
              className={cn("w-full rounded-2xl border-2 p-3.5 text-left transition", praticienId === p.id ? "border-success bg-success-soft" : "border-line")}
            >
              <span className="block text-sm font-bold text-ink">{p.specialite}</span>
              <span className="block text-xs text-muted">
                {p.nom} · {p.debut} – {p.fin}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={panneau === "confirmation"} onClose={() => setPanneau(null)} title={t.confResaTitre}>
        <div className="space-y-3 pb-2 text-sm leading-relaxed text-ink/85">
          <p>
            <strong className="text-ink">{t.delaiLabel}</strong> {config.autoConfirmation ? t.confimmediatDetail : t.conf2minDetail} {t.notifSmsConfirm}
          </p>
          <p>
            <strong className="text-ink">{t.annulationLabel}</strong> {fmt(t.annulationGratuite, { n: config.delaiMinHeures })}
          </p>
          <p>
            <strong className="text-ink">{t.modificationLabel}</strong> {t.modificationDetail}
          </p>
          <p className="text-xs text-muted">{t.rappel2h} {acompte > 0 ? t.acompteDemande : t.resaGratuite}</p>
        </div>
      </Modal>

      <Modal open={panneau === "annuler"} onClose={() => setPanneau(null)} title={t.annulerLaResa}>
        <div className="space-y-4 pb-2">
          <p className="text-sm text-ink/85">
            {t.annulerLaResa} <strong className="text-ink">{modification?.reference}</strong> ? {fmt(t.annulerGratuite, { n: config.delaiMinHeures })}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPanneau(null)} className="btn btn-outline flex-1 py-3">
              {t.garder}
            </button>
            <button
              type="button"
              onClick={() => {
                if (modifId) changer(modifId, "annulee");
                router.push("/reservations");
              }}
              className="btn flex-1 bg-danger py-3 font-bold text-white"
            >
              {t.confirmerAnnulation}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Champ ligne arrondie ---------- */
function Champ({ Icon, label, valeur, vide, onClick }: { Icon: typeof CalendarDays; label: string; valeur: string; vide?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} : ${valeur}`}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      <Icon className="size-5.5 shrink-0 text-ink/60" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-muted">{label}</span>
        <span className={cn("block truncate text-[15px] font-bold", vide ? "text-muted" : "text-ink")}>{valeur}</span>
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-muted" aria-hidden />
    </button>
  );
}

/* ---------- Compteur +/- ---------- */
function Compteur({ label, valeur, min, max, onChange }: { label: string; valeur: number; min: number; max: number; onChange: (n: number) => void }) {
  const { t } = useLangue();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-2.5">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="flex items-center gap-3">
        <button type="button" aria-label={fmt(t.diminuerQte, { n: label })} disabled={valeur <= min} onClick={() => onChange(valeur - 1)} className="grid size-11 place-items-center rounded-full border border-line text-ink transition active:scale-90 disabled:opacity-30">
          <Minus className="size-4.5" aria-hidden />
        </button>
        <span className="w-6 text-center font-display text-lg font-bold text-ink" aria-live="polite">
          {valeur}
        </span>
        <button type="button" aria-label={fmt(t.augmenterQte, { n: label })} disabled={valeur >= max} onClick={() => onChange(valeur + 1)} className="grid size-11 place-items-center rounded-full bg-success text-white transition active:scale-90 disabled:opacity-30">
          <Plus className="size-4.5" aria-hidden />
        </button>
      </span>
    </div>
  );
}

/* ---------- Calendrier (mois courant + suivant) ---------- */
function Calendrier({ min, max, indisponibles, valeur, mois, onMois, onChoix }: { min: string; max: string; indisponibles: Set<string>; valeur: string; mois: number; onMois: (n: number) => void; onChoix: (d: string) => void }) {
  const { t, locale } = useLangue();
  const base = new Date(`${min}T00:00:00Z`);
  const moisCourant = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + mois, 1));
  const nomMois = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(moisCourant).replace(/^./, (c) => c.toUpperCase());
  const premierJour = moisCourant.getUTCDay();
  const nbJours = new Date(Date.UTC(moisCourant.getUTCFullYear(), moisCourant.getUTCMonth() + 1, 0)).getUTCDate();
  const decal = (premierJour + 6) % 7; // lundi en premier

  return (
    <div className="pb-2">
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={() => onMois(Math.max(0, mois - 1))} disabled={mois === 0} aria-label={t.moisPrecedent} className="grid size-11 place-items-center rounded-full border border-line transition active:scale-90 disabled:opacity-30">
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <p className="font-display font-bold text-ink" aria-live="polite">
          {nomMois}
        </p>
        <button
          type="button"
          onClick={() => onMois(mois + 1)}
          disabled={ajouterJoursDate(moisCourant.toISOString().slice(0, 10), 31) > max}
          aria-label={t.moisSuivant}
          className="grid size-11 place-items-center rounded-full border border-line transition active:scale-90 disabled:opacity-30"
        >
          <ArrowLeft className="size-4 rotate-180" aria-hidden />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted">
        {t.joursCourts.split(" ").map((j, i) => (
          <span key={i} className="py-1">
            {j}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: decal }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: nbJours }, (_, i) => {
          const d = `${moisCourant.getUTCFullYear()}-${String(moisCourant.getUTCMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const bloque = d < min || d > max || indisponibles.has(d);
          return (
            <button
              key={d}
              type="button"
              disabled={bloque}
              onClick={() => onChoix(d)}
              aria-pressed={valeur === d}
              aria-label={dateLongue(d, locale)}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-sm font-semibold transition disabled:text-muted/40",
                valeur === d ? "bg-success text-white shadow-card" : bloque ? "" : "text-ink active:bg-primary-soft",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Onglet Offre (Menu / Chambres / Services) ---------- */
function OngletOffre({ e, config }: { e: Etablissement; config: ReturnType<typeof useReservations>["config"] }) {
  const { t } = useLangue();
  if (e.secteur === "hotellerie")
    return (
      <section className="mt-4 space-y-3">
        {config.hotel.chambres.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-white p-4 shadow-card">
            <div>
              <p className="text-sm font-bold text-ink">{c.nom}</p>
              <p className="text-xs text-muted">{fmt(t.jusquaPersonnes, { n: c.capacite })}</p>
            </div>
            <p className="text-sm font-bold text-primary">{formatFCFA(c.prix)} <span className="text-[11px] font-normal text-muted">{t.parNuit}</span></p>
          </div>
        ))}
      </section>
    );
  if (e.secteur === "sante")
    return (
      <section className="mt-4 space-y-3">
        {config.sante.praticiens.map((p) => (
          <div key={p.id} className="flex items-center gap-3.5 rounded-3xl border border-line bg-white p-4 shadow-card">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secteur-sante/15 text-secteur-sante">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{p.specialite}</p>
              <p className="text-xs text-muted">
                {p.nom} · {p.debut} – {p.fin}
              </p>
            </div>
          </div>
        ))}
        <p className="text-sm font-semibold text-ink">{e.prix}</p>
      </section>
    );
  return (
    <section className="mt-4 space-y-3">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-ink">{e.prix}</p>
        <ul className="mt-3 space-y-2.5">
          {e.services.map((s) => (
            <li key={s} className="flex items-center gap-2.5 text-sm text-ink/85">
              <Check className="size-4 shrink-0 text-success" aria-hidden /> {s}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">{t.carteIndicative}</p>
    </section>
  );
}

/* ---------- Recommandés près de vous ---------- */
function Recommandes({ e, position, locale }: { e: Etablissement; position: [number, number] | null; locale: string }) {
  const { t } = useLangue();
  const { etablissements } = useCatalogue();
  const similaires = etablissements.filter(
    (x) => x.slug !== e.slug && x.secteur === e.secteur && x.pack === "premium",
  )
    .map((x) => ({ x, d: position ? distanceKm(position, x.coords) : Number.POSITIVE_INFINITY, n: noteMoyenne(x.avis) }))
    .sort((a, b) => (position ? a.d - b.d : b.n - a.n))
    .slice(0, 3);
  if (!similaires.length) return null;
  return (
    <section>
      <h3 className="mb-3 font-display text-base font-bold text-ink">{t.recommandes}</h3>
      <ul className="space-y-2.5">
        {similaires.map(({ x, d, n }) => (
          <li key={x.slug}>
            <Link href={`/reserver/${x.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card transition active:scale-[0.98]">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                <PhotoPlaceholder secteur={x.secteur} className="absolute inset-0" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{x.nom}</span>
                <span className="block truncate text-xs text-muted">
                  {x.sousType} · {x.commune}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-muted">
                {Number.isFinite(d) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden /> {d.toLocaleString(locale, { maximumFractionDigits: 1 })} km
                  </span>
                )}
                <span className="flex items-center gap-1 text-ink">
                  <Star className="size-3.5 fill-or text-or" aria-hidden /> {formatScore(n, locale)}
                </span>
                <ChevronRight className="size-4 text-primary" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Squelette ---------- */
function SqueletteReserver() {
  return (
    <div className="px-5 pt-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-32 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="squelette mt-4 h-28 rounded-3xl" />
      <div className="mt-4 flex gap-2">
        <div className="squelette h-12 w-24 rounded-2xl" />
        <div className="squelette h-12 w-20 rounded-2xl" />
        <div className="squelette h-12 w-16 rounded-2xl" />
        <div className="squelette h-12 w-28 rounded-2xl" />
      </div>
      <div className="squelette mt-4 h-72 rounded-3xl" />
      <div className="squelette mt-4 h-20 rounded-3xl" />
    </div>
  );
}
