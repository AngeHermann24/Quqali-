import type { Secteur } from "./data";

export type StatutAvis = "publie" | "en_verification" | "rejete" | "signale";

export const STATUTS_AVIS: Record<StatutAvis, string> = {
  publie: "Publié",
  en_verification: "En vérification",
  rejete: "Rejeté",
  signale: "Signalé",
};

export interface CompteClient {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  creeLe: string;
}

export type PreuveVisite = { type: "reservation"; ref: string } | { type: "code"; code: string };

export interface AvisClient {
  id: string;
  etablissementId: string;
  compteId: string;
  auteur: string;
  date: string;
  note: number;
  personnel?: Record<string, number>;
  commentaire: string;
  preuve: PreuveVisite;
  statut: StatutAvis;
  motifRejet?: string;
}

export const ROLES_PERSONNEL: Record<Secteur, { id: string; label: string }[]> = {
  hotellerie: [
    { id: "reception", label: "Réception" },
    { id: "etage", label: "Personnel d'étage" },
    { id: "restauration", label: "Restaurant / bar" },
  ],
  restauration: [
    { id: "service", label: "Serveurs" },
    { id: "accueil", label: "Accueil" },
  ],
  sante: [
    { id: "guichet", label: "Accueil / guichet" },
    { id: "soignants", label: "Infirmiers et soignants" },
    { id: "medecins", label: "Médecins" },
  ],
  services: [
    { id: "accueil", label: "Accueil / caisse" },
    { id: "techniciens", label: "Techniciens et praticiens" },
  ],
  education: [
    { id: "secretariat", label: "Secrétariat / accueil" },
    { id: "enseignants", label: "Enseignants et formateurs" },
    { id: "encadrement", label: "Encadrement et surveillants" },
  ],
  commerce: [
    { id: "accueil", label: "Accueil / sécurité" },
    { id: "vendeurs", label: "Vendeurs et caissiers" },
  ],
  transport: [
    { id: "guichet", label: "Accueil / guichet" },
    { id: "conducteurs", label: "Chauffeurs et conducteurs" },
    { id: "controleurs", label: "Contrôleurs" },
  ],
};

const hachage = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
};

/** Code remis au client sur place (QR code / ticket). En production : code unique par visite. */
export const codeVisiteDemo = (etablissementId: string) => `VIS-${String(1000 + (hachage(etablissementId) % 9000))}`;

export const telephoneNorm = (t: string) => {
  const chiffres = t.replace(/\D/g, "");
  return chiffres.slice(-10).replace(/^(?:225)/, "");
};

export const masquerNom = (nom: string) => {
  const parties = nom.trim().split(/\s+/);
  return parties.length > 1 ? `${parties[0]} ${parties.at(-1)![0].toUpperCase()}.` : parties[0];
};

export interface SaisieAvis {
  compte: CompteClient;
  note: number;
  commentaire: string;
  preuve: PreuveVisite;
}

export interface ContexteModeration {
  etablissementId: string;
  avisExistants: AvisClient[];
  codesValides: string[];
  reservationsElegibles: string[];
  avisDuCompte: AvisClient[];
  telephoneResponsable?: string;
}

export function modererAvis(saisie: SaisieAvis, ctx: ContexteModeration, maintenant: string): { statut: StatutAvis; motif?: string } {
  const { compte, note, commentaire, preuve } = saisie;
  const texte = commentaire.trim();
  if (!Number.isInteger(note) || note < 1 || note > 5) return { statut: "rejete", motif: "La note doit être un entier entre 1 et 5." };
  if (texte.length < 20) return { statut: "rejete", motif: "Commentaire trop court : décrivez votre visite en au moins 20 caractères." };
  if (/https?:\/\/|www\./i.test(texte)) return { statut: "rejete", motif: "Les liens ne sont pas autorisés dans les avis." };
  if (ctx.telephoneResponsable && telephoneNorm(compte.telephone) === telephoneNorm(ctx.telephoneResponsable))
    return { statut: "rejete", motif: "Vous ne pouvez pas évaluer votre propre établissement." };

  const utilises = new Set(ctx.avisExistants.filter((a) => a.statut !== "rejete").map((a) => (a.preuve.type === "reservation" ? `r:${a.preuve.ref}` : `c:${a.preuve.code}:${a.compteId}`)));
  if (preuve.type === "reservation") {
    if (!ctx.reservationsElegibles.includes(preuve.ref)) return { statut: "rejete", motif: "Cette réservation est introuvable, non confirmée ou appartient à un autre compte." };
    if (utilises.has(`r:${preuve.ref}`)) return { statut: "rejete", motif: "Cette réservation a déjà donné lieu à un avis : un seul avis par visite." };
  } else {
    if (!ctx.codesValides.includes(preuve.code.trim().toUpperCase())) return { statut: "rejete", motif: "Code de visite invalide. Il figure sur le QR code ou le ticket remis sur place." };
    if (utilises.has(`c:${preuve.code.trim().toUpperCase()}:${compte.id}`)) return { statut: "rejete", motif: "Vous avez déjà publié un avis pour cette visite." };
  }

  const jour = maintenant.slice(0, 10);
  if (ctx.avisDuCompte.filter((a) => a.date.startsWith(jour)).length >= 3)
    return { statut: "en_verification", motif: "Volume inhabituel d'avis : votre avis sera publié après vérification par l'équipe Qualité+." };
  return { statut: "publie" };
}

export function creerAvis(saisie: SaisieAvis, ctx: ContexteModeration, maintenant: string, rang: number, personnel?: Record<string, number>): AvisClient {
  const moderation = modererAvis(saisie, ctx, maintenant);
  return {
    id: `avis-${ctx.etablissementId}-${rang}`,
    etablissementId: ctx.etablissementId,
    compteId: saisie.compte.id,
    auteur: masquerNom(saisie.compte.nom),
    date: maintenant,
    note: saisie.note,
    personnel: personnel && Object.keys(personnel).length ? personnel : undefined,
    commentaire: saisie.commentaire.trim(),
    preuve: saisie.preuve,
    statut: moderation.statut,
    motifRejet: moderation.motif,
  };
}

export function notesPersonnel(avis: AvisClient[]) {
  const parRole = new Map<string, { somme: number; nombre: number }>();
  let sommeG = 0;
  let nbG = 0;
  for (const a of avis) {
    if (!a.personnel) continue;
    const valeurs = Object.values(a.personnel);
    sommeG += valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
    nbG++;
    for (const [role, note] of Object.entries(a.personnel)) {
      const r = parRole.get(role) ?? { somme: 0, nombre: 0 };
      parRole.set(role, { somme: r.somme + note, nombre: r.nombre + 1 });
    }
  }
  return {
    parRole: [...parRole.entries()].map(([role, r]) => ({ role, moyenne: Math.round((r.somme / r.nombre) * 10) / 10, nombre: r.nombre })),
    globale: nbG ? Math.round((sommeG / nbG) * 10) / 10 : null,
    nombre: nbG,
  };
}
