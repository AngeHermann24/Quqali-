import { normaliser } from "./format.ts";

/* Calcul « ouvert maintenant » à partir des horaires libres des fiches
   (ex. « Lundi – Samedi · 07:00 – 21:00 », « 24 h/24 », « Fermé »). */

const JOURS_SEMAINE: Record<string, number> = {
  dimanche: 0,
  dim: 0,
  lundi: 1,
  lun: 1,
  mardi: 2,
  mar: 2,
  mercredi: 3,
  mer: 3,
  jeudi: 4,
  jeu: 4,
  vendredi: 5,
  ven: 5,
  samedi: 6,
  sam: 6,
};

export interface HorairesJour {
  jours: string;
  heures: string;
}

const PLAGE = /(\d{1,2})[:h](\d{2})\s*[-–]\s*(\d{1,2})[:h](\d{2})/g;

function dansPlage(debut: number, fin: number, minutes: number) {
  // Plage à cheval sur minuit : « 17:00 – 01:00 » couvre 22:00 comme 00:30.
  return debut <= fin ? minutes >= debut && minutes < fin : minutes >= debut || minutes < fin;
}

/** Le libellé « jours » couvre-t-il le jour demandé (0 = dimanche … 6 = samedi) ? */
export function couvreJour(jours: string, jour: number): boolean {
  const t = normaliser(jours);
  if (/tous|7\s?j/.test(t)) return true;
  const trouves = (t.match(/[a-z]+/g) ?? []).map((x) => JOURS_SEMAINE[x]).filter((j): j is number => j !== undefined);
  if (trouves.length === 0) return true; // « Réception », « Urgences », « Guichet »… : tous les jours
  if (trouves.length === 1) return jour === trouves[0];
  const a = trouves[0];
  const b = trouves[trouves.length - 1];
  return a <= b ? jour >= a && jour <= b : jour >= a || jour <= b; // « Mardi – Dimanche » passe par samedi→dimanche
}

function plages(heures: string) {
  return [...normaliser(heures).matchAll(PLAGE)].map((m) => ({
    debut: Number(m[1]) * 60 + Number(m[2]),
    fin: Number(m[3]) * 60 + Number(m[4]),
  }));
}

/** Le libellé « heures » couvre-t-il l'instant (en minutes depuis minuit) ? */
export function couvreHeure(heures: string, minutes: number): boolean {
  const t = normaliser(heures);
  if (/24\s?h/.test(t)) return true;
  if (/ferm/.test(t)) return false;
  return plages(heures).some((p) => dansPlage(p.debut, p.fin, minutes));
}

/** L'établissement est-il ouvert à l'instant donné ? (une seule entrée d'horaires suffit) */
export function estOuvert(horaires: HorairesJour[], date: Date): boolean {
  const jour = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  const hier = (jour + 6) % 7;
  return horaires.some((h) => {
    if (couvreJour(h.jours, jour) && couvreHeure(h.heures, minutes)) return true;
    // Service de la veille qui passe minuit (« 17:00 – 01:00 » ouvert à 00:30).
    if (couvreJour(h.jours, hier) && !/ferm/.test(normaliser(h.heures)))
      return plages(h.heures).some((p) => p.fin <= p.debut && minutes < p.fin);
    return false;
  });
}

const heureCourte = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}h${minutes % 60 ? String(minutes % 60).padStart(2, "0") : ""}`;

/** Plages d'ouverture du jour, formatées « 08h – 23h » (ou « 24h/24 », « Fermé »). */
export function plageDuJour(horaires: HorairesJour[], date: Date): string | null {
  const jour = date.getDay();
  for (const h of horaires) {
    if (!couvreJour(h.jours, jour)) continue;
    const t = normaliser(h.heures);
    if (/24\s?h/.test(t)) return "24h/24";
    if (/ferm/.test(t)) continue;
    const p = plages(h.heures);
    if (p.length) return p.map((x) => `${heureCourte(x.debut)} – ${heureCourte(x.fin)}`).join(" · ");
  }
  return null;
}

/** Heure de la prochaine ouverture (« 08h ») quand l'établissement est fermé, sinon null. */
export function prochaineHeure(horaires: HorairesJour[], date: Date): string | null {
  const minutes = date.getHours() * 60 + date.getMinutes();
  for (let decal = 0; decal < 7; decal++) {
    const jour = (date.getDay() + decal) % 7;
    const debuts = horaires.filter((h) => couvreJour(h.jours, jour) && !/ferm/.test(normaliser(h.heures))).flatMap((h) => plages(h.heures).map((p) => p.debut));
    const cible = debuts.filter((d) => decal > 0 || d > minutes).sort((a, b) => a - b)[0];
    if (cible !== undefined) return heureCourte(cible);
  }
  return null;
}
