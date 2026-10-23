"use client";

import { useMemo, useState } from "react";
import { Download, FileText, MapPin, QrCode } from "lucide-react";
import { codeVisiteDemo } from "@/lib/avis";
import { genererAfficheGarePdf, genererCarteAvisPdf } from "@/lib/brochure-pdf";
import { ETABLISSEMENTS, SECTEURS } from "@/lib/data";
import { CLES, type Dossier } from "@/lib/espace";
import { genererQr } from "@/lib/qrcode";
import { useStockage } from "@/lib/stockage";
import { Bloc, EspaceHeader } from "@/components/espace/ui";

function telecharger(octets: Uint8Array, nom: string) {
  const url = URL.createObjectURL(new Blob([octets.buffer as ArrayBuffer], { type: "application/pdf" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

function ApercuQr({ url }: { url: string }) {
  const matrice = useMemo(() => {
    try {
      return genererQr(url);
    } catch {
      return null;
    }
  }, [url]);
  if (!matrice) return <p className="text-xs text-muted">QR non générable pour cette URL.</p>;
  return (
    <div className="grid w-fit overflow-hidden rounded-lg border border-line" style={{ gridTemplateColumns: `repeat(${matrice.taille}, 4px)` }} role="img" aria-label={`QR code vers ${url}`}>
      {matrice.modules.flat().map((cell, i) => (
        <span key={i} className={cell ? "bg-ink" : "bg-white"} style={{ width: 4, height: 4 }} />
      ))}
    </div>
  );
}

const URL_ETABLISSEMENTS = "https://qualite.ci/etablissements";

export function BrochuresAdmin() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [lieu, setLieu] = useState("les gares routières d'Abidjan");
  const [slugChoisi, setSlugChoisi] = useState(ETABLISSEMENTS[0].slug);

  const cibles = [
    ...ETABLISSEMENTS.map((e) => ({ id: e.slug, nom: e.nom, secteur: e.secteur, url: `https://qualite.ci/etablissements/${e.slug}` })),
    ...(dossier?.statut === "admis" ? [{ id: dossier.id, nom: dossier.nom, secteur: dossier.secteur, url: "https://qualite.ci/pro" }] : []),
  ];
  const cible = cibles.find((c) => c.id === slugChoisi) ?? cibles[0];
  const urlAvis = `${cible.url}#avis`;
  const code = codeVisiteDemo(cible.id);

  return (
    <>
      <EspaceHeader role="Administration" titre="Brochures PDF" sousTitre="Supports imprimables avec QR code : affiches pour les gares et cartes avis pour les comptoirs." />
      <div className="container-page grid gap-5 py-6 lg:grid-cols-2">
        <Bloc titre="Affiche pour les gares" icone={<MapPin className="size-5" aria-hidden />}>
          <p className="text-sm text-muted">
            Une affiche A4 invitant les voyageurs à choisir un établissement certifié : le QR mène vers la liste publique des établissements.
          </p>
          <label className="mt-3 block text-sm">
            <span className="label">Lieu d&apos;affichage</span>
            <input className="input" value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="les gares routières d'Abidjan" />
          </label>
          <div className="mt-3 flex items-center gap-3">
            <ApercuQr url={URL_ETABLISSEMENTS} />
            <p className="text-xs text-muted">QR → qualite.ci/etablissements</p>
          </div>
          <button type="button" className="btn btn-primary mt-4" onClick={() => telecharger(genererAfficheGarePdf({ lieu: lieu || "les gares" }), "qualite-affiche-gares.pdf")}>
            <Download className="size-4" aria-hidden /> Générer l&apos;affiche A4
          </button>
        </Bloc>

        <Bloc titre="Carte « Laissez un avis »" icone={<FileText className="size-5" aria-hidden />}>
          <p className="text-sm text-muted">
            Un support à poser au comptoir : le client scanne le QR pour ouvrir la fiche, puis saisit le code de visite imprimé — le même code que celui vérifié à la dépose de l&apos;avis.
          </p>
          <label className="mt-3 block text-sm">
            <span className="label">Établissement</span>
            <select className="input" value={slugChoisi} onChange={(e) => setSlugChoisi(e.target.value)}>
              {cibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {SECTEURS[c.secteur].label}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 flex items-center gap-3">
            <ApercuQr url={urlAvis} />
            <p className="text-xs text-muted">
              QR → {urlAvis}
              <br />
              Code de visite : <strong className="font-mono text-ink">{code}</strong>
            </p>
          </div>
          <button type="button" className="btn btn-primary mt-4" onClick={() => telecharger(genererCarteAvisPdf({ nom: cible.nom, url: urlAvis, code }), `qualite-carte-avis-${cible.id}.pdf`)}>
            <Download className="size-4" aria-hidden /> Générer la carte
          </button>
        </Bloc>

        <div className="rounded-2xl bg-surface p-4 text-sm text-muted lg:col-span-2">
          <QrCode className="mr-1 inline size-4 text-primary" aria-hidden />
          Les PDF sont générés dans le navigateur : affiche A4 pour l&apos;affichage dans les gares, carte comptoir pour l&apos;établissement. Le code de visite imprimé correspond au code de démonstration vérifié lors du dépôt d&apos;un avis — en production, un code unique par visite.
        </div>
      </div>
    </>
  );
}
