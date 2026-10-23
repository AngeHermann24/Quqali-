import type { Metadata } from "next";
import { AwardsView } from "@/components/awards/awards-view";
import { EspaceHeader } from "@/components/espace/ui";

export const metadata: Metadata = { title: "Dashboard des votes", robots: { index: false } };

export default function AdminAwardsPage() {
  return (
    <>
      <EspaceHeader role="Administration" titre="Dashboard des votes" sousTitre="Scores, classement et participation aux Awards en temps réel." />
      <div className="container-page py-6">
        <AwardsView admin />
      </div>
    </>
  );
}
