"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Building2, CalendarDays, CircleHelp, FileText, Footprints, LayoutDashboard, MessageSquareText, MoreHorizontal, ShieldCheck } from "lucide-react";
import { CLES } from "@/lib/espace";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import type { ComptePro } from "@/lib/pro-demo";
import type { Dossier } from "@/lib/espace";
import { Chargement } from "@/components/espace/ui";
import { Logo } from "@/components/logo";

/** Pages accessibles sans compte établissement. */
const PUBLIQUES = ["/pro/connexion", "/pro/onboarding"];

const NAV_AVANT = [
  { href: "/pro/parcours", label: "Mon parcours", Icon: Footprints },
  { href: "/pro/documents", label: "Documents", Icon: FileText },
  { href: "/pro/aide", label: "Aide", Icon: CircleHelp },
  { href: "/pro/profil", label: "Profil", Icon: Building2 },
];

const NAV_APRES = [
  { href: "/pro", label: "Accueil", Icon: LayoutDashboard, exact: true },
  { href: "/pro/fiche", label: "Ma fiche", Icon: FileText },
  { href: "/pro/avis", label: "Avis", Icon: MessageSquareText },
  { href: "/pro/reservations", label: "Réservas.", Icon: CalendarDays },
  { href: "/pro/plus", label: "Plus", Icon: MoreHorizontal },
];

export function ProChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [compte] = useStockage<ComptePro>(CLES.comptePro);
  const [dossier] = useStockage<Dossier>(CLES.dossier);

  const publique = PUBLIQUES.includes(pathname);
  useEffect(() => {
    if (!publique && compte === null) router.replace("/pro/connexion");
  }, [publique, compte, router]);

  if (publique) return <>{children}</>;
  if (compte === undefined || compte === null) return <Chargement />;

  const publie = dossier?.statut === "admis";
  const onglets = publie ? NAV_APRES : NAV_AVANT;

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary text-white">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link href={publie ? "/pro" : "/pro/parcours"} className="flex items-center gap-2" aria-label="Qualité+ Pro">
            <Logo light />
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">Pro</span>
          </Link>
          {dossier && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
              <ShieldCheck className="size-4 shrink-0 text-[#7ee2a4]" aria-hidden />
              <span className="truncate">{dossier.nom}</span>
            </span>
          )}
        </div>
      </header>

      {children}

      <nav aria-label="Navigation établissement" className="verre fixed inset-x-4 bottom-3 z-50 mx-auto max-w-md rounded-full shadow-flottant">
        <div className="flex items-center justify-around px-2 py-1.5">
          {onglets.map(({ href, label, Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const actif = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={cn("relative flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 transition-transform duration-200", actif ? "scale-110 text-primary" : "text-muted active:scale-95")}
              >
                <Icon className="size-5" strokeWidth={actif ? 2.4 : 2} aria-hidden />
                <span className="text-[10px] font-bold">{label}</span>
                {actif && <span className="absolute -bottom-0.5 size-1.5 rounded-full bg-success" aria-hidden />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
