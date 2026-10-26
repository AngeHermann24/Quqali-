"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Images, Star, X } from "lucide-react";
import { type Etablissement, noteMoyenne } from "@/lib/data";
import { codeVisiteDemo } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import type { Reservation } from "@/lib/reservation";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { useHorloge } from "@/lib/use-config";
import {
  CRITERES_AVIS,
  type CritereAvisId,
  DELAI_AVIS_JOURS,
  DELAI_MODIFICATION_JOURS,
  ETIQUETTES_NOTE,
  LARGEUR_PHOTO,
  MAX_PHOTOS,
  MAX_TAILLE_PHOTO,
  PUCES_PLAINTES,
  SUGGESTIONS_COMMENTAIRE,
  TEXTES_AVIS,
} from "@/lib/textes-avis";
import type { AvisClient } from "@/lib/avis";
import { Modal } from "@/components/modal";
import { PhotoPlaceholder } from "@/components/ui";
import { useAvis, useCompteClient } from "@/components/avis/use-avis";

const T = TEXTES_AVIS;
const dateLongue = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`))
    .replace(/^./, (c) => c.toUpperCase());
const ajouterJours = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

type Etape = "form" | "succes" | "refus" | "deja-note" | "delai" | "pas-de-visite";

export function DonnerAvis({ e }: { e: Etablissement }) {
  const router = useRouter();
  const params = useSearchParams();
  const { aujourdhui } = useHorloge();
  const { compte, charge: compteCharge } = useCompteClient();
  const { avis, soumettre, charge } = useAvis(e.slug);
  const [toutesResa] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [, setTousAvis] = useStockage<Record<string, AvisClient[]>>(CLES.avis);

  const resaId = params.get("reservation");
  const modifId = params.get("modifier");
  const jour = aujourdhui?.slice(0, 10) ?? "";
  const moyenne = noteMoyenne(e.avis);

  /* ---------- Résolution de la visite ---------- */
  const reservations = toutesResa?.[e.slug] ?? [];
  const tel = compte?.telephone.replace(/\D/g, "").slice(-8) ?? "";
  const reservation =
    reservations.find((r) => r.id === resaId) ??
    reservations.find(
      (r) =>
        (r.statut === "honoree" || (r.statut === "confirmee" && (r.date ?? r.arrivee ?? "") <= jour)) &&
        tel &&
        r.client.telephone.replace(/\D/g, "").slice(-8) === tel &&
        !avis.some((a) => a.preuve.type === "reservation" && a.preuve.ref === r.id && a.statut !== "rejete"),
    );
  const visite = reservation ? (reservation.date ?? reservation.arrivee ?? "") : "";
  const avisExistant = reservation ? avis.find((a) => a.preuve.type === "reservation" && a.preuve.ref === reservation.id && a.statut !== "rejete") : undefined;
  const avisModifie = modifId ? avis.find((a) => a.id === modifId && a.compteId === compte?.id) : undefined;
  const modifiable = avisModifie && ajouterJours(avisModifie.date.slice(0, 10), DELAI_MODIFICATION_JOURS) >= jour;
  const delaiDepasse = visite ? ajouterJours(visite, DELAI_AVIS_JOURS) < jour : false;
  const eligibilite: Etape | null = !charge || !compteCharge || !jour
    ? "form"
    : avisModifie && !modifiable
      ? "delai"
      : avisExistant && !modifId
        ? "deja-note"
        : delaiDepasse
          ? "delai"
          : !reservation && !modifId
            ? "pas-de-visite"
            : "form";

  /* ---------- Brouillon ---------- */
  const cleDraft = `avis-draft-${e.slug}-${resaId ?? "libre"}`;
  const [notes, setNotes] = useState<Record<CritereAvisId, number | null>>({ hygiene: null, accueil: null, presentation: null });
  const [plaintes, setPlaintes] = useState<string[]>([]);
  const [commentaire, setCommentaire] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [brouillonPret, setBrouillonPret] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");

  const [etape, setEtape] = useState<Etape | null>(null);
  const [panneau, setPanneau] = useState<"photos" | "quitter" | null>(null);
  const [secoue, setSecoue] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [progression, setProgression] = useState(0);
  const [motifRefus, setMotifRefus] = useState("");
  const [tentative, setTentative] = useState(0);
  const [horsLigne, setHorsLigne] = useState(false);
  const refFichier = useRef<HTMLInputElement>(null);
  const refCamera = useRef<HTMLInputElement>(null);
  const refNotes = useRef<HTMLDivElement>(null);

  /* ---------- Restauration du brouillon ---------- */
  useEffect(() => {
    if (!charge || brouillonPret) return;
    const t = window.setTimeout(() => {
      if (avisModifie) {
        setNotes((n) => ({
          ...n,
          ...(Object.fromEntries(Object.entries(avisModifie.criteres ?? {})) as Partial<Record<CritereAvisId, number>>),
        }));
        setCommentaire(avisModifie.commentaire);
      } else {
        const brut = sessionStorage.getItem(cleDraft);
        if (brut) {
          try {
            const d = JSON.parse(brut) as { notes?: Record<CritereAvisId, number | null>; plaintes?: string[]; commentaire?: string; photos?: string[] };
            if (d.notes) setNotes((n) => ({ ...n, ...d.notes }));
            if (d.plaintes) setPlaintes(d.plaintes);
            if (d.commentaire) setCommentaire(d.commentaire);
            if (d.photos) setPhotos(d.photos);
          } catch {
            /* brouillon illisible */
          }
        }
      }
      setBrouillonPret(true);
      setEtape(eligibilite);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge, brouillonPret]);

  useEffect(() => {
    if (!brouillonPret || avisModifie) return;
    sessionStorage.setItem(cleDraft, JSON.stringify({ notes, plaintes, commentaire, photos }));
  }, [brouillonPret, avisModifie, cleDraft, notes, plaintes, commentaire, photos]);

  const sale = Object.values(notes).some((n) => n !== null) || commentaire.trim() || photos.length;
  const toutesNotes = Object.values(notes).every((n) => n !== null);
  const noteMoy = toutesNotes ? Math.round((Object.values(notes) as number[]).reduce((s, n) => s + n, 0) / 3) : 0;
  const faibles = CRITERES_AVIS.filter((c) => (notes[c.id] ?? 0) <= 2 && notes[c.id] !== null);
  const bonnes = Object.values(notes).filter((n) => n !== null && n >= 4).length >= 2;

  /* ---------- Photos : compression + métadonnées retirées par réencodage canvas ---------- */
  const traiterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    for (const f of [...fichiers].slice(0, MAX_PHOTOS - photos.length)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > MAX_TAILLE_PHOTO) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, LARGEUR_PHOTO / img.width);
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * ratio);
          c.height = Math.round(img.height * ratio);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(img.src);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = URL.createObjectURL(f);
      });
      setPhotos((p) => [...p, dataUrl]);
    }
  };

  /* ---------- Publication ---------- */
  const retour = () => {
    if (sale && etape === "form") setPanneau("quitter");
    else router.back();
  };

  const publier = () => {
    if (!toutesNotes) {
      const manquant = CRITERES_AVIS.find((c) => !notes[c.id]);
      if (manquant) {
        refNotes.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setSecoue(manquant.id);
        window.setTimeout(() => setSecoue(null), 600);
      }
      return;
    }
    if (!compte) {
      router.push(`/connexion?suivant=${encodeURIComponent(`/avis/${e.slug}${resaId ? `?reservation=${resaId}` : ""}`)}`);
      return;
    }
    if (!navigator.onLine) {
      setHorsLigne(true);
      return; // brouillon déjà conservé : envoi simulé dès le retour du réseau
    }
    if (envoi) return;
    navigator.vibrate?.(15);
    setEnvoi(true);
    setProgression(0);
    const avance = window.setInterval(() => setProgression((p) => Math.min(90, p + 30)), 180);
    window.setTimeout(() => {
      clearInterval(avance);
      setProgression(100);
      if (avisModifie) {
        setTousAvis((prev) => ({
          ...prev,
          [e.slug]: (prev?.[e.slug] ?? []).map((a) =>
            a.id === avisModifie.id ? { ...a, note: noteMoy, criteres: notes as Record<string, number>, commentaire: commentaire.trim(), statut: "en_verification" as const } : a,
          ),
        }));
        sessionStorage.removeItem(cleDraft);
        setEtape("succes");
        setEnvoi(false);
        return;
      }
      const saisie = {
        compte,
        note: noteMoy,
        criteres: notes as Record<string, number>,
        commentaire: commentaire.trim() || `Note de ${noteMoy}/5 — expérience Qualité+`, // repli pour la modération si commentaire vide
        preuve: (reservation
          ? { type: "reservation" as const, ref: reservation.id }
          : { type: "code" as const, code: codeSaisi.trim().toUpperCase() || codeVisiteDemo(e.slug) }),
      };
      const nouveau = soumettre(compte, saisie);
      sessionStorage.removeItem(cleDraft);
      setEnvoi(false);
      if (nouveau.statut === "rejete") {
        setMotifRefus(nouveau.motifRejet ?? "Motif non précisé.");
        setTentative((t) => t + 1);
        setEtape("refus");
      } else {
        setEtape("succes");
      }
    }, 1000);
  };

  if (!charge || !compteCharge) return <SqueletteAvis />;

  /* ---------- États terminaux ---------- */
  const etapeActuelle = etape ?? eligibilite;

  if (etapeActuelle === "succes")
    return (
      <div className="relative flex min-h-[85dvh] flex-col items-center overflow-hidden px-6 pt-12 pb-28 text-center">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 22 }, (_, i) => (
            <span key={i} className="confetti-piece" style={{ left: `${(i * 41) % 100}%`, animationDelay: `${(i % 9) * 0.18}s`, background: i % 3 === 0 ? "#16A34A" : i % 3 === 1 ? "#1E3A8A" : "#22C55E" }} />
          ))}
        </div>
        <span className="grid size-20 place-items-center rounded-full bg-success-soft">
          <svg viewBox="0 0 52 52" className="size-14">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#16A34A" strokeWidth="3" className="cercle-succes" />
            <path d="M15 27l8 8 15-16" fill="none" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="coche-succes" />
          </svg>
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">{T.succesTitre}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {T.succesTexte}
          <br />
          {T.succesContribution}
        </p>
        <Link href="/reservations" className="btn btn-success mt-8 w-full max-w-sm rounded-2xl py-4 font-display font-bold">
          {T.retourReservations}
        </Link>
        <Link href="/etablissements" className="btn btn-outline mt-3 w-full max-w-sm rounded-2xl py-3.5 font-bold">
          {T.explorerAutres}
        </Link>
      </div>
    );

  if (etapeActuelle === "refus")
    return (
      <BlocEtat titre={T.refusTitre} texte={`Motif : ${motifRefus}`}>
        {tentative < 2 ? (
          <button type="button" onClick={() => setEtape("form")} className="btn btn-success w-full rounded-2xl py-3.5 font-bold">
            {T.refusAction}
          </button>
        ) : (
          <Link href="/reservations" className="btn btn-outline w-full rounded-2xl py-3.5 font-bold">
            {T.retourReservations}
          </Link>
        )}
      </BlocEtat>
    );

  if (etapeActuelle === "deja-note")
    return (
      <BlocEtat titre={T.dejaNoteTitre} texte="Votre avis est déjà enregistré pour cette visite.">
        <Link href={`/etablissements/${e.slug}#avis`} className="btn btn-success w-full rounded-2xl py-3.5 font-bold">
          {T.dejaNoteAction}
        </Link>
      </BlocEtat>
    );

  if (etapeActuelle === "delai")
    return (
      <BlocEtat titre={T.delaiDepasseTitre} texte={T.delaiDepasseTexte}>
        <Link href="/reservations" className="btn btn-outline w-full rounded-2xl py-3.5 font-bold">
          {T.retourReservations}
        </Link>
      </BlocEtat>
    );

  if (etapeActuelle === "pas-de-visite" && !codeSaisi)
    return (
      <BlocEtat titre={T.pasDeVisiteTitre} texte={T.pasDeVisiteTexte}>
        <div className="w-full rounded-2xl border border-line p-3.5">
          <label htmlFor="code-visite" className="label block">
            {T.codeVisite}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="code-visite"
              value={codeSaisi}
              onChange={(ev) => setCodeSaisi(ev.target.value.toUpperCase())}
              placeholder="VIS-0000"
              className="input flex-1 font-mono"
              maxLength={9}
            />
            <button
              type="button"
              onClick={() => {
                if (codeSaisi.trim().toUpperCase() === codeVisiteDemo(e.slug)) setEtape("form");
              }}
              disabled={!codeSaisi.trim()}
              className="btn btn-success px-5 py-2.5 font-bold disabled:opacity-40"
            >
              Valider
            </button>
          </div>
        </div>
        <Link href="/etablissements" className="btn btn-outline w-full rounded-2xl py-3.5 font-bold">
          {T.explorerAutres}
        </Link>
      </BlocEtat>
    );

  /* ---------- Formulaire ---------- */
  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pt-4">
        <button type="button" onClick={retour} aria-label="Retour" className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="font-display text-lg font-extrabold text-primary">{avisModifie ? "Modifier mon avis" : T.titre}</h1>
        <span className="size-10" aria-hidden />
      </header>

      {/* ---------- Carte établissement ---------- */}
      <div className="mx-5 mt-3 flex items-center gap-3.5 rounded-[1.25rem] border border-line bg-white p-3.5 shadow-card">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
          <PhotoPlaceholder secteur={e.secteur} className="absolute inset-0" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold text-ink">{e.nom}</p>
          <p className="truncate text-xs text-muted">
            {e.sousType} · {e.commune}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-or text-or" aria-hidden />
            <span className="font-bold text-ink">{moyenne > 0 ? moyenne.toFixed(1).replace(".", ",") : "—"}</span>
            <span className="text-muted">({e.avis.length} avis)</span>
          </p>
        </div>
      </div>
      {visite && <p className="mt-2.5 px-6 text-xs font-medium text-muted">{T.visite(dateLongue(visite))}</p>}

      {/* ---------- Étape 1 : notes ---------- */}
      <div ref={refNotes} className="mx-5 mt-4">
        <h2 className="font-display text-base font-bold text-ink">{T.etapeNotes}</h2>
        <div className={cn("mt-2.5 rounded-3xl border border-line bg-white shadow-card", secoue && "secoue")}>
          {CRITERES_AVIS.map((c, i) => (
            <div key={c.id} className={cn("flex items-center justify-between gap-3 px-4 py-3", i > 0 && "border-t border-line")}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{c.label}</p>
                <p className="mt-0.5 h-4 text-xs font-semibold text-or" aria-live="polite">
                  {notes[c.id] ? ETIQUETTES_NOTE[notes[c.id]! - 1] : ""}
                </p>
              </div>
              <LigneEtoiles valeur={notes[c.id]} onChange={(v) => setNotes((n) => ({ ...n, [c.id]: v }))} aria-label={`${c.label}, ${notes[c.id] ?? 0} étoiles sur 5`} />
            </div>
          ))}
        </div>
        {faibles.length > 0 && (
          <div className="mt-3 rounded-2xl border border-line bg-white p-4">
            <p className="text-sm font-semibold text-ink">{T.questionPlaint}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PUCES_PLAINTES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlaintes((l) => (l.includes(p) ? l.filter((x) => x !== p) : [...l, p]))}
                  aria-pressed={plaintes.includes(p)}
                  className={cn("chip border text-xs font-semibold transition active:scale-95", plaintes.includes(p) ? "border-success bg-success-soft text-success" : "border-line text-ink/70")}
                >
                  {plaintes.includes(p) && <Check className="size-3.5" aria-hidden />} {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Étape 2 : commentaire ---------- */}
      <div className="mx-5 mt-5">
        <h2 className="font-display text-base font-bold text-ink">{T.etapeCommentaire}</h2>
        <div className="mt-2.5 rounded-3xl border border-line bg-white p-3.5 shadow-card">
          <textarea
            value={commentaire}
            onChange={(ev) => {
              setCommentaire(ev.target.value.slice(0, 500));
              ev.target.style.height = "auto";
              ev.target.style.height = `${ev.target.scrollHeight}px`;
            }}
            placeholder={T.placeholderCommentaire}
            rows={3}
            className="w-full resize-none rounded-xl border border-line p-3 text-[15px] leading-relaxed text-ink outline-none transition focus:border-primary"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {bonnes &&
                SUGGESTIONS_COMMENTAIRE.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCommentaire((c) => `${c}${c && !c.endsWith(" ") ? " " : ""}${s}.`)}
                    className="rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 transition active:scale-95"
                  >
                    {s}
                  </button>
                ))}
            </div>
            <span className={cn("shrink-0 text-[11px] font-medium", commentaire.length > 480 ? "text-red-600" : "text-muted")}>{commentaire.length} / 500</span>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted">{T.rappelCourtoisie}</p>
      </div>

      {/* ---------- Étape 3 : photos ---------- */}
      <div className="mx-5 mt-5">
        <h2 className="font-display text-base font-bold text-ink">
          {T.etapePhotos} <span className="text-sm font-medium text-muted">({T.optionnel})</span>
        </h2>
        <button
          type="button"
          onClick={() => photos.length < MAX_PHOTOS && setPanneau("photos")}
          className="mt-2.5 flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line bg-primary-soft/40 px-5 py-8 transition active:scale-[0.99]"
        >
          <span className="relative grid size-11 place-items-center rounded-2xl bg-primary text-white">
            <Camera className="size-5.5" aria-hidden />
            <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-success text-[10px] font-bold">+</span>
          </span>
          <span className="text-sm font-semibold text-primary">{T.ajouterPhotos}</span>
        </button>
        {photos.length > 0 && (
          <ul className="mt-3 flex gap-2.5 overflow-x-auto">
            {photos.map((p, i) => (
              <li key={i} className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((l) => l.filter((_, j) => j !== i))}
                  aria-label={`Retirer la photo ${i + 1}`}
                  className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-ink/60 text-white"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 px-1 text-xs text-muted">{T.infoPhotos}</p>
      </div>

      {/* ---------- Bouton ---------- */}
      <div className="mx-5 mt-6">
        <button
          type="button"
          onClick={publier}
          aria-disabled={!toutesNotes || envoi}
          className={cn("btn btn-success w-full rounded-2xl py-4 font-display text-base font-bold", (!toutesNotes || envoi) && "opacity-60")}
        >
          {envoi ? T.enCours : avisModifie ? T.enregistrer : T.publier}
        </button>
        {envoi && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-success transition-all duration-200" style={{ width: `${progression}%` }} />
          </div>
        )}
        {horsLigne && <p className="mt-3 rounded-2xl bg-primary-soft p-3 text-center text-xs font-semibold text-primary" role="status">{T.horsLigne}</p>}
      </div>

      {/* ---------- Panneaux ---------- */}
      <Modal open={panneau === "photos"} onClose={() => setPanneau(null)} title={T.ajouterPhotos}>
        <div className="space-y-1 pb-2">
          <button type="button" onClick={() => { setPanneau(null); refCamera.current?.click(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition hover:bg-surface">
            <Camera className="size-4.5 text-primary" aria-hidden /> {T.prendrePhoto}
          </button>
          <button type="button" onClick={() => { setPanneau(null); refFichier.current?.click(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-semibold text-ink transition hover:bg-surface">
            <Images className="size-4.5 text-primary" aria-hidden /> {T.choisirGalerie}
          </button>
        </div>
      </Modal>
      <input ref={refFichier} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(ev) => { traiterPhotos(ev.target.files); ev.target.value = ""; }} />
      <input ref={refCamera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(ev) => { traiterPhotos(ev.target.files); ev.target.value = ""; }} />

      <Modal open={panneau === "quitter"} onClose={() => setPanneau(null)} title={T.quitterTitre}>
        <div className="space-y-4 pb-2">
          <p className="text-sm text-ink/85">{T.quitterTexte}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPanneau(null)} className="btn btn-outline flex-1 py-3 font-bold">
              {T.quitterRester}
            </button>
            <button type="button" onClick={() => router.back()} className="btn flex-1 bg-danger py-3 font-bold text-white">
              {T.quitterQuitter}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- 5 étoiles : touch, glisser, clavier ---------- */
function LigneEtoiles({ valeur, onChange, "aria-label": ariaLabel }: { valeur: number | null; onChange: (v: number) => void; "aria-label": string }) {
  const ref = useRef<HTMLDivElement>(null);
  const noteDepuisX = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(5, Math.max(1, Math.ceil(((x - r.left) / r.width) * 5)));
  };
  const [glisse, setGlisse] = useState(false);
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      onPointerDown={(ev) => {
        setGlisse(true);
        ev.currentTarget.setPointerCapture(ev.pointerId);
        onChange(noteDepuisX(ev.clientX));
        navigator.vibrate?.(8);
      }}
      onPointerMove={(ev) => glisse && onChange(noteDepuisX(ev.clientX))}
      onPointerUp={() => setGlisse(false)}
      onPointerCancel={() => setGlisse(false)}
      className="flex touch-none"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valeur === i}
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          tabIndex={i === 1 || valeur === i ? 0 : -1}
          onClick={() => onChange(i)}
          onKeyDown={(ev) => {
            if (ev.key === "ArrowRight" || ev.key === "ArrowUp") onChange(Math.min(5, (valeur ?? 0) + 1));
            if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") onChange(Math.max(1, (valeur ?? 2) - 1));
          }}
          className="grid size-11 place-items-center"
        >
          <Star
            className={cn("size-7 transition", i <= (valeur ?? 0) ? "fill-or text-or etoile-rebond" : "fill-line text-line")}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

/* ---------- Écrans d'état ---------- */
function BlocEtat({ titre, texte, children }: { titre: string; texte: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="pb-28">
      <header className="flex items-center px-5 pt-4">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="flex-1 text-center font-display text-lg font-extrabold text-primary">{T.titre}</h1>
        <span className="size-10" aria-hidden />
      </header>
      <div className="mx-5 mt-14 flex flex-col items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface text-muted">
          <Star className="size-7" aria-hidden />
        </span>
        <h2 className="font-display text-xl font-extrabold text-ink">{titre}</h2>
        <p className="max-w-xs text-sm leading-relaxed text-muted">{texte}</p>
        {children}
      </div>
    </div>
  );
}

/* ---------- Squelette ---------- */
function SqueletteAvis() {
  return (
    <div className="px-5 pt-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-32 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="squelette mt-4 h-20 rounded-3xl" />
      <div className="squelette mt-2 h-3 w-40 rounded-full" />
      <div className="squelette mt-5 h-4 w-44 rounded-full" />
      <div className="squelette mt-2.5 h-44 rounded-3xl" />
      <div className="squelette mt-5 h-4 w-36 rounded-full" />
      <div className="squelette mt-2.5 h-32 rounded-3xl" />
      <div className="squelette mt-5 h-4 w-52 rounded-full" />
      <div className="squelette mt-2.5 h-28 rounded-3xl" />
      <div className="squelette mt-6 h-14 rounded-2xl" />
    </div>
  );
}
