import { ETABLISSEMENTS, type Secteur } from "@/lib/data";
import { CONFIG_RESERVATION_DEFAUT, type ConfigReservation } from "@/lib/reservation";

const PERSONNALISATIONS: Record<string, (c: ConfigReservation) => ConfigReservation> = {
  "saveurs-d-akwaba": (c) => ({
    ...c,
    restaurant: { ...c.restaurant, services: [{ nom: "Déjeuner", debut: "11:30", fin: "15:00" }, { nom: "Dîner", debut: "19:00", fin: "23:00" }], couvertsParCreneau: 24, joursFermes: [0] },
  }),
  "hotel-lagune-bleue": (c) => ({
    ...c,
    hotel: {
      ...c.hotel,
      chambres: [
        { id: "standard", nom: "Chambre Deluxe vue jardin", capacite: 2, stock: 40, prix: 65000 },
        { id: "superieure", nom: "Chambre Prestige vue lagune", capacite: 2, stock: 30, prix: 90000 },
        { id: "suite", nom: "Suite Lagune", capacite: 4, stock: 6, prix: 180000 },
      ],
    },
  }),
  "hotel-bassam-plage": (c) => ({
    ...c,
    autoConfirmation: true,
    hotel: {
      ...c.hotel,
      chambres: [
        { id: "standard", nom: "Chambre côté jardin", capacite: 2, stock: 10, prix: 45000 },
        { id: "superieure", nom: "Bungalow pieds dans l'eau", capacite: 3, stock: 6, prix: 75000 },
      ],
    },
  }),
  "polyclinique-du-plateau": (c) => ({
    ...c,
    sante: {
      praticiens: [
        { id: "cardio", nom: "Dr N'Dri", specialite: "Cardiologie", jours: [1, 3, 5], debut: "08:00", fin: "12:00", dureeMinutes: 30 },
        { id: "ophtalmo", nom: "Dr Coulibaly", specialite: "Ophtalmologie", jours: [2, 4], debut: "09:00", fin: "16:00", dureeMinutes: 20 },
        { id: "bilan", nom: "Équipe bilans", specialite: "Bilan de santé entreprise", jours: [1, 2, 3, 4, 5], debut: "07:30", fin: "10:30", dureeMinutes: 30 },
      ],
    },
  }),
};

export const configParDefaut = (etablissementId: string) => (PERSONNALISATIONS[etablissementId] ?? ((c) => c))(CONFIG_RESERVATION_DEFAUT);

export interface EtablissementGere {
  id: string;
  nom: string;
  secteur: Secteur;
  commune: string;
  noteLabel: number | null;
  noteDate?: string;
  notePrecedente?: number;
  visite3d?: string;
  demo: boolean;
}

export const ETABLISSEMENTS_DEMO_PREMIUM = ETABLISSEMENTS.filter((e) => e.pack === "premium");
