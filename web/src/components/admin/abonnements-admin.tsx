"use client";

import { CreditCard, Receipt, Wallet } from "lucide-react";
import { TRANSACTIONS_DEMO } from "@/lib/admin";
import { type StatutAbonnement, type Transaction, MOYENS, etatAbonnement, libellePeriode } from "@/lib/abonnement";
import { ETABLISSEMENTS } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { formatDate } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { formatFCFA } from "@/lib/pdf";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { useGestion } from "@/components/admin/use-admin";

const TONS_ETAT: Record<StatutAbonnement, "succes" | "alerte" | "primaire" | "neutre"> = {
  aucun: "neutre",
  actif: "succes",
  expire_bientot: "primaire",
  grace: "primaire",
  suspendu: "alerte",
};
const LIB_ETAT: Record<StatutAbonnement, string> = {
  aucun: "Aucun",
  actif: "Actif",
  expire_bientot: "Expire bientôt",
  grace: "Délai de grâce",
  suspendu: "Suspendu",
};

export function AbonnementsAdmin() {
  const { aujourdhui } = useHorloge();
  const { config } = useConfigTarifs();
  const { charge: c1 } = useGestion();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (!aujourdhui || !c1 || dossier === undefined) return <Chargement />;

  const abonnements = [
    ...ETABLISSEMENTS.map((e) => ({ id: e.slug, nom: e.nom, pack: e.pack, statut: "actif" as StatutAbonnement, fin: null as string | null, demo: true })),
    ...(dossier?.statut === "admis" && dossier.abonnement
      ? [{ id: dossier.id, nom: dossier.nom, pack: dossier.abonnement.pack, statut: etatAbonnement(dossier.abonnement, aujourdhui, config).statut, fin: dossier.abonnement.fin, demo: false }]
      : []),
  ];
  const transactions: (Transaction & { source: string })[] = [
    ...(dossier?.transactions ?? []).map((t) => ({ ...t, source: dossier!.nom })),
    ...TRANSACTIONS_DEMO.map((t) => ({ ...t, source: "Établissements certifiés (démo)" })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const actifs = abonnements.filter((a) => a.statut === "actif" || a.statut === "expire_bientot" || a.statut === "grace").length;
  const suspendus = abonnements.filter((a) => a.statut === "suspendu").length;
  const revenus = transactions.filter((t) => t.statut === "reussi").reduce((s, t) => s + t.montant, 0);
  const mrr = abonnements.filter((a) => !a.demo && a.statut !== "suspendu" && a.statut !== "aucun").reduce((s, a) => s + config.prix[a.pack], 0);

  return (
    <>
      <EspaceHeader role="Administration" titre="Abonnements & paiements" sousTitre="Suivi des packs, des transactions et des suspensions pour impayé." />
      <div className="container-page space-y-5 py-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Abonnements actifs", String(actifs)],
            ["Suspendus (impayé)", String(suspendus)],
            ["MRR (abonnés suivis)", formatFCFA(mrr)],
            ["Encaissé (total)", formatFCFA(revenus)],
          ].map(([t, v]) => (
            <div key={t} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t}</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{v}</p>
            </div>
          ))}
        </div>

        <Bloc titre="Abonnés" icone={<Wallet className="size-5" aria-hidden />}>
          <ul className="divide-y divide-line">
            {abonnements.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-ink">
                    {a.nom} {a.demo && <span className="chip bg-surface text-muted">Démo</span>}
                  </p>
                  <p className="text-sm text-muted">Pack {nomPack(a.pack)}{a.fin ? ` · échéance ${formatDate(a.fin)}` : ""}</p>
                </div>
                <Pastille ton={TONS_ETAT[a.statut]}>{LIB_ETAT[a.statut]}</Pastille>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Suspension automatique {config.delaiGrace} jours après l&apos;échéance : la fiche est masquée et réapparaît au paiement. La note n&apos;est jamais modifiée.
          </p>
        </Bloc>

        <Bloc titre={`Transactions (${transactions.length})`} icone={<Receipt className="size-5" aria-hidden />}>
          <ul className="divide-y divide-line">
            {transactions.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {t.reference} · {formatFCFA(t.montant)}
                  </p>
                  <p className="text-muted">
                    {t.source} · {libellePeriode(t.pack, t.periodicite)} · {MOYENS[t.moyen].label} {t.compte} · {formatDate(t.date)}
                    {t.facture && ` · ${t.facture}`}
                    {t.motif && ` — ${t.motif}`}
                  </p>
                </div>
                <Pastille ton={t.statut === "reussi" ? "succes" : "alerte"}>{t.statut === "reussi" ? "Réussi" : "Échoué"}</Pastille>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            <CreditCard className="mr-1 inline size-3.5" aria-hidden />
            Le paiement ne modifie jamais la note : il ne touche qu&apos;à l&apos;abonnement.
          </p>
        </Bloc>
      </div>
    </>
  );
}
