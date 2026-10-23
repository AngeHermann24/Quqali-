"use client";

import { useCompteClient } from "@/components/avis/use-avis";
import { MesReservations } from "@/components/app/mes-reservations";

export default function ReservationsPage() {
  const { compte } = useCompteClient();
  return <MesReservations compte={compte} />;
}
