import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesAutre } from "@/components/app/services-autre";

export const metadata: Metadata = { title: "Autre" };

export default function AutrePage() {
  return (
    <Suspense fallback={<SqueletteAutre />}>
      <ServicesAutre />
    </Suspense>
  );
}

function SqueletteAutre() {
  return (
    <div className="px-5 pt-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-16 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="squelette mt-4 h-44 w-full rounded-3xl" />
      <div className="squelette mt-4 h-36 w-full rounded-3xl" />
      <div className="squelette mt-4 h-32 w-full rounded-3xl" />
    </div>
  );
}
