"use client";

import { useState } from "react";
import { MessageSquareText, Send, TrendingUp } from "lucide-react";
import { CLES, type Dossier, avisDemo } from "@/lib/espace";
import { type AvisClient, type StatutAvis } from "@/lib/avis";
import { CRITERES } from "@/lib/data";
import { aAcces } from "@/lib/pro-service";
import { useStockage } from "@/lib/stockage";
import { useHorloge } from "@/lib/use-config";
import { Chargement } from "@/components/espace/ui";
import { ChipPro, EntetePro, EtatVidePro, LockedFeature, PanneauBas, ProgressBarPro, ReviewCardPro, TabsPro, ToastPro } from "@/components/pro/ui";

type AvisAff = { id: string; auteur: string; date: string; note: number; commentaire: string; statut: StatutAvis; criteres?: Record<string, number> };
type Onglet = "tous" | "positifs" | "neutres" | "negatifs";
const PAGE = 4;

const ilYA = (iso: string, ref: string) => {
  const j = Math.max(0, Math.round((new Date(ref).getTime() - new Date(iso).getTime()) / 86400000));
  return j === 0 ? "Aujourd'hui" : j === 1 ? "Hier" : `Il y a ${j} jours`;
};

export function AvisPro() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous, setAvisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const { aujourdhui } = useHorloge();
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [sansReponseSeulement, setSansReponseSeulement] = useState(false);
  const [periode, setPeriode] = useState<0 | 7 | 30>(0);
  const [affiches, setAffiches] = useState(PAGE);
  const [reponsePour, setReponsePour] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [signalePour, setSignalePour] = useState<string | null>(null);
  const [signales, setSignales] = useState<string[]>([]);
  const [motif, setMotif] = useState("Avis injurieux ou diffamatoire");
  const [toast, setToast] = useState("");

  if (dossier === undefined || avisTous === undefined || !aujourdhui) return <Chargement />;

  if (!dossier)
    return (
      <div className="px-5 py-8">
        <EtatVidePro icone={<MessageSquareText className="size-8" aria-hidden />} titre="Aucun avis pour l'instant" detail="Les avis vérifiés des usagers apparaîtront ici une fois votre fiche publiée." />
      </div>
    );

  const premium = aAcces(dossier, "rapportIa");
  const tous: AvisAff[] = [
    ...(avisTous?.[dossier.id] ?? []),
    ...avisDemo().map((a) => ({ ...a, statut: "publie" as const })),
  ].map((a) => (signales.includes(a.id) ? { ...a, statut: "signale" as const } : a));

  const positifs = tous.filter((a) => a.note >= 4);
  const neutres = tous.filter((a) => a.note === 3);
  const negatifs = tous.filter((a) => a.note <= 2);
  const parOnglet = onglet === "positifs" ? positifs : onglet === "neutres" ? neutres : onglet === "negatifs" ? negatifs : tous;
  const filtres = parOnglet.filter((a) => {
    if (sansReponseSeulement && dossier.reponsesAvis[a.id]) return false;
    if (periode) {
      const j = Math.round((new Date(aujourdhui.slice(0, 10)).getTime() - new Date(a.date).getTime()) / 86400000);
      if (j > periode) return false;
    }
    return true;
  });
  const vus = filtres.slice(0, affiches);
  const moyenne = tous.length ? tous.reduce((s, a) => s + a.note, 0) / tous.length : 0;

  // Thèmes récurrents : moyenne des notes par critère (sur 5).
  const themes = CRITERES.slice(0, 3)
    .map((c) => {
      const notes = tous.map((a) => a.criteres?.[c.key]).filter((n): n is number => n !== undefined);
      return { label: c.label, moyenne: notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : 0 };
    })
    .filter((t) => t.moyenne > 0);

  const publier = () => {
    if (!reponsePour || brouillon.trim().length < 4) return;
    setDossier({ ...dossier, reponsesAvis: { ...dossier.reponsesAvis, [reponsePour]: brouillon.trim().slice(0, 500) } });
    setReponsePour(null);
    setBrouillon("");
    setToast("Réponse envoyée — publiée après relecture.");
  };

  const signaler = () => {
    if (!signalePour) return;
    setAvisTous((p) => ({ ...p, [dossier.id]: (p?.[dossier.id] ?? []).map((x) => (x.id === signalePour ? { ...x, statut: "signale" } : x)) }));
    setSignales((p) => [...p, signalePour]);
    setSignalePour(null);
    setToast("Avis signalé — examiné par l'équipe.");
  };

  return (
    <>
      <EntetePro titre="Avis clients" />
      <div className="px-5 pb-6">
        <p className="text-sm text-muted">
          Moyenne <strong className="text-ink">{moyenne.toFixed(1).replace(".", ",")}/5</strong> · {tous.length} avis vérifiés
        </p>

        <TabsPro
          className="mt-3.5"
          actif={onglet}
          onChange={(o) => { setOnglet(o); setAffiches(PAGE); }}
          onglets={[
            { id: "tous", label: `Tous (${tous.length})` },
            { id: "positifs", label: `Positifs (${positifs.length})` },
            { id: "neutres", label: `Neutres (${neutres.length})` },
            { id: "negatifs", label: `Négatifs (${negatifs.length})` },
          ]}
        />

        {/* Filtres */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ChipPro actif={sansReponseSeulement} onClick={() => setSansReponseSeulement(!sansReponseSeulement)}>Sans réponse</ChipPro>
          <ChipPro actif={periode === 7} onClick={() => setPeriode(periode === 7 ? 0 : 7)}>7 derniers jours</ChipPro>
          <ChipPro actif={periode === 30} onClick={() => setPeriode(periode === 30 ? 0 : 30)}>30 derniers jours</ChipPro>
        </div>

        {/* Liste */}
        <ul className="mt-4 space-y-3.5">
          {vus.map((a) => (
            <li key={a.id}>
              <ReviewCardPro
                nom={a.auteur}
                ilYA={ilYA(a.date, aujourdhui.slice(0, 10))}
                note={a.note}
                texte={a.commentaire}
                verifie={a.statut !== "signale"}
                criteres={
                  a.criteres
                    ? Object.entries(a.criteres).map(([k, v]) => ({ label: CRITERES.find((c) => c.key === k)?.label ?? k, valeur: v }))
                    : undefined
                }
                reponse={dossier.reponsesAvis[a.id]}
                onRepondre={() => { setReponsePour(a.id); setBrouillon(dossier.reponsesAvis[a.id] ?? ""); }}
                onSignaler={a.statut === "publie" ? () => setSignalePour(a.id) : undefined}
              />
              {a.statut === "signale" && <p className="mt-1.5 text-[11px] font-semibold text-or">{"Signalé — en cours d'examen par l'équipe."}</p>}
            </li>
          ))}
          {vus.length === 0 && <li><EtatVidePro icone={<MessageSquareText className="size-8" aria-hidden />} titre="Aucun avis" detail="Aucun avis ne correspond à ces filtres." /></li>}
        </ul>

        {filtres.length > affiches && (
          <button type="button" onClick={() => setAffiches(affiches + PAGE)} className="mt-4 h-11 w-full rounded-2xl border-2 border-bleu font-bold text-bleu transition active:scale-[0.98]">
            Voir tous les avis ({filtres.length - affiches} restants)
          </button>
        )}

        {/* Thèmes récurrents — Premium */}
        <div className="mt-6">
          {premium ? (
            <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
              <p className="flex items-center gap-2 text-sm font-bold text-ink"><TrendingUp className="size-4 text-primary" aria-hidden /> Thèmes récurrents</p>
              <p className="text-xs text-muted">Moyenne des notes détaillées par critère.</p>
              <ul className="mt-3 space-y-3">
                {themes.map((t) => (
                  <li key={t.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{t.label}</span>
                      <span className="font-bold text-primary">{t.moyenne.toFixed(1).replace(".", ",")}/5</span>
                    </div>
                    <ProgressBarPro valeur={(t.moyenne / 5) * 100} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <LockedFeature titre="Thèmes récurrents" detail="Analyse des points forts et points faibles de vos avis — réservée au pack Premium." />
          )}
        </div>
      </div>

      {/* Répondre */}
      <PanneauBas ouvert={!!reponsePour} titre="Répondre publiquement" onFermer={() => setReponsePour(null)}>
        <textarea
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu"
          placeholder="Votre réponse publique…"
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          aria-label="Réponse publique (500 caractères)"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
          <span>Relue par nos équipes avant publication.</span>
          <span>{brouillon.length}/500</span>
        </div>
        <button type="button" onClick={publier} disabled={brouillon.trim().length < 4} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-success font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-muted">
          <Send className="size-4" aria-hidden /> Publier ma réponse
        </button>
      </PanneauBas>

      {/* Signaler */}
      <PanneauBas ouvert={!!signalePour} titre="Signaler cet avis" onFermer={() => setSignalePour(null)}>
        <p className="text-sm text-muted">Le motif est examiné par l&apos;équipe Qualité+ — l&apos;avis reste visible pendant l&apos;examen.</p>
        <div className="mt-3 space-y-2">
          {["Avis injurieux ou diffamatoire", "Faux avis — pas de visite réelle", "Conflit d'intérêts ou concurrent", "Contenu hors sujet"].map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm font-semibold text-ink has-checked:border-bleu has-checked:bg-primary-soft/50">
              <input type="radio" name="motif" checked={motif === m} onChange={() => setMotif(m)} className="accent-bleu" />
              {m}
            </label>
          ))}
        </div>
        <button type="button" onClick={signaler} className="mt-4 h-12 w-full rounded-2xl bg-danger font-bold text-white transition active:scale-[0.98]">
          Envoyer le signalement
        </button>
      </PanneauBas>

      <ToastPro visible={!!toast} message={toast} />
    </>
  );
}
