import type { Metadata } from "next";
import { AwardsView } from "@/components/awards/awards-view";

export const metadata: Metadata = {
  title: "Awards",
  description: "Le palmarès annuel des établissements certifiés : 30 % votes des clients vérifiés, 70 % évaluation des agents sur place.",
};

export default function AwardsPage() {
  return (
    <div>
      <section className="bg-primary py-12 text-white">
        <div className="container-page">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Palmarès annuel</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Les Awards Qualité+</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Chaque année, les meilleurs établissements certifiés sont récompensés. Le score final combine les avis des clients vérifiés (30 %) et la
            note d&apos;audit sur place de nos agents évaluateurs (70 %).
          </p>
        </div>
      </section>
      <div className="container-page py-8">
        <AwardsView />
      </div>
    </div>
  );
}
