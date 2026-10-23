"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { type AvisClient, STATUTS_AVIS, type StatutAvis } from "@/lib/avis";
import { ETABLISSEMENTS } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { Stars } from "@/components/ui";

const ORDRE: StatutAvis[] = ["signale", "en_verification", "rejete"];
const TONS: Record<StatutAvis, "alerte" | "primaire" | "neutre"> = { signale: "alerte", en_verification: "primaire", rejete: "neutre", publie: "neutre" };

export function ModerationAvis() {
  const [tous, setTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [filtre, setFiltre] = useState<StatutAvis | "tous">("signale");
  if (tous === undefined || dossier === undefined) return <Chargement />;

  const nomEtab = (id: string) => ETABLISSEMENTS.find((e) => e.slug === id)?.nom ?? (dossier?.id === id ? dossier.nom : id);
  const lignes = Object.values(tous ?? {})
    .flat()
    .filter((a) => a.statut !== "publie")
    .sort((a, b) => ORDRE.indexOf(a.statut) - ORDRE.indexOf(b.statut) || b.date.localeCompare(a.date));
  const visibles = filtre === "tous" ? lignes : lignes.filter((a) => a.statut === filtre);
  const compteur = (s: StatutAvis) => lignes.filter((a) => a.statut === s).length;

  const maj = (a: AvisClient, statut: StatutAvis, motif?: string) =>
    setTous((prec) => ({
      ...prec,
      [a.etablissementId]: (prec?.[a.etablissementId] ?? []).map((x) => (x.id === a.id ? { ...x, statut, motifRejet: motif ?? x.motifRejet } : x)),
    }));

  return (
    <>
      <EspaceHeader role="Administration" titre="Modération des avis" sousTitre="Signalements des établissements et avis en attente de vérification." />
      <div className="container-page space-y-5 py-6">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {([...ORDRE, "tous"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filtre === s}
              onClick={() => setFiltre(s)}
              className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium", filtre === s ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              {s === "tous" ? "Tous" : STATUTS_AVIS[s] + "s"}
              <span className={cn("rounded-full px-1.5 text-xs", filtre === s ? "bg-white text-primary" : "bg-primary-soft text-primary")}>
                {s === "tous" ? lignes.length : compteur(s)}
              </span>
            </button>
          ))}
        </div>

        <Bloc titre={filtre === "tous" ? `Avis à examiner (${lignes.length})` : `${STATUTS_AVIS[filtre as StatutAvis]}s (${visibles.length})`} icone={<ShieldCheck className="size-5" aria-hidden />}>
          {visibles.length ? (
            <ul className="space-y-3">
              {visibles.map((a) => (
                <li key={a.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {a.auteur} <span className="font-normal text-muted">sur {nomEtab(a.etablissementId)} · {formatDate(a.date)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Stars value={a.note} />
                      <Pastille ton={TONS[a.statut]}>{STATUTS_AVIS[a.statut]}</Pastille>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink/90">{a.commentaire}</p>
                  <p className="mt-1 text-xs text-muted">
                    Preuve : {a.preuve.type === "reservation" ? "réservation" : `code ${a.preuve.code}`}
                    {a.motifRejet ? ` · ${a.motifRejet}` : ""}
                  </p>
                  {a.statut !== "rejete" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn btn-success px-3 py-2" onClick={() => maj(a, "publie")}>
                        <Check className="size-4" aria-hidden /> Publier
                      </button>
                      <button type="button" className="btn btn-outline px-3 py-2" onClick={() => maj(a, "rejete", "Rejeté par l'équipe de modération")}>
                        <X className="size-4" aria-hidden /> Rejeter
                      </button>
                    </div>
                  )}
                  {a.statut === "rejete" && (
                    <button type="button" className="btn btn-outline mt-3 px-3 py-2" onClick={() => maj(a, "publie")}>
                      <Check className="size-4" aria-hidden /> Republier
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucun avis dans cette catégorie. Les avis signalés par les établissements ou bloqués par les règles automatiques apparaîtront ici.</p>
          )}
        </Bloc>
        <p className="text-sm text-muted">
          Les règles automatiques rejettent les avis sans preuve de visite, les doublons, les liens et l&apos;auto-évaluation. Voir aussi le{" "}
          <Link href="/admin/awards" className="font-semibold text-primary">dashboard des votes</Link>.
        </p>
      </div>
    </>
  );
}
