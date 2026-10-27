"use client";

import dynamic from "next/dynamic";

const RepereView = dynamic(() => import("./repere-view"), {
  ssr: false,
  loading: () => <div className="grid h-44 animate-pulse place-items-center rounded-2xl bg-surface text-xs text-muted">Chargement de la carte…</div>,
});

/** Mini-carte pour placer le repère de l'établissement (clic = position). */
export function CarteRepere({ coords, onChange }: { coords: [number, number] | undefined; onChange: (c: [number, number]) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <RepereView coords={coords} onChange={onChange} />
    </div>
  );
}
