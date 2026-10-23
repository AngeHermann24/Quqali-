import type { Metadata } from "next";
import { Suspense } from "react";
import { MISSIONS } from "@/lib/espace";
import { Chargement } from "@/components/espace/ui";
import { MissionDetail } from "@/components/espace/mission-detail";

export const metadata: Metadata = { title: "Mission d'accompagnement", robots: { index: false } };

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function MissionPage(props: PageProps<"/partenaire/missions/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      {props.params.then(({ id }) => (
        <MissionDetail id={id} />
      ))}
    </Suspense>
  );
}
