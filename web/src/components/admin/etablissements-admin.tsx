"use client";

import Link from "next/link";
import { BadgeX, Building2, EyeOff, RotateCcw, ShieldCheck } from "lucide-react";
import { etatPublic, forcerNiveau, niveauEffectif, remettreBadge, retablir, retirerBadge, suspendre } from "@/lib/admin";
import { SECTEURS, scoreGlobal } from "@/lib/data";
import { type NiveauQualite, COULEUR_NIVEAU, niveauScore } from "@/lib/scores";
import { CLES, maintenant, type Dossier } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { useStockage } from "@/lib/stockage";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { useGestion } from "@/components/admin/use-admin";
import { useCatalogue } from "@/components/catalogue";

const TONS = { actif: "succes", badge_retire: "alerte", suspendu: "alerte" } as const;
const LABELS = { actif: "Actif", badge_retire: "Badge retiré", suspendu: "Suspendu" } as const;
const NIVEAUX: { id: NiveauQualite; label: string }[] = [
  { id: "excellent", label: "Excellent" },
  { id: "bon", label: "Bon" },
  { id: "ameliorer", label: "À améliorer" },
];

export function EtablissementsAdmin() {
  const { gestion, setGestion, charge } = useGestion();
  const { etablissements, charge: chargeCat } = useCatalogue();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (!charge || !chargeCat || dossier === undefined) return <Chargement />;
  const date = maintenant();

  const lignes = [
    ...etablissements.map((e) => ({ id: e.slug, nom: e.nom, secteur: e.secteur, lieu: `${e.commune}, ${e.ville}`, note: scoreGlobal(e.scores), pack: e.pack, slug: e.slug, demo: false })),
    ...(dossier?.statut === "admis"
      ? [{ id: dossier.id, nom: dossier.nom, secteur: dossier.secteur, lieu: `${dossier.commune}, ${dossier.ville}`, note: dossier.audit?.global ?? 0, pack: dossier.abonnement?.pack ?? "basique", slug: undefined, demo: true }]
      : []),
  ].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <>
      <EspaceHeader role="Administration" titre="Établissements" sousTitre="Suspension des fiches publiques et retrait du badge qualité." />
      <div className="container-page space-y-5 py-6">
        <Bloc titre={`Établissements certifiés (${lignes.length})`} icone={<Building2 className="size-5" aria-hidden />}>
          <ul className="space-y-3">
            {lignes.map((l) => {
              const etat = etatPublic(gestion[l.id]);
              const g = gestion[l.id];
              return (
                <li key={l.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {l.nom}
                        <Pastille ton={TONS[etat]}>{LABELS[etat]}</Pastille>
                        {l.demo && <span className="chip bg-surface text-muted">Votre dossier</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {SECTEURS[l.secteur].label} · {l.lieu} · audit <strong className="text-ink">{formatScore(l.note)} %</strong> · pack {nomPack(l.pack)}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full px-2.5 py-1 text-white" style={{ background: COULEUR_NIVEAU[niveauEffectif(l.note, g)] }}>
                          {NIVEAUX.find((n) => n.id === niveauEffectif(l.note, g))!.label}
                          {g?.niveau ? " (forcé)" : ""}
                        </span>
                        <label className="sr-only" htmlFor={`niv-${l.id}`}>
                          Niveau du badge
                        </label>
                        <select
                          id={`niv-${l.id}`}
                          value={g?.niveau ?? "auto"}
                          onChange={(e) => setGestion(forcerNiveau(gestion, l.id, e.target.value === "auto" ? null : (e.target.value as NiveauQualite)))}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink"
                        >
                          <option value="auto">Auto (score : {NIVEAUX.find((n) => n.id === niveauScore(l.note))!.label})</option>
                          {NIVEAUX.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </p>
                      {g?.suspendu && <p className="mt-1 text-xs text-muted">Suspendu le {formatDate(g.suspendu)} : fiche masquée du site public.</p>}
                      {g?.badgeRetire && !g.suspendu && <p className="mt-1 text-xs text-muted">Badge retiré le {formatDate(g.badgeRetire)} : plus éligible aux Awards.</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {etat === "suspendu" ? (
                        <button type="button" className="btn btn-success px-3 py-2" onClick={() => setGestion(retablir(gestion, l.id))}>
                          <RotateCcw className="size-4" aria-hidden /> Rétablir la fiche
                        </button>
                      ) : (
                        <button type="button" className="btn btn-outline px-3 py-2" onClick={() => setGestion(suspendre(gestion, l.id, date))}>
                          <EyeOff className="size-4" aria-hidden /> Suspendre
                        </button>
                      )}
                      {g?.badgeRetire ? (
                        <button type="button" className="btn btn-outline px-3 py-2" onClick={() => setGestion(remettreBadge(gestion, l.id))}>
                          <ShieldCheck className="size-4" aria-hidden /> Remettre le badge
                        </button>
                      ) : (
                        <button type="button" className="btn btn-outline px-3 py-2" onClick={() => setGestion(retirerBadge(gestion, l.id, date))}>
                          <BadgeX className="size-4" aria-hidden /> Retirer le badge
                        </button>
                      )}
                      {l.slug && (
                        <Link href={`/etablissements/${l.slug}`} className="btn btn-outline px-3 py-2">
                          Voir la fiche
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Bloc>
        <div className="rounded-2xl bg-surface p-4 text-sm text-ink">
          <p className="font-semibold">Effets des décisions</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• <strong>Suspendre</strong> : la fiche disparaît des résultats publics et l&apos;établissement sort des Awards. La note d&apos;audit est conservée.</li>
            <li>• <strong>Retirer le badge</strong> : la fiche reste visible mais le badge « Qualité certifiée » n&apos;est plus affiché et l&apos;établissement sort des Awards.</li>
            <li>• <strong>Niveau du badge</strong> : « Auto » suit le score d&apos;audit (excellent ≥ 90, bon ≥ 80, à améliorer sinon) ; le forçage remplace le libellé et la couleur affichés au public.</li>
            <li>• La suspension pour impayé (règle d&apos;abonnement) est automatique et indépendante de cette gestion.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
