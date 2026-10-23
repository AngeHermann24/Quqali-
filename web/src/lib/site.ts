export const SITE = {
  name: "Quqliter",
  tagline: "Le label de confiance des établissements de Côte d'Ivoire",
  description:
    "Hôtels, restaurants et établissements de santé audités sur place. Seuls ceux qui atteignent 80 % de performance sont listés.",
  seuil: 80,
};

/** Navigation de l'univers usagers (grand public) — aucun lien vers les espaces pro. */
export const NAV = [
  { href: "/etablissements", label: "Établissements" },
  { href: "/awards", label: "Awards" },
  { href: "/methodologie", label: "Notre méthodologie" },
];

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
