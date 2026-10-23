"use client";

import { useEffect, useState } from "react";

/** Écran de lancement : le logo se dessine une fois par session, puis la carte apparaît. */
export function Splash() {
  const [visible, setVisible] = useState(true);
  const [part, setPart] = useState(false);

  useEffect(() => {
    const dejaVu = sessionStorage.getItem("quqliter-splash");
    sessionStorage.setItem("quqliter-splash", "1");
    const t1 = setTimeout(() => setPart(true), dejaVu ? 60 : 2000);
    const t2 = setTimeout(() => setVisible(false), dejaVu ? 420 : 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`splash-ecran fixed inset-0 z-[100] grid place-items-center overflow-hidden transition-opacity duration-500 ${part ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(160deg,#16296B,#1E3A8A 55%,#14532D)" }}
    >
      <div className="absolute -inset-1/3 opacity-25 blur-3xl [animation:derive_18s_ease-in-out_infinite_alternate] [background:linear-gradient(135deg,#1E3A8A,#2D4DB0_45%,#16A34A)]" />
      <div className="relative flex flex-col items-center">
        <svg viewBox="0 0 96 96" className="size-24" fill="none">
          <circle
            cx="48" cy="48" r="44" stroke="#22C55E" strokeWidth="5" strokeLinecap="round"
            className="[stroke-dasharray:290] [stroke-dashoffset:290] [animation:trace_1.3s_.15s_ease_forwards]"
          />
          <path
            d="M32 49l11 11 21-24" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            className="[stroke-dasharray:60] [stroke-dashoffset:60] [animation:coche_.55s_1.15s_ease_forwards]"
          />
        </svg>
        <p className="mt-5 font-display text-3xl font-extrabold text-white opacity-0 [animation:monte_.6s_1.4s_ease_forwards]">
          Quqliter
        </p>
        <p className="mt-1 text-sm text-[#C7D2FE] opacity-0 [animation:monte_.6s_1.55s_ease_forwards]">
          Le label de confiance — Abidjan
        </p>
      </div>
    </div>
  );
}
