import type { Dossier } from "./espace";
import { SCORES_SIMULES, ajouterJours, maintenant } from "./espace";
import { scoreGlobal } from "./data";
import type { Transaction } from "./abonnement";

/** Compte de connexion à l'app Pro (démo : localStorage). */
export interface ComptePro {
  tel: string;
  responsable: string;
  role: "gerant" | "responsable" | "comptable";
  demoId?: string;
  creeLe: string;
}

export const ROLES_PRO: Record<ComptePro["role"], { label: string; droits: string }> = {
  gerant: { label: "Gérant", droits: "Tous les droits : dossier, abonnement, fiche, avis, réservations, utilisateurs." },
  responsable: { label: "Responsable", droits: "Avis et réservations." },
  comptable: { label: "Comptable", droits: "Paiements et factures." },
};

const j = (n: number) => ajouterJours("2026-11-02", n);

function dossierDemo(p: Partial<Dossier> & Pick<Dossier, "id" | "nom" | "secteur" | "sousType" | "commune" | "quartier" | "adresse">): Dossier {
  return {
    description: "",
    ville: "Abidjan",
    responsable: { nom: "", fonction: "Gérant", telephone: "", email: "" },
    documents: [
      { type: "rccm", nom: "rccm.pdf" },
      { type: "autorisation", nom: "autorisation.pdf" },
    ],
    parcours: "A",
    statut: "soumis",
    historique: [{ statut: "soumis", date: j(-12) }],
    reponsesAvis: {},
    ...p,
  };
}

const scores = SCORES_SIMULES.admis;

export interface CompteDemo {
  id: string;
  etablissement: string;
  secteur: string;
  situation: string;
  responsable: string;
  tel: string;
  dossier: () => Dossier;
}

/** Les trois comptes fictifs de démonstration : candidature, Basique, Premium. */
export const COMPTES_DEMO: CompteDemo[] = [
  {
    id: "demo-tanti",
    etablissement: "Restaurant Chez Tanti",
    secteur: "Restauration · Marcory",
    situation: "Candidature en cours — audit programmé",
    responsable: "Aya Koné",
    tel: "+225 07 47 00 11 22",
    dossier: () =>
      dossierDemo({
        id: "resto-chez-tanti",
        nom: "Restaurant Chez Tanti",
        secteur: "restauration",
        sousType: "Restaurant",
        description: "Cuisine ivoirienne et grillades, salle climatisée de 60 places.",
        commune: "Marcory",
        quartier: "Zone 4",
        adresse: "Boulevard VGE, Zone 4",
        coords: [5.303, -3.984],
        statut: "en_audit",
        agentAuditId: "ag-nguessan",
        historique: [
          { statut: "soumis", date: j(-12) },
          { statut: "en_audit", date: j(-4) },
        ],
        responsable: { nom: "Aya Koné", fonction: "Gérante", telephone: "+225 07 47 00 11 22", email: "aya.kone@example.com" },
      }),
  },
  {
    id: "demo-palmier",
    etablissement: "Hôtel Le Palmier",
    secteur: "Hôtellerie · Cocody",
    situation: "Admis — pack Premium",
    responsable: "Marc N'Guessan",
    tel: "+225 05 66 44 33 22",
    dossier: () =>
      dossierDemo({
        id: "hotel-le-palmier",
        nom: "Hôtel Le Palmier",
        secteur: "hotellerie",
        sousType: "Hôtel 4 étoiles",
        description: "Un hôtel moderne et confortable, situé au cœur de Cocody. Nous vous offrons un service de qualité et une expérience unique.",
        commune: "Cocody",
        quartier: "Riviera Palmeraie",
        adresse: "Rue des Minimes, Riviera 3",
        coords: [5.353, -3.959],
        statut: "admis",
        agentAuditId: "ag-kone",
        historique: [
          { statut: "soumis", date: j(-40) },
          { statut: "en_audit", date: j(-25) },
          { statut: "admis", date: j(-18) },
        ],
        audit: { date: j(-18), scores, global: scoreGlobal(scores) },
        abonnement: { pack: "premium", periodicite: "mensuel", debut: j(-15), fin: j(15), moyen: "orange", compte: "05 66 44 33 22", renouvellementAuto: true },
        visite3d: "https://my.matterport.com/show/?m=demo-palmier",
        transactions: [
          {
            id: "tx-palmier-1",
            reference: "QCI-2026-0041",
            date: j(-15),
            type: "souscription",
            pack: "premium",
            periodicite: "mensuel",
            periodeDebut: j(-15),
            periodeFin: j(15),
            lignes: [{ libelle: "Abonnement Premium — 1 mois", montant: 29900 }],
            montant: 29900,
            moyen: "orange",
            compte: "05 66 44 33 22",
            statut: "reussi",
            facture: "F-2026-0041",
          },
        ],
        responsable: { nom: "Marc N'Guessan", fonction: "Directeur", telephone: "+225 05 66 44 33 22", email: "direction@baie-sirenes.ci" },
      }),
  },
  {
    id: "demo-sainte-famille",
    etablissement: "Clinique Sainte-Famille",
    secteur: "Santé · Cocody",
    situation: "Admise — pack Basique",
    responsable: "Dr Fatou Traoré",
    tel: "+225 07 09 88 77 66",
    dossier: () =>
      dossierDemo({
        id: "clinique-sainte-famille",
        nom: "Clinique Sainte-Famille",
        secteur: "sante",
        sousType: "Clinique privée",
        description: "Médecine générale, pédiatrie et imagerie. Urgences 24 h/24.",
        commune: "Cocody",
        quartier: "Deux Plateaux",
        adresse: "Rue L143, Deux Plateaux",
        coords: [5.377, -4.005],
        statut: "admis",
        agentAuditId: "ag-bamba",
        historique: [
          { statut: "soumis", date: j(-70) },
          { statut: "en_audit", date: j(-55) },
          { statut: "admis", date: j(-48) },
        ],
        audit: { date: j(-48), scores: { hygiene: 91, accueil: 87, presentation: 89, gouvernance: 88 }, global: scoreGlobal({ hygiene: 91, accueil: 87, presentation: 89, gouvernance: 88 }) },
        abonnement: { pack: "basique", periodicite: "mensuel", debut: j(-45), fin: j(15), moyen: "wave", compte: "07 09 88 77 66", renouvellementAuto: true },
        transactions: [] satisfies Transaction[],
        responsable: { nom: "Dr Fatou Traoré", fonction: "Directrice médicale", telephone: "+225 07 09 88 77 66", email: "contact@clinique-palmiers.ci" },
      }),
  },
];

/** Installe le dossier du compte démo dans le stockage local (appelé à la connexion). */
export function dossierDuCompte(compte: ComptePro): Dossier | null {
  const demo = COMPTES_DEMO.find((c) => c.id === compte.demoId);
  return demo ? demo.dossier() : null;
}

export const nouveauComptePro = (tel: string, responsable: string): ComptePro => ({ tel, responsable, role: "gerant", creeLe: maintenant() });
