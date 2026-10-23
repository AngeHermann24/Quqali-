"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  Rotate3d,
  Sparkles,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Gauge,
  Handshake,
  MapPin,
  MessageSquareText,
  Scale,
  UserRound,
} from "lucide-react";
import { MOYENS, etatAbonnement } from "@/lib/abonnement";
import { CRITERES, SECTEURS, type Secteur } from "@/lib/data";
import {
  AVIS_DEMO,
  CLES,
  type Dossier,
  INTERVENANTS,
  STATUTS,
  type StatutDossier,
  ajouterJours,
  auditSimule,
  delaiReaudit,
  maintenant,
  nomIntervenant,
  planifierReaudit,
} from "@/lib/espace";
import { type AvisClient, ROLES_PERSONNEL, STATUTS_AVIS } from "@/lib/avis";
import { formatDate, formatScore } from "@/lib/format";
import { nomPack } from "@/lib/packs";
import { assignerAgent } from "@/lib/regles";
import { SITE, cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { useConfigTarifs, useHorloge } from "@/lib/use-config";
import { ScoreBars, ScoreRing } from "@/components/scores";
import { CertifiedBadge, Stars } from "@/components/ui";
import { Bloc, Chargement, EspaceHeader, Etapes, PanneauDemo, Pastille, Progression } from "@/components/espace/ui";

const EXEMPLE: Omit<Dossier, "historique"> = {
  id: "etab-residence-les-cocotiers",
  nom: "Résidence Les Cocotiers",
  secteur: "hotellerie",
  sousType: "Résidence hôtelière",
  description: "24 appartements meublés avec piscine, ménage quotidien et gardiennage 24 h/24.",
  ville: "Abidjan",
  commune: "Cocody",
  quartier: "Riviera 3",
  adresse: "Rue des Jardins, Riviera 3",
  coords: [5.352, -3.958],
  responsable: { nom: "Konan Yao", fonction: "Gérant", telephone: "+225 07 00 00 00 11", email: "gerant@example.com" },
  documents: [
    { type: "rccm", nom: "rccm-cocotiers.pdf" },
    { type: "licence", nom: "licence-exploitation.pdf" },
  ],
  parcours: "A",
  statut: "soumis",
  reponsesAvis: {},
};

const LIBELLES_ABONNEMENT = { aucun: "Aucun", actif: "Actif", expire_bientot: "Expire bientôt", grace: "Paiement en attente", suspendu: "Suspendu" };

export function DashboardEtablissement() {
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [avisTous, setAvisTous] = useStockage<Record<string, AvisClient[]>>(CLES.avis);
  const { config } = useConfigTarifs();
  const { aujourdhui } = useHorloge();

  if (dossier === undefined || !aujourdhui) return <Chargement />;
  if (!dossier) return <Accueil onExemple={() => setDossier({ ...EXEMPLE, historique: [{ statut: "soumis", date: maintenant() }] })} />;

  const changerStatut = (statut: StatutDossier, partiel: Partial<Dossier> = {}) =>
    setDossier({ ...dossier, ...partiel, statut, historique: [...dossier.historique, { statut, date: maintenant() }] });
  const dateStatut = (s: StatutDossier) => dossier.historique.findLast((h) => h.statut === s)?.date;
  const acc = dossier.accompagnement;

  const lancerAudit = () => {
    const liens = acc ? [{ accompagnateurId: acc.accompagnateurId, etablissementId: dossier.id }] : [];
    const { agent } = assignerAgent({ id: dossier.id, secteur: dossier.secteur, commune: dossier.commune }, INTERVENANTS, liens, dossier.agentAuditId);
    changerStatut("en_audit", { agentAuditId: acc?.agentReauditId ?? agent?.id });
  };

  const admis = dossier.statut === "admis";
  const abonnement = dossier.abonnement;
  const etatAb = etatAbonnement(abonnement, aujourdhui, config);
  const resultat = admis || dossier.statut === "refuse" ? dossier.audit : undefined;
  const etapes = [
    { label: "Dossier soumis", description: STATUTS.soumis.description, date: fmt(dateStatut("soumis")), etat: "fait" as const },
    {
      label: "En audit",
      description: dossier.agentAuditId ? `Agent évaluateur : ${nomIntervenant(dossier.agentAuditId)}` : STATUTS.en_audit.description,
      date: fmt(dateStatut("en_audit")),
      etat: dossier.statut === "soumis" ? ("a_venir" as const) : dossier.statut === "en_audit" ? ("actuel" as const) : ("fait" as const),
    },
    {
      label: resultat ? `${admis ? "Admis" : "Refusé"} · ${formatScore(resultat.global)} %` : "Résultat de l'audit",
      description: resultat ? STATUTS[dossier.statut].description : `Seuil d'admission : ${SITE.seuil} %`,
      date: fmt(resultat?.date),
      etat: admis ? ("fait" as const) : dossier.statut === "refuse" ? ("echec" as const) : ("a_venir" as const),
    },
    {
      label: "Publication",
      description: abonnement
        ? etatAb.visible
          ? `Pack ${nomPack(abonnement.pack)}, badge « Qualité certifiée » visible.`
          : "Fiche masquée pour impayé. Votre note est conservée."
        : "Choix du pack et paiement après l'admission.",
      etat: abonnement && etatAb.visible ? ("fait" as const) : admis ? ("actuel" as const) : ("a_venir" as const),
    },
  ];

  return (
    <>
      <EspaceHeader
        role="Espace établissement"
        titre={dossier.nom}
        sousTitre={`${dossier.sousType} · ${dossier.quartier}, ${dossier.commune}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {admis && etatAb.visible ? <CertifiedBadge size="lg" /> : <span className="chip bg-white/15 text-sm text-white">Statut : {admis && abonnement ? "Fiche masquée (impayé)" : STATUTS[dossier.statut].label}</span>}
          </div>
        }
      />

      <div className="container-page grid gap-5 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Bloc titre="Suivi du dossier" icone={<ClipboardList className="size-5" aria-hidden />}>
            <Etapes etapes={etapes} />
            <div className="mt-5">
              <PanneauDemo>
                {dossier.statut === "soumis" && (
                  <button type="button" className="btn btn-primary" onClick={lancerAudit}>
                    Valider le dossier et assigner un agent
                  </button>
                )}
                {dossier.statut === "en_audit" && (
                  <>
                    <button type="button" className="btn btn-success" onClick={() => changerStatut("admis", { audit: auditSimule("admis") })}>
                      Résultat : admis
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => changerStatut("refuse", { audit: auditSimule("refuse") })}>
                      Résultat : refusé
                    </button>
                  </>
                )}
                {dossier.statut === "refuse" && acc?.pretLe && (
                  <button type="button" className="btn btn-primary" onClick={lancerAudit}>
                    Lancer le réaudit ({nomIntervenant(acc.agentReauditId)})
                  </button>
                )}
                <button type="button" className="btn btn-outline" onClick={() => setDossier(null)}>
                  Réinitialiser la démo
                </button>
              </PanneauDemo>
            </div>
          </Bloc>

          {resultat && (
            <Bloc titre="Ma note" icone={<Gauge className="size-5" aria-hidden />} action={<Pastille ton={admis ? "succes" : "alerte"}>{admis ? "Admis" : "Sous le seuil"}</Pastille>}>
              <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing value={resultat.global} size={124} />
                  <p className="text-xs text-muted">Audit du {formatDate(resultat.date)}</p>
                </div>
                <ScoreBars scores={resultat.scores} />
              </div>
              {!admis && (
                <div className="mt-5 space-y-3 rounded-xl bg-surface p-4 text-sm">
                  <p className="font-semibold text-ink">Axes prioritaires</p>
                  <ul className="space-y-1 text-muted">
                    {CRITERES.filter((c) => resultat.scores[c.key] < SITE.seuil)
                      .sort((a, b) => resultat.scores[a.key] - resultat.scores[b.key])
                      .map((c) => (
                        <li key={c.key}>
                          • {c.label} : {formatScore(resultat.scores[c.key])} % (objectif {SITE.seuil} %)
                        </li>
                      ))}
                  </ul>
                  <p className="text-ink">
                    Réaudit possible à partir du <strong>{formatDate(ajouterJours(resultat.date, delaiReaudit(resultat.global)))}</strong>.
                  </p>
                  {!acc && (
                    <Link href="/pro/accompagnement" className="btn btn-primary">
                      <Handshake className="size-4" aria-hidden /> Demander un accompagnement
                    </Link>
                  )}
                </div>
              )}
            </Bloc>
          )}

          {acc ? (
            <SuiviAccompagnement dossier={dossier} setDossier={setDossier} />
          ) : (
            !admis && (
              <Bloc id="accompagnement" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <Handshake className="size-6 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-semibold text-ink">Besoin d&apos;aide pour atteindre {SITE.seuil} % ?</p>
                    <p className="text-sm text-muted">Faites-vous accompagner par nos équipes ou par un partenaire certifié.</p>
                  </div>
                </div>
                <Link href="/pro/accompagnement" className="btn btn-outline shrink-0">
                  Demander un accompagnement
                </Link>
              </Bloc>
            )
          )}

          {admis && (
            <Bloc
              titre="Avis reçus"
              icone={<MessageSquareText className="size-5" aria-hidden />}
              action={<span className="text-sm text-muted">{AVIS_DEMO.length + (avisTous?.[dossier.id] ?? []).filter((a) => a.statut === "publie").length} avis vérifiés</span>}
            >
              <ul className="space-y-4">
                {(avisTous?.[dossier.id] ?? []).map((a) => (
                  <AvisItem
                    key={a.id}
                    avis={a}
                    statut={a.statut}
                    personnel={a.personnel}
                    secteur={dossier.secteur}
                    reponse={dossier.reponsesAvis[a.id]}
                    onRepondre={(texte) => setDossier({ ...dossier, reponsesAvis: { ...dossier.reponsesAvis, [a.id]: texte } })}
                    onSignaler={
                      a.statut === "publie"
                        ? () =>
                            setAvisTous((prec) => ({
                              ...prec,
                              [dossier.id]: (prec?.[dossier.id] ?? []).map((x) => (x.id === a.id ? { ...x, statut: "signale" } : x)),
                            }))
                        : undefined
                    }
                  />
                ))}
                {AVIS_DEMO.map((a) => (
                  <AvisItem
                    key={a.id}
                    avis={a}
                    reponse={dossier.reponsesAvis[a.id]}
                    onRepondre={(texte) => setDossier({ ...dossier, reponsesAvis: { ...dossier.reponsesAvis, [a.id]: texte } })}
                  />
                ))}
              </ul>
            </Bloc>
          )}
        </div>

        <div className="space-y-5">
          <Bloc titre="Abonnement" icone={<CreditCard className="size-5" aria-hidden />}>
            {abonnement ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-primary">{nomPack(abonnement.pack)}</span>
                  <Pastille ton={etatAb.statut === "actif" ? "succes" : etatAb.statut === "expire_bientot" ? "primaire" : "alerte"}>{LIBELLES_ABONNEMENT[etatAb.statut]}</Pastille>
                </div>
                <dl className="space-y-1.5 text-muted">
                  <Ligne label="Échéance" valeur={formatDate(abonnement.fin)} />
                  <Ligne label="Paiement" valeur={MOYENS[abonnement.moyen].label} />
                  <Ligne label="Renouvellement" valeur={abonnement.renouvellementAuto ? "Automatique" : "Manuel"} />
                  <Ligne label="Fiche publique" valeur={etatAb.visible ? "Publiée" : "Masquée"} />
                </dl>
                <Link href="/pro/abonnement" className="btn btn-outline w-full">
                  Gérer mon abonnement
                </Link>
              </div>
            ) : admis ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Félicitations ! Choisissez votre pack pour publier votre fiche.</p>
                <Link href="/pro/abonnement" className="btn btn-success w-full">
                  Choisir mon pack
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Disponible après l&apos;admission ({SITE.seuil} % minimum). Le pack se choisit après l&apos;audit : le paiement n&apos;influence jamais la note.
              </p>
            )}
          </Bloc>

          {admis && (
            <Bloc titre="Fonctions Premium" icone={<Sparkles className="size-5" aria-hidden />}>
              <ul className="space-y-2">
                {[
                  { href: "/pro/premium", label: "Visite virtuelle 3D", Icone: Rotate3d },
                  { href: "/pro/reservations", label: "Réservations en ligne", Icone: CalendarCheck },
                  { href: "/pro/rapports", label: "Rapport mensuel IA", Icone: Sparkles },
                ].map(({ href, label, Icone }) => (
                  <li key={href}>
                    <Link href={href} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm font-medium text-ink transition hover:border-primary hover:text-primary">
                      <Icone className="size-4 text-primary" aria-hidden /> {label}
                    </Link>
                  </li>
                ))}
              </ul>
              {abonnement?.pack !== "premium" && <p className="mt-3 text-xs text-muted">Inclus dans le pack Premium. Découvrez-les avec un établissement de démonstration.</p>}
            </Bloc>
          )}

          <Bloc titre="Profil" icone={<Building2 className="size-5" aria-hidden />}>
            <dl className="space-y-2.5 text-sm">
              <Ligne label="Secteur" valeur={SECTEURS[dossier.secteur].nom} />
              <Ligne label="Type" valeur={dossier.sousType} />
              <Ligne label="Parcours" valeur={dossier.parcours === "A" ? "A · Audit direct" : "B · Accompagnement"} />
            </dl>
            <p className="mt-4 flex gap-2 text-sm text-ink">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                {dossier.adresse}, {dossier.quartier}, {dossier.commune} ({dossier.ville})
                {dossier.coords && <span className="block text-xs text-muted">GPS : {dossier.coords.join(", ")}</span>}
              </span>
            </p>
            <p className="mt-3 flex gap-2 text-sm text-ink">
              <UserRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                {dossier.responsable.nom} · {dossier.responsable.fonction}
                <span className="block text-xs text-muted">
                  {dossier.responsable.telephone} · {dossier.responsable.email}
                </span>
              </span>
            </p>
            <div className="mt-4 border-t border-line pt-4">
              <p className="label">Documents</p>
              <ul className="space-y-1.5">
                {dossier.documents.map((d) => (
                  <li key={d.type} className="flex items-center gap-2 text-sm text-ink">
                    <FileCheck2 className="size-4 shrink-0 text-success" aria-hidden />
                    <span className="truncate">{d.nom}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-xs text-muted">Après l&apos;admission, toute modification est soumise à validation.</p>
          </Bloc>
        </div>
      </div>

    </>
  );
}

function SuiviAccompagnement({ dossier, setDossier }: { dossier: Dossier; setDossier: (d: Dossier) => void }) {
  const acc = dossier.accompagnement!;
  const faits = acc.plan.filter((a) => a.fait).length;
  const toutFait = faits === acc.plan.length;
  const reaudit = planifierReaudit(dossier, acc.accompagnateurId);

  const basculer = (id: string) =>
    setDossier({ ...dossier, accompagnement: { ...acc, plan: acc.plan.map((a) => (a.id === id ? { ...a, fait: !a.fait } : a)) } });

  const declarerPret = () => {
    const pretLe = maintenant();
    const minimum = dossier.audit ? ajouterJours(dossier.audit.date, delaiReaudit(dossier.audit.global)) : pretLe;
    const dateReaudit = [ajouterJours(pretLe, 7), minimum].sort().at(-1);
    setDossier({ ...dossier, accompagnement: { ...acc, pretLe, dateReaudit, agentReauditId: reaudit.agent?.id } });
  };

  const etapes = [
    { label: "Demande envoyée", date: fmt(acc.dateDemande), etat: "fait" as const },
    { label: "Accompagnateur assigné", description: nomIntervenant(acc.accompagnateurId), etat: "fait" as const },
    { label: "Diagnostic et plan d'actions", description: `${acc.plan.length} actions sur ${acc.besoins.length} critère(s)`, etat: "fait" as const },
    { label: "Mise en œuvre", description: `${faits}/${acc.plan.length} actions réalisées`, etat: toutFait ? ("fait" as const) : ("actuel" as const) },
    { label: "Prêt pour le réaudit", date: fmt(acc.pretLe), etat: acc.pretLe ? ("fait" as const) : toutFait ? ("actuel" as const) : ("a_venir" as const) },
    {
      label: "Réaudit",
      description: acc.agentReauditId ? `Agent : ${nomIntervenant(acc.agentReauditId)}` : undefined,
      date: acc.dateReaudit ? `Prévu le ${formatDate(acc.dateReaudit)}` : undefined,
      etat: dossier.statut === "admis" && acc.pretLe ? ("fait" as const) : acc.pretLe ? ("actuel" as const) : ("a_venir" as const),
    },
  ];

  return (
    <Bloc id="accompagnement" titre="Suivi d'accompagnement" icone={<Handshake className="size-5" aria-hidden />} action={<Pastille ton="primaire">{acc.mode === "nous" ? "Par nos équipes" : "Partenaire"}</Pastille>}>
      <div className="grid gap-6 md:grid-cols-2">
        <Etapes etapes={etapes} />
        <div>
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-ink">Plan d&apos;actions</p>
            <p className="text-muted">{Math.round((faits / acc.plan.length) * 100)} %</p>
          </div>
          <Progression valeur={(faits / acc.plan.length) * 100} className="mt-2" />
          <ul className="mt-4 space-y-2">
            {acc.plan.map((a) => (
              <li key={a.id}>
                <label className={cn("flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition", a.fait ? "border-success/40 bg-success-soft/50" : "border-line")}>
                  <input type="checkbox" checked={a.fait} disabled={!!acc.pretLe} onChange={() => basculer(a.id)} className="mt-0.5 accent-success" />
                  <span className="min-w-0">
                    <span className={cn("block font-medium", a.fait ? "text-muted line-through" : "text-ink")}>{a.action}</span>
                    <span className="block text-xs text-muted">
                      {CRITERES.find((c) => c.key === a.critere)?.label} · avant le {formatDate(a.echeance)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {!acc.pretLe && (
            <button type="button" disabled={!toutFait} onClick={declarerPret} className="btn btn-success mt-4 w-full">
              <CalendarClock className="size-4" aria-hidden /> Confirmer : prêt pour le réaudit
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-3 rounded-xl bg-surface p-4 text-sm">
        <Scale className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="text-ink">
            <strong>Règle d&apos;indépendance appliquée :</strong> {nomIntervenant(acc.accompagnateurId)} vous accompagne et ne pourra jamais auditer votre établissement.
          </p>
          <p className="text-muted">
            Agent prévu pour le réaudit : <strong className="text-ink">{nomIntervenant(acc.agentReauditId ?? reaudit.agent?.id)}</strong>
            {reaudit.exclus.length > 0 && <> · exclu(s) : {reaudit.exclus.map((e) => `${e.intervenant.nom} (${(e.motif ?? "").split(" :")[0].toLowerCase()})`).join(", ")}</>}
          </p>
        </div>
      </div>
    </Bloc>
  );
}

function AvisItem({
  avis,
  reponse,
  onRepondre,
  statut,
  personnel,
  secteur,
  onSignaler,
}: {
  avis: { id: string; auteur: string; date: string; note: number; commentaire: string };
  reponse?: string;
  onRepondre: (texte: string) => void;
  statut?: AvisClient["statut"];
  personnel?: Record<string, number>;
  secteur?: Secteur;
  onSignaler?: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {avis.auteur} <span className="font-normal text-muted">· {formatDate(avis.date)}</span>
        </p>
        <span className="flex items-center gap-2">
          <Stars value={avis.note} />
          {statut && statut !== "publie" && <Pastille ton={statut === "signale" ? "alerte" : "primaire"}>{STATUTS_AVIS[statut]}</Pastille>}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink/90">{avis.commentaire}</p>
      {personnel && secteur && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(personnel).map(([role, n]) => (
            <span key={role} className="chip bg-primary-soft text-primary">
              {ROLES_PERSONNEL[secteur].find((r) => r.id === role)?.label ?? role} {formatScore(n)}/5
            </span>
          ))}
        </div>
      )}
      {statut === "signale" && <p className="mt-2 text-xs text-muted">Signalé à l&apos;équipe Quqliter : masqué en attendant l&apos;examen.</p>}
      {onSignaler && (
        <button type="button" className="mt-2 text-xs font-semibold text-muted hover:text-primary" onClick={onSignaler}>
          Signaler cet avis
        </button>
      )}
      {reponse ? (
        <p className="mt-3 rounded-lg border-l-4 border-primary bg-surface p-3 text-sm text-ink/90">
          <span className="block text-xs font-semibold text-primary">Votre réponse</span>
          {reponse}
        </p>
      ) : ouvert ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onRepondre(String(new FormData(e.currentTarget).get("reponse")));
          }}
        >
          <textarea name="reponse" required rows={2} className="input" placeholder="Remerciez le client, répondez à sa remarque…" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary px-3 py-2">
              Publier
            </button>
            <button type="button" className="btn btn-outline px-3 py-2" onClick={() => setOuvert(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="mt-2 text-sm font-semibold text-primary" onClick={() => setOuvert(true)}>
          Répondre
        </button>
      )}
    </li>
  );
}

function Accueil({ onExemple }: { onExemple: () => void }) {
  return (
    <>
      <EspaceHeader role="Espace établissement" titre="Bienvenue" sousTitre="Faites certifier la qualité de votre établissement." />
      <div className="container-page grid max-w-4xl gap-4 py-10 sm:grid-cols-2">
        <div className="card flex flex-col p-6">
          <ClipboardList className="size-8 text-primary" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-semibold text-ink">Créer mon dossier</h2>
          <p className="mt-1 flex-1 text-sm text-muted">Informations, localisation, documents et choix du parcours. Environ 10 minutes.</p>
          <Link href="/pro/inscription" className="btn btn-primary mt-5">
            Commencer l&apos;inscription
          </Link>
        </div>
        <div className="card flex flex-col p-6">
          <Handshake className="size-8 text-success" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-semibold text-ink">Découvrir avec un exemple</h2>
          <p className="mt-1 flex-1 text-sm text-muted">Chargez un dossier fictif et simulez chaque étape : audit, résultat, pack, accompagnement.</p>
          <button type="button" onClick={onExemple} className="btn btn-outline mt-5">
            Charger l&apos;exemple
          </button>
        </div>
      </div>
    </>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{valeur}</dd>
    </div>
  );
}

const fmt = (iso?: string) => (iso ? formatDate(iso) : undefined);
