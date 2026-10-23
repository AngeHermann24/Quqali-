import type { Pack } from "./data";

export type Periodicite = "mensuel" | "annuel";
export type MoyenPaiement = "orange" | "mtn" | "wave" | "carte";
export type StatutAbonnement = "aucun" | "actif" | "expire_bientot" | "grace" | "suspendu";

export interface ConfigTarifs {
  prix: Record<Pack, number>;
  remiseAnnuelle: number;
  delaiGrace: number;
  rappels: number[];
  tva: number;
}

export const CONFIG_DEFAUT: ConfigTarifs = {
  prix: { basique: 15000, premium: 45000 },
  remiseAnnuelle: 15,
  delaiGrace: 7,
  rappels: [15, 7, 1],
  tva: 18,
};

export const MOYENS: Record<MoyenPaiement, { label: string; type: "mobile" | "carte"; prefixes?: string[]; instruction: string }> = {
  orange: { label: "Orange Money", type: "mobile", prefixes: ["07"], instruction: "Composez #144*82# ou validez la notification Orange Money pour confirmer." },
  mtn: { label: "MTN MoMo", type: "mobile", prefixes: ["05"], instruction: "Validez la demande de paiement reçue sur votre téléphone MTN MoMo." },
  wave: { label: "Wave", type: "mobile", instruction: "Ouvrez l'application Wave et approuvez le paiement." },
  carte: { label: "Carte bancaire", type: "carte", instruction: "Saisissez le code de sécurité 3-D Secure reçu par SMS." },
};

export interface Abonnement {
  pack: Pack;
  periodicite: Periodicite;
  debut: string;
  fin: string;
  moyen: MoyenPaiement;
  compte: string;
  renouvellementAuto: boolean;
}

export interface LigneFacture {
  libelle: string;
  montant: number;
}

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  type: "souscription" | "renouvellement" | "renouvellement_auto" | "changement";
  pack: Pack;
  periodicite: Periodicite;
  periodeDebut: string;
  periodeFin: string;
  lignes: LigneFacture[];
  montant: number;
  moyen: MoyenPaiement;
  compte: string;
  statut: "reussi" | "echoue";
  motif?: string;
  facture?: string;
}

export interface AvecPaiements {
  abonnement?: Abonnement;
  transactions?: Transaction[];
}

const JOUR = 24 * 60 * 60 * 1000;
const t = (iso: string) => new Date(iso).getTime();
export const ajouterJoursIso = (iso: string, jours: number) => new Date(t(iso) + jours * JOUR).toISOString();
export const ajouterMois = (iso: string, mois: number) => {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString();
};
export const dureeMois = (p: Periodicite) => (p === "annuel" ? 12 : 1);
const arrondir = (n: number) => Math.round(n / 100) * 100;

export function montantPeriode(config: ConfigTarifs, pack: Pack, periodicite: Periodicite) {
  const mensuel = config.prix[pack];
  return periodicite === "annuel" ? arrondir(mensuel * 12 * (1 - config.remiseAnnuelle / 100)) : mensuel;
}

export function decomposerTTC(ttc: number, tva: number) {
  const ht = Math.round(ttc / (1 + tva / 100));
  return { ht, tva: ttc - ht, ttc };
}

export function etatAbonnement(ab: Abonnement | undefined, aujourdhui: string, config: ConfigTarifs) {
  if (!ab) return { statut: "aucun" as StatutAbonnement, visible: false, joursRestants: 0, finGrace: undefined, rappels: [] };
  const finGrace = ajouterJoursIso(ab.fin, config.delaiGrace);
  const joursRestants = Math.ceil((t(ab.fin) - t(aujourdhui)) / JOUR);
  const rappels = [...config.rappels]
    .sort((a, b) => b - a)
    .map((jours) => {
      const date = ajouterJoursIso(ab.fin, -jours);
      return { jours, date, envoye: t(aujourdhui) >= t(date) };
    });
  const statut: StatutAbonnement =
    t(aujourdhui) >= t(finGrace) ? "suspendu" : t(aujourdhui) >= t(ab.fin) ? "grace" : joursRestants <= Math.max(0, ...config.rappels) ? "expire_bientot" : "actif";
  return { statut, visible: statut !== "suspendu", joursRestants, finGrace, rappels };
}

export function prochainePeriode(ab: Abonnement | undefined, aujourdhui: string, periodicite: Periodicite, config: ConfigTarifs) {
  const continuite = ab && etatAbonnement(ab, aujourdhui, config).statut !== "suspendu";
  const debut = continuite ? ab.fin : aujourdhui;
  return { debut, fin: ajouterMois(debut, dureeMois(periodicite)) };
}

export function creditProrata(ab: Abonnement | undefined, derniere: Transaction | undefined, aujourdhui: string) {
  if (!ab || !derniere || t(aujourdhui) >= t(ab.fin)) return 0;
  const total = t(ab.fin) - t(ab.debut);
  return total > 0 ? arrondir((derniere.montant * (t(ab.fin) - t(aujourdhui))) / total) : 0;
}

export function devis(
  dossier: AvecPaiements,
  aujourdhui: string,
  config: ConfigTarifs,
  choix: { pack: Pack; periodicite: Periodicite; type: Transaction["type"] },
) {
  const montant = montantPeriode(config, choix.pack, choix.periodicite);
  if (choix.type !== "changement") {
    const { debut, fin } = prochainePeriode(dossier.abonnement, aujourdhui, choix.periodicite, config);
    return { debut, fin, joursOfferts: 0, lignes: [{ libelle: libellePeriode(choix.pack, choix.periodicite), montant }], total: montant };
  }
  const derniere = dossier.transactions?.find((x) => x.statut === "reussi");
  const creditTotal = creditProrata(dossier.abonnement, derniere, aujourdhui);
  const credit = Math.min(montant, creditTotal);
  const finBase = ajouterMois(aujourdhui, dureeMois(choix.periodicite));
  const joursPeriode = Math.round((t(finBase) - t(aujourdhui)) / JOUR);
  const joursOfferts = creditTotal > credit && montant > 0 ? Math.round(((creditTotal - credit) / montant) * joursPeriode) : 0;
  const lignes = [{ libelle: libellePeriode(choix.pack, choix.periodicite), montant }];
  if (credit)
    lignes.push({
      libelle: `Avoir prorata (période non consommée)${joursOfferts ? ` — reliquat converti en ${joursOfferts} jours offerts` : ""}`,
      montant: -credit,
    });
  return { debut: aujourdhui, fin: ajouterJoursIso(finBase, joursOfferts), joursOfferts, lignes, total: montant - credit };
}

export function enregistrerPaiement<T extends AvecPaiements>(dossier: T, tx: Transaction, abonnement?: Abonnement): T {
  return {
    ...dossier,
    abonnement: tx.statut === "reussi" && abonnement ? abonnement : dossier.abonnement,
    transactions: [tx, ...(dossier.transactions ?? [])],
  };
}

export const numeroFacture = (date: string, rang: number) => `FAC-${date.slice(0, 4)}-${String(rang).padStart(5, "0")}`;
export const reference = (date: string, rang: number) => `QC-${date.slice(0, 10).replaceAll("-", "")}-${String(rang).padStart(4, "0")}`;

export const normaliserNumero = (numero: string) => numero.replace(/[\s.-]/g, "").replace(/^(\+|00)225/, "");

export function validerNumero(moyen: MoyenPaiement, numero: string): string | null {
  const n = normaliserNumero(numero);
  if (!/^(01|05|07)\d{8}$/.test(n)) return "Numéro ivoirien à 10 chiffres attendu (ex. 07 00 00 00 00).";
  const prefixes = MOYENS[moyen].prefixes;
  if (prefixes && !prefixes.some((p) => n.startsWith(p))) return `Ce numéro n'est pas un numéro ${MOYENS[moyen].label} (préfixe ${prefixes.join(" ou ")}).`;
  return null;
}

export function validerCarte(numero: string, expiration: string, aujourdhui: string): string | null {
  const n = numero.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(n)) return "Numéro de carte invalide.";
  const somme = [...n].reverse().reduce((s, c, i) => {
    let d = Number(c);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    return s + d;
  }, 0);
  if (somme % 10) return "Numéro de carte invalide.";
  const m = /^(\d{2})\/(\d{2})$/.exec(expiration);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return "Date d'expiration invalide (MM/AA).";
  const fin = Date.UTC(2000 + Number(m[2]), Number(m[1]), 1);
  if (fin <= t(aujourdhui)) return "Cette carte est expirée.";
  return null;
}

export const masquer = (moyen: MoyenPaiement, valeur: string) => {
  const n = moyen === "carte" ? valeur.replace(/\s/g, "") : normaliserNumero(valeur);
  return moyen === "carte" ? `•••• ${n.slice(-4)}` : `${n.slice(0, 2)} •• •• ${n.slice(-4, -2)} ${n.slice(-2)}`;
};

export function resultatSimule(moyen: MoyenPaiement, valeur: string): { reussi: boolean; motif?: string } {
  const n = moyen === "carte" ? valeur.replace(/\s/g, "") : normaliserNumero(valeur);
  if (moyen === "carte" && n === "4000000000000002") return { reussi: false, motif: "Carte refusée par la banque." };
  if (moyen !== "carte" && n.endsWith("0000")) return { reussi: false, motif: "Solde insuffisant." };
  return { reussi: true };
}

export function traiterEcheances<T extends AvecPaiements>(dossier: T, aujourdhui: string, config: ConfigTarifs, echecForce = false): T {
  let d = dossier;
  for (let i = 0; i < 36; i++) {
    const ab = d.abonnement;
    if (!ab?.renouvellementAuto || t(aujourdhui) < t(ab.fin)) break;
    const dejaTente = d.transactions?.some((x) => x.type === "renouvellement_auto" && x.periodeDebut === ab.fin);
    if (dejaTente) break;
    const rang = (d.transactions?.length ?? 0) + 1;
    const montant = montantPeriode(config, ab.pack, ab.periodicite);
    const periodeFin = ajouterMois(ab.fin, dureeMois(ab.periodicite));
    const tx: Transaction = {
      id: `tx-${rang}`,
      reference: reference(ab.fin, rang),
      date: ab.fin,
      type: "renouvellement_auto",
      pack: ab.pack,
      periodicite: ab.periodicite,
      periodeDebut: ab.fin,
      periodeFin,
      lignes: [{ libelle: libellePeriode(ab.pack, ab.periodicite), montant }],
      montant,
      moyen: ab.moyen,
      compte: ab.compte,
      statut: echecForce ? "echoue" : "reussi",
      motif: echecForce ? "Prélèvement automatique refusé." : undefined,
      facture: echecForce ? undefined : numeroFacture(ab.fin, (d.transactions?.filter((x) => x.facture).length ?? 0) + 1),
    };
    d = enregistrerPaiement(d, tx, { ...ab, debut: ab.fin, fin: periodeFin });
    if (echecForce) break;
  }
  return d;
}

export const libellePeriode = (pack: Pack, periodicite: Periodicite) =>
  `Pack ${pack === "premium" ? "Premium" : "Basique"} — abonnement ${periodicite === "annuel" ? "annuel (12 mois)" : "mensuel (1 mois)"}`;
