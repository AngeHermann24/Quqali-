import type { Metadata } from "next";
import { Suspense } from "react";
import { Connexion } from "@/components/app/connexion";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à Qualité+ avec votre numéro de téléphone.",
};

export default function ConnexionPage() {
  return (
    <Suspense>
      <Connexion />
    </Suspense>
  );
}
