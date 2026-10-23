"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, Inbox, Mail, MessageSquare, Plus, Settings2, Trash2, X } from "lucide-react";
import { SECTEURS } from "@/lib/data";
import { formatFCFA } from "@/lib/facture-pdf";
import { AVEC_CRENEAUX, type ConfigReservation, JOURS, type Reservation, STATUTS_RESERVATION, type StatutReservation, resume } from "@/lib/reservation";
import type { EtablissementGere } from "@/lib/reservation-demo";
import { cn } from "@/lib/site";
import { Modal } from "@/components/modal";
import { SelecteurEtablissement } from "@/components/reservation/selecteur";
import { useEtablissementsGeres } from "@/components/reservation/use-etablissements-geres";
import { useReservations } from "@/components/reservation/use-reservations";
import { WidgetReservation } from "@/components/reservation/widget-reservation";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

type Onglet = "demandes" | "agenda" | "disponibilites" | "messages";
const MOTIFS = ["Complet sur ce créneau", "Fermeture exceptionnelle", "Demande incomplète"];
const TONS: Record<StatutReservation, "neutre" | "succes" | "primaire" | "alerte"> = {
  en_attente: "primaire",
  confirmee: "succes",
  refusee: "alerte",
  annulee: "neutre",
  honoree: "succes",
  absent: "alerte",
};

export function GestionReservations() {
  const { options, premiumActif, charge } = useEtablissementsGeres();
  const [choix, setChoix] = useState<string | null>(null);
  if (!charge) return <Chargement />;
  const etab = options.find((o) => o.id === choix) ?? options[0];
  return (
    <>
      <EspaceHeader
        role="Espace établissement · Premium"
        titre="Réservations en ligne"
        sousTitre="Demandes, agenda, disponibilités et messages envoyés aux clients."
        actions={
          <Link href="/pro/premium" className="btn btn-white">
            Fonctions Premium
          </Link>
        }
      />
      <div className="container-page space-y-5 py-6">
        <SelecteurEtablissement options={options} valeur={etab.id} onChange={setChoix} premiumActif={premiumActif} />
        <Tableau key={etab.id} etab={etab} />
      </div>
    </>
  );
}

function Tableau({ etab }: { etab: EtablissementGere }) {
  const { reservations, config, messages, changer, enregistrerConfig, charge } = useReservations(etab.id, etab.nom, etab.secteur);
  const [onglet, setOnglet] = useState<Onglet>("demandes");
  const [simulation, setSimulation] = useState(false);
  const [aRefuser, setARefuser] = useState<Reservation | null>(null);
  if (!charge) return <Chargement />;

  const enAttente = reservations.filter((r) => r.statut === "en_attente");
  const cle = (r: Reservation) => `${r.arrivee ?? r.date ?? ""} ${r.heure ?? ""}`;
  const agenda = reservations.filter((r) => r.statut !== "en_attente").sort((a, b) => cle(a).localeCompare(cle(b)));

  const onglets: { id: Onglet; label: string; Icone: typeof Inbox; nombre?: number }[] = [
    { id: "demandes", label: "Demandes", Icone: Inbox, nombre: enAttente.length },
    { id: "agenda", label: "Agenda", Icone: CalendarDays },
    { id: "disponibilites", label: "Disponibilités", Icone: Settings2 },
    { id: "messages", label: "Messages", Icone: MessageSquare, nombre: messages.length },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {onglets.map(({ id, label, Icone, nombre }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={onglet === id}
              onClick={() => setOnglet(id)}
              className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition", onglet === id ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              <Icone className="size-4" aria-hidden /> {label}
              {!!nombre && <span className={cn("rounded-full px-1.5 text-xs", onglet === id ? "bg-white text-primary" : "bg-primary-soft text-primary")}>{nombre}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline shrink-0" onClick={() => setSimulation(true)}>
          <Plus className="size-4" aria-hidden /> Simuler une réservation client
        </button>
      </div>

      {onglet === "demandes" && (
        <Bloc titre={`Demandes à traiter (${enAttente.length})`} icone={<Inbox className="size-5" aria-hidden />} action={<Pastille ton={config.autoConfirmation ? "succes" : "neutre"}>{config.autoConfirmation ? "Confirmation automatique" : "Confirmation manuelle"}</Pastille>}>
          {enAttente.length ? (
            <ul className="space-y-3">
              {enAttente.map((r) => (
                <li key={r.id} className="rounded-xl border border-line p-4">
                  <Ligne r={r} config={config} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-success px-3 py-2" onClick={() => changer(r.id, "confirmee")}>
                      <Check className="size-4" aria-hidden /> Confirmer
                    </button>
                    <button type="button" className="btn btn-outline px-3 py-2" onClick={() => setARefuser(r)}>
                      <X className="size-4" aria-hidden /> Refuser
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucune demande en attente. {config.autoConfirmation ? "Les réservations disponibles sont confirmées automatiquement." : ""}</p>
          )}
        </Bloc>
      )}

      {onglet === "agenda" && (
        <Bloc titre="Agenda" icone={<CalendarDays className="size-5" aria-hidden />}>
          {agenda.length ? (
            <ul className="divide-y divide-line">
              {agenda.map((r) => (
                <li key={r.id} className="py-3">
                  <Ligne r={r} config={config} />
                  {r.statut === "confirmee" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className="btn btn-outline px-3 py-1.5 text-xs" onClick={() => changer(r.id, "honoree")}>
                        Client venu
                      </button>
                      <button type="button" className="btn btn-outline px-3 py-1.5 text-xs" onClick={() => changer(r.id, "absent")}>
                        Absent
                      </button>
                      <button type="button" className="btn btn-outline px-3 py-1.5 text-xs" onClick={() => changer(r.id, "annulee")}>
                        Annuler
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucune réservation confirmée pour le moment.</p>
          )}
        </Bloc>
      )}

      {onglet === "disponibilites" && <EditeurDisponibilites etab={etab} config={config} enregistrer={enregistrerConfig} />}

      {onglet === "messages" && (
        <Bloc titre="Messages envoyés aux clients" icone={<MessageSquare className="size-5" aria-hidden />}>
          {messages.length ? (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className="rounded-xl bg-surface p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    {m.canal === "sms" ? <MessageSquare className="size-3.5 text-primary" aria-hidden /> : <Mail className="size-3.5 text-primary" aria-hidden />}
                    <strong className="text-ink">{m.canal === "sms" ? "SMS" : "E-mail"}</strong> à {m.destinataire} · {new Date(m.date).toLocaleString("fr-FR")} · {m.reference}
                  </p>
                  {m.objet && <p className="mt-1 font-semibold text-ink">{m.objet}</p>}
                  <p className="mt-1 whitespace-pre-line text-ink/90">{m.contenu}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucun message envoyé pour le moment.</p>
          )}
          <p className="mt-3 text-xs text-muted">Prototype : envoi simulé. En production, branchement à un fournisseur SMS et e-mail.</p>
        </Bloc>
      )}

      <Modal open={simulation} onClose={() => setSimulation(false)} title={`${SECTEURS[etab.secteur].reservation} — ${etab.nom}`}>
        <WidgetReservation etablissementId={etab.id} nom={etab.nom} secteur={etab.secteur} onFermer={() => setSimulation(false)} />
      </Modal>

      <Modal open={aRefuser !== null} onClose={() => setARefuser(null)} title="Refuser la demande">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (aRefuser) changer(aRefuser.id, "refusee", String(new FormData(e.currentTarget).get("motif")));
            setARefuser(null);
          }}
        >
          <p className="text-sm text-muted">Le client sera prévenu par SMS avec le motif choisi.</p>
          {MOTIFS.map((m, i) => (
            <label key={m} className="flex items-center gap-2 rounded-xl border border-line p-3 text-sm has-checked:border-primary has-checked:bg-primary-soft">
              <input type="radio" name="motif" value={m} defaultChecked={i === 0} className="accent-primary" /> {m}
            </label>
          ))}
          <button type="submit" className="btn btn-primary w-full py-3">
            Refuser et prévenir le client
          </button>
        </form>
      </Modal>
    </>
  );
}

function Ligne({ r, config }: { r: Reservation; config: ConfigReservation }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{resume(r, config)}</p>
        <p className="text-xs text-muted">
          {r.client.nom} · {r.client.telephone}
          {r.client.email ? ` · ${r.client.email}` : ""} · {r.reference}
        </p>
        {r.commentaire && <p className="mt-1 text-xs text-ink">« {r.commentaire} »</p>}
        {r.motif && <p className="mt-1 text-xs text-ink">Motif : {r.motif}</p>}
        {r.motifRefus && <p className="mt-1 text-xs text-muted">Refus : {r.motifRefus}</p>}
      </div>
      <div className="flex items-center gap-2">
        {r.montant && <span className="text-xs font-semibold text-ink">{formatFCFA(r.montant)}</span>}
        <Pastille ton={TONS[r.statut]}>{STATUTS_RESERVATION[r.statut]}</Pastille>
      </div>
    </div>
  );
}

function EditeurDisponibilites({ etab, config, enregistrer }: { etab: EtablissementGere; config: ConfigReservation; enregistrer: (c: ConfigReservation) => void }) {
  const [c, setC] = useState(config);
  const [ok, setOk] = useState(false);
  const maj = (partiel: Partial<ConfigReservation>) => {
    setOk(false);
    setC({ ...c, ...partiel });
  };
  const nombre = (v: string, min = 0) => Math.max(min, Math.round(Number(v) || 0));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        enregistrer(c);
        setOk(true);
      }}
    >
      <Bloc titre="Règles générales" icone={<Settings2 className="size-5" aria-hidden />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5 sm:col-span-3">
            <span>
              <span className="block text-sm font-semibold text-ink">Confirmation automatique</span>
              <span className="block text-xs text-muted">Les demandes disponibles sont confirmées immédiatement par SMS.</span>
            </span>
            <input type="checkbox" role="switch" checked={c.autoConfirmation} onChange={(e) => maj({ autoConfirmation: e.target.checked })} className="size-5 accent-success" />
          </label>
          <Nombre id="delai" label="Délai minimum (heures)" valeur={c.delaiMinHeures} onChange={(v) => maj({ delaiMinHeures: nombre(v) })} />
          <Nombre id="horizon" label="Réservable jusqu'à (jours)" valeur={c.horizonJours} onChange={(v) => maj({ horizonJours: nombre(v, 1) })} />
        </div>
      </Bloc>

      {AVEC_CRENEAUX.has(etab.secteur) && (
        <Bloc titre="Services et capacité">
          <div className="space-y-3">
            {c.restaurant.services.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
                <Texte id={`srv-${i}`} label="Service" valeur={s.nom} onChange={(v) => maj({ restaurant: { ...c.restaurant, services: c.restaurant.services.map((x, j) => (j === i ? { ...x, nom: v } : x)) } })} />
                <Heure id={`srv-d-${i}`} label="Début" valeur={s.debut} onChange={(v) => maj({ restaurant: { ...c.restaurant, services: c.restaurant.services.map((x, j) => (j === i ? { ...x, debut: v } : x)) } })} />
                <Heure id={`srv-f-${i}`} label="Fin" valeur={s.fin} onChange={(v) => maj({ restaurant: { ...c.restaurant, services: c.restaurant.services.map((x, j) => (j === i ? { ...x, fin: v } : x)) } })} />
                <Supprimer onClick={() => maj({ restaurant: { ...c.restaurant, services: c.restaurant.services.filter((_, j) => j !== i) } })} />
              </div>
            ))}
            <button type="button" className="btn btn-outline px-3 py-2 text-sm" onClick={() => maj({ restaurant: { ...c.restaurant, services: [...c.restaurant.services, { nom: "Nouveau service", debut: "18:00", fin: "21:00" }] } })}>
              <Plus className="size-4" aria-hidden /> Ajouter un service
            </button>
            <div className="grid gap-4 sm:grid-cols-3">
              <Nombre id="pas" label="Intervalle des créneaux (min)" valeur={c.restaurant.pasMinutes} onChange={(v) => maj({ restaurant: { ...c.restaurant, pasMinutes: nombre(v, 10) } })} />
              <Nombre id="cap" label={etab.secteur === "restauration" ? "Couverts par créneau" : "Places par créneau"} valeur={c.restaurant.couvertsParCreneau} onChange={(v) => maj({ restaurant: { ...c.restaurant, couvertsParCreneau: nombre(v, 1) } })} />
              <Nombre id="max" label="Max. par réservation" valeur={c.restaurant.maxCouverts} onChange={(v) => maj({ restaurant: { ...c.restaurant, maxCouverts: nombre(v, 1) } })} />
            </div>
            <Jours valeur={c.restaurant.joursFermes} label="Jours de fermeture" onChange={(j) => maj({ restaurant: { ...c.restaurant, joursFermes: j } })} />
          </div>
        </Bloc>
      )}

      {etab.secteur === "hotellerie" && (
        <Bloc titre="Types de chambres">
          <div className="space-y-3">
            {c.hotel.chambres.map((ch, i) => {
              const set = (p: Partial<typeof ch>) => maj({ hotel: { ...c.hotel, chambres: c.hotel.chambres.map((x, j) => (j === i ? { ...x, ...p } : x)) } });
              return (
                <div key={ch.id} className="grid grid-cols-2 items-end gap-2 rounded-xl border border-line p-3 sm:grid-cols-[2fr_1fr_1fr_1.3fr_auto]">
                  <Texte id={`ch-${i}`} label="Nom" valeur={ch.nom} onChange={(v) => set({ nom: v })} className="col-span-2 sm:col-span-1" />
                  <Nombre id={`ch-cap-${i}`} label="Pers. max" valeur={ch.capacite} onChange={(v) => set({ capacite: nombre(v, 1) })} />
                  <Nombre id={`ch-st-${i}`} label="Nombre" valeur={ch.stock} onChange={(v) => set({ stock: nombre(v) })} />
                  <Nombre id={`ch-px-${i}`} label="Prix / nuit (FCFA)" valeur={ch.prix} onChange={(v) => set({ prix: nombre(v) })} />
                  <Supprimer onClick={() => maj({ hotel: { ...c.hotel, chambres: c.hotel.chambres.filter((_, j) => j !== i) } })} />
                </div>
              );
            })}
            <button type="button" className="btn btn-outline px-3 py-2 text-sm" onClick={() => maj({ hotel: { ...c.hotel, chambres: [...c.hotel.chambres, { id: `ch-${Date.now()}`, nom: "Nouvelle chambre", capacite: 2, stock: 1, prix: 40000 }] } })}>
              <Plus className="size-4" aria-hidden /> Ajouter un type de chambre
            </button>
            <Nombre id="sejour" label="Séjour maximum en ligne (nuits)" valeur={c.hotel.sejourMax} onChange={(v) => maj({ hotel: { ...c.hotel, sejourMax: nombre(v, 1) } })} />
          </div>
        </Bloc>
      )}

      {etab.secteur === "sante" && (
        <Bloc titre="Praticiens et plages de consultation">
          <div className="space-y-3">
            {c.sante.praticiens.map((p, i) => {
              const set = (x: Partial<typeof p>) => maj({ sante: { praticiens: c.sante.praticiens.map((y, j) => (j === i ? { ...y, ...x } : y)) } });
              return (
                <div key={p.id} className="space-y-3 rounded-xl border border-line p-3">
                  <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_auto]">
                    <Texte id={`p-n-${i}`} label="Praticien" valeur={p.nom} onChange={(v) => set({ nom: v })} />
                    <Texte id={`p-s-${i}`} label="Spécialité" valeur={p.specialite} onChange={(v) => set({ specialite: v })} />
                    <Heure id={`p-d-${i}`} label="Début" valeur={p.debut} onChange={(v) => set({ debut: v })} />
                    <Heure id={`p-f-${i}`} label="Fin" valeur={p.fin} onChange={(v) => set({ fin: v })} />
                    <Nombre id={`p-du-${i}`} label="Durée (min)" valeur={p.dureeMinutes} onChange={(v) => set({ dureeMinutes: nombre(v, 5) })} />
                    <Supprimer onClick={() => maj({ sante: { praticiens: c.sante.praticiens.filter((_, j) => j !== i) } })} />
                  </div>
                  <Jours valeur={p.jours} label="Jours de consultation" onChange={(j) => set({ jours: j })} />
                </div>
              );
            })}
            <button type="button" className="btn btn-outline px-3 py-2 text-sm" onClick={() => maj({ sante: { praticiens: [...c.sante.praticiens, { id: `pr-${Date.now()}`, nom: "Dr …", specialite: "Médecine générale", jours: [1, 2, 3, 4, 5], debut: "08:00", fin: "12:00", dureeMinutes: 20 }] } })}>
              <Plus className="size-4" aria-hidden /> Ajouter un praticien
            </button>
          </div>
        </Bloc>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary px-6 py-3">
          Enregistrer les disponibilités
        </button>
        {ok && (
          <span className="flex items-center gap-1 text-sm font-medium text-success-dark">
            <Check className="size-4" aria-hidden /> Enregistré
          </span>
        )}
      </div>
    </form>
  );
}

function Nombre({ id, label, valeur, onChange }: { id: string; label: string; valeur: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} type="number" className="input" value={valeur} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Texte({ id, label, valeur, onChange, className }: { id: string; label: string; valeur: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="input" value={valeur} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

function Heure({ id, label, valeur, onChange }: { id: string; label: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} type="time" className="input" value={valeur} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

function Supprimer({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Supprimer" className="btn btn-outline size-11 p-0">
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

function Jours({ valeur, label, onChange }: { valeur: number[]; label: string; onChange: (j: number[]) => void }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((j) => (
          <button
            key={j}
            type="button"
            aria-pressed={valeur.includes(j)}
            onClick={() => onChange(valeur.includes(j) ? valeur.filter((x) => x !== j) : [...valeur, j])}
            className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium", valeur.includes(j) ? "border-primary bg-primary text-white" : "border-line text-ink")}
          >
            {JOURS[j]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
