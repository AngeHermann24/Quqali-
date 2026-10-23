"use client";

import Link from "next/link";
import { Download, Handshake, PartyPopper, TrendingDown, TrendingUp } from "lucide-react";
import { CRITERES } from "@/lib/data";
import { CLES, type Dossier, ajouterJours, delaiReaudit } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { BLEU, BLANC, ENCRE, GRIS, SURFACE, VERT, assemblerPdf, couleur, creerCanvas, dateFr, largeur } from "@/lib/pdf";
import { SITE } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { ScoreBars, ScoreRing } from "@/components/scores";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { CertifiedBadge } from "@/components/ui";

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
  texte(62, y + 24, admis ? "Décision : admis au label Quqliter. Choisissez votre pack pour publier votre fiche." : `Décision : sous le seuil de ${SITE.seuil} %.`, { taille: 9 });
  texte(62, y + 10, admis ? "Le paiement de l'abonnement n'influence jamais la note obtenue." : `Réaudit possible à partir du ${dateFr(ajouterJours(a.date, delaiReaudit(a.global)))}.`, { taille: 8.5, c: GRIS });

  rect(50, 70, 495, 1.5, VERT);
  texte(50, 54, `Seuil d'admission : ${SITE.seuil} % — audit réalisé sur place par un agent évaluateur indépendant.`, { taille: 8.5, c: GRIS });
  texte(50, 40, "Document de démonstration.", { taille: 7.5, c: GRIS });
  return assemblerPdf(ops.join("\n"));
}

export function ResultatPro() {
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  if (dossier === undefined) return <Chargement />;

  if (!dossier?.audit)
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Aucun résultat pour le moment</h1>
          <p className="mt-2 text-sm text-muted">Le résultat apparaît ici une fois l&apos;audit réalisé sur place.</p>
          <Link href="/pro/parcours" className="btn btn-primary mt-5">
            Voir mon parcours
          </Link>
        </div>
      </div>
    );

  const a = dossier.audit;
  const admis = dossier.statut === "admis";
  const forts = CRITERES.filter((c) => a.scores[c.key] >= SITE.seuil);
  const aCorriger = CRITERES.filter((c) => a.scores[c.key] < SITE.seuil).sort((x, y) => a.scores[x.key] - a.scores[y.key]);

  return (
    <>
      <EspaceHeader
        role="Résultat de l'audit"
        titre={`${formatScore(a.global)} % — ${admis ? "admis" : "sous le seuil"}`}
        sousTitre={`Audit du ${formatDate(a.date)} · ${dossier.nom}`}
        actions={admis ? <CertifiedBadge size="lg" /> : <Pastille ton="alerte">Seuil requis : {SITE.seuil} %</Pastille>}
      />

      <div className="container-page max-w-2xl space-y-5 py-6">
        {admis && (
          <div className="card border-success/30 bg-success-soft/60 p-5 text-center [animation:pop_.45s_ease_both]">
            <PartyPopper className="mx-auto size-10 text-success" aria-hidden />
            <p className="mt-1 font-display text-xl font-bold text-ink">Félicitations !</p>
            <p className="text-sm text-muted">Votre établissement dépasse le seuil de {SITE.seuil} %. Choisissez votre pack pour publier votre fiche.</p>
          </div>
        )}

        <Bloc titre="Votre note">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={a.global} size={140} />
              <p className="text-xs text-muted">Audit du {formatDate(a.date)}</p>
            </div>
            <ScoreBars scores={a.scores} />
          </div>
        </Bloc>

        <div className="grid gap-4 sm:grid-cols-2">
          <Bloc titre="Points forts" icone={<TrendingUp className="size-5 text-success" aria-hidden />}>
            <ul className="space-y-2 text-sm">
              {forts.map((c) => (
                <li key={c.key} className="flex justify-between gap-2">
                  <span className="text-ink">{c.label}</span>
                  <span className="font-bold text-success-dark">{formatScore(a.scores[c.key])} %</span>
                </li>
              ))}
              {forts.length === 0 && <li className="text-muted">—</li>}
            </ul>
          </Bloc>
          <Bloc titre="À corriger" icone={<TrendingDown className="size-5 text-amber-600" aria-hidden />}>
            <ul className="space-y-2 text-sm">
              {aCorriger.map((c) => (
                <li key={c.key} className="flex justify-between gap-2">
                  <span className="text-ink">{c.label}</span>
                  <span className="font-bold text-amber-700">
                    {formatScore(a.scores[c.key])} % → {SITE.seuil} %
                  </span>
                </li>
              ))}
              {aCorriger.length === 0 && <li className="text-muted">Tous les critères sont au-dessus du seuil.</li>}
            </ul>
          </Bloc>
        </div>

        <button type="button" className="btn btn-outline w-full" onClick={() => telecharger(rapportPdf(dossier), `quqliter-rapport-audit-${dossier.id}.pdf`)}>
          <Download className="size-4" aria-hidden /> Télécharger le rapport PDF
        </button>

        {admis && !dossier.abonnement && (
          <Link href="/pro/abonnement" className="btn btn-success w-full">
            Choisir mon pack et publier ma fiche
          </Link>
        )}
        {!admis && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface p-4 text-sm text-muted">
              Ce n&apos;est pas un échec : la plupart des établissements accompagnés dépassent le seuil au réaudit. Réaudit possible à partir du{" "}
              <strong className="text-ink">{formatDate(ajouterJours(a.date, delaiReaudit(a.global)))}</strong>.
            </div>
            <Link href="/pro/accompagnement" className="btn btn-primary w-full">
              <Handshake className="size-4" aria-hidden /> Demander un accompagnement
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
