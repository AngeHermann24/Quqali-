import type { Metadata } from "next";
import { GestionReservations } from "@/components/reservation/gestion-reservations";

export const metadata: Metadata = { title: "Réservations en ligne", robots: { index: false } };

export default function ReservationsPage() {
  return <GestionReservations />;
}
