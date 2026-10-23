import { BadgeCheck, BedDouble, Briefcase, Bus, GraduationCap, Landmark, type LucideIcon, Shirt, ShoppingBag, SprayCan, HandHeart, Star, Stethoscope, UtensilsCrossed } from "lucide-react";
import type { CritereKey, Secteur } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { cn } from "@/lib/site";

export const SECTEUR_ICONS: Record<Secteur, LucideIcon> = {
  hotellerie: BedDouble,
  restauration: UtensilsCrossed,
  sante: Stethoscope,
  services: Briefcase,
  education: GraduationCap,
  commerce: ShoppingBag,
  transport: Bus,
};

export const CRITERE_ICONS: Record<CritereKey, LucideIcon> = {
  hygiene: SprayCan,
  accueil: HandHeart,
  presentation: Shirt,
  gouvernance: Landmark,
};

export function CertifiedBadge({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-success font-semibold text-white shadow-sm",
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <BadgeCheck className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
      Qualité certifiée
    </span>
  );
}

export function PremiumTag({ className }: { className?: string }) {
  return <span className={cn("chip bg-white/95 font-semibold text-primary ring-1 ring-primary/15", className)}>Premium</span>;
}

export function ScorePill({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-baseline rounded-lg bg-success-soft px-2 py-1 font-bold text-success-dark", className)}
      title="Note de gouvernance (audit sur place)"
    >
      {formatScore(value)}
      <span className="ml-0.5 text-xs">%</span>
    </span>
  );
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${formatScore(value)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            size === "md" ? "size-5" : "size-3.5",
            i <= Math.round(value) ? "fill-primary text-primary" : "fill-line text-line",
          )}
        />
      ))}
    </span>
  );
}

const GRADIENTS: Record<Secteur, string> = {
  hotellerie: "from-primary via-[#2747a8] to-[#3b63c9]",
  restauration: "from-primary-dark via-primary to-success",
  sante: "from-success-dark via-success to-[#2fbf6a]",
  services: "from-[#0f766e] via-[#14b8a6] to-success",
  education: "from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]",
  commerce: "from-[#9a3412] via-[#ea580c] to-[#f59e0b]",
  transport: "from-[#0c4a6e] via-[#0369a1] to-[#38bdf8]",
};

export function PhotoPlaceholder({ secteur, label, className }: { secteur: Secteur; label?: string; className?: string }) {
  const Icon = SECTEUR_ICONS[secteur];
  return (
    <div className={cn("isolate overflow-hidden bg-gradient-to-br", GRADIENTS[secteur], className ?? "relative")}>
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-8 size-36 rounded-full bg-white/10" />
      <Icon className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 text-white/35" aria-hidden />
      {label && <span className="absolute bottom-2 left-3 text-[11px] font-medium text-white/70">{label}</span>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, intro, center = false }: { eyebrow?: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-xs font-semibold tracking-wider text-success uppercase">{eyebrow}</p>}
      <h2 className="h-section mt-1">{title}</h2>
      {intro && <p className="mt-3 text-muted">{intro}</p>}
    </div>
  );
}
