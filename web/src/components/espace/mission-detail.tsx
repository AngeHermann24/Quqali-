"use client";

import Link from "next/link";
import { ArrowLeft, Ban, CalendarClock, CalendarPlus, Check, ClipboardList, Gauge, NotebookPen, Scale } from "lucide-react";
import { CRITERES, SECTEURS, scoreGlobal } from "@/lib/data";
import { INTERVENANTS, STATUTS_MISSION, ajouterJours, genererPlan, getMission, maintenant, partenaireCommeIntervenant } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { agentsEligibles, assignerAgent } from "@/lib/regles";
import { SITE, cn } from "@/lib/site";
import { ScoreBars, ScoreRing } from "@/components/scores";
import { usePartenaire } from "@/components/espace/use-partenaire";
import { Bloc, Chargement, EspaceHeader, PanneauDemo, Pastille, Progression } from "@/components/espace/ui";

export function MissionDetail({ id }: { id: string }) {
  const { partenaire, etats, liens, majMission, pret } = usePartenaire();
  const mission = getMission(id);

  if (!pret) return <Chargement />;
  if (!mission || partenaire?.statut !== "valide")
    return (
      <div className="container-page max-w-2xl py-12">
        <div className="card p-6 text-center">
          <p className="font-display text-lg font-semibold text-ink">{mission ? "Mission réservée aux accompagnateurs validés" : "Mission introuvable"}</p>
          <Link href="/partenaire" className="btn btn-primary mt-5">
            Retour à mon espace
          </Link>
        </div>
      </div>
    );

  const etat = etats[mission.id];
  const plan = genererPlan(mission.besoins, etat.accepteeLe ?? mission.demandeLe);
  const avancement = (etat.faits.length / plan.length) * 100;
  const intervenants = [...INTERVENANTS, partenaireCommeIntervenant(partenaire)];
  const cible = { id: mission.etablissementId, secteur: mission.secteur, commune: mission.commune };
  const candidats = agentsEligibles(cible, intervenants, liens);
  const modifiable = etat.statut === "en_cours";

  const declarerPret = () => {
    const { agent } = assignerAgent(cible, intervenants, liens);
    majMission(mission.id, { statut: "pret", pretLe: maintenant(), agentReauditId: agent?.id });
  };

  return (
    <>
      <EspaceHeader
        role="Mission d'accompagnement"
        titre={mission.etablissement}
        sousTitre={`${SECTEURS[mission.secteur].nom} · ${mission.commune} · demande du ${formatDate(mission.demandeLe)}`}
        actions={<span className="chip bg-white/15 text-sm text-white">{STATUTS_MISSION[etat.statut].label}</span>}
      />
      <div className="container-page py-6">
        <Link href="/partenaire" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Mes missions
        </Link>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Bloc titre="Plan d'actions" icone={<ClipboardList className="size-5" aria-hidden />} action={<span className="text-sm font-semibold text-ink">{Math.round(avancement)} %</span>}>
              <Progression valeur={avancement} />
              <ul className="mt-4 space-y-2">
                {plan.map((a) => {
                  const fait = etat.faits.includes(a.id);
                  return (
                    <li key={a.id}>
                      <label className={cn("flex gap-3 rounded-xl border p-3 text-sm transition", fait ? "border-success/40 bg-success-soft/50" : "border-line", modifiable && "cursor-pointer")}>
                        <input
                          type="checkbox"
                          checked={fait}
                          disabled={!modifiable}
                          onChange={() => majMission(mission.id, { faits: fait ? etat.faits.filter((f) => f !== a.id) : [...etat.faits, a.id] })}
                          className="mt-0.5 accent-success"
                        />
                        <span>
                          <span className={cn("block font-medium", fait ? "text-muted line-through" : "text-ink")}>{a.action}</span>
                          <span className="block text-xs text-muted">
                            {CRITERES.find((c) => c.key === a.critere)?.label} · échéance {formatDate(a.echeance)}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Bloc>

            <Bloc titre="Séances et comptes rendus" icone={<NotebookPen className="size-5" aria-hidden />}>
              {etat.seances.length ? (
                <ol className="space-y-3">
                  {etat.seances.map((s, i) => (
                    <li key={`${s.date}-${i}`} className="rounded-xl bg-surface p-3.5 text-sm">
                      <p className="font-semibold text-ink">
                        {s.objet} <span className="font-normal text-muted">· {formatDate(s.date)}</span>
                      </p>
                      <p className="mt-1 text-ink/90">{s.compteRendu}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">Aucune séance pour le moment.</p>
              )}
              {modifiable && (
                <form
                  className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_1fr]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    majMission(mission.id, {
                      seances: [...etat.seances, { date: new Date(String(fd.get("date"))).toISOString(), objet: String(fd.get("objet")), compteRendu: String(fd.get("cr")) }],
                    });
                    form.reset();
                  }}
                >
                  <input name="date" type="date" required className="input" aria-label="Date de la séance" />
                  <input name="objet" required className="input" placeholder="Objet (ex. formation de l'équipe d'accueil)" aria-label="Objet" />
                  <textarea name="cr" required rows={2} className="input sm:col-span-2" placeholder="Compte rendu : actions menées, points de vigilance…" aria-label="Compte rendu" />
                  <button type="submit" className="btn btn-outline sm:col-span-2">
                    <CalendarPlus className="size-4" aria-hidden /> Ajouter la séance
                  </button>
                </form>
              )}
            </Bloc>
          </div>

          <div className="space-y-5">
            <Bloc titre="Diagnostic initial" icone={<Gauge className="size-5" aria-hidden />}>
              <div className="flex justify-center">
                <ScoreRing value={scoreGlobal(mission.diagnostic)} size={112} />
              </div>
              <div className="mt-4">
                <ScoreBars scores={mission.diagnostic} />
              </div>
            </Bloc>

            <Bloc titre="Réaudit" icone={<CalendarClock className="size-5" aria-hidden />}>
              {etat.statut === "en_cours" && (
                <>
                  <p className="text-sm text-muted">Quand toutes les actions sont réalisées, déclarez l&apos;établissement prêt. Un agent indépendant sera assigné automatiquement.</p>
                  <button type="button" className="btn btn-success mt-4 w-full" disabled={etat.faits.length < plan.length} onClick={declarerPret}>
                    <Check className="size-4" aria-hidden /> Déclarer prêt pour le réaudit
                  </button>
                </>
              )}
              {etat.statut === "pret" && etat.pretLe && (
                <div className="space-y-3 text-sm">
                  <p className="text-ink">
                    Réaudit prévu vers le <strong>{formatDate(ajouterJours(etat.pretLe, 7))}</strong>
                  </p>
                  <p className="text-ink">
                    Agent assigné : <strong>{intervenants.find((i) => i.id === etat.agentReauditId)?.nom ?? "aucun agent disponible"}</strong>
                  </p>
                  <PanneauDemo>
                    <button type="button" className="btn btn-success" onClick={() => majMission(mission.id, { statut: "terminee", resultatReaudit: 83.6 })}>
                      Réaudit : admis (83,6 %)
                    </button>
                  </PanneauDemo>
                </div>
              )}
              {etat.statut === "terminee" && etat.resultatReaudit !== undefined && (
                <div className="flex items-center justify-between rounded-xl bg-success-soft p-4">
                  <span className="text-sm font-semibold text-success-dark">{etat.resultatReaudit >= SITE.seuil ? "Admis au réaudit" : "Sous le seuil"}</span>
                  <span className="font-display text-2xl font-bold text-success-dark">{formatScore(etat.resultatReaudit)} %</span>
                </div>
              )}
            </Bloc>

            <Bloc titre="Agents éligibles au réaudit" icone={<Scale className="size-5" aria-hidden />}>
              <ul className="space-y-2">
                {candidats.map(({ intervenant, eligible, motif }) => (
                  <li key={intervenant.id} className={cn("rounded-lg border p-3 text-sm", eligible ? "border-line" : "border-ink/20 bg-surface")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{intervenant.nom}</span>
                      {eligible ? (
                        <Pastille ton={intervenant.id === etat.agentReauditId ? "succes" : "neutre"}>{intervenant.id === etat.agentReauditId ? "Assigné" : "Éligible"}</Pastille>
                      ) : (
                        <Ban className="size-4 shrink-0 text-ink" aria-label="Exclu" />
                      )}
                    </div>
                    {motif && <p className="mt-1 text-xs text-muted">{motif}</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Agents habilités au secteur {SECTEURS[mission.secteur].nom.toLowerCase()}. Vous êtes exclu d&apos;office de cet audit.</p>
            </Bloc>
          </div>
        </div>
      </div>
    </>
  );
}
