"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FileCheck2, Handshake, ShieldCheck, Upload } from "lucide-react";
import { SECTEURS, SECTEUR_LIST, type Secteur } from "@/lib/data";
import { type DocumentJoint, maintenant } from "@/lib/espace";
import { cn } from "@/lib/site";
import { COMMUNES_ABIDJAN } from "@/components/espace/inscription-etablissement";
import { usePartenaire } from "@/components/espace/use-partenaire";
import { Chargement, Champ, ChampTexte } from "@/components/espace/ui";

const ENGAGEMENTS = [
  "Je n'auditerai jamais un établissement que j'ai accompagné, et je déclarerai tout conflit d'intérêts.",
  "Je respecte la confidentialité des informations des établissements accompagnés.",
  "Je ne perçois aucune rémunération d'un établissement en dehors du cadre de la plateforme.",
];

export function InscriptionPartenaire() {
  const router = useRouter();
  const { partenaire, setPartenaire, reinitialiser, pret } = usePartenaire();
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentJoint[]>([]);
  const [erreur, setErreur] = useState("");

  if (!pret) return <Chargement />;
  if (partenaire)
    return (
      <div className="container-page max-w-2xl py-12">
        <div className="card p-6 text-center">
          <FileCheck2 className="mx-auto size-12 text-success" aria-hidden />
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">Votre candidature est déjà enregistrée</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/partenaire" className="btn btn-primary">
              Mon espace accompagnateur
            </Link>
            <button type="button" className="btn btn-outline" onClick={reinitialiser}>
              Recommencer (supprimer la démo)
            </button>
          </div>
        </div>
      </div>
    );

  const basculer = <T,>(liste: T[], valeur: T) => (liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur]);

  const envoyer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!secteurs.length || !zones.length) return setErreur("Choisissez au moins un secteur et une zone d'intervention.");
    const fd = new FormData(e.currentTarget);
    const texte = (cle: string) => String(fd.get(cle) ?? "").trim();
    setPartenaire({
      id: "moi",
      nom: texte("nom"),
      telephone: texte("telephone"),
      email: texte("email"),
      secteurs,
      zones,
      experience: Number(fd.get("experience")),
      certifications: texte("certifications"),
      references: texte("references"),
      agentHabilite: fd.get("agent") === "on",
      documents,
      statut: "soumis",
      historique: [{ statut: "soumis", date: maintenant() }],
    });
    router.push("/partenaire");
  };

  return (
    <div className="container-page max-w-3xl py-8">
      <form onSubmit={envoyer} className="card space-y-7 p-5 sm:p-8">
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-primary">Identité</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="p-nom" name="nom" label="Nom complet" required autoComplete="name" className="sm:col-span-2" />
            <Champ id="p-tel" name="telephone" label="Téléphone" type="tel" required autoComplete="tel" placeholder="+225 07 00 00 00 00" />
            <Champ id="p-email" name="email" label="E-mail" type="email" required autoComplete="email" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-primary">Expertise</h2>
          <fieldset>
            <legend className="label">
              Secteurs <span className="text-success">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {SECTEUR_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={secteurs.includes(s)}
                  onClick={() => setSecteurs(basculer(secteurs, s))}
                  className={cn("rounded-xl border-2 p-3 text-sm font-semibold transition", secteurs.includes(s) ? "border-primary bg-primary-soft text-primary" : "border-line text-ink")}
                >
                  {SECTEURS[s].nom}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">
              Zones d&apos;intervention (Abidjan) <span className="text-success">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {COMMUNES_ABIDJAN.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={zones.includes(c)}
                  onClick={() => setZones(basculer(zones, c))}
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition", zones.includes(c) ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-primary")}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="p-exp" name="experience" label="Années d'expérience" type="number" min={0} max={60} required />
            <Champ id="p-certif" name="certifications" label="Certifications" placeholder="ISO 9001, HACCP, hygiène hospitalière…" />
            <ChampTexte id="p-ref" name="references" label="Références (établissements accompagnés, missions)" className="sm:col-span-2" required />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm has-checked:border-primary has-checked:bg-primary-soft">
            <input type="checkbox" name="agent" className="mt-0.5 accent-primary" />
            <span>
              <span className="block font-semibold text-ink">Je suis également agent évaluateur habilité</span>
              <span className="block text-xs text-muted">Vous pourrez recevoir des missions d&apos;audit, mais jamais sur les établissements que vous accompagnez.</span>
            </span>
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">Documents</h2>
          {[
            { type: "cv", label: "CV", obligatoire: true },
            { type: "diplomes", label: "Diplômes et certifications", obligatoire: false },
          ].map((d) => {
            const nom = documents.find((x) => x.type === d.type)?.nom;
            return (
              <div key={d.type} className={cn("rounded-xl border p-4", nom ? "border-success/40 bg-success-soft/40" : "border-line")}>
                <label htmlFor={`pdoc-${d.type}`} className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {d.label} {d.obligatoire && <span className="text-success">*</span>}
                    </span>
                    <span className="block truncate text-xs text-muted">{nom ?? "PDF, 5 Mo maximum"}</span>
                  </span>
                  <span className={cn("btn shrink-0 px-3 py-2", nom ? "btn-outline" : "btn-primary")}>
                    <Upload className="size-4" aria-hidden /> {nom ? "Remplacer" : "Ajouter"}
                  </span>
                </label>
                <input
                  id={`pdoc-${d.type}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required={d.obligatoire && !nom}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDocuments([...documents.filter((x) => x.type !== d.type), { type: d.type, nom: f.name }]);
                  }}
                />
              </div>
            );
          })}
        </section>

        <section className="space-y-3 rounded-2xl bg-surface p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
            <ShieldCheck className="size-5" aria-hidden /> Charte déontologique
          </h2>
          {ENGAGEMENTS.map((t) => (
            <label key={t} className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" required className="mt-1 accent-primary" /> {t}
            </label>
          ))}
        </section>

        {erreur && <p className="text-sm font-medium text-ink">{erreur}</p>}
        <button type="submit" className="btn btn-success w-full py-3 text-base">
          <Handshake className="size-5" aria-hidden /> Envoyer ma candidature
        </button>
      </form>
    </div>
  );
}
