import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ETABLISSEMENTS, getEtablissement, scoreGlobal } from "@/lib/data";
import { formatDate, formatScore } from "@/lib/format";
import { FicheEtablissement } from "@/components/app/fiche-etablissement";

export function generateStaticParams() {
  return ETABLISSEMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/etablissements/[slug]">): Promise<Metadata> {
  const e = getEtablissement((await props.params).slug);
  if (!e) return {};
  return {
    title: `${e.nom} — ${e.commune}`,
    description: `${e.sousType} certifié ${formatScore(scoreGlobal(e.scores))} % (audit du ${formatDate(e.dateAudit)}). ${e.description}`,
  };
}

export default function FichePage(props: PageProps<"/etablissements/[slug]">) {
  return (
    <Suspense fallback={<FicheSkeleton />}>
      <Fiche params={props.params} />
    </Suspense>
  );
}

async function Fiche({ params }: { params: PageProps<"/etablissements/[slug]">["params"] }) {
  const e = getEtablissement((await params).slug);
  if (!e) notFound();
  const similaires = ETABLISSEMENTS.filter((x) => x.secteur === e.secteur && x.slug !== e.slug).slice(0, 3);
  return <FicheEtablissement e={e} similaires={similaires} />;
}

function FicheSkeleton() {
  return (
    <div className="pb-44" aria-busy="true">
      <div className="squelette relative h-[38dvh] min-h-64">
        <div className="absolute top-4 left-4 size-10 rounded-full bg-white/30" />
        <div className="absolute top-4 right-4 size-10 rounded-full bg-white/30" />
      </div>
      <div className="relative z-10 -mt-7 rounded-t-[1.75rem] bg-white px-5 pt-5">
        <div className="squelette h-7 w-2/3 rounded-lg" />
        <div className="squelette mt-2 h-4 w-1/2 rounded-lg" />
        <div className="squelette mt-3 h-5 w-1/3 rounded-lg" />
        <div className="mt-5 flex justify-around">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="squelette size-[74px] rounded-full" />
              <div className="squelette h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="squelette size-10 rounded-full" />
              <div className="flex-1">
                <div className="squelette h-4 w-20 rounded-lg" />
                <div className="squelette mt-1.5 h-3.5 w-2/3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="squelette aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
