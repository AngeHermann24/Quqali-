import type { Secteur } from "./data";
import { scoreGlobal } from "./scores.ts";
import type { Scores } from "./scores";
import type { ConfigTarifs, Transaction } from "./abonnement";
import { etatAbonnement } from "./abonnement.ts";
import type { AvisClient } from "./avis";
import type { Etablissement } from "./data";
import type { Dossier, DossierPartenaire, StatutDossier } from "./espace";
import { type Intervenant, type LienAccompagnement, agentsEligibles } from "./regles.ts";

/* ---------- Gestion des établissements (suspension, retrait de badge) ---------- */

export interface GestionEtablissement {
  /** Date ISO de suspension de la fiche publique. */
  suspendu?: string;
  /** Date ISO du retrait du badge « Qualité certifiée ». */
  badgeRetire?: string;
}
export type Gestion = Record<string, GestionEtablissement>;

export type EtatPublic = "actif" | "badge_retire" | "suspendu";
export const etatPublic = (g?: GestionEtablissement): EtatPublic => (g?.suspendu ? "suspendu" : g?.badgeRetire ? "badge_retire" : "actif");

export const suspendre = (g: Gestion, id: string, date: string): Gestion => ({ ...g, [id]: { ...g[id], suspendu: date } });
export const retablir = (g: Gestion, id: string): Gestion => {
  const copie = { ...g[id] };
  delete copie.suspendu;
  return { ...g, [id]: copie };
};
export const retirerBadge = (g: Gestion, id: string, date: string): Gestion => ({ ...g, [id]: { ...g[id], badgeRetire: date } });
export const remettreBadge = (g: Gestion, id: string): Gestion => {
  const copie = { ...g[id] };
  delete copie.badgeRetire;
  return { ...g, [id]: copie };
};

/* ---------- Candidatures d'établissements ---------- */

/** Un dossier peut passer en audit une fois l'agent indépendant assigné. */
export const peutDemarrerAudit = (d: Pick<Dossier, "statut" | "agentAuditId">) => d.statut === "soumis" && !!d.agentAuditId;

export function demarrerAudit<T extends Pick<Dossier, "statut" | "agentAuditId" | "historique">>(d: T, agentId: string, date: string): T {
  if (d.statut !== "soumis") throw new Error("Seul un dossier soumis peut passer en audit.");
  return { ...d, statut: "en_audit", agentAuditId: agentId, historique: [...d.historique, { statut: "en_audit", date }] };
}

/** Le résultat de l'audit décide seul de l'admission : ≥ 80 % admis, sinon refusé. */
export function enregistrerResultatAudit<T extends { statut: StatutDossier; historique: Dossier["historique"] }>(d: T, scores: Scores, date: string) {
  if (d.statut !== "en_audit") throw new Error("Le dossier doit être en audit pour enregistrer un résultat.");
  const global = scoreGlobal(scores);
  const statut: StatutDossier = global >= 80 ? "admis" : "refuse";
  return { ...d, statut, audit: { date, scores, global }, historique: [...d.historique, { statut, date }] };
}

export function refuserDossier<T extends Pick<Dossier, "statut" | "historique">>(d: T, date: string): T {
  if (d.statut !== "soumis") throw new Error("Seul un dossier soumis peut être refusé pour pièces.");
  return { ...d, statut: "refuse", historique: [...d.historique, { statut: "refuse", date }] };
}

/** Liste les agents autorisés à auditer (rôle agent, secteur, indépendance, rotation) avec le motif d'exclusion. */
export const candidatsAgent = (cible: { id: string; secteur: Secteur }, intervenants: Intervenant[], liens: LienAccompagnement[], dernierAgentId?: string) =>
  agentsEligibles(cible, intervenants, liens, dernierAgentId);

/** Liens d'accompagnement issus du dossier : l'accompagnateur ne peut jamais auditer son client. */
export const liensDuDossier = (d: Pick<Dossier, "id" | "accompagnement">): LienAccompagnement[] =>
  d.accompagnement?.accompagnateurId ? [{ accompagnateurId: d.accompagnement.accompagnateurId, etablissementId: d.id }] : [];

/* ---------- Candidatures partenaires ---------- */

export type StatutPartenaireAdmin = "soumis" | "entretien" | "valide" | "refuse";
export type CandidatPartenaire = Omit<DossierPartenaire, "id"> & { id: string };
export const transitionPartenaire = (p: CandidatPartenaire, statut: StatutPartenaireAdmin, date: string): CandidatPartenaire => ({
  ...p,
  statut,
  historique: [...p.historique, { statut, date }],
});

/* ---------- Statistiques globales ---------- */

export interface StatsGlobales {
  certifies: number;
  parSecteur: Record<Secteur, number>;
  scoreMoyen: number;
  candidaturesEnAttente: number;
  enAudit: number;
  avisTotal: number;
  avisPublies: number;
  avisEnAttente: number;
  avisMoyenne: number | null;
  abonnementsActifs: number;
  suspendus: number;
  badgesRetires: number;
  revenusTotal: number;
  revenusMois: number;
}

export function statistiquesGlobales(entree: {
  etablissements: Etablissement[];
  dossiersAdmis: Dossier[];
  candidatures: Pick<Dossier, "statut">[];
  transactions: Transaction[];
  avis: AvisClient[];
  gestion: Gestion;
  aujourdhui: string;
  config: ConfigTarifs;
}): StatsGlobales {
  const { etablissements, dossiersAdmis, candidatures, transactions, avis, gestion, aujourdhui, config } = entree;
  const parSecteur: Record<Secteur, number> = { hotellerie: 0, restauration: 0, sante: 0, services: 0, education: 0, commerce: 0, transport: 0 };
  for (const e of etablissements) parSecteur[e.secteur]++;
  for (const d of dossiersAdmis) parSecteur[d.secteur]++;

  const scores = [...etablissements.map((e) => scoreGlobal(e.scores)), ...dossiersAdmis.map((d) => d.audit?.global ?? 0)].filter((s) => s > 0);
  const notes = avis.filter((a) => a.statut === "publie").map((a) => a.note);
  const reussies = transactions.filter((t) => t.statut === "reussi");
  const mois = aujourdhui.slice(0, 7);
  const abos = dossiersAdmis.filter((d) => d.abonnement && ["actif", "expire_bientot", "grace"].includes(etatAbonnement(d.abonnement, aujourdhui, config).statut));

  return {
    certifies: etablissements.length + dossiersAdmis.length,
    parSecteur,
    scoreMoyen: scores.length ? Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10 : 0,
    candidaturesEnAttente: candidatures.filter((d) => d.statut === "soumis").length,
    enAudit: candidatures.filter((d) => d.statut === "en_audit").length,
    avisTotal: avis.length,
    avisPublies: notes.length,
    avisEnAttente: avis.filter((a) => a.statut === "en_verification" || a.statut === "signale").length,
    avisMoyenne: notes.length ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : null,
    abonnementsActifs: etablissements.length + abos.length,
    suspendus: Object.values(gestion).filter((g) => g.suspendu).length,
    badgesRetires: Object.values(gestion).filter((g) => g.badgeRetire && !g.suspendu).length,
    revenusTotal: reussies.reduce((s, t) => s + t.montant, 0),
    revenusMois: reussies.filter((t) => t.date.startsWith(mois)).reduce((s, t) => s + t.montant, 0),
  };
}

/* ---------- Données de démonstration ---------- */

export const DOSSIERS_CANDIDATURES_DEMO: Dossier[] = [
  {
    id: "cand-safran-palace",
    nom: "Hôtel Safran Palace",
    secteur: "hotellerie",
    sousType: "Hôtel 3 étoiles",
    description: "Hôtel d'affaires de 42 chambres au cœur du Plateau, avec salle de séminaire et restaurant.",
    ville: "Abidjan",
    commune: "Plateau",
    quartier: "Plateau centre",
    adresse: "Avenue Chardy, face à la Cathédrale",
    responsable: { nom: "Yao Konan", fonction: "Directeur général", telephone: "07 09 11 22 33", email: "direction@safranpalace.ci" },
    documents: [
      { type: "rccm", nom: "rccm-safran.pdf" },
      { type: "licence", nom: "licence-touristique.pdf" },
      { type: "assurance", nom: "assurance-rc.pdf" },
      { type: "photos", nom: "photos-etablissement.zip" },
    ],
    parcours: "B",
    statut: "soumis",
    historique: [{ statut: "soumis", date: "2026-10-18T09:14:00.000Z" }],
    reponsesAvis: {},
    accompagnement: {
      mode: "partenaire",
      accompagnateurId: "",
      besoins: ["hygiene", "accueil"],
      disponibilites: "Jours ouvrés, matinées",
      message: "Nous voulons préparer l'audit avec un accompagnateur partenaire avant la première visite.",
      dateDemande: "2026-10-18T09:14:00.000Z",
      plan: [],
    },
  },
  {
    id: "cand-debarcadere",
    nom: "Restaurant Le Débarcadère",
    secteur: "restauration",
    sousType: "Restaurant de poissons",
    description: "Spécialités de poissons braisés et attiéké, terrasse face à la lagune, 60 couverts.",
    ville: "Grand-Bassam",
    commune: "Grand-Bassam",
    quartier: "Ancien Bassam",
    adresse: "Boulevard du Bord de mer",
    responsable: { nom: "Adjoua Ekra", fonction: "Propriétaire", telephone: "05 04 22 33 44", email: "contact@debarcadere.ci" },
    documents: [
      { type: "rccm", nom: "rccm-debarcadere.pdf" },
      { type: "autorisation", nom: "autorisation-exploitation.pdf" },
      { type: "sanitaire", nom: "carnets-sanitaires.pdf" },
    ],
    parcours: "A",
    statut: "en_audit",
    agentAuditId: "ag-nguessan",
    historique: [
      { statut: "soumis", date: "2026-10-09T14:30:00.000Z" },
      { statut: "en_audit", date: "2026-10-16T10:05:00.000Z" },
    ],
    reponsesAvis: {},
  },
  {
    id: "cand-saint-viateur",
    nom: "Clinique Saint-Viateur",
    secteur: "sante",
    sousType: "Clinique générale",
    description: "Clinique de quartier : consultations, maternité, imagerie. 18 lits, 9 praticiens.",
    ville: "Abidjan",
    commune: "Yopougon",
    quartier: "Selmer",
    adresse: "Rue des Écoles, Selmer",
    responsable: { nom: "Dr Brice Kouassi", fonction: "Directeur médical", telephone: "07 07 44 55 66", email: "direction@saint-viateur.ci" },
    documents: [
      { type: "rccm", nom: "rccm-saint-viateur.pdf" },
      { type: "agrement", nom: "agrement-ms.pdf" },
      { type: "ordre", nom: "inscriptions-ordre.pdf" },
    ],
    parcours: "A",
    statut: "soumis",
    historique: [{ statut: "soumis", date: "2026-10-20T16:41:00.000Z" }],
    reponsesAvis: {},
  },
  {
    id: "cand-groupe-scolaire-lumieres",
    nom: "Groupe Scolaire Les Lumières",
    secteur: "education",
    sousType: "École primaire privée",
    description: "École primaire de 240 élèves avec cantine et infirmerie, en pleine expansion à Angre.",
    ville: "Abidjan",
    commune: "Cocody",
    quartier: "Angre",
    adresse: "Angre, 8e tranche, lot 214",
    responsable: { nom: "N'Guessan Affoué", fonction: "Directrice", telephone: "07 07 12 34 56", email: "direction@leslumieres.ci" },
    documents: [
      { type: "rccm", nom: "rccm-lumieres.pdf" },
      { type: "autorisation", nom: "autorisation-ministere.pdf" },
      { type: "photos", nom: "photos-ecole.zip" },
    ],
    parcours: "A",
    statut: "soumis",
    historique: [{ statut: "soumis", date: "2026-10-21T08:05:00.000Z" }],
    reponsesAvis: {},
  },
];

export const CANDIDATURES_PARTENAIRES_DEMO: CandidatPartenaire[] = [
  {
    id: "part-kouadio",
    nom: "Kouadio N'Guessan",
    telephone: "07 08 77 66 55",
    email: "k.nguessan@conseil.ci",
    secteurs: ["restauration", "hotellerie"],
    zones: ["Marcory", "Koumassi", "Treichville"],
    experience: 7,
    certifications: "Lead auditor ISO 9001, HACCP",
    references: "Cabinet Altitude Conseil, Abidjan",
    agentHabilite: false,
    documents: [{ type: "cv", nom: "cv-kouadio.pdf" }],
    statut: "soumis",
    historique: [{ statut: "soumis", date: "2026-10-19T11:20:00.000Z" }],
  },
  {
    id: "part-aminata",
    nom: "Aminata Sylla",
    telephone: "05 05 88 77 66",
    email: "a.sylla@sante-qualite.ci",
    secteurs: ["sante"],
    zones: ["Cocody", "Plateau", "Yopougon"],
    experience: 11,
    certifications: "Accréditation HAS, qualité hospitalière",
    references: "CHU de Cocody, service qualité",
    agentHabilite: true,
    documents: [
      { type: "cv", nom: "cv-aminata.pdf" },
      { type: "certifications", nom: "certifications.pdf" },
    ],
    statut: "entretien",
    historique: [
      { statut: "soumis", date: "2026-10-11T08:10:00.000Z" },
      { statut: "entretien", date: "2026-10-17T15:00:00.000Z" },
    ],
  },
];

const tx = (id: string, rang: number, date: string, pack: "basique" | "premium", periodicite: "mensuel" | "annuel", montant: number, moyen: Transaction["moyen"]): Transaction => ({
  id,
  reference: `QC-${date.slice(0, 10).replaceAll("-", "")}-${String(rang).padStart(4, "0")}`,
  date: `${date}T10:00:00.000Z`,
  type: "souscription",
  pack,
  periodicite,
  periodeDebut: `${date}T00:00:00.000Z`,
  periodeFin: `${date}T00:00:00.000Z`,
  lignes: [{ libelle: `Pack ${pack === "premium" ? "Premium" : "Basique"}`, montant }],
  montant,
  moyen,
  compte: "07 •• •• •• ••",
  statut: "reussi",
  facture: `FAC-${date.slice(0, 4)}-${String(rang).padStart(5, "0")}`,
});

/** Paiements de démonstration des établissements listés (les vraies transactions du dossier s'y ajoutent). */
export const TRANSACTIONS_DEMO: Transaction[] = [
  tx("tx-demo-1", 1, "2026-10-02", "premium", "annuel", 459000, "orange"),
  tx("tx-demo-2", 2, "2026-10-05", "basique", "mensuel", 15000, "wave"),
  tx("tx-demo-3", 3, "2026-10-08", "premium", "mensuel", 45000, "mtn"),
  tx("tx-demo-4", 4, "2026-10-12", "basique", "annuel", 153000, "carte"),
  tx("tx-demo-5", 5, "2026-10-17", "premium", "mensuel", 45000, "orange"),
  tx("tx-demo-6", 6, "2026-10-19", "basique", "mensuel", 15000, "wave"),
  tx("tx-demo-7", 7, "2026-09-15", "premium", "mensuel", 45000, "orange"),
  tx("tx-demo-8", 8, "2026-09-22", "basique", "mensuel", 15000, "mtn"),
];
