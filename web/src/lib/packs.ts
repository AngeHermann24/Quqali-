import type { Pack } from "@/lib/data";

export const PACKS: { pack: Pack; nom: string; accroche: string; avantages: string[] }[] = [
  {
    pack: "basique",
    nom: "Basique",
    accroche: "L'essentiel pour être visible et reconnu.",
    avantages: ["Fiche établissement standard", "Badge « Qualité certifiée » et note détaillée", "Avis clients vérifiés et réponses", "Participation aux Awards annuels"],
  },
  {
    pack: "premium",
    nom: "Premium",
    accroche: "Pour convertir vos visiteurs en clients.",
    avantages: ["Tout le pack Basique", "Visite virtuelle 3D", "Réservation / prise de RDV en ligne", "Rapport mensuel IA (avis, tendances, recommandations)"],
  },
];

export const nomPack = (pack: Pack) => (pack === "premium" ? "Premium" : "Basique");

export const COMPARATIF: { label: string; basique: boolean | string; premium: boolean | string; neutre?: boolean }[] = [
  { label: "Audit sur place, note de gouvernance et contrôles réguliers", basique: "Identiques", premium: "Identiques", neutre: true },
  { label: "Badge « Qualité certifiée »", basique: true, premium: true },
  { label: "Fiche établissement (photos, horaires, contact, carte)", basique: true, premium: true },
  { label: "Note détaillée par critère", basique: true, premium: true },
  { label: "Avis clients vérifiés et réponses", basique: true, premium: true },
  { label: "Participation aux Awards annuels", basique: true, premium: true },
  { label: "Visite virtuelle 3D", basique: false, premium: true },
  { label: "Réservation / prise de rendez-vous en ligne", basique: false, premium: true },
  { label: "Rapport mensuel IA (avis, tendances, recommandations)", basique: false, premium: true },
];
