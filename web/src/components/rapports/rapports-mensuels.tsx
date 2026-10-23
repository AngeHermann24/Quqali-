"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Mail, Minus, Quote, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { CLES } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { avisDemo, libelleMois, moisPrecedent } from "@/lib/ia/donnees-demo";
import { emailRapportHtml } from "@/lib/ia/email-rapport";
import { type CritereRapport, type DonneesRapport, LIBELLES_CRITERES, type RapportIA, statistiques } from "@/lib/ia/rapport";
import type { EtablissementGere } from "@/lib/reservation-demo";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useHorloge } from "@/lib/use-config";
import { Modal } from "@/components/modal";
import { SelecteurEtablissement } from "@/components/reservation/selecteur";
import { useEtablissementsGeres } from "@/components/reservation/use-etablissements-geres";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

interface RapportStocke {
  id: string;
  mois: string;
  genereLe: string;
  source: "claude" | "demo";
  modele?: string;
  nombre: number;
  moyenne: number | null;
  precedent: { nombre: number; moyenne: number | null };
  noteLabel: number | null;
  rapport: RapportIA;
  email: { destinataire: string; envoyeLe: string };
}

const PRIORITES = { haute: "alerte", moyenne: "primaire", basse: "neutre" } as const;

export function RapportsMensuels() {
  const { options, premiumActif, dossier, charge } = useEtablissementsGeres();
  const { aujourdhui } = useHorloge();
  const [choix, setChoix] = useState<string | null>(null);
  if (!charge || !aujourdhui) return <Chargement />;
  const etab = options.find((o) => o.id === choix) ?? options[0];
  const destinataire = !etab.demo && dossier ? dossier.responsable.email : "gerant@example.com";
  return (
    <>
      <EspaceHeader
        role="Espace établissement · Premium"
        titre="Rapport mensuel IA"
        sousTitre="La synthèse de vos avis clients, chaque mois, dans votre espace et par e-mail."
        actions={
          <Link href="/pro/premium" className="btn btn-white">
            Fonctions Premium
          </Link>
        }
      />
      <div className="container-page space-y-5 py-6">
        <SelecteurEtablissement options={options} valeur={etab.id} onChange={setChoix} premiumActif={premiumActif} />
        <Contenu key={etab.id} etab={etab} aujourdhui={aujourdhui} destinataire={destinataire} />
      </div>
    </>
  );
}

function Contenu({ etab, aujourdhui, destinataire }: { etab: EtablissementGere; aujourdhui: string; destinataire: string }) {
  const [tous, setTous] = useStockage<Record<string, RapportStocke[]>>(CLES.rapports);
  const moisDisponibles = [1, 2, 3].reduce<string[]>((acc) => [...acc, moisPrecedent(acc.at(-1) ?? aujourdhui.slice(0, 7))], []);
  const [mois, setMois] = useState(moisDisponibles[0]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [emailOuvert, setEmailOuvert] = useState(false);
  if (tous === undefined) return <Chargement />;

  const rapports = tous?.[etab.id] ?? [];
  const courant = rapports.find((r) => r.mois === mois);

  const generer = async () => {
    setEnCours(true);
    setErreur("");
    const avis = avisDemo(etab.secteur, mois, etab.id);
    const precedent = statistiques(avisDemo(etab.secteur, moisPrecedent(mois), etab.id));
    const donnees: DonneesRapport = {
      etablissement: { nom: etab.nom, secteur: etab.secteur, commune: etab.commune },
      periode: { mois, libelle: libelleMois(mois) },
      noteLabel: etab.noteLabel !== null ? { valeur: etab.noteLabel, date: etab.noteDate ?? "", precedente: etab.notePrecedente } : null,
      avis,
      moisPrecedent: { nombre: precedent.nombre, moyenne: precedent.moyenne },
      tauxReponse: 40,
    };
    try {
      const reponse = await fetch("/api/rapports/generer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(donnees) });
      const json = (await reponse.json()) as { rapport?: RapportIA; source?: "claude" | "demo"; modele?: string; erreur?: string };
      if (!reponse.ok || !json.rapport) throw new Error(json.erreur ?? "La génération a échoué.");
      const stats = statistiques(avis);
      const genereLe = new Date().toISOString();
      const nouveau: RapportStocke = {
        id: `${etab.id}-${mois}`,
        mois,
        genereLe,
        source: json.source ?? "demo",
        modele: json.modele,
        nombre: stats.nombre,
        moyenne: stats.moyenne,
        precedent: { nombre: precedent.nombre, moyenne: precedent.moyenne },
        noteLabel: etab.noteLabel,
        rapport: json.rapport,
        email: { destinataire, envoyeLe: genereLe },
      };
      setTous((prec) => ({ ...prec, [etab.id]: [nouveau, ...(prec?.[etab.id] ?? []).filter((r) => r.mois !== mois)] }));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La génération a échoué.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {moisDisponibles.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => (setMois(m), setErreur(""))}
              aria-pressed={mois === m}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium capitalize transition", mois === m ? "border-primary bg-primary text-white" : "border-line bg-white text-ink")}
            >
              {libelleMois(m)}
              {rapports.some((r) => r.mois === m) && <span className="ml-1.5 inline-block size-2 rounded-full bg-success align-middle" />}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-success shrink-0" onClick={generer} disabled={enCours}>
          <Sparkles className={cn("size-4", enCours && "animate-spin")} aria-hidden />
          {enCours ? "Génération en cours…" : courant ? "Régénérer le rapport" : `Générer le rapport de ${libelleMois(mois)}`}
        </button>
      </div>
      {erreur && <p className="rounded-xl bg-ink p-3 text-sm text-white">{erreur}</p>}

      {courant ? (
        <Vue r={courant} etab={etab} onEmail={() => setEmailOuvert(true)} />
      ) : (
        <Bloc className="text-center">
          <Bot className="mx-auto size-10 text-primary" aria-hidden />
          <p className="mt-3 font-display font-semibold text-ink">Aucun rapport pour {libelleMois(mois)}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            En production, le rapport du mois écoulé est généré automatiquement le 1er de chaque mois et envoyé par e-mail. Dans ce prototype, lancez-le manuellement.
          </p>
        </Bloc>
      )}

      {courant && (
        <Modal open={emailOuvert} onClose={() => setEmailOuvert(false)} title={`E-mail envoyé à ${courant.email.destinataire}`}>
          <iframe
            title="Aperçu de l'e-mail"
            sandbox=""
            className="h-[70dvh] w-full rounded-xl border border-line"
            srcDoc={emailRapportHtml(courant.rapport, {
              etablissement: etab.nom,
              mois: libelleMois(courant.mois),
              nombreAvis: courant.nombre,
              moyenne: courant.moyenne,
              noteLabel: courant.noteLabel,
              lien: `${typeof window === "undefined" ? "" : window.location.origin}/pro/rapports`,
            })}
          />
        </Modal>
      )}
    </>
  );
}

function Vue({ r, etab, onEmail }: { r: RapportStocke; etab: EtablissementGere; onEmail: () => void }) {
  const { rapport } = r;
  const Fleche = rapport.tendance.evolution === "hausse" ? ArrowUpRight : rapport.tendance.evolution === "baisse" ? ArrowDownRight : rapport.tendance.evolution === "stable" ? ArrowRight : Minus;
  const parCritere = (Object.keys(LIBELLES_CRITERES) as CritereRapport[]).map((c) => ({ c, themes: rapport.themes.filter((t) => t.critere === c) })).filter((g) => g.themes.length);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Avis du mois", valeur: String(r.nombre) },
            { label: "Note moyenne des avis", valeur: r.moyenne === null ? "—" : `${formatScore(r.moyenne)}/5`, extra: r.precedent.moyenne !== null ? `${formatScore(r.precedent.moyenne)}/5 le mois précédent` : undefined },
            { label: "Note du label (audit)", valeur: r.noteLabel === null ? "—" : `${formatScore(r.noteLabel)} %`, extra: "Inchangée par les avis" },
            { label: "Fiabilité", valeur: rapport.fiabilite === "bonne" ? "Bonne" : rapport.fiabilite === "moyenne" ? "Moyenne" : "Faible" },
          ].map((k) => (
            <div key={k.label} className="card p-4">
              <p className="font-display text-2xl font-bold text-ink">{k.valeur}</p>
              <p className="text-xs text-muted">{k.label}</p>
              {k.extra && <p className="mt-1 text-[11px] text-muted">{k.extra}</p>}
            </div>
          ))}
        </div>

        <Bloc titre="Synthèse" icone={<Sparkles className="size-5" aria-hidden />}>
          <p className="leading-relaxed text-ink">{rapport.synthese}</p>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface p-3 text-sm text-ink">
            <Fleche className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {rapport.tendance.commentaire}
          </p>
        </Bloc>

        <div className="grid gap-5 md:grid-cols-2">
          <Bloc titre="Points forts" icone={<ThumbsUp className="size-5" aria-hidden />}>
            <Constats liste={rapport.points_forts} vide="Pas de point fort récurrent ce mois-ci." />
          </Bloc>
          <Bloc titre="Points à améliorer" icone={<ThumbsDown className="size-5" aria-hidden />}>
            <Constats liste={rapport.points_faibles} vide="Aucun point faible récurrent : bravo." />
          </Bloc>
        </div>

        <Bloc titre="Thèmes récurrents par critère" icone={<Quote className="size-5" aria-hidden />}>
          <div className="space-y-4">
            {parCritere.map(({ c, themes }) => (
              <div key={c}>
                <p className="label">{LIBELLES_CRITERES[c]}</p>
                <ul className="space-y-2">
                  {themes.map((t) => (
                    <li key={`${t.theme}-${t.sentiment}`} className="rounded-xl border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-ink">{t.theme}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted">{t.nb_avis} avis</span>
                          <Pastille ton={t.sentiment === "positif" ? "succes" : t.sentiment === "negatif" ? "alerte" : "primaire"}>{t.sentiment === "positif" ? "Positif" : t.sentiment === "negatif" ? "Négatif" : "Mitigé"}</Pastille>
                        </span>
                      </div>
                      {t.citation && <p className="mt-1 text-xs text-muted italic">« {t.citation} »</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!parCritere.length && <p className="text-sm text-muted">Pas assez d&apos;avis pour dégager des thèmes.</p>}
          </div>
        </Bloc>
      </div>

      <div className="space-y-5">
        <Bloc titre="Recommandations" icone={<Sparkles className="size-5" aria-hidden />}>
          <ol className="space-y-3">
            {rapport.recommandations.map((x, i) => (
              <li key={i} className="rounded-xl bg-surface p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Pastille ton={PRIORITES[x.priorite]}>Priorité {x.priorite}</Pastille>
                  <span className="text-xs text-muted">{LIBELLES_CRITERES[x.critere]}</span>
                </div>
                <p className="font-semibold text-ink">{x.action}</p>
                <p className="mt-0.5 text-xs text-muted">{x.justification}</p>
              </li>
            ))}
          </ol>
        </Bloc>

        {rapport.alertes.length > 0 && (
          <div className="rounded-2xl bg-ink p-4 text-sm text-white">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4" aria-hidden /> Alertes transmises à l&apos;équipe qualité
            </p>
            <ul className="mt-2 space-y-1.5 text-white/85">
              {rapport.alertes.map((a, i) => (
                <li key={i}>• {a.description}</li>
              ))}
            </ul>
          </div>
        )}

        <Bloc titre="Envoi par e-mail" icone={<Mail className="size-5" aria-hidden />}>
          <p className="text-sm text-ink">
            Envoyé à <strong>{r.email.destinataire}</strong> le {formatDate(r.email.envoyeLe)}.
          </p>
          <button type="button" className="btn btn-outline mt-3 w-full" onClick={onEmail}>
            Voir l&apos;e-mail
          </button>
          <p className="mt-3 text-xs text-muted">Prototype : envoi simulé.</p>
        </Bloc>

        <p className="flex items-start gap-2 text-xs text-muted">
          <Bot className="mt-0.5 size-4 shrink-0" aria-hidden />
          {r.source === "claude" ? `Généré par l'API Claude (${r.modele}) le ${formatDate(r.genereLe)}.` : "Mode démonstration : aucune clé API Claude configurée, rapport généré par l'analyse locale."} Avis
          analysés : avis de démonstration de {etab.nom}. Ce rapport n&apos;a aucun effet sur la note de gouvernance.
        </p>
      </div>
    </div>
  );
}

function Constats({ liste, vide }: { liste: RapportIA["points_forts"]; vide: string }) {
  if (!liste.length) return <p className="text-sm text-muted">{vide}</p>;
  return (
    <ul className="space-y-3">
      {liste.map((p) => (
        <li key={p.titre} className="text-sm">
          <p className="font-semibold text-ink">
            {p.titre} <span className="font-normal text-muted">· {LIBELLES_CRITERES[p.critere]} · {p.nb_avis} avis</span>
          </p>
          <p className="text-muted">{p.detail}</p>
        </li>
      ))}
    </ul>
  );
}
