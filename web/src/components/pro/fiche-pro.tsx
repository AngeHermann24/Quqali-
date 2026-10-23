"use client";

import { useState } from "react";
import { Eye, MapPin, Phone, Save } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { SECTEURS } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { Bloc, Champ, ChampTexte, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { CertifiedBadge } from "@/components/ui";

export function FichePro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [sauve, setSauve] = useState(false);
  const [form, setForm] = useState<null | { sousType: string; description: string; adresse: string; telephone: string; email: string }>(null);
  if (dossier === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Pas encore de fiche</h1>
          <p className="mt-2 text-sm text-muted">Votre fiche est créée à partir de votre dossier de candidature.</p>
        </div>
      </div>
    );

  const f = form ?? {
    sousType: dossier.sousType,
    description: dossier.description,
    adresse: dossier.adresse,
    telephone: dossier.responsable.telephone,
    email: dossier.responsable.email,
  };
  const maj = (k: keyof typeof f, v: string) => {
    setForm({ ...f, [k]: v });
    setSauve(false);
  };
  const sauvegarder = () => {
    setDossier({ ...dossier, sousType: f.sousType, description: f.description, adresse: f.adresse, responsable: { ...dossier.responsable, telephone: f.telephone, email: f.email } });
    setForm(null);
    setSauve(true);
  };

  return (
    <>
      <EspaceHeader role="Ma fiche" titre="Ce que voient les usagers" sousTitre="Les modifications sensibles passent par validation de nos équipes" />
      <div className="container-page grid max-w-4xl gap-5 py-6 lg:grid-cols-2">
        <Bloc titre="Modifier" className="space-y-4">
          <Champ id="f-soustype" label="Type d'établissement" value={f.sousType} onChange={(e) => maj("sousType", e.target.value)} />
          <ChampTexte id="f-desc" label="Description" value={f.description} onChange={(e) => maj("description", e.target.value)} rows={4} />
          <Champ id="f-adr" label="Adresse" value={f.adresse} onChange={(e) => maj("adresse", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="f-tel" label="Téléphone" value={f.telephone} onChange={(e) => maj("telephone", e.target.value)} />
            <Champ id="f-mail" label="E-mail" type="email" value={f.email} onChange={(e) => maj("email", e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={sauvegarder} disabled={!form}>
            <Save className="size-4" aria-hidden /> {sauve ? "Enregistré ✓" : "Enregistrer"}
          </button>
          <p className="text-xs text-muted">En production, les modifications visibles des usagers sont validées par nos équipes sous 48 h.</p>
        </Bloc>

        <Bloc titre="Aperçu usager" icone={<Eye className="size-5" aria-hidden />}>
          <div className="overflow-hidden rounded-3xl border border-line">
            <div className="relative h-36 bg-gradient-to-br from-primary to-success/80">
              <span className="badge-brille absolute top-3 left-3">
                <CertifiedBadge />
              </span>
              {dossier.audit && (
                <span className="absolute right-3 bottom-3 rounded-full bg-white px-3 py-1 font-display text-lg font-bold text-primary">{formatScore(dossier.audit.global)} %</span>
              )}
            </div>
            <div className="p-4">
              <p className="font-display text-lg font-bold text-ink">{dossier.nom}</p>
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5" aria-hidden /> {SECTEURS[dossier.secteur].nom} · {f.sousType} — {f.adresse}, {dossier.quartier}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{f.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Phone className="size-4 text-primary" aria-hidden /> {f.telephone}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <Pastille ton="primaire">Rendu tel que dans l&apos;app usager</Pastille>
          </div>
        </Bloc>
      </div>
    </>
  );
}
