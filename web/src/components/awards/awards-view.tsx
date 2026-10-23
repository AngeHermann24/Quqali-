"use client";

import Link from "next/link";
import { Trophy, Users, ShieldCheck, Scale, Medal, Flag } from "lucide-react";
import { SECTEURS } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { cn } from "@/lib/site";
import { useAwards } from "@/components/awards/use-awards";
import { Chargement, Pastille } from "@/components/espace/ui";

const MEDAILLES = ["bg-amber-400", "bg-slate-300", "bg-amber-700"];

export function AwardsView({ admin, sansLiens }: { admin?: boolean; sansLiens?: boolean }) {
  const data = useAwards();
  if (!data.charge) return <Chargement />;
  const laureats = data.classements.map(({ categorie, lignes }) => ({ categorie, gagnant: lignes[0] })).filter((x) => x.gagnant);

  return (
    <div className="space-y-10">
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {laureats.map(({ categorie, gagnant }) => (
            <div key={categorie.id} className={cn("card flex flex-col p-4", admin && "order-none")}>
              <Trophy className="size-6 text-amber-500" aria-hidden />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{categorie.nom}</p>
              <p className="mt-1 font-display font-semibold text-ink">
                {gagnant.candidat.slug && !sansLiens ? <Link href={`/etablissements/${gagnant.candidat.slug}`} className="hover:text-primary">{gagnant.candidat.nom}</Link> : gagnant.candidat.nom}
              </p>
              <p className="mt-auto pt-2 text-sm font-bold text-primary">{formatScore(gagnant.scoreFinal)} pts</p>
            </div>
          ))}
        </div>
      </section>

      {data.classements.map(({ categorie, lignes }) => (
        <section key={categorie.id}>
          <h2 className="font-display text-xl font-semibold text-primary">{categorie.nom}</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="hidden grid-cols-[3rem_1fr_7.5rem_7.5rem_6rem] gap-2 border-b border-line bg-surface px-4 py-2.5 text-xs font-semibold text-muted sm:grid">
              <span>Rang</span>
              <span>Établissement</span>
              <span className="text-right">Clients 30 %</span>
              <span className="text-right">Évaluateurs 70 %</span>
              <span className="text-right">Final</span>
            </div>
            <ul className="divide-y divide-line">
              {lignes.map((l) => (
                <li key={l.candidat.id} className={cn("grid gap-2 px-4 py-3 sm:grid-cols-[3rem_1fr_7.5rem_7.5rem_6rem] sm:items-center", l.laureat && "bg-amber-50")}>
                  <span className="flex items-center gap-2">
                    <span className={cn("grid size-7 place-items-center rounded-full text-xs font-bold text-white", MEDAILLES[l.rang - 1] ?? "bg-line text-ink")}>{l.rang}</span>
                    {l.laureat && <Medal className="size-4 text-amber-500 sm:hidden" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      {l.candidat.slug && !sansLiens ? (
                        <Link href={`/etablissements/${l.candidat.slug}`} className="font-semibold text-ink hover:text-primary">
                          {l.candidat.nom}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink">{l.candidat.nom}</span>
                      )}
                      <span className="text-xs text-muted">{SECTEURS[l.candidat.secteur].label}</span>
                      {l.laureat && <Pastille ton="succes">Lauréat</Pastille>}
                    </span>
                    <span className="text-xs text-muted sm:hidden">
                      Clients {formatScore(l.scoreClients)} ({l.nbVotes} votes) · Évaluateurs {formatScore(l.scoreEvaluateurs)}
                    </span>
                  </span>
                  <span className="hidden text-right text-sm text-ink sm:block">
                    {formatScore(l.scoreClients)}
                    <span className="block text-[11px] text-muted">{l.nbVotes} votes</span>
                  </span>
                  <span className="hidden text-right text-sm text-ink sm:block">{formatScore(l.scoreEvaluateurs)}</span>
                  <span className="hidden text-right font-display text-base font-bold text-primary sm:block">{formatScore(l.scoreFinal)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <div className="grid gap-4 rounded-2xl bg-surface p-5 text-sm sm:grid-cols-3">
        <p className="flex gap-2 text-ink">
          <Users className="size-5 shrink-0 text-primary" aria-hidden />
          <span><strong>30 % clients</strong> : moyenne des avis vérifiés de l&apos;année ({data.totalVotes} votes), lissée pour éviter qu&apos;un seul avis ne fausse le palmarès.</span>
        </p>
        <p className="flex gap-2 text-ink">
          <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
          <span><strong>70 % évaluateurs</strong> : note de l&apos;audit sur place (globale, ou critère accueil/hygiène pour ces catégories).</span>
        </p>
        <p className="flex gap-2 text-ink">
          <Scale className="size-5 shrink-0 text-primary" aria-hidden />
          <span><strong>Éligibilité</strong> : établissements certifiés (≥ 80 %) et non suspendus. Départage : plus grand nombre de votes clients.</span>
        </p>
      </div>

      {admin && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-ink">
            <Flag className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Scrutin {data.annee} en cours · {data.enVerification} avis en attente de modération.
          </p>
          <Link href="/admin/moderation" className="btn btn-primary shrink-0">
            Ouvrir la modération
          </Link>
        </div>
      )}
    </div>
  );
}
