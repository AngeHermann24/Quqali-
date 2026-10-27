"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Crown, FileText, Lock, ShieldCheck, Star, Upload, X } from "lucide-react";
import { cn } from "@/lib/site";

/* ------------------------------------------------------------------ */
/* LogoPro : image officielle « v+pro.png » (Qualité+ Pro)              */
/* ------------------------------------------------------------------ */
export function LogoPro({ className, imgClassName = "h-9" }: { className?: string; imgClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/v+pro.png" alt="Qualité+ Pro" className={cn("w-auto", imgClassName)} />
    </span>
  );
}

/** Variante sur fond bleu : logo dans un cartouche blanc. */
export function LogoProCartouche({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-[0_10px_30px_rgb(2_6_23/0.3)]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/v+pro.png" alt="Qualité+ Pro" className="h-8 w-auto" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Badge « Qualité certifiée » — bouclier vert à reflet                 */
/* ------------------------------------------------------------------ */
export function BadgeCertifiePro({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25 [animation:brille_4s_infinite]" />
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
      {compact ? "Certifiée" : "Qualité certifiée"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Anneau de score animé avec compteur                                  */
/* ------------------------------------------------------------------ */
export function RingScorePro({ valeur, taille = 120, epaisseur = 10, couleur = "#16A34A", duree = 900, className }: {
  valeur: number; taille?: number; epaisseur?: number; couleur?: string; duree?: number; className?: string;
}) {
  const [affiche, setAffiche] = useState(0);
  const r = (taille - epaisseur) / 2;
  const c = 2 * Math.PI * r;
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf0 = requestAnimationFrame(() => setAffiche(valeur));
      return () => cancelAnimationFrame(raf0);
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duree);
      setAffiche(valeur * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [valeur, duree]);
  return (
    <span className={cn("relative inline-grid place-items-center", className)} style={{ width: taille, height: taille }} role="img" aria-label={`Score ${Math.round(affiche)} %`}>
      <svg width={taille} height={taille} className="-rotate-90" aria-hidden>
        <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={epaisseur} />
        <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - affiche / 100)} />
      </svg>
      <span className="absolute font-display font-extrabold text-ink" style={{ fontSize: taille * 0.24 }}>
        {Math.round(affiche)}
        <span style={{ fontSize: taille * 0.13 }}>%</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper horizontal — 6 étapes du parcours                            */
/* ------------------------------------------------------------------ */
export type EtapeStepper = { label: string; etat: "fait" | "actuel" | "a_venir" | "echec" };
export function StepperPro({ etapes, className }: { etapes: EtapeStepper[]; className?: string }) {
  return (
    <ol className={cn("flex items-start", className)} aria-label="Progression du dossier">
      {etapes.map((e, i) => (
        <li key={e.label} className="relative flex flex-1 flex-col items-center gap-1.5">
          {i > 0 && <span aria-hidden className={cn("absolute top-[13px] right-1/2 h-0.5 w-full -translate-y-1/2", e.etat === "a_venir" ? "bg-line" : e.etat === "echec" ? "bg-danger" : "bg-success")} style={{ animation: e.etat === "fait" ? `monte .4s ${i * 0.12}s ease both` : undefined }} />}
          <span
            className={cn(
              "relative z-10 grid size-7 place-items-center rounded-full border-2 text-[11px] font-bold",
              e.etat === "fait" && "border-success bg-success text-white",
              e.etat === "actuel" && "border-bleu bg-bleu text-white ring-4 ring-bleu/15",
              e.etat === "echec" && "border-danger bg-danger text-white",
              e.etat === "a_venir" && "border-line bg-white text-muted",
            )}
          >
            {e.etat === "fait" ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : e.etat === "echec" ? <X className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
          </span>
          <span className={cn("text-center text-[10px] leading-tight font-semibold", e.etat === "actuel" ? "text-bleu" : e.etat === "fait" ? "text-ink" : e.etat === "echec" ? "text-danger" : "text-muted")}>{e.label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Barre de progression                                                  */
/* ------------------------------------------------------------------ */
export function ProgressBarPro({ valeur, couleur = "bg-success", className }: { valeur: number; couleur?: string; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface", className)} role="progressbar" aria-valuenow={Math.round(valeur)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-700", couleur)} style={{ width: `${Math.min(100, Math.max(0, valeur))}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte KPI (valeur + variation %)                                      */
/* ------------------------------------------------------------------ */
export function KpiCard({ valeur, label, variation, icone, className }: { valeur: ReactNode; label: string; variation?: number; icone?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-4 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
        {icone}
      </div>
      <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">{valeur}</p>
      {variation !== undefined && (
        <p className={cn("mt-0.5 text-xs font-bold", variation >= 0 ? "text-success" : "text-danger")}>
          {variation >= 0 ? "+" : ""}
          {variation} % <span className="font-normal text-muted">vs mois dernier</span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pastille de statut                                                    */
/* ------------------------------------------------------------------ */
const STYLES_STATUT: Record<string, string> = {
  confirmee: "bg-success-soft text-success",
  a_confirmer: "bg-or/15 text-[#b45309]",
  en_attente: "bg-primary-soft text-primary",
  refusee: "bg-danger/10 text-danger",
  annulee: "bg-surface text-muted",
};
export function StatusPillPro({ statut, label }: { statut: keyof typeof STYLES_STATUT; label: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", STYLES_STATUT[statut])}>{label}</span>;
}

/* ------------------------------------------------------------------ */
/* Élément de document à envoyer                                         */
/* ------------------------------------------------------------------ */
export type EtatUpload = "a_envoyer" | "en_cours" | "envoye" | "refuse";
export function UploadItem({ label, detail, etat, progression = 0, fichier, onAjouter, onRetirer }: {
  label: string; detail: string; etat: EtatUpload; progression?: number; fichier?: string;
  onAjouter?: () => void; onRetirer?: () => void;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-3.5", etat === "refuse" ? "border-danger/40 bg-danger/5" : "border-line bg-white")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", etat === "envoye" ? "bg-success-soft text-success" : etat === "refuse" ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary")}>
        <FileText className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{label}</p>
        <p className="truncate text-xs text-muted">{fichier ?? detail}</p>
        {etat === "en_cours" && <ProgressBarPro valeur={progression} couleur="bg-bleu" className="mt-1.5" />}
        {etat === "refuse" && <p className="mt-0.5 text-[11px] font-semibold text-danger">Refusé — à renvoyer</p>}
      </div>
      {etat === "envoye" ? (
        <button type="button" onClick={onRetirer} aria-label={`Retirer ${label}`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface">
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        <button type="button" onClick={onAjouter} aria-label={`Ajouter ${label}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-bleu text-white shadow-sm transition active:scale-90">
          <Upload className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglets en puces (Tous / Positifs / Neutres / Négatifs…)              */
/* ------------------------------------------------------------------ */
export function TabsPro<T extends string>({ onglets, actif, onChange, className }: { onglets: { id: T; label: string }[]; actif: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)} role="tablist">
      {onglets.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={actif === o.id}
          onClick={() => onChange(o.id)}
          className={cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap transition", actif === o.id ? "bg-bleu text-white" : "bg-surface text-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panneau du bas (bottom sheet)                                         */
/* ------------------------------------------------------------------ */
export function PanneauBas({ ouvert, titre, onFermer, children }: { ouvert: boolean; titre?: string; onFermer: () => void; children: ReactNode }) {
  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titre}>
      <button type="button" aria-label="Fermer" onClick={onFermer} className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] [animation:monte_.2s_ease_both]" />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white p-5 pb-8 shadow-panneau [animation:monte_.3s_ease_both]">
        <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line" />
        {titre && <h2 className="mb-3 font-display text-lg font-bold text-ink">{titre}</h2>}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast bas d'écran                                                     */
/* ------------------------------------------------------------------ */
export function ToastPro({ message, action, onAction, visible }: { message: string; action?: string; onAction?: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-24 z-[85] flex justify-center px-5 [animation:monte_.3s_ease_both]">
      <div className="flex w-full max-w-[400px] items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-flottant">
        <span>{message}</span>
        {action && (
          <button type="button" onClick={onAction} className="shrink-0 font-bold text-success-bright">
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Squelette + état vide                                                 */
/* ------------------------------------------------------------------ */
export function SquelettePro({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className="space-y-3" aria-label="Chargement">
      {Array.from({ length: lignes }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-surface [animation:shimmer_1.4s_infinite]" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}

export function EtatVidePro({ icone, titre, detail, action }: { icone: ReactNode; titre: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-surface text-muted">{icone}</span>
      <p className="mt-4 font-display text-base font-bold text-ink">{titre}</p>
      {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte d'abonnement Basique / Premium                                  */
/* ------------------------------------------------------------------ */
export function PlanCard({ nom, prix, premium = false, points, pointsVerrouilles, choisi = false, onChoisir }: {
  nom: string; prix: string; premium?: boolean; points: string[]; pointsVerrouilles?: string[]; choisi?: boolean; onChoisir?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5",
        premium ? "border-transparent bg-gradient-to-br from-primary to-bleu text-white shadow-survol" : "border-line bg-white shadow-card",
      )}
    >
      {premium && <Crown className="absolute top-4 right-4 size-6 text-or" aria-hidden />}
      <p className={cn("font-display text-lg font-extrabold", premium ? "text-white" : "text-ink")}>{nom}</p>
      <p className={cn("mt-0.5 font-display text-2xl font-extrabold", premium ? "text-white" : "text-primary")}>{prix}</p>
      <ul className={cn("mt-4 space-y-2 text-sm", premium ? "text-white/90" : "text-ink")}>
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", premium ? "text-success-bright" : "text-success")} strokeWidth={3} aria-hidden />
            {p}
          </li>
        ))}
        {pointsVerrouilles?.map((p) => (
          <li key={p} className="flex items-start gap-2 text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChoisir}
        className={cn(
          "mt-5 h-12 w-full rounded-2xl font-bold transition active:scale-[0.98]",
          premium ? "bg-success text-white" : "border-2 border-bleu text-bleu",
          choisi && "ring-2 ring-success ring-offset-2",
        )}
      >
        Choisir {nom}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fonction verrouillée (Basique)                                        */
/* ------------------------------------------------------------------ */
export function LockedFeature({ titre, detail, onPremium }: { titre: string; detail?: string; onPremium?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white">
      <div aria-hidden className="pointer-events-none space-y-3 p-5 opacity-40 blur-[3px] select-none">
        <div className="h-5 w-2/3 rounded bg-surface" />
        <div className="h-16 rounded-2xl bg-surface" />
        <div className="h-16 rounded-2xl bg-surface" />
        <div className="h-16 rounded-2xl bg-surface" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 p-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary text-white">
          <Lock className="size-5" aria-hidden />
        </span>
        <p className="font-display text-base font-bold text-ink">{titre}</p>
        {detail && <p className="text-xs text-muted">{detail}</p>}
        <button type="button" onClick={onPremium} className="mt-1 rounded-2xl bg-success px-5 py-2.5 text-sm font-bold text-white transition active:scale-95">
          <Crown className="mr-1.5 inline size-4" aria-hidden /> Passer Premium
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte d'avis client                                                   */
/* ------------------------------------------------------------------ */
export function ReviewCardPro({ nom, ilYA, note, texte, verifie = true, criteres, reponse, onRepondre, onSignaler }: {
  nom: string; ilYA: string; note: number; texte: string; verifie?: boolean;
  criteres?: { label: string; valeur: number }[]; reponse?: string; onRepondre?: () => void; onSignaler?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display font-bold text-primary">{nom[0]}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{nom}</p>
          <p className="text-[11px] text-muted">{ilYA}</p>
        </div>
        <span className="flex items-center gap-0.5" aria-label={`${note} étoiles sur 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("size-3.5", i < Math.round(note) ? "fill-or text-or" : "text-line")} aria-hidden />
          ))}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-ink">{texte}</p>
      {criteres && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {criteres.map((c) => (
            <span key={c.label} className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
              {c.label} {c.valeur}/5
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        {verifie && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-success">
            <ShieldCheck className="size-3.5" aria-hidden /> Avis vérifié
          </span>
        )}
        <div className="ml-auto flex gap-3">
          {onRepondre && (
            <button type="button" onClick={onRepondre} className="text-xs font-bold text-bleu">
              {reponse ? "Ma réponse" : "Répondre"}
            </button>
          )}
          {onSignaler && (
            <button type="button" onClick={onSignaler} className="text-xs font-semibold text-muted">
              Signaler
            </button>
          )}
        </div>
      </div>
      {reponse && <p className="mt-2 rounded-xl bg-surface p-2.5 text-xs text-muted">Votre réponse : {reponse}</p>}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Puce filtre                                                           */
/* ------------------------------------------------------------------ */
export function ChipPro({ actif = false, children, onClick }: { actif?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap transition", actif ? "bg-primary text-white" : "bg-primary-soft text-ink")}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Calendrier mensuel                                                    */
/* ------------------------------------------------------------------ */
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function CalendrierPro({ mois, annee, joursActifs, jourCourant, onMois, onJour }: {
  mois: number; annee: number; joursActifs?: Set<number>; jourCourant?: number; onMois?: (delta: number) => void; onJour?: (j: number) => void;
}) {
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onMois?.(-1)} aria-label="Mois précédent" className="grid size-9 place-items-center rounded-full transition hover:bg-surface">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="font-display text-sm font-bold text-ink capitalize">
          {MOIS[mois]} {annee}
        </p>
        <button type="button" onClick={() => onMois?.(1)} aria-label="Mois suivant" className="grid size-9 place-items-center rounded-full transition hover:bg-surface">
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {JOURS.map((j, i) => (
          <span key={i} className="pb-1 text-[10px] font-bold text-muted">
            {j}
          </span>
        ))}
        {Array.from({ length: decalage }).map((_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: nbJours }).map((_, i) => {
          const j = i + 1;
          const courant = j === jourCourant;
          const actif = joursActifs?.has(j);
          return (
            <button
              key={j}
              type="button"
              onClick={() => onJour?.(j)}
              className={cn(
                "relative mx-auto grid size-9 place-items-center rounded-full text-sm font-semibold transition",
                courant ? "bg-bleu font-bold text-white" : "text-ink hover:bg-surface",
              )}
            >
              {j}
              {actif && <span aria-hidden className={cn("absolute bottom-1 size-1 rounded-full", courant ? "bg-white" : "bg-success")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* En-tête d'écran pro (retour + titre centré)                           */
/* ------------------------------------------------------------------ */
export function EntetePro({ titre, onRetour, action }: { titre: string; onRetour?: () => void; action?: ReactNode }) {
  return (
    <header className="relative flex items-center justify-center px-5 pt-5 pb-3">
      {onRetour && (
        <button type="button" onClick={onRetour} aria-label="Retour" className="absolute left-4 grid size-10 place-items-center rounded-full bg-white shadow-card transition active:scale-90">
          <ChevronLeft className="size-5 text-ink" aria-hidden />
        </button>
      )}
      <h1 className="font-display text-lg font-bold text-primary">{titre}</h1>
      {action && <div className="absolute right-4">{action}</div>}
    </header>
  );
}

export function IconeCalendrier() {
  return <CalendarDays className="size-4" aria-hidden />;
}
