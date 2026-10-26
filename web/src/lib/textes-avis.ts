/* Textes et libellés de l'écran « Donner un avis » — aucun texte en dur dans les composants. */

export const CRITERES_AVIS = [
  { id: "hygiene", label: "Hygiène" },
  { id: "accueil", label: "Accueil" },
  { id: "presentation", label: "Présentation du personnel" },
] as const;

export type CritereAvisId = (typeof CRITERES_AVIS)[number]["id"];

/** Étiquette affichée sous les étoiles selon la note 1–5. */
export const ETIQUETTES_NOTE = ["Insuffisant", "Moyen", "Correct", "Très bien", "Excellent"] as const;

/** Puces de motif affichées quand une note vaut 2 étoiles ou moins. */
export const PUCES_PLAINTES = ["Propreté des lieux", "Attente trop longue", "Accueil froid", "Tenue du personnel", "Autre"] as const;

/** Suggestions de début de commentaire, proposées selon les bonnes notes déjà données. */
export const SUGGESTIONS_COMMENTAIRE = ["Service impeccable", "Salle très propre", "Accueil chaleureux", "Personnel soigné"] as const;

export const TEXTES_AVIS = {
  titre: "Donner un avis",
  visite: (date: string) => `Votre visite du ${date}`,
  etapeNotes: "1. Notez votre expérience",
  etapeCommentaire: "2. Votre commentaire",
  etapePhotos: "3. Ajoutez des photos",
  optionnel: "optionnel",
  placeholderCommentaire: "Partagez votre expérience en quelques mots...",
  rappelCourtoisie: "Restez courtois : les avis injurieux sont refusés.",
  questionPlaint: "Que s'est-il passé ?",
  ajouterPhotos: "Ajouter des photos",
  prendrePhoto: "Prendre une photo",
  choisirGalerie: "Choisir dans la galerie",
  infoPhotos: "Évitez de photographier des personnes sans leur accord.",
  publier: "Publier mon avis",
  enCours: "Publication en cours...",
  enregistrer: "Enregistrer les modifications",
  succesTitre: "Merci pour votre avis !",
  succesTexte: "Il sera publié après vérification, généralement sous 24 heures.",
  succesContribution: "Votre avis aide d'autres usagers à choisir en confiance.",
  retourReservations: "Retour à mes réservations",
  explorerAutres: "Explorer d'autres établissements",
  refusTitre: "Votre avis n'a pas pu être publié",
  refusAction: "Modifier mon avis et le renvoyer",
  dejaNoteTitre: "Vous avez déjà donné votre avis",
  dejaNoteAction: "Voir mon avis publié",
  delaiDepasseTitre: "Délai dépassé",
  delaiDepasseTexte: "Le délai pour donner votre avis est de 30 jours après la visite.",
  pasDeVisiteTitre: "Pas encore de visite",
  pasDeVisiteTexte: "Vous pourrez donner votre avis après votre visite.",
  codeVisite: "J'ai un code de visite (QR ou ticket)",
  quitterTitre: "Quitter sans publier ?",
  quitterTexte: "Vos notes et votre commentaire seront conservés en brouillon.",
  quitterRester: "Rester",
  quitterQuitter: "Quitter",
  horsLigne: "Avis enregistré, envoi dès que la connexion revient.",
} as const;

export const MAX_PHOTOS = 4;
export const MAX_TAILLE_PHOTO = 5 * 1024 * 1024;
export const LARGEUR_PHOTO = 1600;
export const DELAI_AVIS_JOURS = 30;
export const DELAI_MODIFICATION_JOURS = 7;
