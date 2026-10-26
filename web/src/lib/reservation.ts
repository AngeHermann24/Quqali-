import type { Secteur } from "./data";

export type StatutReservation = "en_attente" | "confirmee" | "refusee" | "annulee" | "honoree" | "absent";

export interface ConfigRestaurant {
  services: { nom: string; debut: string; fin: string }[];
  pasMinutes: number;
  couvertsParCreneau: number;
  maxCouverts: number;
  joursFermes: number[];
}
export interface ConfigHotel {
  chambres: { id: string; nom: string; capacite: number; stock: number; prix: number }[];
  sejourMax: number;
}
export interface ConfigSante {
  praticiens: { id: string; nom: string; specialite: string; jours: number[]; debut: string; fin: string; dureeMinutes: number }[];
}

export interface ConfigReservation {
  autoConfirmation: boolean;
  delaiMinHeures: number;
  horizonJours: number;
  /** Acompte en FCFA exigé à la réservation (0 ou absent = gratuit, pas d'étape paiement). */
  acompteRequis?: number;
  restaurant: ConfigRestaurant;
  hotel: ConfigHotel;
  sante: ConfigSante;
}

export interface Client {
  nom: string;
  telephone: string;
  email?: string;
}

export interface Demande {
  client: Client;
  commentaire?: string;
  date?: string;
  heure?: string;
  couverts?: number;
  arrivee?: string;
  depart?: string;
  chambreId?: string;
  nbChambres?: number;
  voyageurs?: number;
  praticienId?: string;
  motif?: string;
}

export interface Reservation extends Demande {
  id: string;
  reference: string;
  etablissementId: string;
  secteur: Secteur;
  creeLe: string;
  statut: StatutReservation;
  montant?: number;
  motifRefus?: string;
  historique: { statut: StatutReservation; date: string }[];
}

export const STATUTS_RESERVATION: Record<StatutReservation, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  refusee: "Refusée",
  annulee: "Annulée",
  honoree: "Honorée",
  absent: "Client absent",
};

export const TRANSITIONS: Record<StatutReservation, StatutReservation[]> = {
  en_attente: ["confirmee", "refusee", "annulee"],
  confirmee: ["honoree", "absent", "annulee"],
  refusee: [],
  annulee: [],
  honoree: [],
  absent: [],
};

export const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/** Secteurs dont la réservation suit le modèle « créneau + places » (restauration et nouveaux secteurs). */
export const AVEC_CRENEAUX = new Set<Secteur>(["restauration", "services", "education", "commerce", "transport"]);

export const CONFIG_RESERVATION_DEFAUT: ConfigReservation = {
  autoConfirmation: false,
  delaiMinHeures: 2,
  horizonJours: 60,
  restaurant: {
    services: [
      { nom: "Déjeuner", debut: "12:00", fin: "15:00" },
      { nom: "Dîner", debut: "19:00", fin: "22:30" },
    ],
    pasMinutes: 30,
    couvertsParCreneau: 30,
    maxCouverts: 12,
    joursFermes: [],
  },
  hotel: {
    chambres: [
      { id: "standard", nom: "Chambre standard", capacite: 2, stock: 12, prix: 45000 },
      { id: "superieure", nom: "Chambre supérieure", capacite: 2, stock: 6, prix: 65000 },
      { id: "suite", nom: "Suite familiale", capacite: 4, stock: 2, prix: 120000 },
    ],
    sejourMax: 30,
  },
  sante: {
    praticiens: [
      { id: "mg", nom: "Dr Kouassi", specialite: "Médecine générale", jours: [1, 2, 3, 4, 5, 6], debut: "08:00", fin: "17:00", dureeMinutes: 20 },
      { id: "ped", nom: "Dr Bamba", specialite: "Pédiatrie", jours: [1, 2, 3, 4, 5], debut: "09:00", fin: "13:00", dureeMinutes: 30 },
      { id: "gyn", nom: "Dr Yao", specialite: "Gynécologie", jours: [2, 4], debut: "14:00", fin: "18:00", dureeMinutes: 30 },
    ],
  },
};

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const instant = (date: string, heure = "00:00") => Date.parse(`${date}T${heure}:00Z`);
export const jourSemaine = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
export const ajouterJoursDate = (date: string, n: number) => new Date(instant(date) + n * 86400000).toISOString().slice(0, 10);
export const nuits = (arrivee: string, depart: string) => Math.round((instant(depart) - instant(arrivee)) / 86400000);

export const actives = (r: Reservation[]) => r.filter((x) => x.statut === "en_attente" || x.statut === "confirmee");

export function creneaux(debut: string, fin: string, pas: number) {
  const liste: string[] = [];
  for (let m = minutes(debut); m + pas <= minutes(fin); m += pas) liste.push(hhmm(m));
  return liste;
}

const tropTot = (date: string, heure: string, maintenant: string, delaiMinHeures: number) => instant(date, heure) < Date.parse(maintenant) + delaiMinHeures * 3600000;

export function disponibilitesRestaurant(config: ConfigReservation, date: string, reservations: Reservation[], maintenant: string) {
  const c = config.restaurant;
  if (c.joursFermes.includes(jourSemaine(date))) return [];
  const prises = actives(reservations).filter((r) => r.date === date);
  return c.services.flatMap((s) =>
    creneaux(s.debut, s.fin, c.pasMinutes)
      .filter((h) => !tropTot(date, h, maintenant, config.delaiMinHeures))
      .map((heure) => ({
        service: s.nom,
        heure,
        restants: Math.max(0, c.couvertsParCreneau - prises.filter((r) => r.heure === heure).reduce((t, r) => t + (r.couverts ?? 0), 0)),
      })),
  );
}

export function disponibilitesHotel(config: ConfigReservation, arrivee: string, depart: string, reservations: Reservation[]) {
  const n = nuits(arrivee, depart);
  if (!(n > 0)) return [];
  const prises = actives(reservations);
  return config.hotel.chambres.map((chambre) => {
    let occupationMax = 0;
    for (let i = 0; i < n; i++) {
      const nuit = ajouterJoursDate(arrivee, i);
      const occupees = prises
        .filter((r) => r.chambreId === chambre.id && r.arrivee && r.depart && r.arrivee <= nuit && nuit < r.depart)
        .reduce((t, r) => t + (r.nbChambres ?? 1), 0);
      occupationMax = Math.max(occupationMax, occupees);
    }
    return { chambre, nuits: n, restantes: Math.max(0, chambre.stock - occupationMax), totalParChambre: n * chambre.prix };
  });
}

export function disponibilitesSante(config: ConfigReservation, praticienId: string, date: string, reservations: Reservation[], maintenant: string) {
  const p = config.sante.praticiens.find((x) => x.id === praticienId);
  if (!p || !p.jours.includes(jourSemaine(date))) return [];
  const prises = new Set(actives(reservations).filter((r) => r.praticienId === praticienId && r.date === date).map((r) => r.heure));
  return creneaux(p.debut, p.fin, p.dureeMinutes)
    .filter((h) => !tropTot(date, h, maintenant, config.delaiMinHeures))
    .map((heure) => ({ heure, libre: !prises.has(heure) }));
}

export function verifierDemande(secteur: Secteur, config: ConfigReservation, d: Demande, reservations: Reservation[], maintenant: string): string | null {
  if (!d.client.nom.trim()) return "Indiquez votre nom.";
  if (!/^(\+?225)?\s?(01|05|07|27)(\s?\d{2}){4}$/.test(d.client.telephone.trim())) return "Numéro de téléphone ivoirien invalide (ex. 07 00 00 00 00).";
  if (d.client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.client.email)) return "Adresse e-mail invalide.";
  const aujourdhui = maintenant.slice(0, 10);
  const limite = ajouterJoursDate(aujourdhui, config.horizonJours);
  const dateRef = secteur === "hotellerie" ? d.arrivee : d.date;
  if (!dateRef || dateRef < aujourdhui) return "Choisissez une date à venir.";
  if (dateRef > limite) return `Les réservations sont ouvertes jusqu'à ${config.horizonJours} jours à l'avance.`;

  if (AVEC_CRENEAUX.has(secteur)) {
    const couverts = d.couverts ?? 0;
    if (couverts < 1 || couverts > config.restaurant.maxCouverts)
      return `Entre 1 et ${config.restaurant.maxCouverts} ${secteur === "restauration" ? "couverts" : "personnes"} par réservation en ligne.`;
    const creneau = disponibilitesRestaurant(config, d.date!, reservations, maintenant).find((c) => c.heure === d.heure);
    if (!creneau) return "Ce créneau n'est pas disponible.";
    if (creneau.restants < couverts) return `Il ne reste que ${creneau.restants} place(s) sur ce créneau.`;
  }
  if (secteur === "hotellerie") {
    const n = d.depart ? nuits(d.arrivee!, d.depart) : 0;
    if (n < 1) return "La date de départ doit suivre la date d'arrivée.";
    if (n > config.hotel.sejourMax) return `Séjour limité à ${config.hotel.sejourMax} nuits en ligne.`;
    const dispo = disponibilitesHotel(config, d.arrivee!, d.depart!, reservations).find((x) => x.chambre.id === d.chambreId);
    if (!dispo) return "Choisissez un type de chambre.";
    const nb = d.nbChambres ?? 1;
    if (dispo.restantes < nb) return dispo.restantes ? `Il ne reste que ${dispo.restantes} chambre(s) de ce type.` : "Ce type de chambre est complet sur ces dates.";
    if ((d.voyageurs ?? 1) > dispo.chambre.capacite * nb) return `Capacité maximale : ${dispo.chambre.capacite * nb} personne(s).`;
  }
  if (secteur === "sante") {
    const creneau = disponibilitesSante(config, d.praticienId ?? "", d.date!, reservations, maintenant).find((c) => c.heure === d.heure);
    if (!creneau) return "Ce créneau n'est pas proposé.";
    if (!creneau.libre) return "Ce créneau vient d'être pris. Choisissez-en un autre.";
  }
  return null;
}

export function creerReservation(etablissementId: string, secteur: Secteur, config: ConfigReservation, d: Demande, rang: number, maintenant: string): Reservation {
  const statut: StatutReservation = config.autoConfirmation ? "confirmee" : "en_attente";
  const chambre = config.hotel.chambres.find((c) => c.id === d.chambreId);
  return {
    ...d,
    id: `${etablissementId}-${rang}`,
    reference: `RES-${maintenant.slice(2, 10).replaceAll("-", "")}-${String(rang).padStart(3, "0")}`,
    etablissementId,
    secteur,
    creeLe: maintenant,
    statut,
    montant: secteur === "hotellerie" && chambre && d.arrivee && d.depart ? nuits(d.arrivee, d.depart) * chambre.prix * (d.nbChambres ?? 1) : undefined,
    historique: [{ statut, date: maintenant }],
  };
}

export function changerStatut(r: Reservation, statut: StatutReservation, maintenant: string, motif?: string): Reservation {
  if (!TRANSITIONS[r.statut].includes(statut)) throw new Error(`Transition impossible : ${r.statut} → ${statut}`);
  return { ...r, statut, motifRefus: motif ?? r.motifRefus, historique: [...r.historique, { statut, date: maintenant }] };
}

const dateLongue = (date: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export function resume(r: Reservation, config: ConfigReservation) {
  if (r.secteur === "hotellerie") {
    const chambre = config.hotel.chambres.find((c) => c.id === r.chambreId)?.nom ?? "Chambre";
    return `${r.nbChambres ?? 1} × ${chambre}, du ${dateLongue(r.arrivee!)} au ${dateLongue(r.depart!)} (${nuits(r.arrivee!, r.depart!)} nuit(s), ${r.voyageurs ?? 1} pers.)`;
  }
  if (r.secteur === "sante") {
    const p = config.sante.praticiens.find((x) => x.id === r.praticienId);
    return `RDV ${p ? `${p.specialite} avec ${p.nom}` : ""} le ${dateLongue(r.date!)} à ${r.heure}`;
  }
  if (r.secteur === "restauration") return `Table pour ${r.couverts} le ${dateLongue(r.date!)} à ${r.heure}`;
  return `${r.couverts ?? 1} personne(s) le ${dateLongue(r.date!)} à ${r.heure}`;
}

export type EvenementReservation = "creee" | "confirmee" | "refusee" | "annulee" | "rappel";

export interface MessageSortant {
  canal: "sms" | "email";
  destinataire: string;
  objet?: string;
  contenu: string;
}

export function messagesClient(r: Reservation, nomEtablissement: string, config: ConfigReservation, evenement: EvenementReservation) {
  const detail = resume(r, config);
  const sms: Record<EvenementReservation, string> = {
    creee:
      r.statut === "confirmee"
        ? `${nomEtablissement} : réservation ${r.reference} CONFIRMÉE. ${detail}. Pour annuler, répondez ANNULER.`
        : `${nomEtablissement} : demande ${r.reference} bien reçue (${detail}). Vous recevrez la confirmation par SMS.`,
    confirmee: `${nomEtablissement} : votre réservation ${r.reference} est CONFIRMÉE. ${detail}. À bientôt !`,
    refusee: `${nomEtablissement} : désolé, la demande ${r.reference} ne peut être acceptée${r.motifRefus ? ` (${r.motifRefus})` : ""}. Essayez un autre créneau.`,
    annulee: `${nomEtablissement} : la réservation ${r.reference} est annulée.`,
    rappel: `${nomEtablissement} : rappel de votre réservation ${r.reference} demain. ${detail}.`,
  };
  const objets: Record<EvenementReservation, string> = {
    creee: r.statut === "confirmee" ? `Réservation confirmée — ${nomEtablissement}` : `Demande de réservation reçue — ${nomEtablissement}`,
    confirmee: `Réservation confirmée — ${nomEtablissement}`,
    refusee: `Réservation non disponible — ${nomEtablissement}`,
    annulee: `Réservation annulée — ${nomEtablissement}`,
    rappel: `Rappel : votre réservation demain — ${nomEtablissement}`,
  };
  const messages: MessageSortant[] = [{ canal: "sms", destinataire: r.client.telephone, contenu: sms[evenement] }];
  if (r.client.email)
    messages.push({
      canal: "email",
      destinataire: r.client.email,
      objet: objets[evenement],
      contenu: `Bonjour ${r.client.nom},\n\n${sms[evenement]}\n\nRéférence : ${r.reference}\n${r.montant ? `Montant estimé : ${r.montant.toLocaleString("fr-FR")} FCFA (réglé sur place)\n` : ""}\nL'équipe ${nomEtablissement}`,
    });
  return messages;
}
