"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Bell, CalendarDays, ChevronRight, CircleHelp, Globe, Heart, Lock, LogOut, Moon, ShieldCheck, Star } from "lucide-react";
import { type AvisClient, type CompteClient } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import type { Reservation } from "@/lib/reservation";
import { useStockage } from "@/lib/stockage";
import { LogoApp } from "@/components/app/logo-app";
import { useFavoris } from "@/components/app/favoris";

export function Profil({ compte }: { compte: CompteClient | null | undefined }) {
  const router = useRouter();
  const [, setCompte] = useStockage(CLES.compte);
  const [tousAvis] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [toutesRes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const { favoris } = useFavoris();

  const stats = useMemo(() => {
    if (!compte) return { avis: 0, resa: 0 };
    const tel = compte.telephone.replace(/\D/g, "").slice(-10);
    const resa = Object.values(toutesRes ?? {})
      .flat()
      .filter((r) => r.client.telephone.replace(/\D/g, "").endsWith(tel.slice(-8))).length;
    const avis = Object.values(tousAvis ?? {})
      .flat()
      .filter((a) => a.compteId === compte.id).length;
    return { avis, resa };
  }, [compte, toutesRes, tousAvis]);

  const deconnexion = () => {
    if (!confirm("Se déconnecter de Qualité+ ?")) return;
    setCompte(null);
    router.push("/");
  };

  if (compte === undefined) return <div className="squelette mx-5 mt-10 h-40 rounded-3xl" />;

  if (compte === null) {
    return (
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col px-6 pt-14">
        <LogoApp imgClassName="h-11" />
        <h1 className="mt-10 font-display text-3xl font-extrabold text-ink">Votre profil</h1>
        <p className="mt-2 text-[15px] text-muted">
          Un compte vous permet de réserver, donner votre avis et garder vos favoris — partout.
        </p>
        <Link href="/connexion?suivant=/profil" className="btn-hero mt-8 w-full">
          Se connecter par SMS
        </Link>
        <p className="mt-4 text-center text-sm text-muted">Sans compte, l&apos;exploration reste libre.</p>
      </div>
    );
  }

  const initiales = compte.nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  const options = [
    { Icon: Globe, label: "Langue", valeur: "Français" },
    { Icon: Bell, label: "Notifications", valeur: "Activées" },
    { Icon: Lock, label: "Verrouillage", valeur: "Bientôt — empreinte / PIN" },
    { Icon: Moon, label: "Mode sombre", valeur: "Bientôt" },
    { Icon: ShieldCheck, label: "Notre méthodologie", href: "/methodologie" },
    { Icon: CircleHelp, label: "Aide", valeur: "Bientôt" },
  ];

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-10 pb-8">
      {/* En-tête profil */}
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold text-white [background:linear-gradient(135deg,#1E3A8A,#2D4DB0_45%,#16A34A)]">
          {initiales}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold text-ink">{compte.nom}</h1>
          <p className="text-sm text-muted">{compte.telephone}</p>
          <p className="mt-0.5 text-xs text-muted">Membre depuis le {formatDate(compte.creeLe)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {[
          { Icon: CalendarDays, n: stats.resa, label: "Réservations", href: "/reservations" },
          { Icon: Star, n: stats.avis, label: "Avis", href: "/profil" },
          { Icon: Heart, n: favoris.length, label: "Favoris", href: "/favoris" },
        ].map(({ Icon, n, label, href }) => (
          <Link key={label} href={href} className="rounded-3xl bg-surface p-4 text-center transition active:scale-95">
            <Icon className="mx-auto size-5 text-primary" aria-hidden />
            <p className="mt-1.5 font-display text-xl font-extrabold text-ink">{n}</p>
            <p className="text-[11px] font-bold text-muted">{label}</p>
          </Link>
        ))}
      </div>

      {/* Options */}
      <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-white shadow-card">
        {options.map(({ Icon, label, valeur, href }) => {
          const corps = (
            <>
              <Icon className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
              {valeur && <span className="text-xs text-muted">{valeur}</span>}
              {href && <ChevronRight className="size-4 text-muted" aria-hidden />}
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className="flex items-center gap-3.5 px-4 py-4 transition hover:bg-surface">
                  {corps}
                </Link>
              ) : (
                <div className="flex items-center gap-3.5 px-4 py-4">{corps}</div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={deconnexion}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-line py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="size-4" aria-hidden /> Se déconnecter
      </button>
      <p className="mt-4 text-center text-xs text-muted">Qualité+ · Abidjan — données de démonstration</p>
    </div>
  );
}
