"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { Building2, Handshake, Scale, Sparkles } from "lucide-react";
import { CRITERES, type CritereKey, SECTEURS } from "@/lib/data";
import { CLES, type Dossier, EQUIPE_INTERNE_ID, INTERVENANTS, genererPlan, maintenant } from "@/lib/espace";
import { formatScore } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { CRITERE_ICONS } from "@/components/ui";
import { Chargement, ChampSelect, ChampTexte } from "@/components/espace/ui";

const AUTO = "auto";

export function CandidatureAccompagnement() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [mode, setMode] = useState<"nous" | "partenaire">("nous");
  const [partenaire, setPartenaire] = useState(AUTO);
  const [besoins, setBesoins] = useState<CritereKey[]>([]);
  const [erreur, setErreur] = useState("");

  if (dossier === undefined) return <Chargement />;
  if (!dossier)
    return (
      <Message titre="Créez d'abord le dossier de votre établissement" texte="La demande d'accompagnement est liée à votre dossier d'inscription.">
        <Link href="/pro/inscription" className="btn btn-primary">
          Créer mon dossier
        </Link>
      </Message>
    );
  if (dossier.accompagnement)
    return (
      <Message titre="Votre demande d'accompagnement est enregistrée" texte="Suivez votre plan d'actions et la date de réaudit depuis votre tableau de bord.">
        <Link href="/pro#accompagnement" className="btn btn-primary">
          Voir mon suivi
        </Link>
      </Message>
    );

  const partenaires = INTERVENANTS.filter((i) => i.roles.includes("accompagnateur") && i.id !== EQUIPE_INTERNE_ID && i.secteurs.includes(dossier.secteur));
  const choixAuto = partenaires.find((p) => p.zones.includes(dossier.commune)) ?? partenaires[0];
  const scores = dossier.audit?.scores;

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!besoins.length) return setErreur("Choisissez au moins un critère à améliorer.");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const date = maintenant();
    setDossier({
      ...dossier,
      parcours: "B",
      accompagnement: {
        mode,
        accompagnateurId: mode === "nous" ? EQUIPE_INTERNE_ID : partenaire === AUTO ? choixAuto.id : partenaire,
        besoins,
        disponibilites: String(fd.get("disponibilites")),
        message: String(fd.get("message") ?? ""),
        dateDemande: date,
        plan: genererPlan(besoins, date),
      },
    });
    router.push("/pro#accompagnement");
  };

  return (
    <div className="container-page max-w-3xl py-8">
      <form onSubmit={envoyer} className="card space-y-6 p-5 sm:p-8">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">Qui vous accompagne ?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "nous", titre: "Par nos équipes", texte: "L'équipe qualité de la plateforme vous accompagne directement.", Icon: Building2 },
                { value: "partenaire", titre: "Par un partenaire", texte: "Un accompagnateur certifié, proche de chez vous.", Icon: Handshake },
              ] as const
            ).map(({ value, titre, texte, Icon }) => (
              <label
                key={value}
                className={cn("flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition", mode === value ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40")}
              >
                <input type="radio" name="mode" className="sr-only" checked={mode === value} onChange={() => setMode(value)} />
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-ink">{titre}</span>
                  <span className="block text-xs text-muted">{texte}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {mode === "partenaire" && (
          <fieldset>
            <legend className="label">Accompagnateurs disponibles · {SECTEURS[dossier.secteur].nom}</legend>
            <div className="space-y-2">
              {[{ id: AUTO, nom: "Laisser la plateforme choisir", zones: [`Recommandé : ${choixAuto.nom}`] }, ...partenaires].map((p) => (
                <label
                  key={p.id}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition", partenaire === p.id ? "border-primary bg-primary-soft" : "border-line")}
                >
                  <input type="radio" name="partenaire" checked={partenaire === p.id} onChange={() => setPartenaire(p.id)} className="accent-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      {p.id === AUTO && <Sparkles className="size-4 text-success" aria-hidden />}
                      {p.nom}
                    </span>
                    <span className="block truncate text-xs text-muted">{p.zones.join(" · ")}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="label">
            Critères à améliorer <span className="text-success">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CRITERES.map((c) => {
              const Icon = CRITERE_ICONS[c.key];
              const coche = besoins.includes(c.key);
              return (
                <label key={c.key} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition", coche ? "border-primary bg-primary-soft" : "border-line")}>
                  <input
                    type="checkbox"
                    checked={coche}
                    onChange={() => {
                      setErreur("");
                      setBesoins((b) => (coche ? b.filter((x) => x !== c.key) : [...b, c.key]));
                    }}
                    className="accent-primary"
                  />
                  <Icon className="size-4 text-primary" aria-hidden />
                  <span className="flex-1 text-sm font-medium text-ink">{c.label}</span>
                  {scores && <span className={cn("text-xs font-semibold", scores[c.key] < 80 ? "text-ink" : "text-success-dark")}>{formatScore(scores[c.key])} %</span>}
                </label>
              );
            })}
          </div>
          {erreur && <p className="mt-2 text-sm font-medium text-ink">{erreur}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampSelect id="disponibilites" name="disponibilites" label="Disponibilités" required defaultValue="Matin (8 h – 12 h)">
            {["Matin (8 h – 12 h)", "Après-midi (14 h – 18 h)", "Fin de journée (après 18 h)", "Week-end"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </ChampSelect>
          <ChampTexte id="message" name="message" label="Précisions" placeholder="Vos attentes, contraintes…" className="sm:col-span-2" />
        </div>

        <div className="flex gap-3 rounded-xl bg-surface p-4 text-sm">
          <Scale className="size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-ink">
            <strong>Règle d&apos;indépendance :</strong> la personne qui vous accompagne ne pourra jamais auditer votre établissement. Le réaudit sera
            confié automatiquement à un agent différent.
          </p>
        </div>

        <button type="submit" className="btn btn-success w-full py-3 text-base">
          Envoyer ma demande d&apos;accompagnement
        </button>
      </form>
    </div>
  );
}

function Message({ titre, texte, children }: { titre: string; texte: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-2xl py-12">
      <div className="card p-6 text-center">
        <Handshake className="mx-auto size-12 text-primary" aria-hidden />
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">{titre}</h2>
        <p className="mt-2 text-sm text-muted">{texte}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
