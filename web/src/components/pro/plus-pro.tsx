"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  Gauge,
  GraduationCap,
  Handshake,
  LogOut,
  Rotate3d,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { packActif } from "@/lib/pro-service";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import type { ComptePro } from "@/lib/pro-demo";
import { Chargement } from "@/components/espace/ui";
import { EntetePro } from "@/components/pro/ui";

const GROUPES: { titre: string; items: { href: string; label: string; desc: string; Icon: typeof Bell; premium?: true }[] }[] = [
  {
    titre: "Mon activité",
    items: [
      { href: "/pro/abonnement", label: "Abonnement", desc: "Pack, paiements, factures", Icon: CreditCard },
      { href: "/pro/rapports", label: "Rapport mensuel IA", desc: "Synthèse avis, recommandations", Icon: Sparkles, premium: true },
      { href: "/pro/premium", label: "Visite 3D", desc: "Visite virtuelle de l'établissement", Icon: Rotate3d, premium: true },
    ],
  },
  {
    titre: "Certification",
    items: [
      { href: "/pro/accompagnement", label: "Accompagnement", desc: "Plan d'action et réaudit", Icon: Handshake },
      { href: "/pro/formations", label: "Formations", desc: "Capsules vidéo payantes sur la qualité", Icon: GraduationCap },
      { href: "/pro/plus/controles", label: "Contrôles", desc: "Calendrier, seuil 80 %", Icon: Gauge },
      { href: "/pro/plus/awards", label: "Awards Qualité+", desc: "Nominations et classement", Icon: Trophy },
      { href: "/pro/documents", label: "Documents", desc: "Pièces du dossier", Icon: FileText },
    ],
  },
  {
    titre: "Compte",
    items: [
      { href: "/pro/notifications", label: "Notifications", desc: "Audit, avis, réservations", Icon: Bell },
      { href: "/pro/profil", label: "Équipe et paramètres", desc: "Utilisateurs, verrouillage, thème", Icon: Users },
      { href: "/pro/aide", label: "Aide", desc: "Questions fréquentes, support", Icon: CircleHelp },
    ],
  },
];

export function PlusPro() {
  const router = useRouter();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [, setCompte] = useStockage<ComptePro | null>(CLES.comptePro);
  if (dossier === undefined) return <Chargement />;
  const premium = packActif(dossier) === "premium";

  return (
    <>
      <EntetePro titre="Plus" />
      <div className="space-y-5 px-5 pb-6">
        {GROUPES.map(({ titre, items }) => (
          <section key={titre}>
            <p className="mb-2 px-1 text-[11px] font-bold tracking-wide text-muted uppercase">{titre}</p>
            <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              {items.map(({ href, label, desc, Icon, premium: p }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3.5 p-4 transition active:bg-surface">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", p ? "bg-or/15 text-[#b45309]" : "bg-primary-soft text-primary")}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-bold text-ink">
                        {label}
                        {p && (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", premium ? "bg-success-soft text-success" : "bg-surface text-muted")}>
                            <Crown className="mr-0.5 inline size-3" aria-hidden />
                            {premium ? "Inclus" : "Premium"}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted">{desc}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <p className="mb-2 px-1 text-[11px] font-bold tracking-wide text-muted uppercase">Session</p>
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <button
              type="button"
              onClick={() => {
                setCompte(null);
                router.push("/pro/connexion");
              }}
              className="flex w-full items-center gap-3.5 p-4 text-left transition active:bg-surface"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                <LogOut className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-danger">Se déconnecter</span>
            </button>
          </div>
        </section>

        <p className="pt-1 text-center text-[11px] text-muted">
          <Settings className="mr-1 inline size-3" aria-hidden /> Qualité+ Pro · Ensemble pour la qualité !
        </p>
      </div>
    </>
  );
}
