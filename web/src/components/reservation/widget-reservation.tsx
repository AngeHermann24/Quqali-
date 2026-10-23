"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck, CircleCheck, Clock, Mail, MessageSquare, Minus, Plus } from "lucide-react";
import type { Secteur } from "@/lib/data";
import { formatFCFA } from "@/lib/facture-pdf";
import {
  AVEC_CRENEAUX,
  type Demande,
  type Reservation,
  STATUTS_RESERVATION,
  ajouterJoursDate,
  disponibilitesHotel,
  disponibilitesRestaurant,
  disponibilitesSante,
  resume,
} from "@/lib/reservation";
import { cn } from "@/lib/site";
import { type MessageEnvoye, useReservations } from "@/components/reservation/use-reservations";

const aujourdhuiLocal = () => new Date().toISOString().slice(0, 10);

export function WidgetReservation({ etablissementId, nom, secteur, onFermer }: { etablissementId: string; nom: string; secteur: Secteur; onFermer?: () => void }) {
  const { reservations, config, creer, charge } = useReservations(etablissementId, nom, secteur);
  const [maintenant, setMaintenant] = useState<string | null>(null);
  useEffect(() => setMaintenant(new Date().toISOString()), []);
  const jour = maintenant?.slice(0, 10) ?? "";
  const [etape, setEtape] = useState<"choix" | "coordonnees" | "fin">("choix");
  const [date, setDate] = useState(() => ajouterJoursDate(aujourdhuiLocal(), 1));
  const [depart, setDepart] = useState(() => ajouterJoursDate(aujourdhuiLocal(), 3));
  const [heure, setHeure] = useState("");
  const [couverts, setCouverts] = useState(2);
  const [chambreId, setChambreId] = useState("");
  const [nbChambres, setNbChambres] = useState(1);
  const [voyageurs, setVoyageurs] = useState(2);
  const [praticienId, setPraticienId] = useState(config.sante.praticiens[0]?.id ?? "");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState<{ reservation: Reservation; messages: MessageEnvoye[] } | null>(null);

  if (!charge || !maintenant) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  const max = ajouterJoursDate(jour, config.horizonJours);
  const choixValide = secteur === "hotellerie" ? !!chambreId : !!heure;

  const demandeBase: Omit<Demande, "client"> =
    secteur === "hotellerie"
      ? { arrivee: date, depart, chambreId, nbChambres, voyageurs }
      : secteur === "sante"
        ? { date, heure, praticienId, motif }
        : { date, heure, couverts };

  const confirmer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = creer({
      ...demandeBase,
      client: { nom: String(fd.get("nom") ?? ""), telephone: String(fd.get("telephone") ?? ""), email: String(fd.get("email") ?? "").trim() || undefined },
      commentaire: String(fd.get("commentaire") ?? "").trim() || undefined,
    });
    if ("erreur" in res && res.erreur) return setErreur(res.erreur);
    if ("reservation" in res && res.reservation) {
      setErreur("");
      setResultat({ reservation: res.reservation, messages: res.messages });
      setEtape("fin");
    }
  };

  if (etape === "fin" && resultat) {
    const confirmee = resultat.reservation.statut === "confirmee";
    return (
      <div className="space-y-4">
        <div className="text-center">
          <CircleCheck className={cn("mx-auto size-14", confirmee ? "text-success" : "text-primary")} aria-hidden />
          <p className="mt-2 font-display text-lg font-semibold text-ink">{confirmee ? "Réservation confirmée" : "Demande envoyée"}</p>
          <p className="text-sm text-muted">
            Référence <strong className="text-ink">{resultat.reservation.reference}</strong> · {STATUTS_RESERVATION[resultat.reservation.statut]}
          </p>
          <p className="mt-1 text-sm text-ink">{resume(resultat.reservation, config)}</p>
          {resultat.reservation.montant && <p className="text-sm text-muted">Montant estimé : {formatFCFA(resultat.reservation.montant)}, réglé sur place.</p>}
        </div>
        <div className="space-y-2">
          {resultat.messages.map((m) => (
            <div key={m.id} className="rounded-xl bg-surface p-3 text-xs">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                {m.canal === "sms" ? <MessageSquare className="size-3.5" aria-hidden /> : <Mail className="size-3.5" aria-hidden />}
                {m.canal === "sms" ? "SMS" : "E-mail"} envoyé à {m.destinataire}
              </p>
              <p className="whitespace-pre-line text-ink">{m.contenu}</p>
            </div>
          ))}
          <p className="text-center text-[11px] text-muted">Prototype : les SMS et e-mails sont simulés.</p>
        </div>
        {onFermer && (
          <button type="button" className="btn btn-primary w-full py-3" onClick={onFermer}>
            Fermer
          </button>
        )}
      </div>
    );
  }

  if (etape === "coordonnees")
    return (
      <form onSubmit={confirmer} className="space-y-4" noValidate>
        <p className="rounded-xl bg-surface p-3 text-sm text-ink">
          <CalendarCheck className="mr-1.5 inline size-4 text-primary" aria-hidden />
          {resume({ ...demandeBase, client: { nom: "", telephone: "" }, id: "", reference: "", etablissementId, secteur, creeLe: "", statut: "en_attente", historique: [] }, config)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="r-nom" className="label">
              Nom complet
            </label>
            <input id="r-nom" name="nom" required autoComplete="name" className="input" />
          </div>
          <div>
            <label htmlFor="r-tel" className="label">
              Téléphone (SMS)
            </label>
            <input id="r-tel" name="telephone" type="tel" required autoComplete="tel" placeholder="07 00 00 00 00" className="input" />
          </div>
          <div>
            <label htmlFor="r-email" className="label">
              E-mail (facultatif)
            </label>
            <input id="r-email" name="email" type="email" autoComplete="email" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="r-com" className="label">
              Précisions (facultatif)
            </label>
            <textarea id="r-com" name="commentaire" rows={2} className="input" placeholder={secteur === "sante" ? "Symptômes, assurance…" : "Occasion, allergies, heure d'arrivée…"} />
          </div>
        </div>
        {erreur && <p className="text-sm font-medium text-ink">{erreur}</p>}
        <div className="flex gap-3">
          <button type="button" className="btn btn-outline py-3" onClick={() => setEtape("choix")} aria-label="Retour">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="submit" className="btn btn-success flex-1 py-3">
            {config.autoConfirmation ? "Confirmer la réservation" : "Envoyer la demande"}
          </button>
        </div>
        <p className="text-xs text-muted">
          {config.autoConfirmation ? "Confirmation immédiate par SMS." : "L'établissement confirme votre demande par SMS, généralement dans l'heure."}
        </p>
      </form>
    );

  return (
    <div className="space-y-4">
      {AVEC_CRENEAUX.has(secteur) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-date" className="label">
                Date
              </label>
              <input id="r-date" type="date" min={jour} max={max} value={date} onChange={(e) => (setDate(e.target.value), setHeure(""))} className="input" />
            </div>
            <div>
              <span className="label">{secteur === "restauration" ? "Couverts" : "Personnes"}</span>
              <div className="flex items-center justify-between rounded-xl border border-line px-2 py-1.5">
                <button type="button" className="grid size-9 place-items-center rounded-lg hover:bg-surface" onClick={() => setCouverts(Math.max(1, couverts - 1))} aria-label="Moins">
                  <Minus className="size-4" />
                </button>
                <span className="font-semibold text-ink">{couverts}</span>
                <button type="button" className="grid size-9 place-items-center rounded-lg hover:bg-surface" onClick={() => setCouverts(Math.min(config.restaurant.maxCouverts, couverts + 1))} aria-label="Plus">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
          <Creneaux
            groupes={Object.entries(
              disponibilitesRestaurant(config, date, reservations, maintenant).reduce<Record<string, { heure: string; ok: boolean; info?: string }[]>>((acc, c) => {
                (acc[c.service] ??= []).push({ heure: c.heure, ok: c.restants >= couverts, info: c.restants < couverts ? (c.restants ? `${c.restants} pl.` : "Complet") : undefined });
                return acc;
              }, {}),
            )}
            valeur={heure}
            onChange={setHeure}
            vide={config.restaurant.joursFermes.includes(new Date(`${date}T00:00:00Z`).getUTCDay()) ? "Fermé ce jour-là." : "Aucun créneau disponible à cette date."}
          />
        </>
      )}

      {secteur === "hotellerie" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-arr" className="label">
                Arrivée
              </label>
              <input
                id="r-arr"
                type="date"
                min={jour}
                max={max}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (depart <= e.target.value) setDepart(ajouterJoursDate(e.target.value, 1));
                }}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="r-dep" className="label">
                Départ
              </label>
              <input id="r-dep" type="date" min={ajouterJoursDate(date, 1)} value={depart} onChange={(e) => setDepart(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="r-voy" className="label">
                Voyageurs
              </label>
              <input id="r-voy" type="number" min={1} max={12} value={voyageurs} onChange={(e) => setVoyageurs(Math.max(1, Number(e.target.value)))} className="input" />
            </div>
            <div>
              <label htmlFor="r-nbch" className="label">
                Chambres
              </label>
              <input id="r-nbch" type="number" min={1} max={5} value={nbChambres} onChange={(e) => setNbChambres(Math.max(1, Number(e.target.value)))} className="input" />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="label">Type de chambre</legend>
            {disponibilitesHotel(config, date, depart, reservations).map(({ chambre, restantes, nuits, totalParChambre }) => {
              const ok = restantes >= nbChambres && chambre.capacite * nbChambres >= voyageurs;
              return (
                <label
                  key={chambre.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3 transition",
                    !ok ? "cursor-not-allowed border-line opacity-50" : chambreId === chambre.id ? "cursor-pointer border-primary bg-primary-soft" : "cursor-pointer border-line",
                  )}
                >
                  <input type="radio" name="chambre" className="sr-only" disabled={!ok} checked={chambreId === chambre.id} onChange={() => setChambreId(chambre.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{chambre.nom}</span>
                    <span className="block text-xs text-muted">
                      {chambre.capacite} pers. max · {formatFCFA(chambre.prix)} / nuit · {restantes ? (restantes <= 3 ? `plus que ${restantes}` : "disponible") : "complet"}
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold text-ink">
                    {formatFCFA(totalParChambre * nbChambres)}
                    <span className="block text-[11px] font-normal text-muted">{nuits} nuit(s)</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </>
      )}

      {secteur === "sante" && (
        <>
          <fieldset>
            <legend className="label">Spécialité</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {config.sante.praticiens.map((p) => (
                <label key={p.id} className={cn("cursor-pointer rounded-xl border-2 p-3 transition", praticienId === p.id ? "border-primary bg-primary-soft" : "border-line")}>
                  <input type="radio" name="praticien" className="sr-only" checked={praticienId === p.id} onChange={() => (setPraticienId(p.id), setHeure(""))} />
                  <span className="block text-sm font-semibold text-ink">{p.specialite}</span>
                  <span className="block text-xs text-muted">{p.nom}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="r-date-s" className="label">
              Date
            </label>
            <input id="r-date-s" type="date" min={jour} max={max} value={date} onChange={(e) => (setDate(e.target.value), setHeure(""))} className="input" />
          </div>
          <Creneaux
            groupes={[["Créneaux", disponibilitesSante(config, praticienId, date, reservations, maintenant).map((c) => ({ heure: c.heure, ok: c.libre, info: c.libre ? undefined : "Pris" }))]]}
            valeur={heure}
            onChange={setHeure}
            vide="Ce praticien ne consulte pas ce jour-là."
          />
          <div>
            <label htmlFor="r-motif" className="label">
              Motif (facultatif)
            </label>
            <input id="r-motif" className="input" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Consultation, suivi, vaccination…" />
          </div>
        </>
      )}

      <button type="button" disabled={!choixValide} onClick={() => setEtape("coordonnees")} className="btn btn-success w-full py-3">
        Continuer
      </button>
    </div>
  );
}

function Creneaux({ groupes, valeur, onChange, vide }: { groupes: [string, { heure: string; ok: boolean; info?: string }[]][]; valeur: string; onChange: (h: string) => void; vide: string }) {
  if (!groupes.some(([, c]) => c.length)) return <p className="rounded-xl bg-surface p-4 text-center text-sm text-muted">{vide}</p>;
  return (
    <div className="space-y-3">
      {groupes.map(([titre, liste]) => (
        <div key={titre}>
          <p className="label flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> {titre}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {liste.map((c) => (
              <button
                key={c.heure}
                type="button"
                disabled={!c.ok}
                onClick={() => onChange(c.heure)}
                aria-pressed={valeur === c.heure}
                className={cn(
                  "rounded-lg border px-1 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                  valeur === c.heure ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-primary",
                )}
              >
                {c.heure}
                {c.info && <span className="block text-[10px] font-normal">{c.info}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
