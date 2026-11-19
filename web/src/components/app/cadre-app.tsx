"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLangue } from "@/components/langue";

/** Routes hors app usager : pas de cadre téléphone. */
const HORS_APP = ["/pro", "/partenaire", "/admin", "/devenir-partenaire", "/tarifs"];

/** Sur ordinateur, l'app usager s'affiche dans un cadre de téléphone (430 px). */
export function CadreApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const usager = !HORS_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const { langue, dir } = useLangue();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  // Langue et sens du document (rtl pour l'arabe) — couvre la barre du bas, les modales et tout l'univers usager.
  useEffect(() => {
    const html = document.documentElement;
    html.dir = usager ? dir : "ltr";
    html.lang = usager ? langue : "fr";
  }, [usager, langue, dir]);

  return <div className={usager ? "cadre-app relative mx-auto w-full bg-white" : "w-full"}>{children}</div>;
}
