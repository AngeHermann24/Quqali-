"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, CalendarX, MessageSquarePlus } from "lucide-react";
import { type CompteClient, telephoneNorm } from "@/lib/avis";
import { getEtablissement } from "@/lib/data";
import { CLES } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { type Reservation, STATUTS_RESERVATION, type StatutReservation, changerStatut } from "@/lib/reservation";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";

const ONGLETS = [
  { id: "avenir", label: "À venir", statuts: ["en_attente", "confirmee"] },
  { id: "passees", label: "Passées", statuts: ["honoree", "absent"] },
  { id: "annulees", label: "Annulées", statuts: ["annulee", "refusee"] },
] as const;

const COULEURS: Record<StatutReservation, string> = {
  en_attente: "bg-surface text-ink",
  confirmee: "bg-success text-white",
  honoree: "bg-primary text-white",
  absent: "bg-surface text-muted",
  annulee: "bg-surface text-muted line-through",
  refusee: "bg-red-50 text-red-700",
};

export function MesReservations({ compte }: { compte: CompteClient | null | undefined }) {
  const [toutes, setToutes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("avenir");

  const mienne = useMemo(() => {
    if (!compte) return [];
    const tel = telephoneNorm(compte.telephone);
    return Object.entries(toutes ?? {})
      .flatMap(([etab, liste]) => (liste ?? []).map((r) => ({ ...r, etab })))
      .filter((r) => telephoneNorm(r.client.telephone) === tel)
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  }, [toutes, compte]);

  const visibles = mienne.filter((r) => (ONGLETS.find((o) => o.id === onglet)!.statuts as readonly string[]).includes(r.statut));

  const annuler = (r: Reservation & { etab: string }) => {
    if (!confirm(`Annuler la réservation ${r.reference} ?`)) return;
    const maj = changerStatut(r, "annulee", new Date().toISOString());
    setToutes((p) => ({ ...p, [r.etab]: (p?.[r.etab] ?? []).map((x) => (x.id === r.id ? maj : x)) }));
    navigator.vibrate?.(15);
  };

  if (compte === undefined) return <div className="squelette mx-5 mt-10 h-40 rounded-3xl" />;
  if (compte === null) return <Invitation />;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Mes réservations</h1>
      <p className="mt-1 text-sm text-muted">{mienne.length === 0 ? "Rien de prévu pour l'instant." : `${mienne.length} réservation${mienne.length > 1 ? "s" : ""}`}</p>

      <div className="mt-6 flex gap-2 rounded-full bg-surface p-1.5">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={cn(
              "flex-1 rounded-full py-2.5 text-[13px] font-bold transition",
              onglet === o.id ? "bg-white text-primary shadow-card" : "text-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-surface text-muted">
            <CalendarDays className="size-9" aria-hidden />
          </span>
          <p className="mt-5 font-display text-lg font-bold text-ink">Aucune réservation ici</p>
          <Link href="/etablissements?reservation=1" className="btn-hero mt-6">
            Trouver un établissement
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibles.map((r) => {
            const e = getEtablissement(r.etab);
            const detail =
              r.secteur === "hotellerie"
                ? `${formatDate(r.arrivee ?? "")} → ${formatDate(r.depart ?? "")} · ${r.nbChambres ?? 1} chambre${(r.nbChambres ?? 1) > 1 ? "s" : ""}`
                : r.secteur === "sante"
                  ? `${formatDate(r.date ?? "")} à ${r.heure ?? ""} · ${r.motif ?? "Consultation"}`
                  : `${formatDate(r.date ?? "")} à ${r.heure ?? ""} · ${r.couverts ?? 2} ${r.secteur === "restauration" ? "couverts" : "personne(s)"}`;
            return (
              <li key={r.id} className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/etablissements/${r.etab}`} className="truncate font-display font-bold text-ink hover:text-primary">
                      {e?.nom ?? r.etab}
                    </Link>
                    <p className="mt-0.5 text-xs font-medium text-muted">Réf. {r.reference}</p>
                  </div>
                  <span className={cn("chip shrink-0 font-bold", COULEURS[r.statut])}>{STATUTS_RESERVATION[r.statut]}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{detail}</p>
                <div className="mt-3 flex gap-2">
                  {(r.statut === "en_attente" || r.statut === "confirmee") && (
                    <button
                      type="button"
                      onClick={() => annuler(r)}
                      className="btn flex-1 border border-line py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <CalendarX className="size-4" aria-hidden /> Annuler
                    </button>
                  )}
                  {(r.statut === "confirmee" || r.statut === "honoree") && (
                    <Link href={`/etablissements/${r.etab}#avis`} className="btn btn-outline flex-1 py-2 text-xs font-bold">
                      <MessageSquarePlus className="size-4" aria-hidden /> Donner mon avis
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Invitation() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
        <CalendarDays className="size-9" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold text-ink">Connectez-vous</h1>
      <p className="mt-2 text-sm text-muted">Vos réservations, vos avis et vos favoris vous attendent. Un code SMS suffit.</p>
      <Link href="/connexion?suivant=/reservations" className="btn-hero mt-7 w-full">
        Recevoir mon code SMS
      </Link>
      <Link href="/" className="mt-4 text-sm font-semibold text-muted">
        Explorer sans compte
      </Link>
    </div>
  );
}
