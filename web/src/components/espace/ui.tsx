import type { ComponentProps, ReactNode } from "react";
import { Check, FlaskConical } from "lucide-react";
import { cn } from "@/lib/site";

export function EspaceHeader({ role, titre, sousTitre, actions }: { role: string; titre: string; sousTitre?: string; actions?: ReactNode }) {
  return (
    <section className="bg-primary text-white">
      <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-[#7ee2a4] uppercase">{role}</p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">{titre}</h1>
          {sousTitre && <p className="mt-1 text-sm text-white/75">{sousTitre}</p>}
        </div>
        {actions}
      </div>
    </section>
  );
}

export function Bloc({ titre, icone, action, children, className, id }: { titre?: string; icone?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("card scroll-mt-24 p-5", className)}>
      {titre && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
            {icone}
            {titre}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Progression({ valeur, className }: { valeur: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface", className)} role="progressbar" aria-valuenow={Math.round(valeur)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${valeur}%` }} />
    </div>
  );
}

export type EtatEtape = "fait" | "actuel" | "echec" | "a_venir";

export function Etapes({ etapes }: { etapes: { label: string; description?: string; date?: string; etat: EtatEtape }[] }) {
  return (
    <ol className="space-y-0">
      {etapes.map((e, i) => (
        <li key={e.label} className="relative flex gap-3 pb-5 last:pb-0">
          {i < etapes.length - 1 && <span className={cn("absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5", e.etat === "fait" ? "bg-success" : "bg-line")} />}
          <span
            className={cn(
              "relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
              e.etat === "fait" && "bg-success text-white",
              e.etat === "actuel" && "bg-primary text-white ring-4 ring-primary-soft",
              e.etat === "echec" && "bg-ink text-white",
              e.etat === "a_venir" && "border-2 border-line bg-white text-muted",
            )}
          >
            {e.etat === "fait" ? <Check className="size-4" aria-hidden /> : i + 1}
          </span>
          <div className="min-w-0 pt-1">
            <p className={cn("text-sm font-semibold", e.etat === "a_venir" ? "text-muted" : "text-ink")}>{e.label}</p>
            {e.description && <p className="text-xs text-muted">{e.description}</p>}
            {e.date && <p className="mt-0.5 text-xs font-medium text-primary">{e.date}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PanneauDemo({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <FlaskConical className="size-4" aria-hidden /> Simulation (prototype)
      </p>
      <p className="mt-1 text-xs text-muted">Ces actions seront réalisées par l&apos;administrateur et les agents dans leurs propres espaces.</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Champ({ id, label, className, aide, ...props }: { id: string; label: string; aide?: string } & ComponentProps<"input">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {props.required && <span className="text-success"> *</span>}
      </label>
      <input id={id} className="input" {...props} />
      {aide && <p className="mt-1 text-xs text-muted">{aide}</p>}
    </div>
  );
}

export function ChampSelect({ id, label, className, children, ...props }: { id: string; label: string } & ComponentProps<"select">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {props.required && <span className="text-success"> *</span>}
      </label>
      <select id={id} className="input" {...props}>
        {children}
      </select>
    </div>
  );
}

export function ChampTexte({ id, label, className, ...props }: { id: string; label: string } & ComponentProps<"textarea">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {props.required && <span className="text-success"> *</span>}
      </label>
      <textarea id={id} className="input" rows={3} {...props} />
    </div>
  );
}

export function Chargement() {
  return (
    <div className="container-page animate-pulse space-y-4 py-8" aria-busy="true">
      <div className="h-24 rounded-2xl bg-surface" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-2xl bg-surface lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "succes" | "primaire" | "alerte" }) {
  return (
    <span
      className={cn(
        "chip",
        ton === "neutre" && "bg-surface text-ink",
        ton === "succes" && "bg-success-soft text-success-dark",
        ton === "primaire" && "bg-primary-soft text-primary",
        ton === "alerte" && "bg-ink text-white",
      )}
    >
      {children}
    </span>
  );
}
