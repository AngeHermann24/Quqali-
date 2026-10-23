import { type AvisRapport, type CritereRapport, type DonneesRapport, LIBELLES_CRITERES, type RapportIA, statistiques } from "./rapport.ts";

const THEMES: { critere: CritereRapport; theme: string; motif: RegExp; action: string }[] = [
  { critere: "hygiene", theme: "Sanitaires", motif: /toilette|sanitaire|douche|lavabo|wc/i, action: "Afficher un planning de nettoyage des sanitaires, vérifié et émargé toutes les deux heures." },
  { critere: "hygiene", theme: "Literie et linge", motif: /drap|literie|linge|serviette|matelas/i, action: "Contrôler chaque chambre avec une fiche de vérification du linge avant l'arrivée du client." },
  { critere: "hygiene", theme: "Nuisibles", motif: /cafard|moustique|rat\b|souris|punaise|fourmi/i, action: "Programmer sans délai un traitement de désinsectisation et dératisation, puis un suivi mensuel." },
  { critere: "hygiene", theme: "Propreté générale", motif: /propre|propreté|sale|saleté|poussi|nettoy|odeur|impeccable/i, action: "Renforcer le plan de nettoyage des espaces communs avec un responsable par zone." },
  { critere: "accueil", theme: "Délais d'attente", motif: /attente|attendu|attendre|lent|long|rapide|vite|délai|retard/i, action: "Annoncer un délai d'attente réaliste dès l'arrivée et renforcer l'équipe aux heures de pointe." },
  { critere: "accueil", theme: "Courtoisie", motif: /souri|aimable|chaleureu|accueillant|poli|courtois|désagréable|froid|gentil|attentionn/i, action: "Organiser un rappel des standards d'accueil (salutation, sourire, prise de congé) en réunion d'équipe." },
  { critere: "accueil", theme: "Réservation et joignabilité", motif: /réserv|téléphone|appel|whatsapp|joindre/i, action: "Désigner une personne chargée de répondre aux appels et messages WhatsApp en moins d'une heure." },
  { critere: "presentation", theme: "Tenue du personnel", motif: /tenue|uniforme|habillé|blouse|négligé|présentable|élégant/i, action: "Vérifier chaque matin la tenue et le badge de l'équipe avant l'ouverture." },
  { critere: "presentation", theme: "Identification (badge)", motif: /badge|nom du serveur|identifi/i, action: "Équiper tout le personnel en contact client d'un badge nominatif lisible." },
  { critere: "gouvernance", theme: "Prix et facturation", motif: /prix|tarif|cher|facture|addition|devis|transparen/i, action: "Afficher les prix à l'entrée et remettre une facture détaillée systématiquement." },
  { critere: "gouvernance", theme: "Moyens de paiement", motif: /mobile money|orange money|wave|momo|paiement|carte bancaire/i, action: "Afficher clairement les moyens de paiement acceptés et vérifier le terminal chaque jour." },
];

const ALERTES = /intoxi|malade après|vomi|cafard|rat\b|souris|punaise|insalubre|périmé|discrimin|racis|maltrait|frapp|mis en danger|arnaque|escroc/i;
const NUANCE = /\s(?:mais|cependant|par contre|dommage|toutefois)\s/i;

function citation(texte: string, motif: RegExp) {
  const phrase = texte.split(/(?<=[.!?])\s+/).find((p) => motif.test(p)) ?? texte;
  const mots = phrase.trim().split(/\s+/);
  return mots.length > 15 ? `${mots.slice(0, 15).join(" ")}…` : phrase.trim();
}

function analyser(a: AvisRapport) {
  const [debut, ...suite] = a.texte.split(NUANCE);
  const reste = suite.join(" ");
  const tonDebut = a.note >= 4 ? "positif" : a.note <= 2 ? "negatif" : "mitige";
  return THEMES.flatMap((t) => {
    const dansDebut = t.motif.test(debut);
    const dansSuite = reste && t.motif.test(reste);
    if (!dansDebut && !dansSuite) return [];
    const sentiment = dansSuite && !dansDebut ? "negatif" : tonDebut;
    return [{ ...t, sentiment: sentiment as "positif" | "negatif" | "mitige", citation: citation(a.texte, t.motif), id: a.id }];
  });
}

export function genererRapportLocal(d: DonneesRapport): RapportIA {
  const stats = statistiques(d.avis);
  const mentions = d.avis.flatMap(analyser);
  const groupes = new Map<string, typeof mentions>();
  for (const m of mentions) {
    const cle = `${m.theme}|${m.sentiment === "positif" ? "positif" : "negatif"}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), m]);
  }
  const themes = [...groupes.values()]
    .map((g) => ({ critere: g[0].critere, theme: g[0].theme, sentiment: g[0].sentiment, nb_avis: new Set(g.map((m) => m.id)).size, citation: g[0].citation, action: g[0].action }))
    .sort((a, b) => b.nb_avis - a.nb_avis);
  const positifs = themes.filter((t) => t.sentiment === "positif");
  const negatifs = themes.filter((t) => t.sentiment !== "positif");
  const alertes = d.avis.filter((a) => ALERTES.test(a.texte));

  const evolution =
    stats.moyenne === null || d.moisPrecedent.moyenne === null
      ? "inconnue"
      : stats.moyenne - d.moisPrecedent.moyenne >= 0.2
        ? "hausse"
        : stats.moyenne - d.moisPrecedent.moyenne <= -0.2
          ? "baisse"
          : "stable";
  const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }));

  if (!stats.nombre)
    return {
      synthese: `Aucun avis client n'a été déposé en ${d.periode.libelle}.`,
      fiabilite: "faible",
      tendance: { evolution: "inconnue", commentaire: "Pas d'avis ce mois-ci : l'évolution ne peut pas être mesurée." },
      points_forts: [],
      points_faibles: [],
      themes: [],
      recommandations: [{ priorite: "haute", critere: "accueil", action: "Inviter chaque client à laisser un avis via le QR code affiché sur place.", justification: "Aucun avis reçu ce mois-ci." }],
      alertes: [],
      message_gerant: `Voici votre rapport de ${d.periode.libelle}.`,
    };

  return {
    synthese: [
      `En ${d.periode.libelle}, ${stats.nombre} client(s) ont laissé un avis, avec une moyenne de ${fmt(stats.moyenne)}/5.`,
      positifs[0] ? `Le point le plus apprécié est « ${positifs[0].theme.toLowerCase()} » (${positifs[0].nb_avis} avis).` : "",
      negatifs[0] ? `La principale piste d'amélioration concerne « ${negatifs[0].theme.toLowerCase()} » (${negatifs[0].nb_avis} avis).` : "",
    ]
      .filter(Boolean)
      .join(" "),
    fiabilite: stats.nombre < 5 ? "faible" : stats.nombre < 10 ? "moyenne" : "bonne",
    tendance: {
      evolution,
      commentaire:
        evolution === "inconnue"
          ? "Pas de point de comparaison avec le mois précédent."
          : `Note moyenne des avis : ${fmt(stats.moyenne)}/5 contre ${fmt(d.moisPrecedent.moyenne)}/5 le mois précédent (${evolution}).`,
    },
    points_forts: positifs.slice(0, 3).map((t) => ({ titre: t.theme, detail: `Salué dans ${t.nb_avis} avis : « ${t.citation} »`, critere: t.critere, nb_avis: t.nb_avis })),
    points_faibles: negatifs.slice(0, 3).map((t) => ({ titre: t.theme, detail: `Critiqué dans ${t.nb_avis} avis : « ${t.citation} »`, critere: t.critere, nb_avis: t.nb_avis })),
    themes: themes.map((t) => ({ critere: t.critere, theme: t.theme, sentiment: t.sentiment, nb_avis: t.nb_avis, citation: t.citation })),
    recommandations: (negatifs.length ? negatifs : positifs).slice(0, 4).map((t) => ({
      priorite: negatifs.length ? (t.nb_avis >= 3 ? "haute" : t.nb_avis === 2 ? "moyenne" : "basse") : "basse",
      critere: t.critere,
      action: negatifs.length ? t.action : `Maintenir le niveau sur « ${t.theme.toLowerCase()} » et le valoriser auprès de l'équipe.`,
      justification: `${LIBELLES_CRITERES[t.critere]} : ${t.nb_avis} avis concerné(s).`,
    })),
    alertes: alertes.map((a) => ({ gravite: "elevee", description: `Un avis signale un risque à vérifier : « ${citation(a.texte, ALERTES)} »`, avis_ids: [a.id] })),
    message_gerant: `Voici la synthèse de vos avis clients de ${d.periode.libelle}, avec les actions prioritaires du mois.`,
  };
}
