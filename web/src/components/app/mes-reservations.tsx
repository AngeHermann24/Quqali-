"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, CalendarX, MessageSquarePlus, Pencil } from "lucide-react";
import { type AvisClient, type CompteClient, telephoneNorm } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { type Reservation, type StatutReservation, changerStatut } from "@/lib/reservation";
import { changerStatutReservation, mesAvis, mesReservations } from "@/lib/actions/usager";
import { fmt, tv, type CleStr } from "@/lib/langue";
import { useCatalogue } from "@/components/catalogue";
import { useLangue } from "@/components/langue";
import { useSession } from "@/components/session";
import { useStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";

const ONGLETS = [
  { id: "avenir", cle: "aVenir", statuts: ["en_attente", "confirmee"] },
  { id: "passees", cle: "passees", statuts: ["honoree", "absent"] },
  { id: "annulees", cle: "annulees", statuts: ["annulee", "refusee"] },
] as const;

const CLE_STATUT: Record<StatutReservation, CleStr> = {
  en_attente: "statutEnAttente",
  confirmee: "statutConfirmee",
  honoree: "statutHonoree",
  absent: "statutAbsent",
  annulee: "statutAnnulee",
  refusee: "statutRefusee",
};

const COULEURS: Record<StatutReservation, string> = {
  en_attente: "bg-surface text-ink",
  confirmee: "bg-success text-white",
  honoree: "bg-primary text-white",
  absent: "bg-surface text-muted",
  annulee: "bg-surface text-muted line-through",
  refusee: "bg-red-50 text-red-700",
};

export function MesReservations({ compte }: { compte: CompteClient | null | undefined }) {
  const { t, locale } = useLangue();
  const { mode } = useSession();
  const { getEtablissement: getEtablissementCtx } = useCatalogue();
  const [toutes, setToutes] = useStockage<Record<string, Reservation[]>>(CLES.reservations);
  const [tousAvis] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("avenir");
  const [db, setDb] = useState<{ resas: (Reservation & { etab: string })[]; avis: AvisClient[] } | null>(null);

  // Mode Supabase : réservations et avis viennent de la base.
  useEffect(() => {
    if (mode !== "supabase" || !compte) return;
    let actif = true;
    void Promise.all([mesReservations(compte.telephone), mesAvis()]).then(([resas, avis]) => {
      if (actif) setDb({ resas: resas.map((r) => ({ ...r, etab: r.etablissementId })), avis });
    });
    return () => {
      actif = false;
    };
  }, [mode, compte]);

  const mienne = useMemo(() => {
    if (!compte) return [];
    if (mode === "supabase") return db?.resas ?? [];
    const tel = telephoneNorm(compte.telephone);
    return Object.entries(toutes ?? {})
      .flatMap(([etab, liste]) => (liste ?? []).map((r) => ({ ...r, etab })))
      .filter((r) => telephoneNorm(r.client.telephone) === tel)
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  }, [mode, db, toutes, compte]);

  const avisPour = (etab: string, reservationId: string) => {
    const liste = mode === "supabase" ? (db?.avis ?? []).filter((a) => a.etablissementId === etab) : (tousAvis?.[etab] ?? []);
    return liste.some((a) => a.preuve.type === "reservation" && a.preuve.ref === reservationId && a.statut !== "rejete");
  };

  const visibles = mienne.filter((r) => (ONGLETS.find((o) => o.id === onglet)!.statuts as readonly string[]).includes(r.statut));

  const annuler = (r: Reservation & { etab: string }) => {
    if (!confirm(fmt(t.confirmAnnulation, { n: r.reference }))) return;
    if (mode === "supabase") {
      void changerStatutReservation(r.id, "annulee").then(() => mesReservations(compte!.telephone)).then((resas) =>
        setDb((d) => (d ? { ...d, resas: resas.map((x) => ({ ...x, etab: x.etablissementId })) } : d)),
      );
    } else {
      const maj = changerStatut(r, "annulee", new Date().toISOString());
      setToutes((p) => ({ ...p, [r.etab]: (p?.[r.etab] ?? []).map((x) => (x.id === r.id ? maj : x)) }));
    }
    navigator.vibrate?.(15);
  };

  if (compte === undefined) return <div className="squelette mx-5 mt-10 h-40 rounded-3xl" />;
  if (compte === null) return <Invitation />;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t.mesReservations}</h1>
      <p className="mt-1 text-sm text-muted">{mienne.length === 0 ? t.rienPrevu : tv(t.nbReservations, mienne.length)}</p>

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
            {t[o.cle]}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-surface text-muted">
            <CalendarDays className="size-9" aria-hidden />
          </span>
          <p className="mt-5 font-display text-lg font-bold text-ink">{t.aucuneResa}</p>
          <Link href="/etablissements?reservation=1" className="btn-hero mt-6">
            {t.trouverEtab}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibles.map((r) => {
            const e = getEtablissementCtx(r.etab);
            const quand = r.date ? fmt(t.detailDateHeure, { d: formatDate(r.date, locale), h: r.heure ?? "" }) : "";
            const detail =
              r.secteur === "hotellerie"
                ? `${formatDate(r.arrivee ?? "", locale)} → ${formatDate(r.depart ?? "", locale)} · ${tv(t.nbChambres, r.nbChambres ?? 1)}`
                : r.secteur === "sante"
                  ? `${quand} · ${r.motif ?? t.consultation}`
                  : `${quand} · ${tv(r.secteur === "restauration" ? t.nbCouverts : t.nbPersonnes, r.couverts ?? 2)}`;
            return (
              <li key={r.id} className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/etablissements/${r.etab}`} className="truncate font-display font-bold text-ink hover:text-primary">
                      {e?.nom ?? r.etab}
                    </Link>
                    <p className="mt-0.5 text-xs font-medium text-muted">{t.refLabel} {r.reference}</p>
                  </div>
                  <span className={cn("chip shrink-0 font-bold", COULEURS[r.statut])}>{t[CLE_STATUT[r.statut]]}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{detail}</p>
                <div className="mt-3 flex gap-2">
                  {(r.statut === "en_attente" || r.statut === "confirmee") && (
                    <>
                      <Link href={`/reserver/${r.etab}?modifier=${r.id}`} className="btn btn-outline flex-1 py-2 text-xs font-bold">
                        <Pencil className="size-4" aria-hidden /> {t.modifier}
                      </Link>
                      <button
                        type="button"
                        onClick={() => annuler(r)}
                        className="btn flex-1 border border-line py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <CalendarX className="size-4" aria-hidden /> {t.annulerResa}
                      </button>
                    </>
                  )}
                  {(r.statut === "confirmee" || r.statut === "honoree") &&
                    (avisPour(r.etab, r.id) ? (
                      <span className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold text-success">
                        <BadgeCheck className="size-4" aria-hidden /> {t.avisPublie}
                      </span>
                    ) : (
                      <Link href={`/avis/${r.etab}?reservation=${r.id}`} className="btn btn-outline flex-1 py-2 text-xs font-bold">
                        <MessageSquarePlus className="size-4" aria-hidden /> {t.donnerAvis}
                      </Link>
                    ))}
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
  const { t } = useLangue();
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
        <CalendarDays className="size-9" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold text-ink">{t.connectezVous}</h1>
      <p className="mt-2 text-sm text-muted">{t.resasAttendent}</p>
      <Link href="/connexion?suivant=/reservations" className="btn-hero mt-7 w-full">
        {t.recevoirSms}
      </Link>
      <Link href="/" className="mt-4 text-sm font-semibold text-muted">
        {t.explorerSansCompte}
      </Link>
    </div>
  );
}
