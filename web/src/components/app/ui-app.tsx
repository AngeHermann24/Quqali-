"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Search, ShieldCheck, Star } from "lucide-react";
import { SECTEURS, type Secteur } from "@/lib/data";
import { SECTEUR_ICONS } from "@/components/ui";
import { cn } from "@/lib/site";

/* ---------- Couleurs par secteur (design : Restaurants vert, Hôtels bleu, Santé turquoise) ---------- */
export const SECTEUR_COULEURS: Record<Secteur, string> = {
  restauration: "#16A34A",
  hotellerie: "#2563EB",
  sante: "#14B8A6",
  services: "#7C3AED",
  education: "#F59E0B",
  commerce: "#DB2777",
  transport: "#0284C7",
};

/* ---------- Badge « Qualité certifiée » (reflet animé via .badge-brille) ---------- */
export function BadgeCertifie({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "badge-brille inline-flex items-center gap-1 rounded-full bg-success/90 font-bold text-white backdrop-blur",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className,
      )}
    >
      <ShieldCheck className={compact ? "size-3" : "size-3.5"} aria-hidden />
      Qualité certifiée
    </span>
  );
}

/* ---------- Anneau de score animé (%) ---------- */
export function RingScore({ valeur, label, taille = 64, couleur = "#16A34A", epaisseur = 6 }: { valeur: number; label?: string; taille?: number; couleur?: string; epaisseur?: number }) {
  const [progress, setProgress] = useState(0);
  const [compteur, setCompteur] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / 900);
          const ease = 1 - Math.pow(1 - p, 3);
          setProgress(ease);
          setCompteur(Math.round(valeur * ease));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [valeur]);

  const rayon = (taille - epaisseur) / 2;
  const circ = 2 * Math.PI * rayon;
  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: taille, height: taille }}>
        <svg width={taille} height={taille} className="-rotate-90" aria-hidden>
          <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" stroke="#E5E9F2" strokeWidth={epaisseur} />
          <circle
            cx={taille / 2}
            cy={taille / 2}
            r={rayon}
            fill="none"
            stroke={couleur}
            strokeWidth={epaisseur}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - (valeur / 100) * progress)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold text-ink">{compteur}%</span>
      </div>
      {label && <span className="text-[11px] font-semibold text-muted">{label}</span>}
    </div>
  );
}

/* ---------- Tuile secteur colorée (accueil : icône + label dans la couleur) ---------- */
export function SectorTile({ secteur, onClick }: { secteur: Secteur; onClick?: () => void }) {
  const Icon = SECTEUR_ICONS[secteur];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={SECTEURS[secteur].label}
      className="flex h-26 w-full flex-col items-center justify-center gap-2 rounded-3xl text-white shadow-flottant transition active:scale-95"
      style={{ background: SECTEUR_COULEURS[secteur] }}
    >
      <Icon className="size-8" strokeWidth={1.8} aria-hidden />
      <span className="text-xs font-bold">{SECTEURS[secteur].label}</span>
    </button>
  );
}

/* ---------- Puce filtrante ---------- */
export function Chip({ actif = false, children, onClick, icon }: { actif?: boolean; children: ReactNode; onClick?: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95",
        actif ? "border-bleu bg-bleu text-white" : "border-line bg-white text-ink",
      )}
    >
      {icon}
      {children}
      {onClick && <ChevronDown className="size-3.5 opacity-60" aria-hidden />}
    </button>
  );
}

/* ---------- Barre de recherche ---------- */
export function SearchBar({ valeur, onChange, onSubmit, placeholder = "Rechercher un établissement..." }: { valeur: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string }) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 shadow-card"
    >
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:text-muted"
      />
      <button type="submit" aria-label="Rechercher" className="grid size-9 shrink-0 place-items-center rounded-full bg-bleu text-white transition active:scale-90">
        <Search className="size-4" aria-hidden />
      </button>
    </form>
  );
}

/* ---------- Pastille de statut ---------- */
const TONS_STATUT: Record<string, string> = {
  confirmee: "bg-success-soft text-success",
  en_attente: "bg-[#FEF3C7] text-[#B45309]",
  honoree: "bg-primary-soft text-primary",
  refusee: "bg-red-50 text-danger",
  annulee: "bg-surface text-muted",
  absent: "bg-red-50 text-danger",
};

export function StatusPill({ statut, label }: { statut: string; label: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", TONS_STATUT[statut] ?? "bg-surface text-muted")}>{label}</span>;
}

/* ---------- Étoiles ---------- */
export function Etoiles({ note, sur = 5, taille = "size-4", interactif = false, onChange }: { note: number; sur?: number; taille?: string; interactif?: boolean; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={interactif ? "radiogroup" : undefined}>
      {Array.from({ length: sur }, (_, i) => i + 1).map((n) =>
        interactif ? (
          <button key={n} type="button" aria-label={`${n} étoile${n > 1 ? "s" : ""}`} aria-checked={n === Math.round(note)} role="radio" onClick={() => onChange?.(n)} className="transition active:scale-125">
            <Star className={cn(taille, n <= Math.round(note) ? "fill-or text-or" : "text-line")} />
          </button>
        ) : (
          <Star key={n} className={cn(taille, n <= Math.round(note) ? "fill-or text-or" : "text-line")} aria-hidden />
        ),
      )}
    </span>
  );
}

/* ---------- Bouton cœur favori (explosion discrète) ---------- */
export function CoeurFavori({ actif, onClick, taille = "size-5", fond = true }: { actif: boolean; onClick: () => void; taille?: string; fond?: boolean }) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-label={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={actif}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
        setPop(true);
        navigator.vibrate?.(8);
        setTimeout(() => setPop(false), 400);
      }}
      className={cn(
        "grid place-items-center rounded-full transition active:scale-90",
        fond ? "size-9 bg-white/90 shadow-card backdrop-blur" : "size-9",
        pop && "fav-pop",
      )}
    >
      <Heart className={cn(taille, actif ? "fill-danger text-danger" : "text-muted")} aria-hidden />
    </button>
  );
}

/* ---------- État vide ---------- */
export function EtatVide({ Icon, titre, detail, action }: { Icon: typeof Heart; titre: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-surface">
        <Icon className="size-7 text-muted" aria-hidden />
      </span>
      <p className="font-display font-bold text-ink">{titre}</p>
      {detail && <p className="text-sm text-muted">{detail}</p>}
      {action}
    </div>
  );
}
