"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, ChevronUp, ShieldCheck, Stethoscope, UtensilsCrossed } from "lucide-react";
import { SECTEURS, type Secteur } from "@/lib/data";
import { SECTEUR_ICONS } from "@/components/ui";
import { cn } from "@/lib/site";

const CLE = "qualite-lancement";

const PRINCIPAUX: { secteur: Secteur; Icon: typeof UtensilsCrossed; couleur: string }[] = [
  { secteur: "restauration", Icon: UtensilsCrossed, couleur: "#22C55E" },
  { secteur: "hotellerie", Icon: BedDouble, couleur: "#3B82F6" },
  { secteur: "sante", Icon: Stethoscope, couleur: "#2DD4BF" },
];
const AUTRES: Secteur[] = ["services", "education", "commerce", "transport"];

/** Écran de lancement : photo-skyline d'Abidjan, logo, slogan, accès rapide par secteur. Une fois par session. */
export function Lancement() {
  const router = useRouter();
  const dejaVu = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(CLE) === "1",
    () => true,
  );
  const [ferme, setFerme] = useState(false);
  const [sortant, setSortant] = useState(false);
  const [tactile, setTactile] = useState<number | null>(null);

  if (dejaVu || ferme) return null;

  const fermer = () => {
    navigator.vibrate?.(8);
    sessionStorage.setItem(CLE, "1");
    setSortant(true);
    setTimeout(() => setFerme(true), 450);
  };
  const aller = (secteur: Secteur) => {
    sessionStorage.setItem(CLE, "1");
    setFerme(true);
    router.push(`/etablissements?secteur=${secteur}`);
  };

  return (
    <div
      role="dialog"
      aria-label="Bienvenue sur Qualité+"
      onTouchStart={(e) => setTactile(e.touches[0].clientY)}
      onTouchEnd={(e) => {
        if (tactile !== null && tactile - e.changedTouches[0].clientY > 60) fermer();
        setTactile(null);
      }}
      className={cn(
        "fixed inset-0 z-[90] flex flex-col overflow-hidden text-white transition-all duration-500",
        sortant ? "-translate-y-full opacity-0" : "translate-y-0",
      )}
    >
      {/* Photo du pont de Cocody en fond + voile de lisibilité en bas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cocody.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgb(11 27 63 / 0.15) 0%, rgb(11 27 63 / 0.45) 45%, rgb(10 23 48 / 0.9) 100%)" }}
      />

      <div className="relative flex flex-1 flex-col items-center px-8 pt-[16dvh] text-center">
        {/* Logo officiel */}
        <div className="rounded-[1.75rem] bg-white px-7 py-4 shadow-[0_18px_50px_rgb(2_6_23/0.35)] opacity-0 [animation:monte_.7s_ease_forwards]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/V+.png" alt="Qualité+" className="h-12 w-auto" />
        </div>
        <p className="mt-6 font-display text-lg font-semibold opacity-0 [animation:monte_.6s_1.2s_ease_forwards]">Manger · Dormir · Se soigner</p>
        <p className="text-sm text-[#C7D2FE] opacity-0 [animation:monte_.6s_1.4s_ease_forwards]">En toute confiance.</p>
      </div>

      {/* Zone basse : 3 ronds secteurs + autres + gage + continuer */}
      <div className="relative flex flex-col items-center pb-8">
        <div className="flex items-start justify-center gap-7">
          {PRINCIPAUX.map(({ secteur, Icon, couleur }, i) => (
            <button
              key={secteur}
              type="button"
              onClick={() => aller(secteur)}
              aria-label={SECTEURS[secteur].label}
              className="flex w-20 flex-col items-center gap-2.5 opacity-0 transition active:scale-95"
              style={{ animation: `monte .5s ${1.7 + i * 0.15}s cubic-bezier(.34,1.56,.64,1) forwards` }}
            >
              <span className="grid size-[4.5rem] place-items-center rounded-full text-white shadow-[0_10px_26px_rgba(0,0,0,.35)]" style={{ background: couleur }}>
                <Icon className="size-9" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="text-xs font-bold">{SECTEURS[secteur].label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 px-6 opacity-0 [animation:monte_.5s_2.3s_ease_forwards]">
          {AUTRES.map((s) => {
            const Icon = SECTEUR_ICONS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => aller(s)}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur transition active:scale-95"
              >
                <Icon className="size-3.5" aria-hidden />
                {SECTEURS[s].label}
              </button>
            );
          })}
        </div>

        <p className="mx-6 mt-6 flex items-center gap-2.5 rounded-full border border-white/15 bg-black/25 px-4 py-2.5 text-xs font-semibold opacity-0 backdrop-blur [animation:monte_.5s_2.5s_ease_forwards]">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success">
            <ShieldCheck className="size-3.5" aria-hidden />
          </span>
          Établissements audités et certifiés (80 % minimum)
        </p>

        <button type="button" onClick={fermer} className="mx-auto mt-5 flex flex-col items-center gap-0.5 text-xs font-bold text-white/85 opacity-0 [animation:monte_.5s_2.7s_ease_forwards]">
          <ChevronUp className="size-5 animate-bounce" aria-hidden />
          Continuer
        </button>
      </div>
    </div>
  );
}
