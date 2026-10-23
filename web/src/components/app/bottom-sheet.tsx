"use client";

import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";

const fenetreH = () => (typeof window === "undefined" ? 700 : window.innerHeight);

/**
 * Panneau glissant façon Yango : 3 hauteurs (aperçu / moitié / plein écran),
 * poignée déplaçable, contenu défilant en plein écran.
 */
export function BottomSheet({ children, apercu = 150 }: { children: ReactNode; apercu?: number }) {
  const [h, setH] = useState<number | null>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);
  const niveaux = () => {
    const H = fenetreH();
    return [apercu, Math.round(H * 0.56), Math.round(H * 0.92)];
  };

  const debut = (e: RPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.closest("section")?.getBoundingClientRect();
    drag.current = { y: e.clientY, h: h ?? Math.round(rect?.height ?? fenetreH() * 0.56) };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const bouge = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const [min, , max] = niveaux();
    setH(Math.min(max, Math.max(min, drag.current.h + (drag.current.y - e.clientY))));
  };
  const fin = () => {
    if (!drag.current) return;
    drag.current = null;
    setH((courant) => {
      if (courant == null) return courant;
      return niveaux().reduce((proche, n) => (Math.abs(n - courant) < Math.abs(proche - courant) ? n : proche));
    });
  };

  const plein = h != null && h >= fenetreH() * 0.9;

  return (
    <section
      aria-label="Panneau d'accueil"
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[32px] bg-white shadow-panneau transition-[height] duration-200 ease-out"
      style={{ height: h ?? "56%" }}
    >
      <button
        type="button"
        aria-label="Redimensionner le panneau"
        onPointerDown={debut}
        onPointerMove={bouge}
        onPointerUp={fin}
        onPointerCancel={fin}
        className="grid w-full shrink-0 cursor-grab touch-none place-items-center pt-2.5 pb-1.5 active:cursor-grabbing"
      >
        <span className="h-1.5 w-11 rounded-full bg-line" />
      </button>
      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-28 ${plein ? "" : "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}`}>{children}</div>
    </section>
  );
}
