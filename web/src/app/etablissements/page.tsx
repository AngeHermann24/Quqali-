import type { Metadata } from "next";
import { Suspense } from "react";
import { QUARTIERS_PAR_VILLE, VILLES, parseFiltres, rechercher } from "@/lib/data";
import { SITE } from "@/lib/site";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "Établissements certifiés",
  description: `Hôtels, restaurants et établissements de santé audités sur place, avec une note de gouvernance d'au moins ${SITE.seuil} %.`,
};

export default function EtablissementsPage(props: PageProps<"/etablissements">) {
  return (
    <>
      <section className="bg-surface">
        <div className="container-page py-6 sm:py-8">
          <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">Établissements certifiés</h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Tous audités sur place, tous au-dessus de {SITE.seuil} %.</p>
        </div>
      </section>
      <Suspense fallback={<ResultsSkeleton />}>
        <Resultats searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Resultats({ searchParams }: { searchParams: PageProps<"/etablissements">["searchParams"] }) {
  const filtres = parseFiltres(await searchParams);
  return <ResultsView filtres={filtres} resultats={rechercher(filtres)} villes={VILLES} quartiersParVille={QUARTIERS_PAR_VILLE} />;
}

function ResultsSkeleton() {
  return (
    <div className="container-page space-y-4 py-5" aria-busy="true">
      <div className="h-10 w-2/3 animate-pulse rounded-full bg-surface" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}
