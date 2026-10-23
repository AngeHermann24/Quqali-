"use client";

import { MOYENS, type Transaction } from "@/lib/abonnement";
import type { Dossier } from "@/lib/espace";
import { genererFacturePdf } from "@/lib/facture-pdf";
import { SITE } from "@/lib/site";

const date = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(new Date(iso));

export function telechargerFacture(dossier: Dossier, tx: Transaction, tva: number) {
  if (!tx.facture) return;
  const octets = genererFacturePdf({
    numero: tx.facture,
    date: tx.date,
    emetteur: { nom: SITE.name, lignes: ["Abidjan, Côte d'Ivoire", "RCCM / NCC : à compléter"] },
    client: {
      nom: dossier.nom,
      lignes: [`${dossier.adresse}, ${dossier.quartier}`, `${dossier.commune}, ${dossier.ville}`, `${dossier.responsable.nom} — ${dossier.responsable.fonction}`],
    },
    lignes: tx.lignes.map((l, i) => ({ ...l, detail: i === 0 ? `Du ${date(tx.periodeDebut)} au ${date(tx.periodeFin)}` : undefined })),
    tva,
    paiement: { moyen: MOYENS[tx.moyen].label, compte: tx.compte, reference: tx.reference },
    mention: "Le paiement n'influence jamais la note attribuée lors de l'audit.",
  });
  const url = URL.createObjectURL(new Blob([octets.buffer as ArrayBuffer], { type: "application/pdf" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${tx.facture}.pdf`;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
