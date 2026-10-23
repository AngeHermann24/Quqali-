"use client";

import type { Secteur } from "@/lib/data";
import { CLES } from "@/lib/espace";
import {
  type ConfigReservation,
  type Demande,
  type EvenementReservation,
  type MessageSortant,
  type Reservation,
  type StatutReservation,
  changerStatut,
  creerReservation,
  messagesClient,
  verifierDemande,
} from "@/lib/reservation";
import { configParDefaut } from "@/lib/reservation-demo";
import { useStockage } from "@/lib/stockage";

export interface MessageEnvoye extends MessageSortant {
  id: string;
  date: string;
  reference: string;
  evenement: EvenementReservation;
}

const EVENEMENTS: Partial<Record<StatutReservation, EvenementReservation>> = { confirmee: "confirmee", refusee: "refusee", annulee: "annulee" };

export function useReservations(etablissementId: string, nom: string, secteur: Secteur) {
  const [toutes, setToutes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [configs, setConfigs] = useStockage<Record<string, ConfigReservation>>(CLES.configReservation);
  const [messages, setMessages] = useStockage<Record<string, MessageEnvoye[]>>(CLES.messages);

  const reservations = toutes?.[etablissementId] ?? [];
  const config = configs?.[etablissementId] ?? configParDefaut(etablissementId);

  const notifier = (r: Reservation, evenement: EvenementReservation, date: string) => {
    const nouveaux = messagesClient(r, nom, config, evenement).map((m, i) => ({ ...m, id: `${r.id}-${evenement}-${i}-${date}`, date, reference: r.reference, evenement }));
    setMessages((prec) => ({ ...prec, [etablissementId]: [...nouveaux, ...(prec?.[etablissementId] ?? [])] }));
    return nouveaux;
  };

  const creer = (demande: Demande) => {
    const maintenant = new Date().toISOString();
    const erreur = verifierDemande(secteur, config, demande, reservations, maintenant);
    if (erreur) return { erreur };
    const reservation = creerReservation(etablissementId, secteur, config, demande, reservations.length + 1, maintenant);
    setToutes((prec) => ({ ...prec, [etablissementId]: [reservation, ...(prec?.[etablissementId] ?? [])] }));
    return { reservation, messages: notifier(reservation, "creee", maintenant) };
  };

  const changer = (id: string, statut: StatutReservation, motif?: string) => {
    const maintenant = new Date().toISOString();
    const cible = reservations.find((r) => r.id === id);
    if (!cible) return;
    const maj = changerStatut(cible, statut, maintenant, motif);
    setToutes((prec) => ({ ...prec, [etablissementId]: (prec?.[etablissementId] ?? []).map((r) => (r.id === id ? maj : r)) }));
    const evenement = EVENEMENTS[statut];
    if (evenement) notifier(maj, evenement, maintenant);
  };

  const enregistrerConfig = (c: ConfigReservation) => setConfigs((prec) => ({ ...prec, [etablissementId]: c }));

  return {
    reservations,
    config,
    messages: messages?.[etablissementId] ?? [],
    creer,
    changer,
    enregistrerConfig,
    charge: toutes !== undefined && configs !== undefined && messages !== undefined,
  };
}
