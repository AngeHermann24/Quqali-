"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Building2, Check, ClipboardCheck, Handshake, MessageSquareText, Scale, Sparkles } from "lucide-react";
import { CRITERES, type CritereKey } from "@/lib/data";
import { CLES, type Dossier, EQUIPE_INTERNE_ID, INTERVENANTS, genererPlan, maintenant, nomIntervenant } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { assignerAgent } from "@/lib/regles";
import { CRITERE_ICONS } from "@/components/ui";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, ProgressBarPro, ToastPro } from "@/components/pro/ui";

const AUTO = "auto";

/** Accompagnement : demande (équipes ou partenaire) puis suivi du plan d'action jusqu'au réaudit. */
export function AccompagnementPro() {
  const router = useRouter();
  const [dossier, setDossier] = useStockage<Dossier>(CLES.dossier);
  const [mode, setMode] = useState<"nous" | "partenaire">("nous");
  const [partenaire, setPartenaire] = useState(AUTO);
  const [besoins, setBesoins] = useState<CritereKey[]>([]);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState("");

  if (dossier === undefined) return <Chargement />;

  if (!dossier)
    return (
      <div className="bg-surface px-5">
        <EntetePro titre="Accompagnement" onRetour={() => router.back()} />
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <Handshake className="size-12 text-primary" aria-hidden />
          <h1 className="mt-3 font-display text-xl font-bold text-ink">Créez d&apos;abord votre dossier</h1>
          <p className="mt-2 text-sm text-muted">La demande d&apos;accompagnement est liée à votre dossier d&apos;inscription.</p>
          <Link href="/pro/inscription" className="btn btn-success mt-5 w-full">
            Créer mon dossier
          </Link>
        </div>
      </div>
    );

  const acc = dossier.accompagnement;

  /* ================= SUIVI (demande enregistrée) ================= */
  if (acc) {
    const fait = acc.plan.filter((a) => a.fait).length;
    const progression = acc.plan.length ? (fait / acc.plan.length) * 100 : 0;
    const toutFait = fait === acc.plan.length && acc.plan.length > 0;

    const cocher = (id: string) => {
      navigator.vibrate?.(6);
      const plan = acc.plan.map((a) => (a.id === id ? { ...a, fait: !a.fait } : a));
      const maintenantPret = plan.every((a) => a.fait);
      setDossier({ ...dossier, accompagnement: { ...acc, plan, pretLe: maintenantPret ? (acc.pretLe ?? maintenant()) : acc.pretLe } });
      if (maintenantPret && !acc.pretLe) {
        setToast("Plan terminé — vous pouvez demander le réaudit");
        setTimeout(() => setToast(""), 3500);
      }
    };

    const reauditer = () => {
      const liens = [{ accompagnateurId: acc.accompagnateurId, etablissementId: dossier.id }];
      const { agent } = assignerAgent({ id: dossier.id, secteur: dossier.secteur, commune: dossier.commune }, INTERVENANTS, liens, dossier.agentAuditId);
      setDossier({
        ...dossier,
        statut: "en_audit",
        creneauAudit: undefined,
        agentAuditId: agent?.id,
        accompagnement: { ...acc, dateReaudit: maintenant(), agentReauditId: agent?.id },
        historique: [...dossier.historique, { statut: "en_audit" as const, date: maintenant() }],
      });
      router.push("/pro/audit");
    };

    return (
      <div className="bg-surface">
        <EntetePro titre="Accompagnement" onRetour={() => router.back()} />
        <div className="space-y-5 px-5 py-5">
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-display font-bold text-primary">
                {nomIntervenant(acc.accompagnateurId)?.[0] ?? "Q"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{nomIntervenant(acc.accompagnateurId) ?? "Équipe Qualité+"}</p>
                <p className="text-xs text-muted">{acc.mode === "nous" ? "Accompagnement par nos équipes" : "Partenaire accrédité"}</p>
              </div>
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">En cours</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <ProgressBarPro valeur={progression} className="flex-1" />
              <span className="text-xs font-bold text-muted">{Math.round(progression)} %</span>
            </div>
            {acc.dateReaudit && <p className="mt-2 text-xs font-semibold text-bleu">Réaudit demandé le {formatDate(acc.dateReaudit)}</p>}
          </section>

          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <ClipboardCheck className="size-4 text-primary" aria-hidden /> Plan d&apos;action
            </h2>
            <ul className="mt-3 space-y-2">
              {acc.plan.map((a) => {
                const Icon = CRITERE_ICONS[a.critere];
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => cocher(a.id)}
                      aria-pressed={a.fait}
                      className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition", a.fait ? "border-success/40 bg-success-soft/50" : "border-line")}
                    >
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", a.fait ? "border-success bg-success text-white" : "border-line bg-white")}>
                        {a.fait && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-bold", a.fait ? "text-success line-through" : "text-ink")}>{a.action}</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-muted">
                          <Icon className="size-3.5" aria-hidden /> {CRITERES.find((c) => c.key === a.critere)?.label} · échéance {formatDate(a.echeance)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Messages */}
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <MessageSquareText className="size-4 text-primary" aria-hidden /> Messages
            </h2>
            <ul className="mt-3 space-y-2.5">
              <li className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface p-3 text-xs leading-relaxed text-ink">
                Bonjour, votre plan d&apos;action est prêt. Avancez étape par étape — je reste disponible pour toute question.
                <span className="mt-1 block text-[10px] text-muted">{nomIntervenant(acc.accompagnateurId) ?? "Accompagnateur"}</span>
              </li>
              {acc.message && (
                <li className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary-soft p-3 text-xs leading-relaxed text-ink">
                  {acc.message}
                  <span className="mt-1 block text-right text-[10px] text-muted">Vous · {formatDate(acc.dateDemande)}</span>
                </li>
              )}
            </ul>
          </section>

          {toutFait && !acc.dateReaudit && (
            <button type="button" onClick={reauditer} className="btn btn-success h-13 w-full text-base">
              Demander le réaudit
            </button>
          )}
          {acc.dateReaudit && (
            <Link href="/pro/audit" className="btn btn-success h-13 w-full text-base">
              Suivre mon réaudit
            </Link>
          )}

          <p className="flex items-start gap-1.5 px-1 text-[11px] text-muted">
            <Scale className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden /> Votre accompagnateur ne pourra jamais auditer votre établissement — le réaudit est confié à un agent différent.
          </p>
        </div>
        <ToastPro message={toast} visible={!!toast} />
      </div>
    );
  }

  /* ================= DEMANDE ================= */
  const partenaires = INTERVENANTS.filter((i) => i.roles.includes("accompagnateur") && i.id !== EQUIPE_INTERNE_ID && i.secteurs.includes(dossier.secteur));
  const choixAuto = partenaires.find((p) => p.zones.includes(dossier.commune)) ?? partenaires[0];
  const scores = dossier.audit?.scores;

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!besoins.length) return setErreur("Choisissez au moins un critère à améliorer.");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const date = maintenant();
    setDossier({
      ...dossier,
      parcours: "B",
      accompagnement: {
        mode,
        accompagnateurId: mode === "nous" ? EQUIPE_INTERNE_ID : partenaire === AUTO ? choixAuto.id : partenaire,
        besoins,
        disponibilites: String(fd.get("disponibilites")),
        message: String(fd.get("message") ?? ""),
        dateDemande: date,
        plan: genererPlan(besoins, date),
      },
    });
    navigator.vibrate?.(12);
  };

  return (
    <div className="bg-surface">
      <EntetePro titre="Accompagnement" onRetour={() => router.back()} />
      <form onSubmit={envoyer} className="space-y-5 px-5 py-5" noValidate={false}>
        {/* Qui vous accompagne */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold text-ink">Qui vous accompagne ?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(
              [
                { value: "nous", titre: "Par Qualité+", texte: "Nos équipes directement.", Icon: Building2 },
                { value: "partenaire", titre: "Partenaire", texte: "Accrédité, proche de vous.", Icon: Handshake },
              ] as const
            ).map(({ value, titre, texte, Icon }) => (
              <label key={value} className={cn("flex cursor-pointer flex-col gap-1.5 rounded-2xl border-2 p-3.5 transition", mode === value ? "border-bleu bg-primary-soft" : "border-line")}>
                <input type="radio" name="mode" className="sr-only" checked={mode === value} onChange={() => setMode(value)} />
                <Icon className="size-5 text-primary" aria-hidden />
                <span className="text-sm font-bold text-ink">{titre}</span>
                <span className="text-[11px] leading-tight text-muted">{texte}</span>
              </label>
            ))}
          </div>

          {mode === "partenaire" && (
            <div className="mt-3 space-y-2">
              {[{ id: AUTO, nom: "Laisser la plateforme choisir", zones: [`Recommandé : ${choixAuto.nom}`] }, ...partenaires].map((p) => (
                <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition", partenaire === p.id ? "border-bleu bg-primary-soft" : "border-line")}>
                  <input type="radio" name="partenaire" checked={partenaire === p.id} onChange={() => setPartenaire(p.id)} className="accent-bleu" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      {p.id === AUTO && <Sparkles className="size-4 text-success" aria-hidden />}
                      {p.nom}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{p.zones.join(" · ")}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Critères à améliorer */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="font-display text-sm font-bold text-ink">
            Critères à améliorer <span className="text-success">*</span>
          </h2>
          <div className="mt-3 grid gap-2">
            {CRITERES.map((c) => {
              const Icon = CRITERE_ICONS[c.key];
              const coche = besoins.includes(c.key);
              return (
                <label key={c.key} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition", coche ? "border-bleu bg-primary-soft" : "border-line")}>
                  <input
                    type="checkbox"
                    checked={coche}
                    onChange={() => {
                      setErreur("");
                      setBesoins((b) => (coche ? b.filter((x) => x !== c.key) : [...b, c.key]));
                    }}
                    className="size-5 accent-bleu"
                  />
                  <Icon className="size-4 text-primary" aria-hidden />
                  <span className="flex-1 text-sm font-bold text-ink">{c.label}</span>
                  {scores && <span className={cn("text-xs font-semibold", scores[c.key] < 80 ? "text-[#b45309]" : "text-success")}>{formatScore(scores[c.key])} %</span>}
                </label>
              );
            })}
          </div>
          {erreur && (
            <p role="alert" className="mt-2 text-xs font-semibold text-danger">
              {erreur}
            </p>
          )}
        </section>

        {/* Disponibilités + message */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <label htmlFor="dispo" className="label">
            Disponibilités
          </label>
          <select id="dispo" name="disponibilites" required defaultValue="Matin (8 h – 12 h)" className="input h-11 appearance-none">
            {["Matin (8 h – 12 h)", "Après-midi (14 h – 18 h)", "Fin de journée (après 18 h)", "Week-end"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <label htmlFor="msg-acc" className="label mt-3.5">
            Précisions
          </label>
          <textarea id="msg-acc" name="message" rows={3} placeholder="Vos attentes, contraintes…" className="input" />
        </section>

        <div className="flex gap-3 rounded-2xl bg-primary-soft p-3.5 text-xs leading-relaxed text-primary">
          <Scale className="size-4 shrink-0" aria-hidden />
          <p>
            <strong>Règle d&apos;indépendance :</strong> la personne qui vous accompagne ne pourra jamais auditer votre établissement. Le réaudit sera confié à un agent différent.
          </p>
        </div>

        <button type="submit" className="btn btn-success h-13 w-full text-base">
          Envoyer ma demande d&apos;accompagnement
        </button>
      </form>
    </div>
  );
}
