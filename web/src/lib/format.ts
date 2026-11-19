const OPT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
const OPT_MOIS: Intl.DateTimeFormatOptions = { month: "long", year: "numeric", timeZone: "UTC" };
const formats = new Map<string, Intl.DateTimeFormat>();
const df = (opt: Intl.DateTimeFormatOptions, locale = "fr-FR") => {
  const cle = `${locale}-${opt.day ? "d" : "m"}`;
  let f = formats.get(cle);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opt);
    formats.set(cle, f);
  }
  return f;
};

export const formatDate = (iso: string, locale = "fr-FR") => df(OPT_DATE, locale).format(new Date(iso));
export const formatMois = (iso: string, locale = "fr-FR") => df(OPT_MOIS, locale).format(new Date(iso));

export const formatScore = (n: number, locale = "fr-FR") =>
  n.toLocaleString(locale, { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 });

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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

