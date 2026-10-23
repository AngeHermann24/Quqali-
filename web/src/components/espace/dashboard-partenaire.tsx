"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Ban, BriefcaseBusiness, ClipboardCheck, FileCheck2, Handshake, Inbox, Scale, TrendingUp, UserRound } from "lucide-react";
import { CRITERES, SECTEURS, scoreGlobal } from "@/lib/data";
import {
  AUDITS_PROPOSES,
  type DossierPartenaire,
  ETAPES_PARTENAIRE,
  MISSIONS,
  type Mission,
  STATUTS_MISSION,
  type StatutPartenaire,
  genererPlan,
  maintenant,
} from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { peutAuditer } from "@/lib/regles";
import { SITE } from "@/lib/site";
import { Modal } from "@/components/modal";
import { usePartenaire } from "@/components/espace/use-partenaire";
import { Bloc, Chargement, EspaceHeader, type EtatEtape, Etapes, PanneauDemo, Pastille, Progression } from "@/components/espace/ui";

const EXEMPLE: Omit<DossierPartenaire, "historique"> = {
  id: "moi",
  nom: "Koffi Mensah",
  telephone: "+225 07 00 00 00 22",
  email: "k.mensah@example.com",
  secteurs: ["hotellerie", "restauration", "sante"],
  zones: ["Cocody", "Koumassi", "Marcory"],
  experience: 12,
  certifications: "ISO 9001 Lead Auditor, HACCP",
  references: "Accompagnement qualité de 15 hôtels et restaurants à Abidjan.",
  agentHabilite: true,
  documents: [{ type: "cv", nom: "cv-koffi-mensah.pdf" }],
  statut: "soumis",
};

export function DashboardPartenaire() {
  const { partenaire, setPartenaire, etats, liens, majMission, reinitialiser, pret } = usePartenaire();
  const [aAccepter, setAAccepter] = useState<Mission | null>(null);

  if (!pret) return <Chargement />;
  if (!partenaire)
    return (
      <>
        <EspaceHeader role="Espace accompagnateur partenaire" titre="Bienvenue" sousTitre="Aidez les établissements à atteindre le niveau du label." />
        <div className="container-page grid max-w-4xl gap-4 py-10 sm:grid-cols-2">
          <div className="card flex flex-col p-6">
            <Handshake className="size-8 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-lg font-semibold text-ink">Devenir accompagnateur</h2>
            <p className="mt-1 flex-1 text-sm text-muted">Expertise, zones d&apos;intervention, documents et charte déontologique.</p>
            <Link href="/partenaire/inscription" className="btn btn-primary mt-5">
              Postuler
            </Link>
          </div>
          <div className="card flex flex-col p-6">
            <BriefcaseBusiness className="size-8 text-success" aria-hidden />
            <h2 className="mt-3 font-display text-lg font-semibold text-ink">Découvrir avec un exemple</h2>
            <p className="mt-1 flex-1 text-sm text-muted">Chargez un profil fictif, simulez sa validation et gérez des missions.</p>
            <button type="button" className="btn btn-outline mt-5" onClick={() => setPartenaire({ ...EXEMPLE, historique: [{ statut: "soumis", date: maintenant() }] })}>
              Charger l&apos;exemple
            </button>
          </div>
        </div>
      </>
    );

  const changerStatut = (statut: StatutPartenaire) => setPartenaire({ ...partenaire, statut, historique: [...partenaire.historique, { statut, date: maintenant() }] });
  const valide = partenaire.statut === "valide";
  const rang = ETAPES_PARTENAIRE.findIndex((e) => e.statut === partenaire.statut);
  const etapesValidation = ETAPES_PARTENAIRE.map((e, i) => ({
    label: e.label,
    description: e.description,
    date: partenaire.historique.find((h) => h.statut === e.statut)?.date,
    etat: (partenaire.statut === "refuse" ? (i === 0 ? "fait" : i === 1 ? "echec" : "a_venir") : i < rang || (valide && i === rang) ? "fait" : i === rang ? "actuel" : "a_venir") as EtatEtape,
  })).map((e) => ({ ...e, date: e.date ? formatDate(e.date) : undefined }));

  const proposees = MISSIONS.filter((m) => etats[m.id].statut === "proposee" && partenaire.secteurs.includes(m.secteur));
  const actives = MISSIONS.filter((m) => ["en_cours", "pret", "terminee"].includes(etats[m.id].statut));
  const terminees = actives.filter((m) => etats[m.id].statut === "terminee");
  const reussites = terminees.filter((m) => (etats[m.id].resultatReaudit ?? 0) >= SITE.seuil).length;

  return (
    <>
      <EspaceHeader
        role="Espace accompagnateur partenaire"
        titre={partenaire.nom}
        sousTitre={`${partenaire.secteurs.map((s) => SECTEURS[s].nom).join(" · ")} — ${partenaire.zones.join(", ")}`}
        actions={<span className="chip bg-white/15 text-sm text-white">{valide ? "Profil validé" : partenaire.statut === "refuse" ? "Candidature refusée" : "En cours de validation"}</span>}
      />

      <div className="container-page grid gap-5 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {valide && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Missions proposées", valeur: proposees.length, Icon: Inbox },
                { label: "En cours", valeur: actives.length - terminees.length, Icon: BriefcaseBusiness },
                { label: "Établissements accompagnés", valeur: liens.length, Icon: Handshake },
                { label: "Réussite au réaudit", valeur: terminees.length ? `${Math.round((reussites / terminees.length) * 100)} %` : "—", Icon: TrendingUp },
              ].map(({ label, valeur, Icon }) => (
                <div key={label} className="card p-4">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{valeur}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          )}

          {!valide && (
            <Bloc titre="Validation de votre profil" icone={<ClipboardCheck className="size-5" aria-hidden />}>
              <Etapes etapes={etapesValidation} />
              <p className="mt-4 text-sm text-muted">
                {partenaire.statut === "refuse"
                  ? "Votre candidature n'a pas été retenue. Vous pouvez postuler à nouveau dans 6 mois."
                  : "Les missions vous seront proposées dès la validation de votre profil."}
              </p>
              <div className="mt-5">
                <PanneauDemo>
                  {partenaire.statut === "soumis" && (
                    <button type="button" className="btn btn-primary" onClick={() => changerStatut("entretien")}>
                      Dossier conforme : planifier l&apos;entretien
                    </button>
                  )}
                  {partenaire.statut === "entretien" && (
                    <>
                      <button type="button" className="btn btn-success" onClick={() => changerStatut("valide")}>
                        Valider le profil
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => changerStatut("refuse")}>
                        Refuser
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-outline" onClick={reinitialiser}>
                    Réinitialiser la démo
                  </button>
                </PanneauDemo>
              </div>
            </Bloc>
          )}

          {valide && (
            <>
              <Bloc titre="Missions proposées" icone={<Inbox className="size-5" aria-hidden />}>
                {proposees.length ? (
                  <ul className="space-y-3">
                    {proposees.map((m) => (
                      <li key={m.id} className="rounded-xl border border-line p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{m.etablissement}</p>
                            <p className="text-sm text-muted">
                              {SECTEURS[m.secteur].nom} · {m.commune} · demande du {formatDate(m.demandeLe)}
                            </p>
                          </div>
                          <Pastille ton="alerte">Diagnostic {formatScore(scoreGlobal(m.diagnostic))} %</Pastille>
                        </div>
                        <p className="mt-2 text-sm text-ink">À améliorer : {m.besoins.map((b) => CRITERES.find((c) => c.key === b)?.label).join(", ")}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="btn btn-success px-3 py-2" onClick={() => setAAccepter(m)}>
                            Accepter
                          </button>
                          <button type="button" className="btn btn-outline px-3 py-2" onClick={() => majMission(m.id, { statut: "refusee" })}>
                            Décliner
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Aucune nouvelle mission pour le moment.</p>
                )}
              </Bloc>

              <Bloc titre="Mes missions" icone={<BriefcaseBusiness className="size-5" aria-hidden />}>
                <ul className="space-y-3">
                  {actives.map((m) => {
                    const etat = etats[m.id];
                    const total = genererPlan(m.besoins, m.demandeLe).length;
                    const avancement = (etat.faits.length / total) * 100;
                    return (
                      <li key={m.id}>
                        <Link href={`/partenaire/missions/${m.id}`} className="group block rounded-xl border border-line p-4 transition hover:border-primary hover:shadow-card">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink group-hover:text-primary">{m.etablissement}</p>
                              <p className="text-sm text-muted">
                                {SECTEURS[m.secteur].nom} · {m.commune}
                              </p>
                            </div>
                            <Pastille ton={STATUTS_MISSION[etat.statut].ton}>{STATUTS_MISSION[etat.statut].label}</Pastille>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <Progression valeur={avancement} className="flex-1" />
                            <span className="text-xs font-semibold text-ink">
                              {etat.faits.length}/{total} actions
                            </span>
                          </div>
                          <p className="mt-2 flex items-center justify-between text-xs text-muted">
                            <span>
                              Diagnostic {formatScore(scoreGlobal(m.diagnostic))} %
                              {etat.resultatReaudit !== undefined && ` → réaudit ${formatScore(etat.resultatReaudit)} %`}
                            </span>
                            <ArrowRight className="size-4 text-primary" aria-hidden />
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Bloc>
            </>
          )}
        </div>

        <div className="space-y-5">
          <Bloc titre="Règle d'indépendance" icone={<Scale className="size-5" aria-hidden />}>
            <p className="text-sm text-muted">Vous ne serez jamais assigné à l&apos;audit d&apos;un établissement que vous accompagnez ou avez accompagné. Le système le bloque automatiquement.</p>
            {liens.length > 0 && (
              <ul className="mt-4 space-y-2">
                {liens.map((l) => (
                  <li key={l.etablissementId} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                    <span className="truncate text-ink">{MISSIONS.find((m) => m.etablissementId === l.etablissementId)?.etablissement}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ink">
                      <Ban className="size-3.5" aria-hidden /> Audit interdit
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {valide && partenaire.agentHabilite && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="label">Missions d&apos;audit proposées (agent habilité)</p>
                <ul className="space-y-2">
                  {AUDITS_PROPOSES.filter((a) => partenaire.secteurs.includes(a.secteur)).map((a) => {
                    const verif = peutAuditer("moi", a.etablissementId, liens);
                    return (
                      <li key={a.id} className="rounded-lg border border-line p-3 text-sm">
                        <p className="font-medium text-ink">{a.etablissement}</p>
                        <p className="text-xs text-muted">
                          {a.type} · {formatDate(a.date)}
                        </p>
                        <p className="mt-1.5">
                          {verif.autorise ? (
                            <Pastille ton="succes">Disponible</Pastille>
                          ) : (
                            <span className="flex items-start gap-1.5 text-xs font-medium text-ink">
                              <Ban className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Bloqué : {verif.motif}
                            </span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Bloc>

          <Bloc titre="Mon profil" icone={<UserRound className="size-5" aria-hidden />}>
            <dl className="space-y-2 text-sm">
              {[
                ["Expérience", `${partenaire.experience} ans`],
                ["Certifications", partenaire.certifications || "—"],
                ["Agent évaluateur", partenaire.agentHabilite ? "Oui (double habilitation)" : "Non"],
                ["Contact", `${partenaire.telephone}`],
              ].map(([label, valeur]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{valeur}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
              {partenaire.documents.map((d) => (
                <li key={d.type} className="flex items-center gap-2 text-sm text-ink">
                  <FileCheck2 className="size-4 text-success" aria-hidden /> <span className="truncate">{d.nom}</span>
                </li>
              ))}
            </ul>
            {valide && (
              <button type="button" className="btn btn-outline mt-4 w-full" onClick={reinitialiser}>
                Réinitialiser la démo
              </button>
            )}
          </Bloc>
        </div>
      </div>

      <Modal open={aAccepter !== null} onClose={() => setAAccepter(null)} title={`Accepter · ${aAccepter?.etablissement ?? ""}`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (aAccepter) majMission(aAccepter.id, { statut: "en_cours", accepteeLe: maintenant() });
            setAAccepter(null);
          }}
        >
          <p className="text-sm text-muted">En acceptant, vous devenez l&apos;accompagnateur de cet établissement. Vous ne pourrez plus jamais en réaliser l&apos;audit.</p>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" required className="mt-1 accent-primary" />
            Je déclare n&apos;avoir aucun lien personnel, familial ou financier avec cet établissement.
          </label>
          <button type="submit" className="btn btn-success w-full py-3">
            Confirmer et démarrer la mission
          </button>
        </form>
      </Modal>
    </>
  );
}
