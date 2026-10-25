"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Heart, Home, User } from "lucide-react";
import { cn } from "@/lib/site";

const ONGLETS = [
  { href: "/", label: "Accueil", Icon: Home, exact: true },
  { href: "/etablissements", label: "Explorer", Icon: Compass },
  { href: "/favoris", label: "Favoris", Icon: Heart },
  { href: "/reservations", label: "Réservations", Icon: CalendarDays },
  { href: "/profil", label: "Profil", Icon: User },
];

/** Routes hors univers usager : la barre du bas n'y apparaît jamais. */
const HORS_APP = ["/pro", "/partenaire", "/admin", "/devenir-partenaire", "/tarifs", "/onboarding"];
/** Écrans usager en pleine page : pas de barre du bas (connexion SMS). */
const SANS_BARRE = ["/connexion"];

export function NavBas() {
  const pathname = usePathname();
  if ([...HORS_APP, ...SANS_BARRE].some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {ONGLETS.map(({ href, label, Icon, exact }) => {
          const actif = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition active:scale-95",
                actif ? "text-bleu" : "text-muted",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={actif ? 2.4 : 1.8} aria-hidden />
              <span className={cn("text-[10px]", actif ? "font-bold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
