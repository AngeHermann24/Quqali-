import type { Reservation } from "./reservation.ts";

/* Génération d'un fichier .ics (iCalendar) pour « Ajouter au calendrier ». */

const dtIcs = (date: string, heure = "00:00") => `${date.replaceAll("-", "")}T${heure.replace(":", "")}00`;

const icsDate = (iso: string) => iso.replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");

/** Texte .ics d'une réservation (rendez-vous créneau ou séjour hôtelier). */
export function fichierIcs(r: Reservation, nomEtablissement: string, adresse: string): string {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Qualite+//Reservations//FR",
    "BEGIN:VEVENT",
    `UID:${r.id}@qualiteplus`,
    `DTSTAMP:${icsDate(r.creeLe)}`,
    `SUMMARY:Réservation — ${nomEtablissement}`,
    `LOCATION:${adresse.replaceAll(",", "\\,")}`,
    `DESCRIPTION:Référence ${r.reference}`,
  ];
  if (r.secteur === "hotellerie" && r.arrivee && r.depart) {
    lignes.push(`DTSTART:${r.arrivee.replaceAll("-", "")}`, `DTEND:${r.depart.replaceAll("-", "")}`);
  } else if (r.date) {
    const debut = dtIcs(r.date, r.heure);
    const finMin = Number((r.heure ?? "12:00").slice(0, 2)) * 60 + Number((r.heure ?? "12:00").slice(3)) + 90;
    const fin = `${String(Math.floor(finMin / 60)).padStart(2, "0")}:${String(finMin % 60).padStart(2, "0")}`;
    lignes.push(`DTSTART:${debut}`, `DTEND:${dtIcs(r.date, fin)}`);
  }
  lignes.push("END:VEVENT", "END:VCALENDAR");
  return lignes.join("\r\n");
}
