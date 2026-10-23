"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChartLine, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/site";

const ECRANS = [
  { titre: "Prouvez votre qualité", texte: "Un audit indépendant sur place, un badge de confiance que vos clients reconnaissent.", Icon: ShieldCheck },
  { titre: "Soyez vu par des milliers d'usagers", texte: "Votre établissement certifié dans le guide de confiance de la qualité de service.", Icon: ChartLine },
  { titre: "Gérez tout depuis votre téléphone", texte: "Dossier, audit, abonnement, avis et réservations — en quelques gestes.", Icon: Smartphone },
];

export function OnboardingPro() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const { titre, texte, Icon } = ECRANS[i];
  const dernier = i === ECRANS.length - 1;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-primary">
      <div className="absolute -inset-1/3 opacity-25 blur-3xl [animation:derive_18s_ease-in-out_infinite_alternate] [background:linear-gradient(135deg,#1E3A8A,#2D4DB0_45%,#16A34A)]" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-8 pb-10 text-center text-white">
        <div key={i} className="[animation:monte_.4s_ease_both]">
          <span className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-white/15 backdrop-blur">
            <Icon className="size-11 text-white" aria-hidden />
          </span>
          <h1 className="mt-8 font-display text-4xl leading-tight font-extrabold">{titre}</h1>
          <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-white/80">{texte}</p>
        </div>

        <div className="mt-10 flex gap-2">
          {ECRANS.map((_, j) => (
            <span key={j} className={cn("h-1.5 rounded-full transition-all", j === i ? "w-8 bg-white" : "w-1.5 bg-white/40")} />
          ))}
        </div>

        <div className="mt-8 w-full space-y-3">
          <button type="button" onClick={() => (dernier ? router.push("/pro/connexion") : setI(i + 1))} className="btn flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-bold text-primary shadow-flottant">
            {dernier ? "Créer mon compte" : "Continuer"} <ArrowRight className="size-4" aria-hidden />
          </button>
          {dernier && (
            <button type="button" onClick={() => router.push("/pro/connexion")} className="w-full py-2 text-sm font-semibold text-white/85">
              J&apos;ai déjà un compte
            </button>
          )}
        </div>
      </div>
      <span className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 opacity-90">
        <Logo light />
      </span>
    </div>
  );
}
