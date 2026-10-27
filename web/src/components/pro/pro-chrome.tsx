"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Bell, Building2, CalendarDays, CircleHelp, FileText, Footprints, LayoutDashboard, MessageSquareText, MoreHorizontal } from "lucide-react";
import { CLES } from "@/lib/espace";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import type { ComptePro } from "@/lib/pro-demo";
import type { Dossier } from "@/lib/espace";
import { estPublie } from "@/lib/pro-service";
import { Chargement } from "@/components/espace/ui";
import { LogoPro } from "@/components/pro/ui";

/** Pages accessibles sans compte établissement. */
const PUBLIQUES = ["/pro/connexion", "/pro/onboarding"];

const NAV_AVANT = [
  { href: "/pro/parcours", label: "Mon parcours", Icon: Footprints },
  { href: "/pro/documents", label: "Documents", Icon: FileText },
  { href: "/pro/aide", label: "Aide", Icon: CircleHelp },
  { href: "/pro/profil", label: "Profil", Icon: Building2 },
];

const NAV_APRES = [
  { href: "/pro", label: "Tableau de bord", Icon: LayoutDashboard, exact: true },
  { href: "/pro/fiche", label: "Ma fiche", Icon: FileText },
  { href: "/pro/avis", label: "Avis", Icon: MessageSquareText },
  { href: "/pro/reservations", label: "Réservations", Icon: CalendarDays },
  { href: "/pro/plus", label: "Plus", Icon: MoreHorizontal },
];

export function ProChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [compte] = useStockage<ComptePro>(CLES.comptePro);
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [sombre] = useStockage<boolean>(CLES.sombrePro);

  const publique = PUBLIQUES.includes(pathname);
  useEffect(() => {
    if (!publique && compte === null) router.replace("/pro/connexion");
  }, [publique, compte, router]);

  if (publique) {
    return <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white shadow-flottant sm:border-x sm:border-line">{children}</div>;
  }
  if (compte === undefined || compte === null) return <Chargement />;

  const publie = estPublie(dossier);
  const onglets = publie ? NAV_APRES : NAV_AVANT;

  return (
    <div className={cn("mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-surface shadow-flottant sm:border-x sm:border-line", sombre && "pro-sombre")}>
      {/* En-tête : logo Pro + notifications */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white px-5 shadow-card">
        <Link href={publie ? "/pro" : "/pro/parcours"} aria-label="Qualité+ Pro" className="rounded-lg">
          <LogoPro imgClassName="h-7" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pro/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-white transition active:scale-90">
            <Bell className="size-5 text-ink" aria-hidden />
          </Link>
          <Link href="/pro/profil" aria-label="Profil" className="grid size-10 place-items-center rounded-full bg-primary font-display text-sm font-bold text-white">
            {dossier?.nom?.[0] ?? "Q"}
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      {/* Barre du bas — design plat, onglet actif bleu */}
      <nav aria-label="Navigation établissement" className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-line bg-white">
        <div className="flex items-stretch justify-around px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          {onglets.map(({ href, label, Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const actif = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={cn("flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 transition", actif ? "text-bleu" : "text-muted active:scale-95")}
              >
                <Icon className="size-5" strokeWidth={actif ? 2.4 : 2} aria-hidden />
                <span className={cn("max-w-full truncate text-[10px]", actif ? "font-bold" : "font-semibold")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
