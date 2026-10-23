"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Heart, Home, User } from "lucide-react";
import { cn } from "@/lib/site";

const ONGLETS = [
  { href: "/", label: "Accueil", Icon: Home, exact: true },
  { href: "/etablissements", label: "Explorer", Icon: Compass },
  { href: "/favoris", label: "Favoris", Icon: Heart },
  { href: "/reservations", label: "Réservas.", Icon: CalendarDays },
  { href: "/profil", label: "Profil", Icon: User },
];

/** Routes hors univers usager : la barre du bas n'y apparaît jamais. */
const HORS_APP = ["/pro", "/partenaire", "/admin", "/devenir-partenaire", "/tarifs", "/connexion", "/onboarding"];

export function NavBas() {
  const pathname = usePathname();
  if (HORS_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="verre fixed inset-x-4 bottom-3 z-50 mx-auto max-w-md rounded-full shadow-flottant lg:hidden"
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {ONGLETS.map(({ href, label, Icon, exact }) => {
          const actif = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 transition-transform duration-200",
                actif ? "scale-110 text-primary" : "text-muted active:scale-95",
              )}
            >
              <Icon className="size-5" strokeWidth={actif ? 2.4 : 2} aria-hidden />
              <span className="text-[10px] font-bold">{label}</span>
              {actif && <span className="absolute -bottom-0.5 size-1.5 rounded-full bg-success" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
