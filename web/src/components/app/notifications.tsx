"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { Bell, CalendarDays, CircleCheck, Clock, MessageSquarePlus, Sparkles, XCircle } from "lucide-react";
import { type AvisClient, type CompteClient, telephoneNorm } from "@/lib/avis";
import { getEtablissement } from "@/lib/data";
import { CLES } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import type { Reservation } from "@/lib/reservation";
import { useStockage } from "@/lib/stockage";
import { useHorloge } from "@/lib/use-config";
import { EtatVide } from "@/components/app/ui-app";

export interface Notif {
  id: string;
  titre: string;
  detail: string;
  date: string;
  href: string;
  Icon: typeof Bell;
  ton: string;
  lue: boolean;
}

/** Notifications dérivées des données réelles du compte (réservations, avis à laisser, bienvenue). */
export function useNotifications(compte: CompteClient | null | undefined) {
  const [toutesRes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [tousAvis] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [vues, setVues] = useStockage<string[]>(CLES.notificationsVues);
  const { aujourdhui } = useHorloge();

  const items = useMemo<Notif[]>(() => {
    if (!compte || !aujourdhui) return [];
    const tel = telephoneNorm(compte.telephone);
    const jour = aujourdhui.slice(0, 10);
    const resas = Object.entries(toutesRes ?? {})
      .flatMap(([etab, liste]) => (liste ?? []).map((r) => ({ ...r, etab })))
      .filter((r) => telephoneNorm(r.client.telephone) === tel);
    const avisFaits = new Set(
      Object.values(tousAvis ?? {})
        .flat()
        .filter((a) => a.compteId === compte.id && a.statut !== "rejete" && a.preuve.type === "reservation")
        .map((a) => (a.preuve.type === "reservation" ? a.preuve.ref : "")),
    );
    const nomEtab = (slug: string) => getEtablissement(slug)?.nom ?? slug;
    const liste: Omit<Notif, "lue">[] = [];

    for (const r of resas) {
      const jourR = r.arrivee ?? r.date ?? "";
      const quand = jourR ? (r.secteur === "hotellerie" ? `arrivée le ${formatDate(jourR)}` : `${formatDate(jourR)}${r.heure ? ` à ${r.heure}` : ""}`) : "";
      if (r.statut === "confirmee" && jourR >= jour)
        liste.push({ id: `cfm-${r.id}`, titre: "Réservation confirmée", detail: `${nomEtab(r.etab)} · ${quand}`, date: r.creeLe, href: "/reservations", Icon: CircleCheck, ton: "bg-success-soft text-success" });
      else if (r.statut === "en_attente")
        liste.push({ id: `att-${r.id}`, titre: "Demande en cours", detail: `${nomEtab(r.etab)} · ${quand} · confirmation par SMS`, date: r.creeLe, href: "/reservations", Icon: Clock, ton: "bg-[#FEF3C7] text-[#B45309]" });
      else if (r.statut === "refusee")
        liste.push({ id: `ref-${r.id}`, titre: "Demande refusée", detail: `${nomEtab(r.etab)} · essayez un autre créneau`, date: r.creeLe, href: "/reservations", Icon: XCircle, ton: "bg-red-50 text-danger" });
      else if (r.statut === "honoree" && !avisFaits.has(r.reference))
        liste.push({ id: `avis-${r.id}`, titre: "Comment était votre visite ?", detail: `${nomEtab(r.etab)} · votre avis aide les autres usagers`, date: r.creeLe, href: `/etablissements/${r.etab}#avis`, Icon: MessageSquarePlus, ton: "bg-primary-soft text-primary" });
    }

    const ageJours = (new Date(aujourdhui).getTime() - new Date(compte.creeLe).getTime()) / 86_400_000;
    if (ageJours <= 7)
      liste.push({ id: `bvn-${compte.id}`, titre: `Bienvenue ${compte.nom.trim().split(/\s+/)[0]} !`, detail: "Réservez, notez et gardez vos favoris — partout.", date: compte.creeLe, href: "/etablissements", Icon: Sparkles, ton: "bg-success-soft text-success" });

    const lues = new Set(vues ?? []);
    return liste.sort((a, b) => b.date.localeCompare(a.date)).map((n) => ({ ...n, lue: lues.has(n.id) }));
  }, [compte, toutesRes, tousAvis, vues, aujourdhui]);

  const marquerVues = useCallback(() => {
    const ids = items.map((i) => i.id);
    setVues((p) => {
      const fusion = new Set([...(p ?? []), ...ids]);
      return fusion.size === (p ?? []).length ? p : [...fusion];
    });
  }, [items, setVues]);

  return { items, charge: compte !== undefined && aujourdhui !== null, marquerVues };
}

export function Notifications({ compte }: { compte: CompteClient | null | undefined }) {
  const { items, charge, marquerVues } = useNotifications(compte);
  const nonLues = items.filter((n) => !n.lue).length;

  useEffect(() => {
    if (items.length > 0) marquerVues();
  }, [items.length, marquerVues]);

  if (compte === undefined || !charge) return <div className="squelette mx-5 mt-10 h-40 rounded-3xl" />;

  if (compte === null) {
    return (
      <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <Bell className="size-9" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-ink">Connectez-vous</h1>
        <p className="mt-2 text-sm text-muted">Confirmations de réservation, rappels et invitations à donner votre avis — tout arrive ici.</p>
        <Link href="/connexion?suivant=/notifications" className="btn-hero mt-7 w-full">
          Recevoir mon code SMS
        </Link>
        <Link href="/" className="mt-4 text-sm font-semibold text-muted">
          Explorer sans compte
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Notifications</h1>
      <p className="mt-1 text-sm text-muted">{items.length === 0 ? "Vous êtes à jour." : `${items.length} notification${items.length > 1 ? "s" : ""}`}</p>

      {items.length === 0 ? (
        <div className="mt-10">
          <EtatVide
            Icon={Bell}
            titre="Aucune notification"
            detail="Les confirmations de réservation et les rappels apparaîtront ici."
            action={
              <Link href="/etablissements" className="btn-hero mt-2">
                <CalendarDays className="size-4" aria-hidden /> Réserver une table, une chambre, un soin
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className="flex items-start gap-3.5 rounded-3xl border border-line bg-white p-4 shadow-card transition active:scale-[0.99]">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${n.ton}`}>
                  <n.Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display font-bold text-ink">{n.titre}</span>
                    {!n.lue && <span className="size-2 shrink-0 rounded-full bg-danger" aria-label="Non lue" />}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{n.detail}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-muted/70">{formatDate(n.date)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {nonLues > 0 && <p className="sr-only">{nonLues} non lue(s)</p>}
    </div>
  );
}
