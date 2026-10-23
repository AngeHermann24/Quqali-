import type { Intervenant } from "./regles";

/** Agents évaluateurs et accompagnateurs (équipe interne + partenaires validés). */
export const INTERVENANTS: Intervenant[] = [
  { id: "ag-kone", nom: "Ibrahim Koné", roles: ["agent"], secteurs: ["hotellerie", "restauration", "sante", "services", "education", "commerce", "transport"], zones: ["Cocody", "Plateau"] },
  { id: "ag-nguessan", nom: "Aya N'Guessan", roles: ["agent"], secteurs: ["hotellerie", "restauration", "services", "commerce", "transport"], zones: ["Marcory", "Treichville", "Koumassi"] },
  { id: "ag-bamba", nom: "Serge Bamba", roles: ["agent"], secteurs: ["sante", "education", "services"], zones: ["Yopougon", "Cocody"] },
  { id: "int-diabate", nom: "Awa Diabaté (équipe qualité)", roles: ["accompagnateur", "agent"], secteurs: ["hotellerie", "restauration", "sante", "services", "education", "commerce", "transport"], zones: ["Cocody", "Plateau", "Marcory"] },
  { id: "ac-toure", nom: "Dr Mariam Touré", roles: ["accompagnateur", "agent"], secteurs: ["sante", "hotellerie", "education"], zones: ["Cocody", "Plateau"] },
  { id: "ac-ake", nom: "Jean-Luc Aké", roles: ["accompagnateur"], secteurs: ["restauration", "hotellerie", "commerce", "services"], zones: ["Marcory", "Koumassi", "Treichville"] },
  { id: "ac-coulibaly", nom: "Fatim Coulibaly", roles: ["accompagnateur"], secteurs: ["hotellerie", "restauration", "sante", "transport"], zones: ["Yopougon", "Abobo"] },
];

export const EQUIPE_INTERNE_ID = "int-diabate";

export const nomIntervenant = (id?: string, extra: Intervenant[] = []) => [...INTERVENANTS, ...extra].find((i) => i.id === id)?.nom ?? "—";
