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
      {/* Ciel + skyline du Plateau + lagune Ébrié (SVG façon photo) */}
      <svg viewBox="0 0 430 844" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A9CFF3" />
            <stop offset="0.5" stopColor="#5B8FD6" />
            <stop offset="1" stopColor="#2B5BA8" />
          </linearGradient>
          <linearGradient id="lagune" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1E4E8C" />
            <stop offset="1" stopColor="#0A2540" />
          </linearGradient>
          <linearGradient id="fondu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1B3F" stopOpacity="0" />
            <stop offset="0.55" stopColor="#0B1B3F" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0A1730" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="tourA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3D6CA8" />
            <stop offset="1" stopColor="#16355F" />
          </linearGradient>
          <linearGradient id="tourB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B548C" />
            <stop offset="1" stopColor="#10294E" />
          </linearGradient>
        </defs>

        {/* Ciel */}
        <rect width="430" height="560" fill="url(#ciel)" />
        <ellipse cx="90" cy="120" rx="70" ry="18" fill="#fff" opacity="0.25" />
        <ellipse cx="330" cy="90" rx="90" ry="20" fill="#fff" opacity="0.2" />
        <ellipse cx="240" cy="180" rx="110" ry="16" fill="#fff" opacity="0.15" />
        <circle cx="352" cy="150" r="30" fill="#FFF3C4" opacity="0.9" />
        <circle cx="352" cy="150" r="46" fill="#FFF3C4" opacity="0.2" />

        {/* Skyline du Plateau — fond */}
        <g fill="url(#tourB)">
          <rect x="-10" y="330" width="52" height="230" />
          <rect x="48" y="290" width="34" height="270" />
          <rect x="88" y="350" width="46" height="210" />
          <rect x="300" y="310" width="40" height="250" />
          <rect x="345" y="280" width="30" height="280" />
          <rect x="380" y="340" width="56" height="220" />
        </g>
        {/* Tours avant-plan (Tour Postel, Pyramide stylisée, CIE) */}
        <g fill="url(#tourA)">
          <rect x="140" y="250" width="38" height="310" />
          <rect x="146" y="232" width="26" height="20" rx="3" />
          <polygon points="184,560 248,560 216,272" />
          <rect x="242" y="300" width="30" height="260" />
          <rect x="248" y="282" width="18" height="18" />
          <rect x="278" y="330" width="18" height="230" />
        </g>
        {/* Fenêtres éclairées */}
        <g fill="#FFE9A3">
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`a${i}`} x={148 + (i % 3) * 10} y={270 + Math.floor(i / 3) * 42} width="5" height="7" opacity={0.5 + (i % 3) * 0.15} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={`b${i}`} x={56 + (i % 2) * 12} y={310 + Math.floor(i / 2) * 44} width="5" height="7" opacity={0.4 + (i % 2) * 0.3} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={`c${i}`} x={308 + (i % 3) * 10} y={330 + Math.floor(i / 3) * 48} width="5" height="7" opacity={0.45 + (i % 3) * 0.15} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={`d${i}`} x={388 + (i % 4) * 11} y={360 + Math.floor(i / 4) * 50} width="5" height="7" opacity="0.5" />
          ))}
        </g>

        {/* Lagune Ébrié + pont de Gaulle */}
        <rect y="560" width="430" height="284" fill="url(#lagune)" />
        <path d="M0 586 Q 110 548 215 578 T 430 566" stroke="#8FB4DD" strokeWidth="10" fill="none" opacity="0.85" />
        <path d="M0 591 Q 110 553 215 583 T 430 571" stroke="#16355F" strokeWidth="3" fill="none" opacity="0.9" />
        {/* Reflets lumineux sur l'eau */}
        <g strokeLinecap="round">
          <path d="M150 570 v64" stroke="#FFE9A3" strokeWidth="4" opacity="0.35" />
          <path d="M165 570 v44" stroke="#FFE9A3" strokeWidth="3" opacity="0.25" />
          <path d="M252 585 v70" stroke="#8FD3F4" strokeWidth="4" opacity="0.3" />
          <path d="M352 580 v50" stroke="#FFE9A3" strokeWidth="3" opacity="0.3" />
          <path d="M60 600 v40" stroke="#8FD3F4" strokeWidth="3" opacity="0.25" />
          <path d="M395 605 v46" stroke="#8FD3F4" strokeWidth="3" opacity="0.22" />
        </g>
        <path d="M20 700 q18 -6 36 0 M120 730 q18 -6 36 0 M240 710 q18 -6 36 0 M340 740 q18 -6 36 0" stroke="#38BDF8" strokeWidth="3" fill="none" opacity="0.35" />
        {/* Reflets des tours au ras de l'eau */}
        <g opacity="0.28">
          <rect x="52" y="562" width="26" height="30" fill="#2B548C" />
          <rect x="144" y="562" width="30" height="40" fill="#3D6CA8" />
          <rect x="246" y="562" width="22" height="34" fill="#3D6CA8" />
          <rect x="348" y="562" width="24" height="28" fill="#2B548C" />
        </g>

        {/* Voile de lisibilité en bas */}
        <rect y="380" width="430" height="464" fill="url(#fondu)" />
      </svg>

      <div className="relative flex flex-1 flex-col items-center px-8 pt-[16dvh] text-center">
        {/* Logo tracé */}
        <svg viewBox="0 0 84 84" className="size-20 opacity-0 [animation:monte_.7s_ease_forwards]" aria-hidden>
          <circle cx="42" cy="42" r="40" fill="none" stroke="#22C55E" strokeWidth="7" strokeDasharray="252" strokeDashoffset="252" className="[animation:trace_.9s_.3s_ease-out_forwards]" />
          <path d="M30 43l9 9 17-19" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="38" strokeDashoffset="38" className="[animation:trace_.5s_1s_ease-out_forwards]" />
        </svg>
        <h1 className="mt-4 font-display text-[2.6rem] leading-none font-extrabold tracking-tight opacity-0 [animation:monte_.6s_1.2s_ease_forwards]">
          Qualité<span className="text-success-bright">+</span>
        </h1>
        <p className="mt-3 font-display text-lg font-semibold opacity-0 [animation:monte_.6s_1.4s_ease_forwards]">Manger · Dormir · Se soigner</p>
        <p className="text-sm text-[#C7D2FE] opacity-0 [animation:monte_.6s_1.5s_ease_forwards]">En toute confiance.</p>
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
