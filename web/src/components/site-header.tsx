"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { NAV, cn } from "@/lib/site";

const HORS_USAGER = ["/pro", "/partenaire", "/admin"];

/** En-tête visible uniquement sur grand écran : sur mobile, l'app est pilotée par la barre du bas. */
export function SiteHeader() {
  const pathname = usePathname();
  if (HORS_USAGER.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <header className="sticky top-0 z-50 hidden border-b border-line bg-white/95 backdrop-blur lg:block">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Accueil">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Espace usagers">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-surface hover:text-primary",
                pathname.startsWith(item.href) ? "text-primary" : "text-ink/80",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
