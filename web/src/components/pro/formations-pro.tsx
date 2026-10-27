"use client";

import { useState } from "react";
import { Award, CheckCircle2, GraduationCap, ListVideo, Lock, Play, ShieldCheck } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { CRITERES } from "@/lib/data";
import { FORMATIONS, type Capsule, type Formation, capsuleLisible, dureeTotale, progressionFormation } from "@/lib/formations";
import { MOYENS, type MoyenPaiement } from "@/lib/abonnement";
import { formatFCFA } from "@/lib/pdf";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, PanneauBas, ProgressBarPro, ToastPro } from "@/components/pro/ui";

interface EtatFormations {
  achetees: string[];
  vues: string[];
}

const ICONE_THEME: Record<string, typeof GraduationCap> = { hygiene: ShieldCheck, accueil: GraduationCap, presentation: Award, gouvernance: ListVideo, audit: CheckCircle2 };
const themeLabel = (f: Formation) => (f.theme === "audit" ? "Audit" : CRITERES.find((c) => c.key === f.theme)?.label ?? f.theme);

export function FormationsPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [etats, setEtats] = useStockage<Record<string, EtatFormations>>(CLES.formationsPro);
  const [choix, setChoix] = useState<Formation | null>(null);
  const [paiement, setPaiement] = useState<Formation | null>(null);
  const [lecture, setLecture] = useState<{ f: Formation; c: Capsule } | null>(null);
  const [moyen, setMoyen] = useState<MoyenPaiement>("orange");
  const [numero, setNumero] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [lectureLancee, setLectureLancee] = useState(false);
  const [toast, setToast] = useState("");

  if (dossier === undefined || etats === undefined) return <Chargement />;

  const etat = etats?.[dossier?.id ?? "_"] ?? { achetees: [], vues: [] };
  const maj = (partiel: Partial<EtatFormations>) => setEtats((p) => ({ ...p, [dossier!.id]: { ...etat, ...partiel } }));

  const ouvrirCapsule = (f: Formation, c: Capsule) => {
    if (!capsuleLisible(f, c, etat.achetees)) {
      setPaiement(f);
      return;
    }
    setLecture({ f, c });
    setLectureLancee(false);
  };

  const finirLecture = () => {
    if (!lecture) return;
    const cle = `${lecture.f.id}/${lecture.c.id}`;
    if (!etat.vues.includes(cle)) maj({ vues: [...etat.vues, cle] });
    setLecture(null);
    setLectureLancee(false);
  };

  const payer = () => {
    if (!paiement || !dossier) return;
    setEnCours(true);
    setTimeout(() => {
      maj({ achetees: [...etat.achetees, paiement.id] });
      setEnCours(false);
      setPaiement(null);
      setNumero("");
      setToast(`« ${paiement.titre} » débloquée — bonne formation !`);
    }, 1200);
  };

  /* ------ Superpositions communes : paiement, lecteur, toast ------ */
  const feuilles = (
    <>
      {/* Paiement */}
      <PanneauBas ouvert={!!paiement} titre="Paiement sécurisé" onFermer={() => !enCours && setPaiement(null)}>
        {paiement && (
          <>
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-sm font-bold text-ink">{paiement.titre}</p>
              <p className="mt-0.5 text-xs text-muted">{paiement.capsules.length} capsules · {dureeTotale(paiement)} min · accès illimité</p>
              <p className="mt-1.5 font-display text-xl font-extrabold text-primary">{formatFCFA(paiement.prix)}</p>
            </div>
            <p className="mt-3 text-xs font-bold text-muted uppercase">Moyen de paiement</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(MOYENS) as MoyenPaiement[]).map((m) => (
                <button key={m} type="button" onClick={() => setMoyen(m)} aria-pressed={moyen === m} className={cn("rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition", moyen === m ? "border-bleu bg-primary-soft text-bleu" : "border-line text-muted")}>
                  {MOYENS[m].label}
                </button>
              ))}
            </div>
            <input
              className="mt-3 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu"
              placeholder={moyen === "carte" ? "Numéro de carte" : "Numéro Mobile Money"}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              inputMode="tel"
              aria-label="Numéro de paiement"
            />
            <button type="button" onClick={payer} disabled={enCours || numero.trim().length < 8} className="mt-4 h-12 w-full rounded-2xl bg-success font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-muted">
              {enCours ? "Paiement en cours…" : `Payer ${formatFCFA(paiement.prix)}`}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">Paiement de démonstration — aucune somme n&apos;est débitée.</p>
          </>
        )}
      </PanneauBas>

      {/* Lecteur (simulé) */}
      <PanneauBas ouvert={!!lecture} titre={lecture?.c.titre} onFermer={finirLecture}>
        {lecture && (
          <>
            <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-bleu to-ink">
              {lectureLancee ? (
                <span className="absolute inset-x-5 bottom-5">
                  <span className="block h-1.5 overflow-hidden rounded-full bg-white/25">
                    <span className="barre-lecture block h-full rounded-full bg-white [animation:lecture_6s_linear_forwards]" onAnimationEnd={finirLecture} />
                  </span>
                  <span className="mt-1.5 block text-center text-[11px] font-semibold text-white/80">Lecture — {lecture.c.duree} (démo accélérée)</span>
                </span>
              ) : (
                <button type="button" onClick={() => setLectureLancee(true)} aria-label="Lire la capsule" className="grid size-16 place-items-center rounded-full bg-white/95 text-primary shadow-flottant transition active:scale-90">
                  <Play className="ml-1 size-7" aria-hidden />
                </button>
              )}
            </div>
            <button type="button" onClick={finirLecture} className="mt-4 h-12 w-full rounded-2xl border-2 border-line font-bold text-muted transition active:scale-[0.98]">
              Marquer comme vue
            </button>
          </>
        )}
      </PanneauBas>

      <ToastPro visible={!!toast} message={toast} />
    </>
  );

  /* ---------------------------- Détail d'une formation ---------------------------- */
  if (choix) {
    const achetee = etat.achetees.includes(choix.id);
    const prog = progressionFormation(choix, etat.vues);
    const Icone = ICONE_THEME[choix.theme] ?? GraduationCap;
    return (
      <>
        <EntetePro titre={choix.titre} onRetour={() => setChoix(null)} />
        <div className="space-y-4 px-5 pb-6">
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><Icone className="size-5" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{themeLabel(choix)} · {choix.capsules.length} capsules · {dureeTotale(choix)} min</p>
                <p className="text-xs text-muted">{choix.description}</p>
              </div>
            </div>
            {achetee && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted">Votre progression</span>
                  <span className="font-bold text-success">{prog} %</span>
                </div>
                <ProgressBarPro valeur={prog} className="mt-1.5" />
              </div>
            )}
          </div>

          <ul className="space-y-2.5">
            {choix.capsules.map((c, i) => {
              const lisible = capsuleLisible(choix, c, etat.achetees);
              const vue = etat.vues.includes(`${choix.id}/${c.id}`);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => ouvrirCapsule(choix, c)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3.5 text-left shadow-card transition active:scale-[0.99]"
                  >
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", vue ? "bg-success-soft text-success" : lisible ? "bg-bleu text-white" : "bg-surface text-muted")}>
                      {vue ? <CheckCircle2 className="size-5" aria-hidden /> : lisible ? <Play className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{i + 1}. {c.titre}</span>
                      <span className="text-xs text-muted">
                        {c.duree}{c.apercu ? " · Aperçu gratuit" : ""}{vue ? " · Vue" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!achetee && (
            <button type="button" onClick={() => setPaiement(choix)} className="h-12 w-full rounded-2xl bg-success font-bold text-white transition active:scale-[0.98]">
              Débloquer — {formatFCFA(choix.prix)}
            </button>
          )}
          {achetee && prog === 100 && (
            <p className="flex items-center justify-center gap-2 rounded-2xl bg-success-soft p-3 text-sm font-bold text-success">
              <Award className="size-4" aria-hidden /> Formation terminée — bravo !
            </p>
          )}
        </div>
        {feuilles}
      </>
    );
  }

  /* ---------------------------------- Catalogue ---------------------------------- */
  return (
    <>
      <EntetePro titre="Formations" />
      <div className="px-5 pb-6">
        <p className="text-sm text-muted">Capsules vidéo payantes pour progresser sur chaque critère de la grille d&apos;audit.</p>

        <ul className="mt-4 space-y-3.5">
          {FORMATIONS.map((f) => {
            const Icone = ICONE_THEME[f.theme] ?? GraduationCap;
            const achetee = etat.achetees.includes(f.id);
            const prog = progressionFormation(f, etat.vues);
            return (
              <li key={f.id}>
                <button type="button" onClick={() => setChoix(f)} className="w-full rounded-3xl border border-line bg-white p-4 text-left shadow-card transition active:scale-[0.99]">
                  <div className="flex items-start gap-3.5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Icone className="size-6" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-ink">{f.titre}</span>
                        {achetee ? (
                          <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">Débloquée</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">{formatFCFA(f.prix)}</span>
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{f.description}</span>
                      <span className="mt-1.5 block text-[11px] font-semibold text-muted">
                        {themeLabel(f)} · {f.capsules.length} capsules · {dureeTotale(f)} min
                      </span>
                      {achetee && <ProgressBarPro valeur={prog} className="mt-2" />}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 rounded-2xl bg-surface p-3.5 text-[11px] leading-relaxed text-muted">
          La 1<sup>re</sup> capsule de chaque formation est un <strong className="text-ink">aperçu gratuit</strong>. Le paiement se fait par Mobile Money ou carte — la formation est liée à votre établissement.
        </p>
      </div>
      {feuilles}
    </>
  );
}
