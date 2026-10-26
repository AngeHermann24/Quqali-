import type { Metadata } from "next";
import { Suspense } from "react";
import { FavorisUsager } from "@/components/app/favoris-page";

export const metadata: Metadata = { title: "Favoris" };

export default function FavorisPage() {
  return (
    <Suspense fallback={<SqueletteFavoris />}>
      <FavorisUsager />
    </Suspense>
  );
}

function SqueletteFavoris() {
  return (
    <div className="px-5 pt-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="squelette size-10 rounded-full" />
        <div className="squelette h-5 w-20 rounded-full" />
        <div className="squelette size-10 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="squelette h-9 w-16 rounded-full" />
        <div className="squelette h-9 w-28 rounded-full" />
        <div className="squelette h-9 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3.5 py-3">
            <div className="squelette size-[4.5rem] shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="squelette h-4 w-36 rounded-full" />
              <div className="squelette h-3 w-28 rounded-full" />
              <div className="squelette h-3 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
