"use client";

import { useCompteClient } from "@/components/avis/use-avis";
import { Notifications } from "@/components/app/notifications";

export default function NotificationsPage() {
  const { compte } = useCompteClient();
  return <Notifications compte={compte} />;
}
