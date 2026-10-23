"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, MessageSquareText, Send } from "lucide-react";
import { AVIS_DEMO, CLES, type Dossier } from "@/lib/espace";
import { type AvisClient, ROLES_PERSONNEL } from "@/lib/avis";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Stars } from "@/components/ui";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";

export function AvisPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous, setAvisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const [filtre, setFiltre] = useState(0);
  if (dossier === undefined || avisTous === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <MessageSquareText className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Aucun avis pour l&apos;instant</h1>
          <p className="mt-2 text-sm text-muted">Les avis vérifiés des usagers apparaîtront ici une fois votre fiche publiée.</p>
        </div>
      </div>
    );

  const recus = avisTous?.[dossier.id] ?? [];
  const tous = [
    ...recus.map((a) => ({ id: a.id, auteur: a.auteur, date: a.date, note: a.note, commentaire: a.commentaire, statut: a.statut, personnel: a.personnel })),
    ...AVIS_DEMO.map((a) => ({ ...a, statut: "publie" as const, personnel: undefined })),
  ];
  const vus = filtre ? tous.filter((a) => a.note === filtre) : tous;
  const moyenne = tous.length ? tous.reduce((s, a) => s + a.note, 0) / tous.length : 0;

  return (
    <>
      <EspaceHeader role="Avis" titre="Avis et témoignages" sousTitre={`${tous.length} avis vérifiés · moyenne ${moyenne.toFixed(1)}/5`} />
      <div className="container-page max-w-2xl space-y-5 py-6">
        <div className="flex flex-wrap gap-2">
          {[0, 5, 4, 3, 2, 1].map((n) => (
            <button key={n} type="button" onClick={() => setFiltre(n)} className={cn("chip transition", filtre === n ? "bg-primary text-white" : "bg-white text-ink")}>
              {n === 0 ? "Tous" : `${n} ★`} {n > 0 && `(${tous.filter((a) => a.note === n).length})`}
            </button>
          ))}
        </div>

        <ul className="space-y-4">
          {vus.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{a.auteur}</p>
                <div className="flex items-center gap-2">
                  <Stars value={a.note} />
                  {a.statut === "signale" && <Pastille ton="alerte">Signalé</Pastille>}
                </div>
              </div>
              {a.personnel && (
                <p className="mt-0.5 text-xs text-muted">
                  Personnel noté :{" "}
                  {Object.entries(a.personnel)
                    .map(([role, note]) => `${ROLES_PERSONNEL[dossier.secteur]?.find((r) => r.id === role)?.label ?? role} : ${note}/5`)
                    .join(" · ")}
                </p>
              )}
              <p className="mt-1.5 text-sm text-muted">{a.commentaire}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(a.date)}</p>

              <ReponseAvis
                texte={dossier.reponsesAvis[a.id]}
                onSauver={(texte) => setDossier({ ...dossier, reponsesAvis: { ...dossier.reponsesAvis, [a.id]: texte } })}
              />
              {a.statut === "publie" && a.id.startsWith("avis-") === false && (
                <button
                  type="button"
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-600"
                  onClick={() => setAvisTous((p) => ({ ...p, [dossier.id]: (p?.[dossier.id] ?? []).map((x) => (x.id === a.id ? { ...x, statut: "signale" } : x)) }))}
                >
                  <Flag className="size-3.5" aria-hidden /> Signaler un avis abusif
                </button>
              )}
            </li>
          ))}
          {vus.length === 0 && <li className="card p-6 text-center text-sm text-muted">Aucun avis avec cette note.</li>}
        </ul>

        <Bloc>
          <p className="text-sm text-muted">
            Les réponses sont publiques et visibles sur votre fiche. Un avis signalé passe par la modération de nos équipes.{" "}
            <Link href="/pro/aide" className="font-semibold text-primary">En savoir plus</Link>
          </p>
        </Bloc>
      </div>
    </>
  );
}

function ReponseAvis({ texte, onSauver }: { texte?: string; onSauver: (t: string) => void }) {
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState("");

  if (texte && !edition)
    return (
      <div className="mt-3 rounded-xl bg-surface p-3">
        <p className="text-xs font-semibold text-primary">Votre réponse</p>
        <p className="mt-1 text-sm text-ink">{texte}</p>
        <button type="button" className="mt-1.5 text-xs font-semibold text-muted" onClick={() => { setBrouillon(texte); setEdition(true); }}>
          Modifier
        </button>
      </div>
    );

  if (!edition)
    return (
      <button type="button" className="mt-2.5 text-xs font-semibold text-primary" onClick={() => setEdition(true)}>
        Répondre publiquement
      </button>
    );

  return (
    <div className="mt-3 space-y-2">
      <textarea className="input" rows={2} placeholder="Votre réponse publique…" value={brouillon} onChange={(e) => setBrouillon(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary px-4 py-2 text-xs" disabled={brouillon.trim().length < 4} onClick={() => { onSauver(brouillon.trim()); setEdition(false); }}>
          <Send className="size-3.5" aria-hidden /> Publier
        </button>
        <button type="button" className="btn btn-outline px-4 py-2 text-xs" onClick={() => setEdition(false)}>
          Annuler
        </button>
      </div>
    </div>
  );
}
