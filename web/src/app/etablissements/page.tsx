import type { Metadata } from "next";
import { Suspense } from "react";
import { ETABLISSEMENTS } from "@/lib/data";
import { SITE } from "@/lib/site";
import { Explorer } from "@/components/app/explorer";

export const metadata: Metadata = {
  title: "Explorer",
  description: `Trouvez sur la carte d'Abidjan les établissements audités sur place, avec une note de gouvernance d'au moins ${SITE.seuil} %.`,
};

export default function EtablissementsPage() {
  return (
    <Suspense fallback={<SqueletteExplorer />}>
      <Explorer etablissements={ETABLISSEMENTS} />
    </Suspense>
  );
}

function SqueletteExplorer() {
  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col lg:h-[calc(100dvh-4rem)]" aria-busy="true">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-24 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="mt-3 flex gap-2 px-5">
        <div className="squelette h-9 w-16 rounded-full" />
        <div className="squelette h-9 w-28 rounded-full" />
        <div className="squelette h-9 w-20 rounded-full" />
        <div className="squelette h-9 w-16 rounded-full" />
      </div>
      <div className="mt-2.5 flex gap-2 px-5">
        <div className="squelette h-8 w-24 rounded-full" />
        <div className="squelette h-8 w-16 rounded-full" />
        <div className="squelette h-8 w-36 rounded-full" />
      </div>
      <div className="relative mt-3 flex-1 overflow-hidden">
        <div className="squelette absolute inset-0" />
        <div className="squelette absolute inset-x-3 bottom-4 h-24 rounded-[1.25rem]" />
      </div>
    </div>
  );
}
