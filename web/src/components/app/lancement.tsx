"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LayoutGrid, ShieldCheck } from "lucide-react";
import { type Secteur } from "@/lib/data";
import { secteurPluriel } from "@/lib/langue";
import { useLangue } from "@/components/langue";
import { SECTEUR_ICONS } from "@/components/ui";
import { SECTEUR_COULEURS } from "@/components/app/ui-app";
import { cn } from "@/lib/site";

const CLE = "qualite-lancement";

const TOUS_LES_SECTEURS: Secteur[] = ["restauration", "hotellerie", "sante", "education", "commerce", "transport", "services"];

/** Écran de lancement : photo-skyline d'Abidjan, logo, slogan, accès rapide par secteur. Une fois par session. */
export function Lancement() {
  const router = useRouter();
  const { langue, t } = useLangue();
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
    router.push(secteur === "services" ? "/autre" : `/etablissements?secteur=${secteur}`);
  };

  return (
    <div
      role="dialog"
      aria-label={t.bienvenueQualite}
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
        <div className="opacity-0 [animation:monte_.7s_ease_forwards]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sans-fond-qplus.png" alt="Qualité+" className="h-20 w-auto drop-shadow-[0_8px_24px_rgb(2_6_23/0.45)]" />
        </div>
        <p className="mt-6 font-display text-lg font-semibold opacity-0 [animation:monte_.6s_1.2s_ease_forwards]">{t.lanceSlogan}</p>
        <p className="text-sm text-[#C7D2FE] opacity-0 [animation:monte_.6s_1.4s_ease_forwards]">{t.lanceSousTitre}</p>
      </div>

      {/* Zone basse : grille secteurs uniforme + gage + continuer */}
      <div className="relative flex flex-col items-center pb-8">
        <div className="grid w-full max-w-sm grid-cols-4 gap-x-2 gap-y-4 px-6">
          {TOUS_LES_SECTEURS.map((s, i) => {
            const Icon = SECTEUR_ICONS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => aller(s)}
                aria-label={secteurPluriel(s, langue)}
                className="flex flex-col items-center gap-2 opacity-0 transition active:scale-95"
                style={{ animation: `monte .5s ${1.7 + i * 0.08}s cubic-bezier(.34,1.56,.64,1) forwards` }}
              >
                <span className="grid size-14 place-items-center rounded-full text-white shadow-[0_10px_26px_rgba(0,0,0,.35)]" style={{ background: SECTEUR_COULEURS[s] }}>
                  <Icon className="size-7" strokeWidth={1.8} aria-hidden />
                </span>
                <span className="text-[11px] font-bold leading-tight">{secteurPluriel(s, langue)}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(CLE, "1");
              setFerme(true);
              router.push("/etablissements");
            }}
            aria-label={t.tous}
            className="flex flex-col items-center gap-2 opacity-0 transition active:scale-95"
            style={{ animation: "monte .5s 2.3s cubic-bezier(.34,1.56,.64,1) forwards" }}
          >
            <span className="grid size-14 place-items-center rounded-full bg-white text-primary shadow-[0_10px_26px_rgba(0,0,0,.35)]">
              <LayoutGrid className="size-7" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="text-[11px] font-bold leading-tight">{t.tous}</span>
          </button>
        </div>

        <p className="mx-6 mt-6 flex items-center gap-2.5 rounded-full border border-white/15 bg-black/25 px-4 py-2.5 text-xs font-semibold opacity-0 backdrop-blur [animation:monte_.5s_2.5s_ease_forwards]">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success">
            <ShieldCheck className="size-3.5" aria-hidden />
          </span>
          {t.lanceGage}
        </p>

        <button type="button" onClick={fermer} className="mx-auto mt-5 flex flex-col items-center gap-0.5 text-xs font-bold text-white/85 opacity-0 [animation:monte_.5s_2.7s_ease_forwards]">
          <ChevronUp className="size-5 animate-bounce" aria-hidden />
          {t.lanceContinuer}
        </button>
      </div>
    </div>
  );
}
