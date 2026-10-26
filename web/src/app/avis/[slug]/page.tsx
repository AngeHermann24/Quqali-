import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ETABLISSEMENTS, getEtablissement } from "@/lib/data";
import { DonnerAvis } from "@/components/app/donner-avis";

export function generateStaticParams() {
  return ETABLISSEMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/avis/[slug]">): Promise<Metadata> {
  const e = getEtablissement((await props.params).slug);
  if (!e) return {};
  return { title: `Donner un avis — ${e.nom}` };
}

export default function AvisPage(props: PageProps<"/avis/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Contenu params={props.params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/avis/[slug]">["params"] }) {
  const e = getEtablissement((await params).slug);
  if (!e) notFound();
  return <DonnerAvis e={e} />;
}
