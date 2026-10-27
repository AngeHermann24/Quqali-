"use client";

import { useState } from "react";
import { Camera, Eye, History, ImageIcon, Info, Lock, MapPin, Phone, Plus, Save, Star } from "lucide-react";
import { CLES, type Dossier, avisDemo, maintenant } from "@/lib/espace";
import { SECTEURS, type Secteur } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import type { AvisClient } from "@/lib/avis";
import { Chargement } from "@/components/espace/ui";
import { BadgeCertifiePro, ChipPro, EtatVidePro, PanneauBas, TabsPro, ToastPro } from "@/components/pro/ui";

type Onglet = "infos" | "services" | "photos" | "horaires";

const SERVICES_PAR_SECTEUR: Record<Secteur, string[]> = {
  hotellerie: ["Wi-Fi gratuit", "Piscine", "Restaurant", "Salle de sport", "Navette aéroport", "Parking", "Climatisation", "Petit-déjeuner", "Réception 24 h/24", "Room service"],
  restauration: ["Wi-Fi gratuit", "Terrasse", "Climatisation", "Parking", "Plats à emporter", "Livraison", "Menu végétarien", "Espace enfants", "Réservation de groupe", "Climatisation salle privée"],
  sante: ["Urgences 24 h/24", "Parking", "Wi-Fi gratuit", "Pharmacie", "Imagerie", "Laboratoire", "Consultation à domicile", "Téléconsultation"],
  services: ["Wi-Fi gratuit", "Parking", "Sur rendez-vous", "Devis gratuit", "Paiement mobile", "À domicile"],
  education: ["Bibliothèque", "Cantine", "Transport scolaire", "Salle informatique", "Soutien scolaire", "Parking"],
  commerce: ["Parking", "Livraison", "Paiement mobile", "Wi-Fi gratuit", "Retours acceptés"],
  transport: ["Wi-Fi à bord", "Climatisation", "Bagages inclus", "Billets en ligne", "Paiement mobile"],
};

export function FichePro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [onglet, setOnglet] = useState<Onglet>("infos");
  const [apercu, setApercu] = useState(false);
  const [sauve, setSauve] = useState(false);
  const [form, setForm] = useState<null | { description: string; telephone: string; email: string; horaires: string; services: string[] }>(null);

  if (dossier === undefined || avisTous === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="px-5 py-8">
        <EtatVidePro
          icone={<Info className="size-8" aria-hidden />}
          titre="Pas encore de fiche"
          detail="Votre fiche est créée à partir de votre dossier de candidature."
        />
      </div>
    );

  const nbAvis = (avisTous?.[dossier.id] ?? []).length + avisDemo().length;
  const tous = [...(avisTous?.[dossier.id] ?? []), ...avisDemo()];
  const moyenne = tous.length ? tous.reduce((s, a) => s + a.note, 0) / tous.length : 0;

  const f = form ?? {
    description: dossier.description,
    telephone: dossier.responsable.telephone,
    email: dossier.responsable.email,
    horaires: dossier.horaires ?? "",
    services: dossier.services ?? [],
  };
  const maj = (k: keyof typeof f, v: string | string[]) => {
    setForm({ ...f, [k]: v });
    setSauve(false);
  };
  const basculerService = (s: string) => maj("services", f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s]);

  const sauvegarder = () => {
    setDossier({
      ...dossier,
      description: f.description,
      horaires: f.horaires,
      services: f.services,
      responsable: { ...dossier.responsable, telephone: f.telephone, email: f.email },
      modifications: [{ date: maintenant(), champ: "Description, contact, services et horaires" }, ...(dossier.modifications ?? [])].slice(0, 10),
    });
    setForm(null);
    setSauve(true);
  };

  const photos = dossier.documents.filter((d) => d.type === "photos");
  const ajouterPhoto = () =>
    setDossier({ ...dossier, documents: [...dossier.documents, { type: "photos", nom: `photo-${photos.length + 1}.jpg` }] });
  const retirerPhoto = (nom: string) =>
    setDossier({ ...dossier, documents: dossier.documents.filter((d) => !(d.type === "photos" && d.nom === nom)) });

  return (
    <>
      {/* Couverture */}
      <div className="relative mx-5 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-bleu to-primary">
        <div className="flex h-36 items-end justify-between p-4">
          <button
            type="button"
            onClick={() => setApercu(true)}
            className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-primary shadow-card transition active:scale-95"
          >
            <Eye className="size-4" aria-hidden /> Aperçu usager
          </button>
          <span className="grid size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur">
            <Camera className="size-5" aria-hidden />
          </span>
        </div>
      </div>

      {/* Identité */}
      <div className="px-5 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink">{dossier.nom}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-3.5" aria-hidden /> {SECTEURS[dossier.secteur].nom} · {dossier.quartier}, {dossier.commune}
            </p>
          </div>
          <BadgeCertifiePro compact />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink">
          <Star className="size-4 fill-or text-or" aria-hidden />
          <span className="font-bold">{moyenne.toFixed(1).replace(".", ",")}</span>
          <span className="text-muted">· {nbAvis} avis</span>
        </p>
      </div>

      {/* Onglets */}
      <TabsPro
        className="mt-4 px-5"
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "infos", label: "Informations" },
          { id: "services", label: "Services" },
          { id: "photos", label: "Photos" },
          { id: "horaires", label: "Horaires" },
        ]}
      />

      <div className="space-y-4 px-5 py-4 pb-6">
        {onglet === "infos" && (
          <>
            <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
              <label className="text-xs font-bold text-muted uppercase" htmlFor="f-desc">Description</label>
              <textarea id="f-desc" rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" value={f.description} onChange={(e) => maj("description", e.target.value)} />
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-xs font-bold text-muted uppercase" htmlFor="f-tel">Téléphone</label>
                  <input id="f-tel" className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" value={f.telephone} onChange={(e) => maj("telephone", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted uppercase" htmlFor="f-mail">E-mail</label>
                  <input id="f-mail" type="email" className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" value={f.email} onChange={(e) => maj("email", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
              <p className="text-xs font-bold text-muted uppercase">Identité (validation requise)</p>
              <ul className="mt-2.5 space-y-2 text-sm">
                {[["Nom", dossier.nom], ["Type", dossier.sousType], ["Adresse", `${dossier.adresse}, ${dossier.quartier}`]].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5">
                    <span className="text-muted">{k}</span>
                    <span className="flex items-center gap-1.5 text-right font-semibold text-ink"><Lock className="size-3 text-muted" aria-hidden />{v}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11px] text-muted">Nom, adresse, type et documents passent par validation de l&apos;équipe.</p>
            </div>
          </>
        )}

        {onglet === "services" && (
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <p className="text-sm font-bold text-ink">Services proposés</p>
            <p className="text-xs text-muted">Touchez pour ajouter ou retirer — visibles sur votre fiche publique.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SERVICES_PAR_SECTEUR[dossier.secteur].map((s) => (
                <ChipPro key={s} actif={f.services.includes(s)} onClick={() => basculerService(s)}>{s}</ChipPro>
              ))}
            </div>
          </div>
        )}

        {onglet === "photos" && (
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <p className="text-sm font-bold text-ink">Photos de l&apos;établissement</p>
            <p className="text-xs text-muted">JPG/PNG — affichées sur votre fiche publique.</p>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {photos.map((p, i) => (
                <div key={p.nom} className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-success/15">
                  <span className="grid h-full place-items-center text-primary/50"><ImageIcon className="size-7" aria-hidden /></span>
                  <button
                    type="button"
                    onClick={() => retirerPhoto(p.nom)}
                    aria-label={`Retirer la photo ${i + 1}`}
                    className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-ink/60 text-[10px] font-bold text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={ajouterPhoto}
                className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition active:scale-95"
                aria-label="Ajouter une photo"
              >
                <Plus className="size-6" aria-hidden />
              </button>
            </div>
          </div>
        )}

        {onglet === "horaires" && (
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <label className="text-xs font-bold text-muted uppercase" htmlFor="f-hor">Horaires d&apos;ouverture</label>
            <textarea id="f-hor" rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" placeholder={"Lun – Sam : 08 h – 22 h\nDim : 10 h – 18 h"} value={f.horaires} onChange={(e) => maj("horaires", e.target.value)} />
            {dossier.capacites && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
                <Lock className="size-3" aria-hidden /> Capacités déclarées ({[dossier.capacites.chambres && `${dossier.capacites.chambres} chambres`, dossier.capacites.couverts && `${dossier.capacites.couverts} couverts`, dossier.capacites.lits && `${dossier.capacites.lits} lits`].filter(Boolean).join(", ")}) — modifiables sur demande.
              </p>
            )}
          </div>
        )}

        {/* Enregistrer */}
        <button type="button" onClick={sauvegarder} disabled={!form} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white transition active:scale-[0.98]", form ? "bg-success" : "bg-line text-muted")}>
          <Save className="size-4" aria-hidden /> Enregistrer
        </button>
        <p className="flex items-start gap-1.5 text-[11px] text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Certains changements nécessitent une validation. Description, photos, services et horaires sont publiés après relecture rapide.
        </p>

        {/* Historique */}
        {(dossier.modifications ?? []).length > 0 && (
          <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><History className="size-4 text-muted" aria-hidden /> Historique des modifications</p>
            <ul className="mt-2.5 space-y-2">
              {(dossier.modifications ?? []).map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-ink">{m.champ}</span>
                  <span className="shrink-0 text-muted">{formatDate(m.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Aperçu usager */}
      <PanneauBas ouvert={apercu} titre="Aperçu usager" onFermer={() => setApercu(false)}>
        <div className="overflow-hidden rounded-3xl border border-line">
          <div className="relative h-32 bg-gradient-to-br from-primary to-success/80">
            <BadgeCertifiePro className="absolute top-3 left-3" />
            {dossier.audit && <span className="absolute right-3 bottom-3 rounded-full bg-white px-3 py-1 font-display text-lg font-bold text-primary">{dossier.audit.global} %</span>}
          </div>
          <div className="p-4">
            <p className="font-display text-lg font-bold text-ink">{dossier.nom}</p>
            <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" aria-hidden /> {SECTEURS[dossier.secteur].nom} · {dossier.sousType} — {dossier.adresse}, {dossier.quartier}</p>
            <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-ink">
              <Star className="size-4 fill-or text-or" aria-hidden /> {moyenne.toFixed(1).replace(".", ",")} · {nbAvis} avis
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-muted">{f.description || "Description à compléter."}</p>
            {f.services.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.services.slice(0, 6).map((s) => <span key={s} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink">{s}</span>)}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink"><Phone className="size-4 text-primary" aria-hidden /> {f.telephone}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">Rendu tel que dans l&apos;app usager</p>
      </PanneauBas>

      <ToastPro visible={sauve && !form} message="Enregistré — publié après relecture rapide." />
    </>
  );
}
