import type { AvisRapport } from "./rapport.ts";
import type { Secteur } from "../data.ts";

const TEXTES: Record<Secteur, [number, string][]> = {
  hotellerie: [
    [5, "Chambre impeccable et draps très propres. Le personnel de la réception est souriant et efficace."],
    [4, "Très bon séjour, accueil chaleureux. Mais l'attente au check-in a été un peu longue le vendredi soir."],
    [5, "Personnel élégant et bien habillé, on sent le professionnalisme. Petit-déjeuner varié."],
    [3, "Chambre correcte mais la douche avait une odeur d'humidité et le lavabo était mal nettoyé."],
    [4, "Bon rapport qualité-prix, paiement par Wave accepté, c'est pratique."],
    [2, "Attente de 40 minutes à la réception, personne ne nous a informés. Dommage car la chambre était propre."],
    [5, "Accueil aimable, la réceptionniste portait un badge et connaissait bien les environs."],
    [4, "Propreté irréprochable dans les couloirs. Mais le Wi-Fi ne fonctionnait pas dans la chambre."],
    [3, "Le séjour était correct, cependant les serviettes n'ont pas été changées pendant deux jours."],
    [5, "Équipe attentionnée et très polie, je reviendrai avec ma famille."],
    [4, "Facture claire et conforme au prix annoncé. Personnel présentable."],
    [2, "On n'arrive jamais à joindre l'hôtel au téléphone pour réserver, il a fallu se déplacer."],
    [5, "Literie confortable et chambre très propre. Merci pour l'accueil."],
    [4, "Séjour agréable, accueil rapide. Mais la piscine manquait un peu de propreté."],
  ],
  restauration: [
    [5, "Cuisine ouverte et très propre, serveurs en tenue impeccable. Le kédjénou était excellent."],
    [4, "Service rapide le midi, personnel souriant. Mais l'addition a mis du temps à arriver."],
    [3, "Plats bons mais les toilettes étaient sales et sans savon."],
    [5, "Accueil chaleureux, serveur aimable avec un badge, paiement Orange Money possible."],
    [2, "Attente d'une heure pour être servis, personne ne s'est excusé."],
    [4, "Prix affichés clairement à l'entrée, facture détaillée. Bonne ambiance."],
    [5, "Tables propres, couverts nickel, personnel élégant. Je recommande."],
    [3, "Correct, cependant le serveur était un peu froid et peu attentionné."],
    [4, "Très bon poisson braisé et propreté de la salle impeccable."],
    [4, "Réservation facile par WhatsApp, table prête à l'heure."],
    [2, "Tenue négligée de certains serveurs et tablier tâché, ça ne donne pas envie."],
    [5, "Service attentionné et rapide, tout était propre."],
  ],
  sante: [
    [5, "Locaux très propres, personnel souriant et rassurant. Le devis a été donné avant les soins."],
    [4, "Médecin à l'écoute. Mais l'attente aux urgences a été longue, plus d'une heure."],
    [5, "Infirmières en blouse propre avec badge, on sait à qui on parle."],
    [3, "Soins corrects, cependant les toilettes de la salle d'attente étaient sales."],
    [4, "Facture détaillée et conforme au devis, assurance acceptée sans problème."],
    [2, "Accueil désagréable au guichet et aucune information sur le délai d'attente."],
    [5, "Prise en charge rapide de mon enfant, personnel attentionné et poli."],
    [4, "Clinique propre et bien organisée. Rendez-vous respecté à l'heure."],
    [3, "Bonne prise en charge mais on ne peut pas joindre la clinique au téléphone le soir."],
    [5, "Équipe professionnelle et bien présentée, salle d'attente propre et climatisée."],
    [4, "Paiement par Mobile Money accepté, très pratique. Accueil aimable."],
  ],
  services: [
    [5, "Personnel en tenue avec badge, salon très propre. Rendez-vous respecté à la minute."],
    [4, "Bon accueil et matériel impeccable. Légère attente le samedi après-midi."],
    [3, "Prestation correcte, mais le devis annoncé au téléphone n'était pas le même sur place."],
    [5, "Locaux impeccables, équipe professionnelle. Tarifs affichés clairement."],
    [4, "Rapide et soigné. La caissière m'a remis un ticket sans que je le demande."],
    [2, "Deux heures d'attente malgré le rendez-vous, personne ne s'est excusé."],
    [5, "Travail soigné, personnel poli et bien présenté. Je recommande."],
    [4, "Bon rapport qualité-prix, paiement Wave accepté. Accueil souriant."],
  ],
  education: [
    [5, "Classes aérées et propres, enseignants disponibles. La direction répond vite."],
    [4, "Bon encadrement des enfants, cantine propre. Portail bien gardé."],
    [3, "Enseignants compétents mais l'accueil du secrétariat est peu aimable."],
    [5, "Factures claires et scolarité conforme aux tarifs annoncés. Personnel présentable."],
    [2, "Personne ne répond au téléphone pour les inscriptions, il faut se déplacer."],
    [4, "Infirmerie propre, surveillants attentifs à la sortie."],
    [5, "Suivi des notes en ligne impeccable, enseignants ponctuels."],
    [4, "Locaux bien entretenus, enfants encadrés dès le portail."],
  ],
  commerce: [
    [5, "Sanitaires propres, sécurité présente et courtoise. Climatisation efficace."],
    [4, "Boutiques variées et allées propres. Parking sécurisé."],
    [3, "Agréable, mais les toilettes du food court manquaient de savon."],
    [5, "Accueil de l'information impeccable, plan clair des boutiques."],
    [4, "Bien tenu, personnel visible et aimable dans les allées."],
    [2, "Parking bondé et mal indiqué, aucun agent pour orienter."],
    [5, "Un centre commercial propre et rassurant, agents en tenue."],
    [4, "Food court propre, tables débarrassées rapidement."],
  ],
  transport: [
    [5, "Départ pile à l'heure, bus propre et conducteur courtois."],
    [4, "Guichet organisé, billets nominatifs. Bagages étiquetés, rassurant."],
    [3, "Bus propre mais départ avec 30 minutes de retard sans information."],
    [5, "Chauffeur en tenue, tarifs affichés et respectés. Voyage confortable."],
    [2, "Guichet fermé à l'heure prévue, personne ne donne d'explication."],
    [4, "Climatisation au top, personnel du terminal aimable."],
    [5, "Embarquement fluide, sièges propres. Je reprendrai cette compagnie."],
    [4, "Tarif affiché respecté, conducteur prudent."],
  ],
};

function graine(texte: string) {
  let h = 2166136261;
  for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function avisDemo(secteur: Secteur, mois: string, etablissementId: string): AvisRapport[] {
  const alea = graine(`${etablissementId}-${mois}`);
  const textes = [...TEXTES[secteur]].sort(() => alea() - 0.5);
  const nombre = 7 + Math.floor(alea() * 6);
  const [annee, m] = mois.split("-").map(Number);
  const joursDansMois = new Date(Date.UTC(annee, m, 0)).getUTCDate();
  return textes
    .slice(0, nombre)
    .map(([note, texte], i) => ({ id: `A${i + 1}`, date: `${mois}-${String(1 + Math.floor(alea() * joursDansMois)).padStart(2, "0")}`, note, texte }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a, i) => ({ ...a, id: `A${i + 1}` }));
}

export const moisPrecedent = (mois: string) => {
  const [a, m] = mois.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
};

export const libelleMois = (mois: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mois}-01T00:00:00Z`));
