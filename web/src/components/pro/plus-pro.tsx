"use client";

import Link from "next/link";
import { CreditCard, Gauge, Handshake, Rotate3d, Settings, Sparkles, Trophy } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

const ITEMS = [
  { href: "/pro/abonnement", label: "Abonnement", desc: "Pack, paiements Mobile Money, factures PDF", Icon: CreditCard },
  { href: "/pro/accompagnement", label: "Accompagnement", desc: "Plan d'action, suivi, réaudit", Icon: Handshake },
  { href: "/pro/premium", label: "Visite 3D", desc: "Visite virtuelle de votre établissement", Icon: Rotate3d, premium: true },
  { href: "/pro/rapports", label: "Rapport mensuel IA", desc: "Points forts, thèmes, recommandations", Icon: Sparkles, premium: true },
  { href: "/pro/plus/awards", label: "Awards", desc: "Catégories, classement, 30 % clients / 70 % évaluateurs", Icon: Trophy },
  { href: "/pro/plus/controles", label: "Contrôles réguliers", desc: "Calendrier, résultats, seuil 80 %", Icon: Gauge },
  { href: "/pro/profil", label: "Paramètres", desc: "Utilisateurs, notifications, verrouillage", Icon: Settings },
];

export function PlusPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;
  const premium = dossier?.abonnement?.pack === "premium";

  return (
    <>
      <EspaceHeader role="Plus" titre="Toutes les fonctions" sousTitre={dossier?.nom} />
      <div className="container-page max-w-2xl py-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {ITEMS.map(({ href, label, desc, Icon, premium: p }) => (
            <li key={href}>
              <Link href={href} className="card flex items-start gap-3 p-4 transition hover:border-primary/40 active:scale-[0.98]">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    {label}
                    {p && <Pastille ton={premium ? "succes" : "neutre"}>{premium ? "Inclus" : "Premium"}</Pastille>}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
