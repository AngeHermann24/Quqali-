"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BedDouble, CalendarDays, Minus, Phone, Plus, Settings2 } from "lucide-react";
import { CLES, type Dossier, ajouterJours, maintenant } from "@/lib/espace";
import {
  type ConfigReservation,
  type Reservation,
  type StatutReservation,
  JOURS,
  creerReservation,
  resume,
} from "@/lib/reservation";
import { configParDefaut } from "@/lib/reservation-demo";
import { aAcces } from "@/lib/pro-service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useHorloge } from "@/lib/use-config";
import { Chargement } from "@/components/espace/ui";
import { CalendrierPro, EntetePro, EtatVidePro, LockedFeature, PanneauBas, StatusPillPro, TabsPro, ToastPro } from "@/components/pro/ui";

type Onglet = "calendrier" | "liste";
const TON: Record<StatutReservation, { statut: "confirmee" | "a_confirmer" | "en_attente" | "refusee" | "annulee"; label: string }> = {
  confirmee: { statut: "confirmee", label: "Confirmée" },
  en_attente: { statut: "a_confirmer", label: "À confirmer" },
  honoree: { statut: "confirmee", label: "Honorée" },
  refusee: { statut: "refusee", label: "Refusée" },
  annulee: { statut: "annulee", label: "Annulée" },
  absent: { statut: "annulee", label: "Absent" },
};

const initiale = (nom: string) => {
  const [p, n] = nom.trim().split(/\s+/);
  return n ? `${p} ${n[0]}.` : p;
};

/** Réservations de démonstration seedées une fois (dates relatives au jour J). */
function graines(dossier: Dossier, config: ConfigReservation, ref: string): Reservation[] {
  const mk = (d: Parameters<typeof creerReservation>[3], i: number) => creerReservation(dossier.id, dossier.secteur, config, d, i + 1, ref);
  const jour = (n: number) => ajouterJours(ref, n).slice(0, 10);
  const base: Parameters<typeof creerReservation>[3][] =
    dossier.secteur === "hotellerie"
      ? [
          { client: { nom: "Awa Koné", telephone: "+225 07 01 02 03 04" }, arrivee: jour(0), depart: jour(2), chambreId: "standard", nbChambres: 1, voyageurs: 2 },
          { client: { nom: "Jean-Marc Yao", telephone: "+225 05 04 05 06 07" }, arrivee: jour(0), depart: jour(1), chambreId: "superieure", nbChambres: 1, voyageurs: 2 },
          { client: { nom: "Fatou Cissé", telephone: "+225 01 02 03 04 05" }, arrivee: jour(3), depart: jour(6), chambreId: "suite", nbChambres: 1, voyageurs: 4 },
          { client: { nom: "Serge Bakayoko", telephone: "+225 07 08 09 10 11" }, arrivee: jour(1), depart: jour(2), chambreId: "standard", nbChambres: 1, voyageurs: 1 },
        ]
      : dossier.secteur === "sante"
        ? [
            { client: { nom: "Awa Koné", telephone: "+225 07 01 02 03 04" }, date: jour(0), heure: "08:30", praticienId: "mg", motif: "Consultation" },
            { client: { nom: "Jean-Marc Yao", telephone: "+225 05 04 05 06 07" }, date: jour(0), heure: "10:00", praticienId: "mg", motif: "Suivi" },
            { client: { nom: "Fatou Cissé", telephone: "+225 01 02 03 04 05" }, date: jour(2), heure: "09:30", praticienId: "ped", motif: "Pédiatrie" },
          ]
        : [
            { client: { nom: "Awa Koné", telephone: "+225 07 01 02 03 04" }, date: jour(0), heure: "12:30", couverts: 2 },
            { client: { nom: "Jean-Marc Yao", telephone: "+225 05 04 05 06 07" }, date: jour(0), heure: "19:30", couverts: 4 },
            { client: { nom: "Fatou Cissé", telephone: "+225 01 02 03 04 05" }, date: jour(1), heure: "20:00", couverts: 6 },
            { client: { nom: "Serge Bakayoko", telephone: "+225 07 08 09 10 11" }, date: jour(0), heure: "13:00", couverts: 2 },
          ];
  return base.map(mk);
}

export function ReservationsPro() {
  const router = useRouter();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [toutes, setToutes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [configs, setConfigs] = useStockage<Record<string, ConfigReservation>>(CLES.configReservation);
  const { aujourdhui } = useHorloge();

  const [onglet, setOnglet] = useState<Onglet>("calendrier");
  const [jourSel, setJourSel] = useState<number | null>(null);
  const [decalageMois, setDecalageMois] = useState(0);
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [motifRefus, setMotifRefus] = useState("");
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [dispoOuvert, setDispoOuvert] = useState(false);
  const [toast, setToast] = useState("");

  const premium = dossier ? aAcces(dossier, "reservations") : false;
  const charge = dossier !== undefined && toutes !== undefined && configs !== undefined && !!aujourdhui;

  // Seed démo : uniquement pour un compte Premium sans aucune réservation.
  useEffect(() => {
    if (!charge || !dossier || !premium || !aujourdhui) return;
    if ((toutes?.[dossier.id] ?? []).length > 0) return;
    const config = configs?.[dossier.id] ?? configParDefaut(dossier.id);
    const ref = maintenant();
    setToutes((p) => {
      if ((p?.[dossier.id] ?? []).length > 0) return p;
      const liste = graines(dossier, config, ref).map((r, i) => (i < 2 ? { ...r, statut: "en_attente" as const } : { ...r, statut: "confirmee" as const }));
      return { ...p, [dossier.id]: liste };
    });
  }, [charge, dossier, premium, aujourdhui, toutes, configs, setToutes]);

  if (!charge) return <Chargement />;
  if (!dossier)
    return (
      <div className="px-5 py-8">
        <EtatVidePro icone={<CalendarDays className="size-8" aria-hidden />} titre="Pas de fiche" detail="Les réservations s'activent une fois votre établissement publié." />
      </div>
    );

  if (!premium)
    return (
      <div className="space-y-4 px-5 pt-5 pb-6">
        <EntetePro titre="Réservations" />
        <LockedFeature titre="Réservations en ligne" detail="Recevez et gérez les demandes de vos clients : tables, chambres, consultations." onPremium={() => router.push("/pro/abonnement")} />
      </div>
    );

  const config = configs?.[dossier.id] ?? configParDefaut(dossier.id);
  const reservations = toutes?.[dossier.id] ?? [];
  const changer = (id: string, statut: StatutReservation, motif?: string) => {
    setToutes((p) => ({
      ...p,
      [dossier.id]: (p?.[dossier.id] ?? []).map((r) =>
        r.id === id ? { ...r, statut, motifRefus: motif, historique: [...r.historique, { statut, date: maintenant() }] } : r,
      ),
    }));
    setDetail(null);
    setRefusOuvert(false);
    setMotifRefus("");
    setToast(statut === "confirmee" ? "Réservation confirmée — le client est prévenu par SMS." : "Réservation refusée — le client est prévenu par SMS.");
  };
  const majConfig = (c: ConfigReservation) => setConfigs((p) => ({ ...p, [dossier.id]: c }));

  const aujourd = aujourdhui!.slice(0, 10);
  const dJour = new Date(aujourd);
  const moisBase = new Date(dJour.getFullYear(), dJour.getMonth() + decalageMois, 1);
  const jourVisible = jourSel ?? dJour.getDate();
  const dateVisible = `${moisBase.getFullYear()}-${String(moisBase.getMonth() + 1).padStart(2, "0")}-${String(jourVisible).padStart(2, "0")}`;
  const cle = (r: Reservation) => (r.date ?? r.arrivee ?? "").slice(0, 10);
  const duJour = reservations.filter((r) => cle(r) === dateVisible);
  const joursActifs = new Set(
    reservations.map(cle).filter((c) => c.startsWith(`${moisBase.getFullYear()}-${String(moisBase.getMonth() + 1).padStart(2, "0")}`)).map((c) => Number(c.slice(8, 10))),
  );
  const triees = [...reservations].sort((a, b) => cle(a).localeCompare(cle(b)) || (a.heure ?? "").localeCompare(b.heure ?? ""));

  const intitule = () => (dossier.secteur === "hotellerie" ? "Réservation chambre" : dossier.secteur === "sante" ? "Consultation" : "Table restaurant");

  return (
    <>
      <EntetePro titre="Réservations" />
      <div className="px-5 pb-6">
        <TabsPro
          actif={onglet}
          onChange={setOnglet}
          onglets={[
            { id: "calendrier", label: "Calendrier" },
            { id: "liste", label: `Mes réservations (${reservations.length})` },
          ]}
        />

        {onglet === "calendrier" ? (
          <>
            <div className="mt-4">
              <CalendrierPro
                mois={moisBase.getMonth()}
                annee={moisBase.getFullYear()}
                joursActifs={joursActifs}
                jourCourant={jourVisible === dJour.getDate() && decalageMois === 0 ? dJour.getDate() : jourVisible}
                onMois={(d) => { setDecalageMois(decalageMois + d); setJourSel(null); }}
                onJour={setJourSel}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-ink">Réservations du {formatDate(dateVisible)}</p>
              <button type="button" onClick={() => setDispoOuvert(true)} className="flex items-center gap-1.5 text-xs font-bold text-bleu">
                <Settings2 className="size-3.5" aria-hidden /> Disponibilités
              </button>
            </div>
            <ul className="mt-3 space-y-3">
              {duJour.map((r) => <CarteReservation key={r.id} r={r} resume={resume(r, config)} intitule={intitule()} onOuvrir={() => setDetail(r)} />)}
              {duJour.length === 0 && (
                <li className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">Aucune réservation ce jour.</li>
              )}
            </ul>
          </>
        ) : (
          <ul className="mt-4 space-y-3">
            {triees.map((r) => <CarteReservation key={r.id} r={r} resume={resume(r, config)} intitule={intitule()} onOuvrir={() => setDetail(r)} />)}
            {triees.length === 0 && <EtatVidePro icone={<CalendarDays className="size-8" aria-hidden />} titre="Aucune réservation" detail="Les nouvelles demandes apparaîtront ici." />}
          </ul>
        )}
      </div>

      {/* Détail */}
      <PanneauBas ouvert={!!detail && !refusOuvert} titre="Détail de la réservation" onFermer={() => setDetail(null)}>
        {detail && (
          <>
            <div className="rounded-2xl bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold text-ink">{initiale(detail.client.nom)}</p>
                <StatusPillPro {...TON[detail.statut]} />
              </div>
              <p className="mt-1.5 text-sm text-muted">{resume(detail, config)}</p>
              <p className="mt-1 text-xs text-muted">Réf. {detail.reference} · reçue le {formatDate(detail.creeLe)}</p>
              {detail.commentaire && <p className="mt-2 rounded-xl bg-white p-2.5 text-xs text-ink">« {detail.commentaire} »</p>}
              {detail.motifRefus && <p className="mt-2 text-xs font-semibold text-danger">Motif du refus : {detail.motifRefus}</p>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {detail.statut === "en_attente" && (
                <>
                  <button type="button" onClick={() => changer(detail.id, "confirmee")} className="h-12 rounded-2xl bg-success font-bold text-white transition active:scale-[0.97]">Confirmer</button>
                  <button type="button" onClick={() => setRefusOuvert(true)} className="h-12 rounded-2xl border-2 border-danger font-bold text-danger transition active:scale-[0.97]">Refuser</button>
                </>
              )}
              {detail.statut === "confirmee" && (
                <button type="button" onClick={() => changer(detail.id, "annulee", "Annulée par l'établissement")} className="col-span-2 h-12 rounded-2xl border-2 border-line font-bold text-muted transition active:scale-[0.97]">
                  Annuler la réservation
                </button>
              )}
              <a href={`tel:${detail.client.telephone.replace(/\s/g, "")}`} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-bleu font-bold text-white transition active:scale-[0.97]">
                <Phone className="size-4" aria-hidden /> Appeler le client
              </a>
            </div>
          </>
        )}
      </PanneauBas>

      {/* Refus avec motif */}
      <PanneauBas ouvert={refusOuvert} titre="Motif du refus" onFermer={() => setRefusOuvert(false)}>
        <textarea rows={3} className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" placeholder="Ex. : complet sur ce créneau…" value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} aria-label="Motif du refus" />
        <button type="button" onClick={() => detail && changer(detail.id, "refusee", motifRefus.trim() || "Indisponible")} className="mt-3 h-12 w-full rounded-2xl bg-danger font-bold text-white transition active:scale-[0.98]">
          Confirmer le refus
        </button>
      </PanneauBas>

      {/* Disponibilités */}
      <PanneauBas ouvert={dispoOuvert} titre="Gérer les disponibilités" onFermer={() => setDispoOuvert(false)}>
        <Disponibilites config={config} secteur={dossier.secteur} onMaj={majConfig} />
      </PanneauBas>

      <ToastPro visible={!!toast} message={toast} />
    </>
  );
}

function CarteReservation({ r, resume: txt, intitule, onOuvrir }: { r: Reservation; resume: string; intitule: string; onOuvrir: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOuvrir} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition active:scale-[0.99]">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft font-display text-xs font-bold text-primary">
          {r.heure ?? <BedDouble className="size-5" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold text-ink">{intitule}</span>
            <StatusPillPro {...TON[r.statut]} />
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {initiale(r.client.nom)} · {txt}
          </span>
        </span>
      </button>
    </li>
  );
}

function Disponibilites({ config, secteur, onMaj }: { config: ConfigReservation; secteur: Dossier["secteur"]; onMaj: (c: ConfigReservation) => void }) {
  const JOURS_COMPLETS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return (
    <div className="space-y-4">
      {secteur === "restauration" && (
        <div className="flex items-center justify-between rounded-2xl bg-surface p-3.5">
          <span>
            <span className="block text-sm font-bold text-ink">Couverts par créneau</span>
            <span className="text-xs text-muted">Capacité maximale par service</span>
          </span>
          <span className="flex items-center gap-2">
            <button type="button" aria-label="Réduire" className="grid size-9 place-items-center rounded-full bg-white shadow-card" onClick={() => onMaj({ ...config, restaurant: { ...config.restaurant, couvertsParCreneau: Math.max(4, config.restaurant.couvertsParCreneau - 2) } })}>
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-8 text-center font-display text-lg font-extrabold text-ink">{config.restaurant.couvertsParCreneau}</span>
            <button type="button" aria-label="Augmenter" className="grid size-9 place-items-center rounded-full bg-white shadow-card" onClick={() => onMaj({ ...config, restaurant: { ...config.restaurant, couvertsParCreneau: config.restaurant.couvertsParCreneau + 2 } })}>
              <Plus className="size-4" aria-hidden />
            </button>
          </span>
        </div>
      )}
      {secteur === "hotellerie" && (
        <div className="rounded-2xl bg-surface p-3.5">
          <p className="text-sm font-bold text-ink">Chambres en vente</p>
          <ul className="mt-2.5 space-y-2">
            {config.hotel.chambres.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{c.nom}</span>
                <span className="flex items-center gap-2">
                  <button type="button" aria-label={`Réduire ${c.nom}`} className="grid size-8 place-items-center rounded-full bg-white shadow-card" onClick={() => onMaj({ ...config, hotel: { ...config.hotel, chambres: config.hotel.chambres.map((x) => (x.id === c.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)) } })}>
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="w-7 text-center font-display text-base font-extrabold text-ink">{c.stock}</span>
                  <button type="button" aria-label={`Augmenter ${c.nom}`} className="grid size-8 place-items-center rounded-full bg-white shadow-card" onClick={() => onMaj({ ...config, hotel: { ...config.hotel, chambres: config.hotel.chambres.map((x) => (x.id === c.id ? { ...x, stock: x.stock + 1 } : x)) } })}>
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {secteur === "sante" && (
        <div className="rounded-2xl bg-surface p-3.5">
          <p className="text-sm font-bold text-ink">Praticiens et créneaux</p>
          <ul className="mt-2 space-y-1.5">
            {config.sante.praticiens.map((p) => (
              <li key={p.id} className="text-xs text-muted">
                <span className="font-semibold text-ink">{p.nom}</span> · {p.specialite} — {p.jours.map((j) => JOURS[j]).join(", ")}, {p.debut}–{p.fin}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-ink">Jours fermés</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {JOURS_COMPLETS.map((j, i) => {
            const ferme = config.restaurant.joursFermes.includes(i);
            return (
              <button
                key={j}
                type="button"
                aria-pressed={ferme}
                onClick={() => onMaj({ ...config, restaurant: { ...config.restaurant, joursFermes: ferme ? config.restaurant.joursFermes.filter((x) => x !== i) : [...config.restaurant.joursFermes, i].sort() } })}
                className={cn("rounded-full px-3 py-2 text-xs font-bold transition", ferme ? "bg-danger text-white" : "bg-surface text-muted")}
              >
                {j.slice(0, 3)}.
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-muted">Chaque nouvelle demande déclenche une notification et un SMS au client après votre réponse.</p>
    </div>
  );
}
