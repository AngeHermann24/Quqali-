"use client";

import { useCompteClient } from "@/components/avis/use-avis";
import { Profil } from "@/components/app/profil";

export default function ProfilPage() {
  const { compte } = useCompteClient();
  return <Profil compte={compte} />;
}
