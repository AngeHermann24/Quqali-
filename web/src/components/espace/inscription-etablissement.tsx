"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, FileCheck2, Handshake, LocateFixed, Upload } from "lucide-react";
import { SECTEURS, SECTEUR_LIST, type Secteur } from "@/lib/data";
import { CLES, DOCUMENTS_REQUIS, type Dossier, maintenant } from "@/lib/espace";
import { normaliser } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { SECTEUR_ICONS } from "@/components/ui";
import { Chargement, Champ, ChampSelect, ChampTexte } from "@/components/espace/ui";

export const VILLES_CI = ["Abidjan", "Grand-Bassam", "Assinie", "Yamoussoukro", "Bouaké", "San-Pédro"];
export const COMMUNES_ABIDJAN = ["Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon"];
const ETAPES = ["Établissement", "Localisation", "Documents", "Responsable"];
const TAILLE_MAX = 5 * 1024 * 1024;

type Brouillon = Omit<Dossier, "id" | "statut" | "historique" | "reponsesAvis">;

const VIDE: Brouillon = {
  nom: "",
  secteur: "hotellerie",
  sousType: "",
  description: "",
  ville: "Abidjan",
  commune: "",
  quartier: "",
  adresse: "",
  responsable: { nom: "", fonction: "", telephone: "", email: "" },
  documents: [],
  parcours: "A",
};

export function InscriptionEtablissement() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [etape, setEtape] = useState(0);
  const [b, setB] = useState<Brouillon>(VIDE);
  const [gps, setGps] = useState<"idle" | "attente" | "erreur">("idle");
  const [erreurFichier, setErreurFichier] = useState("");

  if (dossier === undefined) return <Chargement />;
  if (dossier)
    return (
      <div className="container-page max-w-2xl py-12">
        <div className="card p-6 text-center">
          <FileCheck2 className="mx-auto size-12 text-success" aria-hidden />
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">Votre dossier « {dossier.nom} » est déjà enregistré</h2>
          <p className="mt-2 text-sm text-muted">Suivez son avancement depuis votre tableau de bord.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/pro" className="btn btn-primary">
              Mon tableau de bord
            </Link>
            <button type="button" className="btn btn-outline" onClick={() => setDossier(null)}>
              Recommencer (supprimer le dossier de démo)
            </button>
          </div>
        </div>
      </div>
    );

  const maj = (partiel: Partial<Brouillon>) => setB((p) => ({ ...p, ...partiel }));
  const majResp = (partiel: Partial<Brouillon["responsable"]>) => setB((p) => ({ ...p, responsable: { ...p.responsable, ...partiel } }));
  const documents = DOCUMENTS_REQUIS[b.secteur];
  const nomDocument = (type: string) => b.documents.find((d) => d.type === type)?.nom;

  const localiser = () => {
    setGps("attente");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        maj({ coords: [Number(pos.coords.latitude.toFixed(5)), Number(pos.coords.longitude.toFixed(5))] });
        setGps("idle");
      },
      () => setGps("erreur"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const suivant = (e: FormEvent) => {
    e.preventDefault();
    if (etape < ETAPES.length - 1) {
      setEtape(etape + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const date = maintenant();
    setDossier({
      ...b,
      id: `etab-${normaliser(b.nom).replace(/[^a-z0-9]+/g, "-")}`,
      statut: "soumis",
      historique: [{ statut: "soumis", date }],
      reponsesAvis: {},
    });
    router.push(b.parcours === "B" ? "/pro/accompagnement" : "/pro");
  };

  return (
    <div className="container-page max-w-3xl py-8">
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Étapes">
        {ETAPES.map((label, i) => (
          <li key={label}>
            <div className={cn("h-1.5 rounded-full", i <= etape ? "bg-primary" : "bg-line")} />
            <p className={cn("mt-1.5 truncate text-xs font-medium", i === etape ? "text-primary" : "text-muted")}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      <form onSubmit={suivant} className="card space-y-5 p-5 sm:p-8">
        {etape === 0 && (
          <>
            <h2 className="font-display text-xl font-semibold text-primary">Votre établissement</h2>
            <Champ id="i-nom" label="Nom de l'établissement" required value={b.nom} onChange={(e) => maj({ nom: e.target.value })} />
            <fieldset>
              <legend className="label">
                Secteur <span className="text-success">*</span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {SECTEUR_LIST.map((s) => {
                  const Icon = SECTEUR_ICONS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => maj({ secteur: s as Secteur, documents: [] })}
                      aria-pressed={b.secteur === s}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition",
                        b.secteur === s ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:border-primary/40",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                      {SECTEURS[s].nom}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Champ
              id="i-type"
              label="Type d'établissement"
              required
              placeholder={
                {
                  hotellerie: "Ex. Hôtel 3 étoiles, résidence…",
                  restauration: "Ex. Maquis, restaurant…",
                  sante: "Ex. Clinique, centre médical…",
                  services: "Ex. Salon de coiffure, pressing, garage…",
                  education: "Ex. École primaire, institut de formation…",
                  commerce: "Ex. Centre commercial, galerie…",
                  transport: "Ex. Compagnie de bus, navette…",
                }[b.secteur]
              }
              value={b.sousType}
              onChange={(e) => maj({ sousType: e.target.value })}
            />
            <ChampTexte id="i-desc" label="Présentation" placeholder="Services, capacité, spécialités…" value={b.description} onChange={(e) => maj({ description: e.target.value })} />
          </>
        )}

        {etape === 1 && (
          <>
            <h2 className="font-display text-xl font-semibold text-primary">Localisation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChampSelect id="i-ville" label="Ville" required value={b.ville} onChange={(e) => maj({ ville: e.target.value })}>
                {VILLES_CI.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </ChampSelect>
              <div>
                <Champ id="i-commune" label="Commune" required list="communes" value={b.commune} onChange={(e) => maj({ commune: e.target.value })} />
                <datalist id="communes">
                  {(b.ville === "Abidjan" ? COMMUNES_ABIDJAN : [b.ville]).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <Champ id="i-quartier" label="Quartier" required placeholder="Ex. Riviera 2, Zone 4…" value={b.quartier} onChange={(e) => maj({ quartier: e.target.value })} />
              <Champ id="i-adresse" label="Adresse / repère" required placeholder="Rue, repère connu…" value={b.adresse} onChange={(e) => maj({ adresse: e.target.value })} />
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-semibold text-ink">Position GPS</p>
                <p className="text-muted">
                  {b.coords ? `${b.coords[0]}, ${b.coords[1]}` : gps === "erreur" ? "Position indisponible : l'agent la relèvera lors de l'audit." : "Facultatif, utile pour la carte et l'itinéraire."}
                </p>
              </div>
              <button type="button" onClick={localiser} disabled={gps === "attente"} className="btn btn-outline shrink-0">
                <LocateFixed className="size-4" aria-hidden /> {gps === "attente" ? "Localisation…" : "Utiliser ma position"}
              </button>
            </div>
          </>
        )}

        {etape === 2 && (
          <>
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Documents justificatifs</h2>
              <p className="mt-1 text-sm text-muted">PDF, JPG ou PNG, 5 Mo maximum par fichier. Ils sont vérifiés avant la planification de l&apos;audit.</p>
            </div>
            <ul className="space-y-3">
              {documents.map((d) => {
                const nom = nomDocument(d.type);
                return (
                  <li key={d.type} className={cn("rounded-xl border p-4", nom ? "border-success/40 bg-success-soft/40" : "border-line")}>
                    <label htmlFor={`doc-${d.type}`} className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {d.label} {d.obligatoire && <span className="text-success">*</span>}
                        </span>
                        <span className="block truncate text-xs text-muted">{nom ?? (d.obligatoire ? "Obligatoire" : "Facultatif")}</span>
                      </span>
                      <span className={cn("btn shrink-0 px-3 py-2", nom ? "btn-outline" : "btn-primary")}>
                        {nom ? <FileCheck2 className="size-4" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                        {nom ? "Remplacer" : "Ajouter"}
                      </span>
                    </label>
                    <input
                      id={`doc-${d.type}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required={d.obligatoire && !nom}
                      className="sr-only"
                      onChange={(e) => {
                        const fichier = e.target.files?.[0];
                        if (!fichier) return;
                        if (fichier.size > TAILLE_MAX) {
                          setErreurFichier(`« ${fichier.name} » dépasse 5 Mo.`);
                          e.target.value = "";
                          return;
                        }
                        setErreurFichier("");
                        maj({ documents: [...b.documents.filter((x) => x.type !== d.type), { type: d.type, nom: fichier.name }] });
                      }}
                    />
                  </li>
                );
              })}
            </ul>
            {erreurFichier && <p className="text-sm font-medium text-ink">{erreurFichier}</p>}
          </>
        )}

        {etape === 3 && (
          <>
            <h2 className="font-display text-xl font-semibold text-primary">Responsable et parcours</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ id="i-resp" label="Nom du responsable" required autoComplete="name" value={b.responsable.nom} onChange={(e) => majResp({ nom: e.target.value })} />
              <Champ id="i-fonction" label="Fonction" required placeholder="Gérant, directeur…" value={b.responsable.fonction} onChange={(e) => majResp({ fonction: e.target.value })} />
              <Champ id="i-tel" label="Téléphone" type="tel" required autoComplete="tel" placeholder="+225 07 00 00 00 00" value={b.responsable.telephone} onChange={(e) => majResp({ telephone: e.target.value })} />
              <Champ id="i-email" label="E-mail" type="email" required autoComplete="email" value={b.responsable.email} onChange={(e) => majResp({ email: e.target.value })} />
            </div>
            <fieldset>
              <legend className="label">
                Parcours <span className="text-success">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: "A", titre: "Audit direct", texte: "Je pense déjà répondre aux exigences.", Icon: ClipboardCheck },
                    { value: "B", titre: "Accompagnement", texte: "Je veux être accompagné avant l'audit.", Icon: Handshake },
                  ] as const
                ).map(({ value, titre, texte, Icon }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition",
                      b.parcours === value ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40",
                    )}
                  >
                    <input type="radio" name="parcours" className="sr-only" checked={b.parcours === value} onChange={() => maj({ parcours: value })} />
                    <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        Parcours {value} · {titre}
                      </span>
                      <span className="block text-xs text-muted">{texte}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" required className="mt-1 accent-primary" />
              J&apos;accepte l&apos;audit sur place de mon établissement et je comprends que le paiement n&apos;influence jamais la note.
            </label>
          </>
        )}

        <div className="flex gap-3 border-t border-line pt-5">
          {etape > 0 && (
            <button type="button" onClick={() => setEtape(etape - 1)} className="btn btn-outline py-3">
              <ArrowLeft className="size-4" aria-hidden /> Retour
            </button>
          )}
          <button type="submit" className={cn("btn flex-1 py-3", etape === ETAPES.length - 1 ? "btn-success" : "btn-primary")}>
            {etape === ETAPES.length - 1 ? "Soumettre mon dossier" : "Continuer"}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
