const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const moisFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatMois = (iso: string) => moisFormat.format(new Date(iso));

export const formatScore = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 });

export const itineraire = ([lat, lng]: [number, number]) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
