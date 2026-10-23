"use client";

import { useState } from "react";
import { ExternalLink, Play, Rotate3d } from "lucide-react";
import { analyserLien3D } from "@/lib/visite3d";

export function Visite3D({ lien, nom }: { lien: string; nom: string }) {
  const [active, setActive] = useState(false);
  const analyse = analyserLien3D(lien);
  if ("erreur" in analyse) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-primary">
      <div className="relative aspect-video">
        {active ? (
          <iframe
            src={analyse.url}
            title={`Visite virtuelle 3D — ${nom}`}
            className="absolute inset-0 size-full"
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-fullscreen"
          />
        ) : (
          <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-primary to-primary-dark text-white">
            <span className="absolute -top-12 -right-12 size-48 rounded-full bg-white/10" />
            <span className="absolute -bottom-16 -left-10 size-48 rounded-full bg-success/20" />
            <span className="relative flex flex-col items-center gap-3">
              <span className="grid size-16 place-items-center rounded-full bg-white text-primary shadow-lg transition group-hover:scale-105">
                <Play className="ml-1 size-7" aria-hidden />
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Rotate3d className="size-5" aria-hidden /> Lancer la visite à 360°
              </span>
              <span className="text-xs text-white/70">Chargement à la demande pour économiser vos données mobiles</span>
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 text-xs text-muted">
        <span>Visite fournie par {analyse.fournisseur}</span>
        <a href={analyse.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-primary">
          Plein écran <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
