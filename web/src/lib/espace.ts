import type { Abonnement, Transaction } from "@/lib/abonnement";
import { type CritereKey, type Scores, type Secteur, scoreGlobal } from "@/lib/data";
import { type Intervenant, type LienAccompagnement, assignerAgent } from "@/lib/regles";

export const CLES = {
  dossier: "qualite-dossier-etablissement",
  partenaire: "qualite-dossier-partenaire",
  missions: "qualite-missions-partenaire",
  config: "qualite-config-tarifs",
  horloge: "qualite-horloge-demo",
  reservations: "qualite-reservations",
  configReservation: "qualite-config-reservation",
  messages: "qualite-messages-envoyes",
  rapports: "qualite-rapports-ia",
  compte: "qualite-compte-client",
  comptePro: "qualite-compte-pro",
  avis: "qualite-avis",
  favoris: "qualite-favoris",
  gestion: "qualite-gestion-etablissements",
  candidatures: "qualite-candidatures-etablissements",
  candidaturesPartenaires: "qualite-candidatures-partenaires",
  affectations: "qualite-affectations-audits",
};

export const jour = 24 * 60 * 60 * 1000;
export const ajouterJours = (iso: string, jours: number) => new Date(new Date(iso).getTime() + jours * jour).toISOString();
export const maintenant = () => new Date().toISOString();

export type StatutDossier = "soumis" | "en_audit" | "admis" | "refuse";

export const STATUTS: Record<StatutDossier, { label: string; description: string }> = {
  soumis: { label: "Soumis", description: "Dossier reçu, vérification des documents en cours." },
  en_audit: { label: "En audit", description: "Un agent évaluateur indépendant est assigné à votre établissement." },
  admis: { label: "Admis", description: "Note supérieure ou égale à 80 % : vous pouvez choisir votre pack." },
  refuse: { label: "Refusé", description: "Note inférieure à 80 % : rapport détaillé et accompagnement possible." },
};

export interface DocumentJoint {
  type: string;
  nom: string;
}

export interface ActionPlan {
  id: string;
  critere: CritereKey;
  action: string;
  echeance: string;
  fait: boolean;
}

export interface Accompagnement {
  mode: "nous" | "partenaire";
  accompagnateurId: string;
  besoins: CritereKey[];
  disponibilites: string;
  message: string;
  dateDemande: string;
  plan: ActionPlan[];
  pretLe?: string;
  dateReaudit?: string;
  agentReauditId?: string;
}

export interface Dossier {
  id: string;
  nom: string;
  secteur: Secteur;
  sousType: string;
  description: string;
  ville: string;
  commune: string;
  quartier: string;
  adresse: string;
  coords?: [number, number];
  responsable: { nom: string; fonction: string; telephone: string; email: string };
  documents: DocumentJoint[];
  parcours: "A" | "B";
  statut: StatutDossier;
  historique: { statut: StatutDossier; date: string }[];
  agentAuditId?: string;
  creneauAudit?: string;
  audit?: { date: string; scores: Scores; global: number };
  abonnement?: Abonnement;
  transactions?: Transaction[];
  visite3d?: string;
  reponsesAvis: Record<string, string>;
  accompagnement?: Accompagnement;
}

export const DOCUMENTS_REQUIS: Record<Secteur, { type: string; label: string; obligatoire: boolean }[]> = {
  hotellerie: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "licence", label: "Licence d'exploitation touristique", obligatoire: true },
    { type: "assurance", label: "Attestation d'assurance RC", obligatoire: false },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  restauration: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "autorisation", label: "Autorisation d'exploitation", obligatoire: true },
    { type: "sanitaire", label: "Carnets sanitaires du personnel", obligatoire: false },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  sante: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "agrement", label: "Agrément du Ministère de la Santé", obligatoire: true },
    { type: "ordre", label: "Inscriptions à l'Ordre des praticiens", obligatoire: true },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  services: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "autorisation", label: "Autorisation d'exploitation", obligatoire: true },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  education: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "autorisation", label: "Autorisation d'ouverture (MEN / tutelle)", obligatoire: true },
    { type: "personnel", label: "Attestations du personnel enseignant", obligatoire: true },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  commerce: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "autorisation", label: "Autorisation d'exploitation", obligatoire: true },
    { type: "securite", label: "Certificat de sécurité incendie", obligatoire: false },
    { type: "photos", label: "Photos de l'établissement", obligatoire: false },
  ],
  transport: [
    { type: "rccm", label: "Registre du commerce (RCCM)", obligatoire: true },
    { type: "licence", label: "Licence de transport (LTC)", obligatoire: true },
    { type: "flotte", label: "Cartes grises et assurances de la flotte", obligatoire: false },
    { type: "photos", label: "Photos des véhicules", obligatoire: false },
  ],
};

import { INTERVENANTS } from "@/lib/intervenants";
export { EQUIPE_INTERNE_ID, INTERVENANTS, nomIntervenant } from "@/lib/intervenants";

export const PLAN_TYPE: Record<CritereKey, string[]> = {
  hygiene: ["Rédiger et afficher un plan de nettoyage émargé", "Signer un contrat de dératisation et désinsectisation"],
  accueil: ["Former l'équipe d'accueil (salutation, délais, réclamations)", "Ouvrir un registre des réclamations"],
  presentation: ["Doter le personnel de tenues et de badges nominatifs", "Diffuser une charte de présentation et d'hygiène"],
  gouvernance: ["Afficher les prix et mettre à jour les autorisations", "Formaliser les fiches de poste et la déclaration CNPS"],
};

export const genererPlan = (besoins: CritereKey[], depart: string): ActionPlan[] =>
  besoins.flatMap((c) => PLAN_TYPE[c].map((action, i) => ({ id: `${c}-${i}`, critere: c, action, echeance: ajouterJours(depart, 14 + i * 14), fait: false })));

export const delaiReaudit = (global: number) => (global >= 70 ? 30 : 90);

export function planifierReaudit(dossier: Dossier, accompagnateurId: string) {
  const liens: LienAccompagnement[] = [{ accompagnateurId, etablissementId: dossier.id }];
  return assignerAgent({ id: dossier.id, secteur: dossier.secteur, commune: dossier.commune }, INTERVENANTS, liens, dossier.agentAuditId);
}

export const SCORES_SIMULES: Record<"admis" | "refuse", Scores> = {
  admis: { hygiene: 88, accueil: 84, presentation: 86, gouvernance: 83 },
  refuse: { hygiene: 78, accueil: 76, presentation: 72, gouvernance: 70 },
};

export const auditSimule = (resultat: "admis" | "refuse") => {
  const scores = SCORES_SIMULES[resultat];
  return { date: maintenant(), scores, global: scoreGlobal(scores) };
};

export const AVIS_DEMO = [
  { id: "avis-1", auteur: "Adjoua K.", date: "2026-10-12", note: 5, commentaire: "Accueil chaleureux et locaux impeccables. Le badge m'a rassurée." },
  { id: "avis-2", auteur: "Moussa D.", date: "2026-10-08", note: 4, commentaire: "Très bon service, un peu d'attente à l'arrivée." },
  { id: "avis-3", auteur: "Linda B.", date: "2026-10-02", note: 4, commentaire: "Personnel bien présenté et souriant. Je reviendrai." },
];

export type StatutPartenaire = "soumis" | "entretien" | "valide" | "refuse";

export const ETAPES_PARTENAIRE: { statut: StatutPartenaire; label: string; description: string }[] = [
  { statut: "soumis", label: "Dossier soumis", description: "Vérification de votre CV, de vos références et certifications." },
  { statut: "entretien", label: "Entretien", description: "Échange avec l'équipe qualité et signature de la charte déontologique." },
  { statut: "valide", label: "Validé", description: "Vous recevez des missions selon vos secteurs et vos zones." },
];

export interface DossierPartenaire {
  id: "moi";
  nom: string;
  telephone: string;
  email: string;
  secteurs: Secteur[];
  zones: string[];
  experience: number;
  certifications: string;
  references: string;
  agentHabilite: boolean;
  documents: DocumentJoint[];
  statut: StatutPartenaire;
  historique: { statut: StatutPartenaire; date: string }[];
}

export const partenaireCommeIntervenant = (p: DossierPartenaire): Intervenant => ({
  id: p.id,
  nom: `${p.nom} (vous)`,
  roles: p.agentHabilite ? ["accompagnateur", "agent"] : ["accompagnateur"],
  secteurs: p.secteurs,
  zones: p.zones,
});

export type StatutMission = "proposee" | "en_cours" | "pret" | "terminee" | "refusee";

export interface Mission {
  id: string;
  etablissementId: string;
  etablissement: string;
  secteur: Secteur;
  commune: string;
  diagnostic: Scores;
  besoins: CritereKey[];
  demandeLe: string;
  statutInitial: StatutMission;
  resultatReaudit?: number;
}

export interface EtatMission {
  statut: StatutMission;
  faits: string[];
  seances: { date: string; objet: string; compteRendu: string }[];
  accepteeLe?: string;
  pretLe?: string;
  agentReauditId?: string;
  resultatReaudit?: number;
}

export const MISSIONS: Mission[] = [
  {
    id: "m-palmier-dor",
    etablissementId: "hotel-palmier-dor",
    etablissement: "Hôtel Le Palmier d'Or",
    secteur: "hotellerie",
    commune: "Koumassi",
    diagnostic: { hygiene: 70, accueil: 78, presentation: 74, gouvernance: 68 },
    besoins: ["hygiene", "gouvernance"],
    demandeLe: "2026-09-02",
    statutInitial: "en_cours",
  },
  {
    id: "m-bon-coin",
    etablissementId: "maquis-le-bon-coin",
    etablissement: "Maquis Le Bon Coin",
    secteur: "restauration",
    commune: "Koumassi",
    diagnostic: { hygiene: 64, accueil: 80, presentation: 66, gouvernance: 65 },
    besoins: ["hygiene", "presentation", "gouvernance"],
    demandeLe: "2026-10-10",
    statutInitial: "proposee",
  },
  {
    id: "m-bethel",
    etablissementId: "centre-sante-bethel",
    etablissement: "Centre de santé Béthel",
    secteur: "sante",
    commune: "Cocody",
    diagnostic: { hygiene: 74, accueil: 79, presentation: 77, gouvernance: 72 },
    besoins: ["hygiene", "accueil"],
    demandeLe: "2026-10-14",
    statutInitial: "proposee",
  },
  {
    id: "m-la-terrasse",
    etablissementId: "restaurant-la-terrasse",
    etablissement: "Restaurant La Terrasse",
    secteur: "restauration",
    commune: "Cocody",
    diagnostic: { hygiene: 72, accueil: 81, presentation: 75, gouvernance: 70 },
    besoins: ["hygiene", "gouvernance"],
    demandeLe: "2026-05-04",
    statutInitial: "terminee",
    resultatReaudit: 84.2,
  },
];

export const getMission = (id: string) => MISSIONS.find((m) => m.id === id);

export const etatInitial = (m: Mission): EtatMission => ({
  statut: m.statutInitial,
  faits: m.statutInitial === "terminee" ? genererPlan(m.besoins, m.demandeLe).map((a) => a.id) : m.statutInitial === "en_cours" ? ["hygiene-0"] : [],
  seances:
    m.statutInitial === "proposee"
      ? []
      : [{ date: ajouterJours(m.demandeLe, 7), objet: "Diagnostic sur place", compteRendu: "Visite complète, priorisation des actions avec la direction." }],
  accepteeLe: m.statutInitial === "proposee" ? undefined : ajouterJours(m.demandeLe, 2),
  resultatReaudit: m.resultatReaudit,
});

export const STATUTS_MISSION: Record<StatutMission, { label: string; ton: "neutre" | "succes" | "primaire" | "alerte" }> = {
  proposee: { label: "Proposée", ton: "primaire" },
  en_cours: { label: "En cours", ton: "primaire" },
  pret: { label: "Réaudit planifié", ton: "succes" },
  terminee: { label: "Terminée", ton: "succes" },
  refusee: { label: "Refusée", ton: "neutre" },
};

export const liensPartenaire = (etats: Record<string, EtatMission>) =>
  MISSIONS.filter((m) => ["en_cours", "pret", "terminee"].includes(etats[m.id].statut)).map((m) => ({ accompagnateurId: "moi", etablissementId: m.etablissementId }));

export const AUDITS_PROPOSES = [
  { id: "aud-terrasse", etablissementId: "restaurant-la-terrasse", etablissement: "Restaurant La Terrasse", secteur: "restauration" as Secteur, type: "Contrôle annuel", date: "2026-11-05" },
  { id: "aud-akwaba", etablissementId: "saveurs-d-akwaba", etablissement: "Saveurs d'Akwaba", secteur: "restauration" as Secteur, type: "Contrôle inopiné", date: "2026-11-12" },
  { id: "aud-palmiers", etablissementId: "clinique-les-palmiers", etablissement: "Clinique Les Palmiers", secteur: "sante" as Secteur, type: "Contrôle annuel", date: "2026-11-20" },
];
