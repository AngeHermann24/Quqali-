"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ShieldCheck } from "lucide-react";
import { SECTEURS, type Secteur } from "@/lib/data";
import { SECTEUR_ICONS } from "@/components/ui";
import { SECTEUR_COULEURS } from "@/components/app/ui-app";
import { cn } from "@/lib/site";

const CLE = "qualite-lancement";
const RONDS: Secteur[] = ["restauration", "hotellerie", "sante"];
const AUTRES: Secteur[] = ["services", "education", "commerce", "transport"];

/** Écran de lancement : skyline d'Abidjan, logo, slogan, accès rapide par secteur. Une fois par session. */
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
      style={{ background: "linear-gradient(160deg, #16296B 0%, #1E3A8A 45%, #0F3D2E 100%)" }}
    >
      {/* Skyline d'Abidjan stylisée */}
      <svg viewBox="0 0 430 300" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full opacity-90" aria-hidden>
        <defs>
          <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C7D2FE" stopOpacity="0" />
            <stop offset="1" stopColor="#C7D2FE" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <rect width="430" height="300" fill="url(#ciel)" />
        <g fill="#0B1B3F">
          <rect x="8" y="150" width="34" height="150" />
          <rect x="52" y="110" width="26" height="190" />
          <rect x="88" y="168" width="40" height="132" />
          <rect x="138" y="80" width="30" height="220" />
          <rect x="142" y="62" width="22" height="20" />
          <rect x="178" y="140" width="36" height="160" />
          <rect x="224" y="98" width="24" height="202" />
          <rect x="258" y="160" width="42" height="140" />
          <rect x="310" y="120" width="28" height="180" />
          <rect x="348" y="88" width="20" height="212" />
          <rect x="352" y="72" width="12" height="18" />
          <rect x="378" y="150" width="44" height="150" />
        </g>
        {/* Pont de Gaulle stylisé */}
        <path d="M0 268 Q 120 236 215 262 T 430 256" stroke="#2D4DB0" strokeWidth="7" fill="none" opacity="0.7" />
        {/* Lagune Ébrié */}
        <rect y="274" width="430" height="26" fill="#0A2540" />
        <path d="M20 285 q18 -5 36 0 M120 288 q18 -5 36 0 M240 284 q18 -5 36 0 M340 289 q18 -5 36 0" stroke="#38BDF8" strokeWidth="3" fill="none" opacity="0.5" />
      </svg>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 pb-10 text-center">
        {/* Logo */}
        <svg viewBox="0 0 84 84" className="size-24 opacity-0 [animation:monte_.7s_ease_forwards]" aria-hidden>
          <circle cx="42" cy="42" r="40" fill="none" stroke="#16A34A" strokeWidth="7" strokeDasharray="252" strokeDashoffset="252" className="[animation:trace_.9s_.3s_ease-out_forwards]" />
          <path d="M30 43l9 9 17-19" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="38" strokeDashoffset="38" className="[animation:trace_.5s_1s_ease-out_forwards]" />
        </svg>
        <h1 className="mt-5 font-display text-4xl font-extrabold opacity-0 [animation:monte_.6s_1.2s_ease_forwards]">
          Qualité<span className="text-success-bright">+</span>
        </h1>
        <p className="mt-3 font-display text-lg font-semibold opacity-0 [animation:monte_.6s_1.4s_ease_forwards]">Manger · Dormir · Se soigner</p>
        <p className="text-sm text-[#C7D2FE] opacity-0 [animation:monte_.6s_1.5s_ease_forwards]">En toute confiance.</p>

        {/* Ronds secteurs en cascade */}
        <div className="mt-8 flex items-start justify-center gap-6">
          {RONDS.map((s, i) => {
            const Icon = SECTEUR_ICONS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => aller(s)}
                aria-label={SECTEURS[s].label}
                className="flex w-20 flex-col items-center gap-2 opacity-0 transition active:scale-95"
                style={{ animation: `monte .5s ${1.7 + i * 0.15}s cubic-bezier(.34,1.56,.64,1) forwards` }}
              >
                <span className="grid size-20 place-items-center rounded-full text-white shadow-flottant" style={{ background: SECTEUR_COULEURS[s] }}>
                  <Icon className="size-9" aria-hidden />
                </span>
                <span className="text-xs font-bold">{SECTEURS[s].label}</span>
              </button>
            );
          })}
        </div>

        {/* Autres secteurs */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 opacity-0 [animation:monte_.5s_2.3s_ease_forwards]">
          {AUTRES.map((s) => (
            <button key={s} type="button" onClick={() => aller(s)} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition active:scale-95">
              {SECTEURS[s].label}
            </button>
          ))}
        </div>

        {/* Gage de confiance */}
        <p className="mt-8 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold opacity-0 backdrop-blur [animation:monte_.5s_2.5s_ease_forwards]">
          <ShieldCheck className="size-4 text-success-bright" aria-hidden />
          Établissements audités et certifiés (80 % minimum)
        </p>
      </div>

      <button type="button" onClick={fermer} className="relative mx-auto mb-8 flex flex-col items-center gap-1 text-xs font-bold text-white/80 opacity-0 [animation:monte_.5s_2.7s_ease_forwards]">
        <ChevronUp className="size-5 animate-bounce" aria-hidden />
        Continuer
      </button>
    </div>
  );
}
