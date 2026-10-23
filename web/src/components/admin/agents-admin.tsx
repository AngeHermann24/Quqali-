"use client";

import { CalendarCheck, Handshake, ShieldCheck, UserCheck } from "lucide-react";
import { candidatsAgent, liensDuDossier } from "@/lib/admin";
import { AUDITS_PROPOSES, CLES, INTERVENANTS, MISSIONS, etatInitial, liensPartenaire, nomIntervenant, partenaireCommeIntervenant } from "@/lib/espace";
import type { DossierPartenaire, EtatMission } from "@/lib/espace";
import { SECTEURS } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useStockage } from "@/lib/stockage";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { useAffectations, useCandidatures } from "@/components/admin/use-admin";

export function AgentsAdmin() {
  const { liste: candidatures, maj, charge: c1 } = useCandidatures();
  const { affectations, affecter, charge: c2 } = useAffectations();
  const [partenaire] = useStockage<DossierPartenaire>(CLES.partenaire);
  const [etats] = useStockage<Record<string, EtatMission>>(CLES.missions);
  if (!c1 || !c2 || partenaire === undefined || etats === undefined) return <Chargement />;

  const intervenants = partenaire?.statut === "valide" ? [...INTERVENANTS, partenaireCommeIntervenant(partenaire)] : INTERVENANTS;
  const etatsMissions = { ...Object.fromEntries(MISSIONS.map((m) => [m.id, etatInitial(m)])), ...etats };
  const liens = [...liensPartenaire(etatsMissions), ...candidatures.flatMap((d) => liensDuDossier(d))];

  // Accompagnements demandés par des candidatures, encore sans accompagnateur
  const accompagnements = candidatures.filter((d) => d.accompagnement && !d.accompagnement.accompagnateurId && d.accompagnement.mode === "partenaire");

  return (
    <>
      <EspaceHeader role="Administration" titre="Agents & affectations" sousTitre="Assignation des audits et accompagnements, dans le respect de l'indépendance." />
      <div className="container-page space-y-5 py-6">
        <Bloc titre={`Audits à affecter (${AUDITS_PROPOSES.length})`} icone={<CalendarCheck className="size-5" aria-hidden />}>
          <ul className="space-y-3">
            {AUDITS_PROPOSES.map((a) => {
              const candidats = candidatsAgent({ id: a.etablissementId, secteur: a.secteur }, intervenants, liens, affectations[a.id]);
              const choisi = affectations[a.id];
              return (
                <li key={a.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        {a.etablissement} <span className="chip bg-surface text-muted">{a.type}</span>
                      </p>
                      <p className="text-sm text-muted">
                        {SECTEURS[a.secteur].label} · prévu le {formatDate(a.date)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="input max-w-64 py-2"
                        value={choisi ?? ""}
                        onChange={(e) => e.target.value && affecter(a.id, e.target.value)}
                        aria-label={`Agent pour ${a.etablissement}`}
                      >
                        <option value="">Choisir un agent…</option>
                        {candidats
                          .filter((c) => c.eligible)
                          .map((c) => (
                            <option key={c.intervenant.id} value={c.intervenant.id}>
                              {c.intervenant.nom}
                            </option>
                          ))}
                      </select>
                      {choisi && <Pastille ton="succes">Affecté à {nomIntervenant(choisi)}</Pastille>}
                    </div>
                  </div>
                  {candidats.some((c) => !c.eligible) && (
                    <ul className="mt-2 space-y-0.5">
                      {candidats
                        .filter((c) => !c.eligible)
                        .map((c) => (
                          <li key={c.intervenant.id} className="text-xs text-muted">
                            <span className="line-through">{c.intervenant.nom}</span> — {c.motif}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">Les agents exclus apparaissent barrés : accompagnateur de l&apos;établissement ou agent du dernier audit.</p>
        </Bloc>

        <Bloc titre={`Accompagnements à affecter (${accompagnements.length})`} icone={<Handshake className="size-5" aria-hidden />}>
          {accompagnements.length ? (
            <ul className="space-y-3">
              {accompagnements.map((d) => {
                const accompagnateurs = intervenants.filter((i) => i.roles.includes("accompagnateur") && i.secteurs.includes(d.secteur));
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                    <div>
                      <p className="font-semibold text-ink">{d.nom}</p>
                      <p className="text-sm text-muted">
                        Besoins : {d.accompagnement!.besoins.join(", ")} · {d.accompagnement!.disponibilites}
                      </p>
                    </div>
                    <select
                      className="input max-w-64 py-2"
                      defaultValue=""
                      onChange={(e) => e.target.value && maj({ ...d, accompagnement: { ...d.accompagnement!, accompagnateurId: e.target.value } })}
                      aria-label={`Accompagnateur pour ${d.nom}`}
                    >
                      <option value="">Choisir un accompagnateur…</option>
                      {accompagnateurs.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucune demande d&apos;accompagnement en attente d&apos;affectation.</p>
          )}
        </Bloc>

        <Bloc titre={`Équipe (${intervenants.length})`} icone={<ShieldCheck className="size-5" aria-hidden />}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {intervenants.map((i) => (
              <li key={i.id} className="rounded-xl border border-line p-4">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  <UserCheck className="size-4 text-primary" aria-hidden /> {i.nom}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {i.roles.includes("agent") && i.roles.includes("accompagnateur") ? "Agent + accompagnateur" : i.roles.includes("agent") ? "Agent évaluateur" : "Accompagnateur"}
                  {" · "}
                  {i.secteurs.map((s) => SECTEURS[s].label).join(", ")}
                </p>
                <p className="text-xs text-muted">Zones : {i.zones.join(", ")}</p>
              </li>
            ))}
          </ul>
        </Bloc>
      </div>
    </>
  );
}
