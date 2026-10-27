"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FilePlus2, Info } from "lucide-react";
import { CLES, DOCUMENTS_REQUIS, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, ToastPro, UploadItem } from "@/components/pro/ui";

/** Onglet Documents — liste des pièces, statuts, remplacement. */
export function DocumentsPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [toast, setToast] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const typeActif = useRef<string>("");

  if (dossier === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="bg-surface px-5">
        <EntetePro titre="Documents" />
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <FilePlus2 className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Déposez d&apos;abord votre dossier</h1>
          <p className="mt-2 text-sm text-muted">La liste des pièces requises dépend de votre type d&apos;établissement.</p>
          <Link href="/pro/inscription" className="btn btn-success mt-5 w-full">
            Commencer mon dossier
          </Link>
        </div>
      </div>
    );

  const requis = DOCUMENTS_REQUIS[dossier.secteur];

  const remplacer = (type: string, fichiers: FileList | null) => {
    const nom = fichiers?.[0]?.name;
    if (!nom) return;
    setDossier({ ...dossier, documents: [...dossier.documents.filter((d) => d.type !== type), { type, nom }] });
    navigator.vibrate?.(8);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const envoyes = dossier.documents.length;

  return (
    <div className="bg-surface">
      <EntetePro titre="Documents" />
      <p className="px-5 text-center text-xs text-muted">
        {dossier.nom} · {envoyes} document{envoyes > 1 ? "s" : ""} reçu{envoyes > 1 ? "s" : ""}
      </p>

      <input
        ref={input}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => remplacer(typeActif.current, e.target.files)}
      />

      <ul className="space-y-3 px-5 py-5">
        {requis.map((r) => {
          const recu = r.type === "photos" ? dossier.documents.filter((d) => d.type === "photos") : undefined;
          const doc = dossier.documents.find((d) => d.type === r.type);
          const nbPhotos = recu?.length ?? 0;
          return (
            <li key={r.type}>
              <UploadItem
                label={`${r.label}${r.obligatoire ? " *" : ""}`}
                detail={r.type === "photos" ? "JPG, PNG · 10 Mo · min. 5" : "PDF, JPG · 5 Mo"}
                etat={r.type === "photos" ? (nbPhotos ? "envoye" : "a_envoyer") : doc ? "envoye" : "a_envoyer"}
                fichier={r.type === "photos" ? (nbPhotos ? `${nbPhotos} photo(s) reçue(s)` : r.obligatoire ? "Requis" : "Recommandé") : doc?.nom ?? (r.obligatoire ? "Requis" : "Recommandé")}
                onAjouter={() => {
                  typeActif.current = r.type;
                  input.current?.click();
                }}
                onRetirer={() => setDossier({ ...dossier, documents: dossier.documents.filter((d) => d.type !== r.type) })}
              />
            </li>
          );
        })}
      </ul>

      <p className="mx-5 flex items-start gap-2 rounded-2xl bg-primary-soft p-3.5 text-xs leading-relaxed text-primary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Prenez vos pièces en photo directement avec votre téléphone. Nos équipes les vérifient avant de valider votre dossier — vous serez notifié si
        une pièce doit être renvoyée.
      </p>

      <ToastPro message="Document remplacé" visible={toast} />
    </div>
  );
}
