"use client";

import Link from "next/link";
import { Award, Bell, CalendarClock, CheckCircle2, ClipboardCheck, CreditCard, FileCheck2, MessageSquareText, Sparkles, Star } from "lucide-react";
import { CLES, type Dossier, avisDemo } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import type { AvisClient } from "@/lib/avis";
import type { Reservation } from "@/lib/reservation";
import { useHorloge } from "@/lib/use-config";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, EtatVidePro } from "@/components/pro/ui";

interface Notif {
  id: string;
  Icon: typeof Bell;
  titre: string;
  detail: string;
  date: string;
  href?: string;
  ton: string;
}

const ilYA = (iso: string, ref: string) => {
  const j = Math.max(0, Math.round((new Date(ref).getTime() - new Date(iso).getTime()) / 86400000));
  return j === 0 ? "Aujourd'hui" : j === 1 ? "Hier" : `Il y a ${j} j`;
};

export function NotificationsPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [resaTous] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [vues, setVues] = useStockage<string[]>(CLES.notificationsProVues);
  const { aujourdhui } = useHorloge();

  if (dossier === undefined || avisTous === undefined || resaTous === undefined || vues === undefined || !aujourdhui) return <Chargement />;

  if (!dossier)
    return (
      <div className="px-5 py-8">
        <EtatVidePro icone={<Bell className="size-8" aria-hidden />} titre="Aucune notification" detail="Les événements de votre dossier apparaîtront ici." />
      </div>
    );

  const ref = aujourdhui.slice(0, 10);
  const notifs: Notif[] = [];
  for (const h of dossier.historique) {
    if (h.statut === "soumis") notifs.push({ id: `h-soumis`, Icon: FileCheck2, titre: "Dossier reçu", detail: "Votre candidature est en cours d'examen par nos équipes.", date: h.date, href: "/pro/parcours", ton: "bg-primary-soft text-primary" });
    if (h.statut === "en_audit") notifs.push({ id: `h-audit`, Icon: CalendarClock, titre: "Audit programmé", detail: dossier.creneauAudit ? `Passage prévu le ${formatDate(dossier.creneauAudit)}.` : "Votre agent vous contactera pour convenir du créneau.", date: h.date, href: "/pro/audit", ton: "bg-primary-soft text-primary" });
    if (h.statut === "admis") notifs.push({ id: `h-admis`, Icon: ClipboardCheck, titre: "Résultat de l'audit — admis !", detail: `Score ${dossier.audit?.global ?? ""} % — votre établissement dépasse le seuil de 80 %.`, date: h.date, href: "/pro/resultat", ton: "bg-success-soft text-success" });
    if (h.statut === "refuse") notifs.push({ id: `h-refuse`, Icon: ClipboardCheck, titre: "Résultat de l'audit", detail: "Sous le seuil — un accompagnement peut vous aider à progresser.", date: h.date, href: "/pro/accompagnement", ton: "bg-or/15 text-[#b45309]" });
  }
  for (const t of dossier.transactions ?? [])
    notifs.push({ id: `tx-${t.id}`, Icon: CreditCard, titre: "Paiement reçu", detail: `${t.facture ? `Facture ${t.facture}` : "Paiement"} — merci. Votre fiche reste publiée.`, date: t.date, href: "/pro/abonnement", ton: "bg-success-soft text-success" });
  for (const a of [...(avisTous?.[dossier.id] ?? []), ...avisDemo()])
    notifs.push({ id: `avis-${a.id}`, Icon: MessageSquareText, titre: "Nouvel avis client", detail: `${a.auteur} vous a laissé ${a.note} ★ — pensez à répondre.`, date: a.date, href: "/pro/avis", ton: "bg-primary-soft text-primary" });
  for (const r of (resaTous?.[dossier.id] ?? []).filter((x) => x.statut === "en_attente"))
    notifs.push({ id: `resa-${r.id}`, Icon: Bell, titre: "Réservation à confirmer", detail: `${r.client.nom} — réf. ${r.reference}.`, date: r.creeLe, href: "/pro/reservations", ton: "bg-or/15 text-[#b45309]" });
  if (dossier.abonnement)
    notifs.push({ id: "ab-expire", Icon: CreditCard, titre: "Échéance d'abonnement", detail: `Votre pack court jusqu'au ${formatDate(dossier.abonnement.fin)}.`, date: dossier.abonnement.debut, href: "/pro/abonnement", ton: "bg-surface text-muted" });
  if (dossier.audit)
    notifs.push({ id: "controle", Icon: Award, titre: "Prochain contrôle qualité", detail: "Une visite de contrôle est planifiée — gardez vos bonnes pratiques.", date: dossier.audit.date, href: "/pro/plus/controles", ton: "bg-surface text-muted" });
  notifs.push({ id: "rapport", Icon: Sparkles, titre: "Rapport mensuel IA", detail: "La synthèse de vos avis du mois est disponible.", date: aujourdhui, href: "/pro/rapports", ton: "bg-surface text-muted" });

  const triees = notifs.sort((a, b) => b.date.localeCompare(a.date));
  const idsVus = new Set(vues);

  return (
    <>
      <EntetePro
        titre="Notifications"
        action={
          <button type="button" onClick={() => setVues(triees.map((n) => n.id))} className="text-xs font-bold text-bleu">
            Tout marquer lu
          </button>
        }
      />
      <ul className="space-y-2.5 px-5 pb-6">
        {triees.map((n) => {
          const nonLue = !idsVus.has(n.id);
          const inner = (
            <>
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", n.ton)}>
                <n.Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn("truncate text-sm", nonLue ? "font-extrabold text-ink" : "font-semibold text-ink")}>{n.titre}</span>
                  {nonLue && <span className="size-2 shrink-0 rounded-full bg-bleu" aria-label="Non lue" />}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.detail}</span>
                <span className="mt-1 block text-[10px] font-semibold text-muted">
                  {ilYA(n.date, ref)} · {formatDate(n.date)}
                </span>
              </span>
            </>
          );
          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className={cn("flex items-start gap-3 rounded-2xl border p-3.5 transition active:scale-[0.99]", nonLue ? "border-bleu/30 bg-white shadow-card" : "border-line bg-white/70")}>{inner}</Link>
              ) : (
                <div className={cn("flex items-start gap-3 rounded-2xl border p-3.5", nonLue ? "border-bleu/30 bg-white shadow-card" : "border-line bg-white/70")}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {triees.length === 0 && <EtatVidePro icone={<Star className="size-8" aria-hidden />} titre="Rien de nouveau" detail="Vous êtes à jour." />}
      <CheckCircle2 className="sr-only" aria-hidden />
    </>
  );
}
