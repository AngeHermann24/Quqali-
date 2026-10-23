import { Suspense } from "react";
import type { Metadata } from "next";
import { CandidaturesAdmin } from "@/components/admin/candidatures";

export const metadata: Metadata = { title: "Candidatures" };

export default function CandidaturesPage() {
  return (
    <Suspense>
      <CandidaturesAdmin />
    </Suspense>
  );
}
