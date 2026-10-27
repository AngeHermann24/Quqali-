"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Flag, Handshake, PartyPopper } from "lucide-react";
import { CRITERES } from "@/lib/data";
import { CLES, type Dossier, ajouterJours, delaiReaudit } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { BLEU, BLANC, ENCRE, GRIS, SURFACE, VERT, assemblerPdf, couleur, creerCanvas, dateFr, largeur } from "@/lib/pdf";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { CRITERE_ICONS } from "@/components/ui";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, ProgressBarPro, RingScorePro } from "@/components/pro/ui";
import { cn } from "@/lib/site";

function telecharger(octets: Uint8Array, nom: string) {
  const url = URL.createObjectURL(new Blob([octets.buffer as ArrayBuffer], { type: "application/pdf" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

/** Rapport d'audit PDF minimal (même moteur maison que les factures). */
function rapportPdf(d: Dossier) {
  const { ops, rect, texte, trait } = creerCanvas();
  const a = d.audit!;
  const admis = a.global >= SITE.seuil;
  rect(0, 762, 595, 80, BLEU);
  texte(50, 805, "Quali", { taille: 24, gras: true, c: BLANC });
  texte(50 + largeur("Quali", 24, true), 805, "CI", { taille: 24, gras: true, c: couleur(0x7e, 0xe2, 0xa4) });
  texte(545, 805, "RAPPORT D'AUDIT", { taille: 18, gras: true, c: BLANC, droite: true });
  texte(545, 784, dateFr(a.date), { taille: 10, c: BLANC, droite: true });

  texte(50, 725, "ÉTABLISSEMENT", { taille: 8, gras: true, c: GRIS });
  texte(50, 710, d.nom, { gras: true, taille: 13 });
  texte(50, 694, `${d.sousType} · ${d.adresse}, ${d.quartier}, ${d.commune}`, { taille: 9, c: GRIS });
  texte(50, 680, `Responsable : ${d.responsable.nom} — ${d.responsable.fonction}`, { taille: 9, c: GRIS });

  rect(390, 660, 155, 60, admis ? VERT : couleur(0xdc, 0x26, 0x26));
  texte(467, 695, `${formatScore(a.global)} %`, { taille: 22, gras: true, c: BLANC, centre: 1 });
  texte(467, 678, admis ? "ADMIS" : "SOUS LE SEUIL", { taille: 10, gras: true, c: BLANC, centre: 1 });

  texte(50, 620, "DÉTAIL PAR CRITÈRE", { taille: 8, gras: true, c: GRIS });
  trait(50, 612, 545, 612, BLEU, 1.5);
  let y = 590;
  for (const c of CRITERES) {
    texte(50, y, `${c.label} (${c.poids} %)`);
    texte(545, y, `${formatScore(a.scores[c.key])} %`, { droite: true, gras: true, c: a.scores[c.key] >= SITE.seuil ? ENCRE : couleur(0xdc, 0x26, 0x26) });
    rect(50, y - 20, 495 * (a.scores[c.key] / 100), 8, a.scores[c.key] >= SITE.seuil ? VERT : couleur(0xdc, 0x26, 0x26));
    rect(50, y - 20, 495, 8, "0.9 0.9 0.92");
    y -= 46;
  }

  rect(50, y - 10, 495, 60, SURFACE);
  texte(62, y + 24, admis ? "Décision : admis au label Qualité+. Choisissez votre pack pour publier votre fiche." : `Décision : sous le seuil de ${SITE.seuil} %.`, { taille: 9 });
  texte(62, y + 10, admis ? "Le paiement de l'abonnement n'influence jamais la note obtenue." : `Réaudit possible à partir du ${dateFr(ajouterJours(a.date, delaiReaudit(a.global)))}.`, { taille: 8.5, c: GRIS });

  rect(50, 70, 495, 1.5, VERT);
  texte(50, 54, `Seuil d'admission : ${SITE.seuil} % — audit réalisé sur place par un agent évaluateur indépendant.`, { taille: 8.5, c: GRIS });
  texte(50, 40, "Document de démonstration.", { taille: 7.5, c: GRIS });
  return assemblerPdf(ops.join("\n"));
}

const mention = (g: number) => (g >= 90 ? { label: "Excellent", couleur: "#16A34A" } : g >= SITE.seuil ? { label: "Très bon", couleur: "#16A34A" } : { label: "À améliorer", couleur: "#F59E0B" });
const sur20 = (pct: number) => Math.round((pct / 5) * 10) / 10;

/** Écran 5 — Résultat de l'audit : anneau animé, détail /20, points forts et à corriger. */
export function ResultatPro() {
  const router = useRouter();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  if (!dossier?.audit)
    return (
      <div className="bg-surface px-5">
        <EntetePro titre="Résultat de l'audit" onRetour={() => router.back()} />
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-xl font-bold text-ink">Aucun résultat pour le moment</h1>
          <p className="mt-2 text-sm text-muted">Le résultat apparaît ici une fois l&apos;audit réalisé sur place.</p>
          <Link href="/pro/parcours" className="btn btn-success mt-5 w-full">
            Voir mon parcours
          </Link>
        </div>
      </div>
    );

  const a = dossier.audit;
  const admis = dossier.statut === "admis";
  const m = mention(a.global);
  const forts = CRITERES.filter((c) => a.scores[c.key] >= SITE.seuil);
  const aCorriger = CRITERES.filter((c) => a.scores[c.key] < SITE.seuil).sort((x, y) => a.scores[x.key] - a.scores[y.key]);

  return (
    <div className="bg-surface">
      {admis && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {Array.from({ length: 26 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-[-4%] block size-2.5 rounded-sm [animation:confetti-chute_2.8s_ease-in_forwards]"
              style={{ left: `${(i * 37) % 100}%`, background: i % 3 === 0 ? "#1D4ED8" : i % 3 === 1 ? "#16A34A" : "#7EE2A4", animationDelay: `${(i % 9) * 0.22}s` }}
            />
          ))}
        </div>
      )}
      <EntetePro titre="Résultat de l'audit" onRetour={() => router.back()} />

      <div className="space-y-5 px-5 py-5">
        {admis && (
          <div className="rounded-3xl border border-success/30 bg-success-soft/60 p-5 text-center [animation:pop_.45s_ease_both]">
            <PartyPopper className="mx-auto size-9 text-success" aria-hidden />
            <p className="mt-1.5 font-display text-lg font-bold text-ink">Félicitations&nbsp;!</p>
            <p className="text-sm text-muted">Votre établissement dépasse le seuil de {SITE.seuil} %.</p>
          </div>
        )}

        {/* Anneau de score */}
        <section className="flex flex-col items-center rounded-3xl border border-line bg-white p-6 shadow-card">
          <RingScorePro valeur={a.global} taille={150} epaisseur={12} couleur={m.couleur} />
          <p className="mt-3 font-display text-lg font-bold" style={{ color: m.couleur }}>
            {m.label}
          </p>
          <p className="text-xs text-muted">Audit du {formatDate(a.date)}</p>
        </section>

        {/* Détail par critère sur 20 */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold text-ink">Détail par critère</h2>
          <ul className="mt-4 space-y-4">
            {CRITERES.map((c) => {
              const Icon = CRITERE_ICONS[c.key];
              const score = a.scores[c.key];
              const ok = score >= SITE.seuil;
              return (
                <li key={c.key}>
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", ok ? "bg-success-soft text-success" : "bg-or/15 text-[#b45309]")}>
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{c.label}</p>
                      <p className="text-sm font-bold text-ink">{sur20(score)}/20</p>
                    </div>
                  </div>
                  <ProgressBarPro valeur={score} couleur={ok ? "bg-success" : "bg-or"} className="mt-1.5 ml-12" />
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-center text-[11px] text-muted">Score global = moyenne des 4 critères (somme sur 80).</p>
        </section>

        {/* Points forts / à corriger */}
        <div className="grid gap-4">
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-success">
              <Check className="size-4" aria-hidden /> Points forts
            </h2>
            <ul className="mt-3 space-y-2">
              {forts.map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-sm text-ink">
                  <Check className="size-4 shrink-0 text-success" strokeWidth={3} aria-hidden /> {c.label}
                  <span className="ml-auto text-xs font-bold text-success">{sur20(a.scores[c.key])}/20</span>
                </li>
              ))}
              {forts.length === 0 && <li className="text-sm text-muted">—</li>}
            </ul>
          </section>
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-[#b45309]">
              <Flag className="size-4" aria-hidden /> Points à corriger
            </h2>
            <ul className="mt-3 space-y-2">
              {aCorriger.map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-sm text-ink">
                  <Flag className="size-4 shrink-0 text-or" aria-hidden /> {c.label}
                  <span className="ml-auto text-xs font-bold text-[#b45309]">
                    {sur20(a.scores[c.key])}/20 → {sur20(SITE.seuil)}/20
                  </span>
                </li>
              ))}
              {aCorriger.length === 0 && <li className="text-sm text-muted">Tous les critères sont au-dessus du seuil.</li>}
            </ul>
          </section>
        </div>

        <button type="button" onClick={() => telecharger(rapportPdf(dossier), `qualite-rapport-audit-${dossier.id}.pdf`)} className="h-13 w-full rounded-2xl bg-bleu font-bold text-white shadow-card transition active:scale-[0.98]">
          <Download className="mr-1.5 inline size-4" aria-hidden /> Télécharger le rapport (PDF)
        </button>

        {admis && !dossier.abonnement && (
          <Link href="/pro/abonnement" className="btn btn-success h-13 w-full text-base">
            Choisir mon abonnement
          </Link>
        )}

        {!admis && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface p-4 text-sm text-muted">
              Ce n&apos;est pas un échec : la plupart des établissements accompagnés dépassent le seuil au réaudit. Réaudit possible à partir du{" "}
              <strong className="text-ink">{formatDate(ajouterJours(a.date, delaiReaudit(a.global)))}</strong>.
            </div>
            <Link href="/pro/accompagnement" className="btn btn-success h-13 w-full text-base">
              <Handshake className="size-4" aria-hidden /> Demander un accompagnement
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
