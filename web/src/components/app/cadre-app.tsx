"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

/** Routes hors app usager : pas de cadre téléphone. */
const HORS_APP = ["/pro", "/partenaire", "/admin", "/devenir-partenaire", "/tarifs"];

/** Sur ordinateur, l'app usager s'affiche dans un cadre de téléphone (430 px). */
export function CadreApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const usager = !HORS_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (process.env.NODE_ENV === "production") navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  return <div className={usager ? "cadre-app relative mx-auto w-full bg-white" : "w-full"}>{children}</div>;
}
