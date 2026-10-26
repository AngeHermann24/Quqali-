import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ETABLISSEMENTS, getEtablissement } from "@/lib/data";
import { Reserver } from "@/components/app/reserver";

export function generateStaticParams() {
  return ETABLISSEMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/reserver/[slug]">): Promise<Metadata> {
  const e = getEtablissement((await props.params).slug);
  if (!e) return {};
  return { title: `Réserver — ${e.nom}`, description: `Réservez en ligne chez ${e.nom} (${e.sousType} certifié, ${e.commune}).` };
}

export default function ReserverPage(props: PageProps<"/reserver/[slug]">) {
  return (
    <Suspense fallback={<Squelette />}>
      <Contenu params={props.params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/reserver/[slug]">["params"] }) {
  const e = getEtablissement((await params).slug);
  if (!e) notFound();
  return <Reserver e={e} />;
}

function Squelette() {
  return (
    <div className="px-5 pt-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-32 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="squelette mt-4 h-28 rounded-3xl" />
      <div className="mt-4 flex gap-2">
        <div className="squelette h-12 w-24 rounded-2xl" />
        <div className="squelette h-12 w-20 rounded-2xl" />
        <div className="squelette h-12 w-16 rounded-2xl" />
        <div className="squelette h-12 w-28 rounded-2xl" />
      </div>
      <div className="squelette mt-4 h-72 rounded-3xl" />
    </div>
  );
}
