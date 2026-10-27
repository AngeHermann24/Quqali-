import type { Metadata } from "next";
import { ReservationsPro } from "@/components/pro/reservations-pro";

export const metadata: Metadata = { title: "Réservations", robots: { index: false } };

export default function ReservationsPage() {
  return <ReservationsPro />;
}
