"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Camera, ChevronRight, FileCheck2, FileText, FolderOpen, ImagePlus, Send, TriangleAlert } from "lucide-react";
import { CLES, DOCUMENTS_REQUIS, type Dossier, maintenant } from "@/lib/espace";
import type { Secteur } from "@/lib/data";
import { useStockage } from "@/lib/stockage";
import { COMMUNES_ABIDJAN, VILLES_CI } from "@/components/espace/inscription-etablissement";
import { Chargement } from "@/components/espace/ui";
import { CarteRepere } from "@/components/pro/carte-repere";
import { EntetePro, UploadItem, type EtatUpload } from "@/components/pro/ui";

const TYPES: { id: string; label: string; secteur: Secteur }[] = [
  { id: "hotel", label: "Hôtel", secteur: "hotellerie" },
  { id: "restaurant", label: "Restaurant", secteur: "restauration" },
  { id: "hopital", label: "Hôpital", secteur: "sante" },
  { id: "clinique", label: "Clinique", secteur: "sante" },
];

const CHAMPS_TYPE: Record<string, { cle: "chambres" | "couverts" | "lits" | "specialites"; label: string; numerique: boolean }[]> = {
  hotel: [{ cle: "chambres", label: "Nombre de chambres", numerique: true }],
  restaurant: [{ cle: "couverts", label: "Nombre de couverts", numerique: true }],
  hopital: [
    { cle: "lits", label: "Nombre de lits", numerique: true },
    { cle: "specialites", label: "Spécialités", numerique: false },
  ],
  clinique: [
    { cle: "lits", label: "Nombre de lits", numerique: true },
    { cle: "specialites", label: "Spécialités", numerique: false },
  ],
};

interface Brouillon {
  nom: string;
  typeId: string;
  description: string;
  ville: string;
  commune: string;
  quartier: string;
  adresse: string;
  coords?: [number, number];
  horaires: string;
  capacites: NonNullable<Dossier["capacites"]>;
  documents: Dossier["documents"];
}

const vide: Brouillon = {
  nom: "",
  typeId: "",
  description: "",
  ville: "Abidjan",
  commune: "",
  quartier: "",
  adresse: "",
  horaires: "",
  capacites: {},
  documents: [],
};

/** Écran 3 — Dossier de candidature : infos générales + documents + envoi. */
export function DossierPro() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [envoi, setEnvoi] = useState<Record<string, number>>({});
  const [fichierActif, setFichierActif] = useState<string | null>(null);
  const inputFichier = useRef<HTMLInputElement>(null);
  const typeFichier = useRef<string>("");

  // Initialisation du brouillon depuis le dossier existant (sauvegarde/reprise)
  const b = useMemo(() => {
    if (brouillon) return brouillon;
    if (!dossier) return vide;
    return {
      nom: dossier.nom,
      typeId: TYPES.find((t) => dossier.sousType.toLowerCase().includes(t.label.toLowerCase()))?.id ?? (dossier.secteur === "hotellerie" ? "hotel" : dossier.secteur === "restauration" ? "restaurant" : "clinique"),
      description: dossier.description,
      ville: dossier.ville,
      commune: dossier.commune,
      quartier: dossier.quartier,
      adresse: dossier.adresse,
      coords: dossier.coords,
      horaires: dossier.horaires ?? "",
      capacites: dossier.capacites ?? {},
      documents: dossier.documents,
    } satisfies Brouillon;
  }, [brouillon, dossier]);

  if (dossier === undefined) return <Chargement />;

  const maj = (partiel: Partial<Brouillon>) => setBrouillon({ ...b, ...partiel });
  const type = TYPES.find((t) => t.id === b.typeId);
  const requis = type ? DOCUMENTS_REQUIS[type.secteur] : [];

  const nbPhotos = b.documents.filter((d) => d.type === "photos").length;
  const photosRequises = requis.find((r) => r.type === "photos")?.obligatoire ? 5 : 0;
  const obligatoiresOk = requis.filter((r) => r.obligatoire && r.type !== "photos").every((r) => b.documents.some((d) => d.type === r.type));
  const photosOk = photosRequises === 0 || nbPhotos >= photosRequises;
  const infosOk = b.nom.trim().length >= 2 && !!type && b.commune !== "" && b.quartier.trim() !== "" && b.adresse.trim() !== "";
  const valide = infosOk && obligatoiresOk && photosOk;

  const envoyerFichier = (typeDoc: string, fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    const noms = [...fichiers].map((f) => f.name);
    // Simulation d'envoi : progression animée puis « envoyé »
    setEnvoi((e) => ({ ...e, [typeDoc]: 10 }));
    const timer = setInterval(() => {
      setEnvoi((e) => {
        const p = (e[typeDoc] ?? 0) + 30;
        if (p >= 100) {
          clearInterval(timer);
          setBrouillon((prev) => {
            const base = prev ?? b;
            const gardes = typeDoc === "photos" ? base.documents : base.documents.filter((d) => d.type !== typeDoc);
            return { ...base, documents: [...gardes, ...noms.map((nom) => ({ type: typeDoc, nom }))] };
          });
          const reste = { ...e };
          delete reste[typeDoc];
          return reste;
        }
        return { ...e, [typeDoc]: p };
      });
    }, 200);
  };

  const ouvrirFichier = (typeDoc: string) => {
    typeFichier.current = typeDoc;
    setFichierActif(null);
    inputFichier.current?.click();
  };

  const etatDoc = (typeDoc: string): EtatUpload =>
    envoi[typeDoc] !== undefined ? "en_cours" : b.documents.some((d) => d.type === typeDoc) ? "envoye" : "a_envoyer";

  const soumettre = () => {
    if (!valide) return;
    navigator.vibrate?.(10);
    const nouveau: Dossier = {
      id: dossier?.id ?? `etab-${Date.now()}`,
      nom: b.nom.trim(),
      secteur: type!.secteur,
      sousType: type!.label,
      description: b.description.trim(),
      ville: b.ville,
      commune: b.commune,
      quartier: b.quartier.trim(),
      adresse: b.adresse.trim(),
      coords: b.coords,
      horaires: b.horaires.trim() || undefined,
      capacites: Object.keys(b.capacites).length ? b.capacites : undefined,
      responsable: dossier?.responsable ?? { nom: "", fonction: "Gérant", telephone: "", email: "" },
      documents: b.documents,
      parcours: dossier?.parcours ?? "A",
      statut: "soumis",
      historique: [...(dossier?.historique ?? []), { statut: "soumis" as const, date: maintenant() }],
      reponsesAvis: dossier?.reponsesAvis ?? {},
    };
    setDossier(nouveau);
    router.push("/pro/parcours");
  };

  const verrouille = dossier && dossier.statut !== "soumis";

  return (
    <div className="bg-surface">
      <EntetePro titre="Dossier de candidature" onRetour={() => router.back()} />
      <p className="px-5 text-center text-xs text-muted">Renseignez les informations de votre établissement et téléchargez les documents requis.</p>

      <div className="space-y-5 px-5 py-5">
        {verrouille && (
          <p className="flex items-start gap-2 rounded-2xl bg-or/15 p-3 text-xs font-semibold text-[#b45309]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Votre dossier est en cours de traitement — les informations ne sont plus modifiables.
          </p>
        )}

        {/* Informations générales */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <FileText className="size-4 text-primary" aria-hidden /> Informations générales
          </h2>
          <div className="mt-4 space-y-3.5">
            <div>
              <label className="label" htmlFor="d-nom">Nom de l&apos;établissement</label>
              <input id="d-nom" disabled={!!verrouille} placeholder="Hôtel Le Palmier" value={b.nom} onChange={(e) => maj({ nom: e.target.value })} className="input h-11" />
            </div>
            <div>
              <label className="label" htmlFor="d-type">Type d&apos;établissement</label>
              <select id="d-type" disabled={!!verrouille} value={b.typeId} onChange={(e) => maj({ typeId: e.target.value })} className="input h-11 appearance-none">
                <option value="">Choisir…</option>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="d-ville">Ville</label>
                <select id="d-ville" disabled={!!verrouille} value={b.ville} onChange={(e) => maj({ ville: e.target.value, commune: "" })} className="input h-11 appearance-none">
                  {VILLES_CI.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="d-commune">Commune</label>
                <select id="d-commune" disabled={!!verrouille} value={b.commune} onChange={(e) => maj({ commune: e.target.value })} className="input h-11 appearance-none">
                  <option value="">Choisir…</option>
                  {(b.ville === "Abidjan" ? COMMUNES_ABIDJAN : [b.ville]).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="d-adresse">Adresse</label>
              <input id="d-adresse" disabled={!!verrouille} placeholder="Quartier, rue — ex : Cocody, Rue des Jardins" value={b.adresse} onChange={(e) => maj({ adresse: e.target.value })} className="input h-11" />
            </div>
            <div>
              <label className="label" htmlFor="d-quartier">Quartier</label>
              <input id="d-quartier" disabled={!!verrouille} placeholder="Ex : Riviera Palmeraie" value={b.quartier} onChange={(e) => maj({ quartier: e.target.value })} className="input h-11" />
            </div>
            {!verrouille && (
              <div>
                <p className="label">Position sur la carte</p>
                <CarteRepere coords={b.coords} onChange={(c) => maj({ coords: c })} />
                <p className="mt-1 text-[11px] text-muted">Touchez la carte pour placer le repère de votre établissement.</p>
              </div>
            )}
            <div>
              <label className="label" htmlFor="d-horaires">Horaires d&apos;ouverture</label>
              <input id="d-horaires" disabled={!!verrouille} placeholder="Ex : 08h00 – 23h00" value={b.horaires} onChange={(e) => maj({ horaires: e.target.value })} className="input h-11" />
            </div>
            {type &&
              CHAMPS_TYPE[type.id].map((champ) => (
                <div key={champ.cle}>
                  <label className="label" htmlFor={`d-${champ.cle}`}>{champ.label}</label>
                  <input
                    id={`d-${champ.cle}`}
                    disabled={!!verrouille}
                    inputMode={champ.numerique ? "numeric" : undefined}
                    placeholder={champ.numerique ? "Ex : 32" : "Ex : Médecine générale, pédiatrie"}
                    value={String(b.capacites[champ.cle] ?? "")}
                    onChange={(e) =>
                      maj({ capacites: { ...b.capacites, [champ.cle]: champ.numerique ? Number(e.target.value.replace(/\D/g, "")) || undefined : e.target.value } })
                    }
                    className="input h-11"
                  />
                </div>
              ))}
            <div>
              <label className="label" htmlFor="d-desc">Description</label>
              <textarea id="d-desc" disabled={!!verrouille} rows={3} placeholder="Présentez votre établissement en quelques lignes…" value={b.description} onChange={(e) => maj({ description: e.target.value })} className="input" />
            </div>
          </div>
        </section>

        {/* Documents requis */}
        {type && (
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <FolderOpen className="size-4 text-primary" aria-hidden /> Documents requis
            </h2>
            <input ref={inputFichier} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => envoyerFichier(typeFichier.current, e.target.files)} />
            <ul className="mt-4 space-y-3">
              {requis.map((r) => {
                const photos = r.type === "photos";
                const doc = b.documents.find((d) => d.type === r.type);
                return (
                  <li key={r.type}>
                    <UploadItem
                      label={photos ? `${r.label}${photosRequises ? ` (min. ${photosRequises})` : ""}` : r.label}
                      detail={photos ? "JPG, PNG · 10 Mo" : "PDF, JPG · 5 Mo"}
                      etat={photos ? (nbPhotos > 0 ? "envoye" : "a_envoyer") : etatDoc(r.type)}
                      progression={envoi[r.type] ?? 0}
                      fichier={photos ? (nbPhotos ? `${nbPhotos} photo(s) reçue(s)` : undefined) : doc?.nom}
                      onAjouter={verrouille ? undefined : () => (photos ? ouvrirFichier("photos") : setFichierActif(r.type))}
                      onRetirer={verrouille ? undefined : () => maj({ documents: b.documents.filter((d) => d.type !== r.type) })}
                    />
                    {fichierActif === r.type && !verrouille && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => ouvrirFichier(r.type)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-xs font-bold text-ink">
                          <Camera className="size-4" aria-hidden /> Appareil photo / fichiers
                        </button>
                        <button type="button" onClick={() => setFichierActif(null)} className="rounded-xl px-3 text-xs font-semibold text-muted">
                          Annuler
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <ImagePlus className="size-3.5" aria-hidden /> Prise en photo possible directement depuis votre téléphone.
            </p>
          </section>
        )}

        {!verrouille && (
          <button type="button" disabled={!valide} onClick={soumettre} className="btn btn-success h-13 w-full text-base disabled:opacity-40">
            <Send className="size-4" aria-hidden /> {dossier ? "Renvoyer mon dossier" : "Envoyer mon dossier"}
          </button>
        )}
        {verrouille && (
          <a href="/pro/documents" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-bleu py-3.5 text-sm font-bold text-bleu">
            Suivre mes documents <ChevronRight className="size-4" aria-hidden />
          </a>
        )}
        {!valide && !verrouille && type && (
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
            <FileCheck2 className="size-3.5" aria-hidden /> Complétez les informations et les documents obligatoires pour envoyer.
          </p>
        )}
      </div>
    </div>
  );
}
