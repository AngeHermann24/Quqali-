"use client";

import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";
import type { MapViewProps } from "@/components/map-view";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full animate-pulse place-items-center bg-surface text-muted">
      <MapIcon className="size-8" aria-hidden />
    </div>
  ),
});

export function Carte(props: MapViewProps) {
  return (
    <div className="isolate size-full overflow-hidden">
      <MapView {...props} />
    </div>
  );
}
