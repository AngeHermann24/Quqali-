import type { Secteur } from "./data.ts";

/* Libellés de l'écran Réservation, par secteur (maquette usager).
   Modifier ici pour ajuster les titres et onglets sans toucher au composant. */

export interface ConfigReserver {
  titre: string;
  sousTitre: (nom: string) => string;
  ongletOffre: string;
  champTemps1: string;
  champTemps2?: string;
  champPersonnes: string;
  unitePersonnes: string;
}

export const RESERVER_PAR_SECTEUR: Record<Secteur, ConfigReserver> = {
  restauration: {
    titre: "Réserver une table",
    sousTitre: (nom) => `Choisissez vos préférences pour une expérience inoubliable ${nom}.`,
    ongletOffre: "Menu",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Nombre de personnes",
    unitePersonnes: "couverts",
  },
  hotellerie: {
    titre: "Réserver une chambre",
    sousTitre: (nom) => `Choisissez vos dates et votre chambre pour un séjour serein ${nom}.`,
    ongletOffre: "Chambres",
    champTemps1: "Arrivée",
    champTemps2: "Départ",
    champPersonnes: "Chambre & voyageurs",
    unitePersonnes: "voyageurs",
  },
  sante: {
    titre: "Prendre rendez-vous",
    sousTitre: (nom) => `Choisissez la spécialité, la date et l'heure de votre consultation ${nom}.`,
    ongletOffre: "Services",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Spécialité",
    unitePersonnes: "patients",
  },
  services: {
    titre: "Prendre rendez-vous",
    sousTitre: (nom) => `Choisissez le créneau qui vous arrange ${nom}.`,
    ongletOffre: "Prestations",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Nombre de personnes",
    unitePersonnes: "personnes",
  },
  education: {
    titre: "Réserver une visite",
    sousTitre: (nom) => `Choisissez le créneau de votre visite ${nom}.`,
    ongletOffre: "Formations",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Nombre de personnes",
    unitePersonnes: "visiteurs",
  },
  commerce: {
    titre: "Réserver un créneau",
    sousTitre: (nom) => `Choisissez le créneau qui vous arrange ${nom}.`,
    ongletOffre: "Offre",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Nombre de personnes",
    unitePersonnes: "personnes",
  },
  transport: {
    titre: "Réserver un trajet",
    sousTitre: (nom) => `Choisissez la date et l'heure de votre trajet ${nom}.`,
    ongletOffre: "Lignes",
    champTemps1: "Date",
    champTemps2: "Heure",
    champPersonnes: "Nombre de passagers",
    unitePersonnes: "passagers",
  },
};

export const PREPOSITION_NOM: Record<Secteur, string> = {
  restauration: "au",
  hotellerie: "à",
  sante: "à",
  services: "chez",
  education: "à",
  commerce: "chez",
  transport: "avec",
};
