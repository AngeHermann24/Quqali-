const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const moisFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatMois = (iso: string) => moisFormat.format(new Date(iso));

export const formatScore = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 });

export const itineraire = ([lat, lng]: [number, number]) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/** Distance à vol d'oiseau en km (formule de Haversine). */
export const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
