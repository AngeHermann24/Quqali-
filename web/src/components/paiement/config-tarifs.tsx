"use client";

import { type FormEvent, useState } from "react";
import { CircleCheck, Lock, RotateCcw, Save } from "lucide-react";
import { CONFIG_DEFAUT, type ConfigTarifs, montantPeriode } from "@/lib/abonnement";
import { formatFCFA } from "@/lib/facture-pdf";
import { useConfigTarifs } from "@/lib/use-config";
import { Bloc, Chargement, Champ } from "@/components/espace/ui";

export function ConfigTarifsForm() {
  const { config, setConfig, personnalise, charge } = useConfigTarifs();
  const [message, setMessage] = useState("");
  if (!charge) return <Chargement />;
  return <Formulaire key={JSON.stringify(config)} config={config} personnalise={personnalise} enregistrer={setConfig} message={message} setMessage={setMessage} />;
}

function Formulaire({
  config,
  personnalise,
  enregistrer,
  message,
  setMessage,
}: {
  config: ConfigTarifs;
  personnalise: boolean;
  enregistrer: (c: ConfigTarifs | null) => void;
  message: string;
  setMessage: (m: string) => void;
}) {
  const [brouillon, setBrouillon] = useState(config);
  const [rappels, setRappels] = useState(config.rappels.join(", "));

  const nombre = (v: string) => Math.max(0, Math.round(Number(v) || 0));
  const apercu = { ...brouillon, rappels: [] };

  const sauver = (e: FormEvent) => {
    e.preventDefault();
    const liste = [...new Set(rappels.split(/[,;\s]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => b - a);
    if (!liste.length) return setMessage("Indiquez au moins un rappel (en jours avant l'échéance).");
    enregistrer({ ...brouillon, rappels: liste });
    setMessage("Configuration enregistrée. Elle s'applique aux prochains paiements.");
  };

  return (
    <div className="container-page grid gap-5 py-6 lg:grid-cols-3">
      <form onSubmit={sauver} className="space-y-5 lg:col-span-2">
        <Bloc titre="Prix des packs (FCFA / mois)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="prix-basique" label="Basique" type="number" min={0} step={500} required value={brouillon.prix.basique} onChange={(e) => setBrouillon({ ...brouillon, prix: { ...brouillon.prix, basique: nombre(e.target.value) } })} />
            <Champ id="prix-premium" label="Premium" type="number" min={0} step={500} required value={brouillon.prix.premium} onChange={(e) => setBrouillon({ ...brouillon, prix: { ...brouillon.prix, premium: nombre(e.target.value) } })} />
            <Champ id="remise" label="Remise abonnement annuel (%)" type="number" min={0} max={50} required value={brouillon.remiseAnnuelle} onChange={(e) => setBrouillon({ ...brouillon, remiseAnnuelle: Math.min(50, nombre(e.target.value)) })} />
            <Champ id="tva" label="TVA (%)" type="number" min={0} max={30} required value={brouillon.tva} onChange={(e) => setBrouillon({ ...brouillon, tva: Math.min(30, nombre(e.target.value)) })} aide="Prix saisis TTC ; la facture détaille HT et TVA." />
          </div>
        </Bloc>
        <Bloc titre="Relances et suspension">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="rappels" label="Rappels avant échéance (jours)" required value={rappels} onChange={(e) => setRappels(e.target.value)} aide="Séparés par des virgules, ex. 15, 7, 1" />
            <Champ id="grace" label="Délai de grâce avant suspension (jours)" type="number" min={0} max={60} required value={brouillon.delaiGrace} onChange={(e) => setBrouillon({ ...brouillon, delaiGrace: Math.min(60, nombre(e.target.value)) })} />
          </div>
        </Bloc>
        {message && (
          <p className="flex items-center gap-2 text-sm font-medium text-success-dark">
            <CircleCheck className="size-4" aria-hidden /> {message}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="btn btn-primary py-3 sm:flex-1">
            <Save className="size-4" aria-hidden /> Enregistrer
          </button>
          {personnalise && (
            <button
              type="button"
              className="btn btn-outline py-3"
              onClick={() => {
                enregistrer(null);
                setMessage("Valeurs par défaut rétablies.");
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Valeurs par défaut
            </button>
          )}
        </div>
      </form>

      <div className="space-y-5">
        <Bloc titre="Aperçu">
          <ul className="space-y-3 text-sm">
            {(["basique", "premium"] as const).map((p) => (
              <li key={p} className="rounded-xl bg-surface p-3">
                <p className="font-semibold text-primary">{p === "premium" ? "Premium" : "Basique"}</p>
                <p className="text-ink">{formatFCFA(montantPeriode(apercu, p, "mensuel"))} / mois</p>
                <p className="text-xs text-muted">{formatFCFA(montantPeriode(apercu, p, "annuel"))} / an</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Valeurs par défaut (démonstration) : {formatFCFA(CONFIG_DEFAUT.prix.basique)} et {formatFCFA(CONFIG_DEFAUT.prix.premium)} par mois.
          </p>
        </Bloc>
        <div className="flex gap-3 rounded-2xl bg-primary-soft p-4 text-sm text-ink">
          <Lock className="size-5 shrink-0 text-primary" aria-hidden />
          Modifier les prix n&apos;a aucun effet sur les notes ni sur les périodes déjà payées.
        </div>
      </div>
    </div>
  );
}
