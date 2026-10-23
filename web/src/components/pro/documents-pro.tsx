"use client";

import Link from "next/link";
import { Camera, FileCheck2, FilePlus2, FileUp } from "lucide-react";
import { CLES, DOCUMENTS_REQUIS, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

export function DocumentsPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <FilePlus2 className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Déposez d&apos;abord votre dossier</h1>
          <p className="mt-2 text-sm text-muted">La liste des pièces requises dépend de votre secteur d&apos;activité.</p>
          <Link href="/pro/inscription" className="btn btn-primary mt-5">
            Commencer mon dossier
          </Link>
        </div>
      </div>
    );

  const requis = DOCUMENTS_REQUIS[dossier.secteur];
  const envoyer = (type: string, nom: string) => {
    if (!nom) return;
    setDossier({ ...dossier, documents: [...dossier.documents.filter((d) => d.type !== type), { type, nom }] });
  };

  return (
    <>
      <EspaceHeader role="Documents" titre="Pièces du dossier" sousTitre={`${dossier.nom} · ${dossier.documents.length} document(s) reçus`} />
      <div className="container-page max-w-2xl space-y-4 py-6">
        <ul className="space-y-3">
          {requis.map((r) => {
            const recu = dossier.documents.find((d) => d.type === r.type);
            return (
              <li key={r.type} className="card flex items-center gap-3 p-4">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${recu ? "bg-success-soft text-success" : "bg-amber-100 text-amber-700"}`}>
                  {recu ? <FileCheck2 className="size-5" aria-hidden /> : <FileUp className="size-5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {r.label} {r.obligatoire && <span className="text-success">*</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{recu ? recu.nom : r.obligatoire ? "Requis" : "Recommandé"}</p>
                </div>
                <label className="btn btn-outline shrink-0 cursor-pointer px-3 py-2 text-xs">
                  <Camera className="size-4" aria-hidden /> {recu ? "Renvoyer" : "Envoyer"}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => envoyer(r.type, e.target.files?.[0]?.name ?? "")}
                  />
                </label>
                <Pastille ton={recu ? "succes" : "primaire"}>{recu ? "Reçu" : "À envoyer"}</Pastille>
              </li>
            );
          })}
        </ul>
        <Bloc>
          <p className="text-sm leading-relaxed text-muted">
            Prenez vos pièces en photo directement avec votre téléphone. Nos équipes les vérifient avant de valider votre dossier — vous serez notifié si
            une pièce doit être renvoyée.
          </p>
        </Bloc>
      </div>
    </>
  );
}
