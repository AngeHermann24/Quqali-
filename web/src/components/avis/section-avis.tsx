"use client";

import { type FormEvent, useState } from "react";
import { BadgeCheck, CircleCheck, CircleAlert, MessageSquareText, QrCode, ShieldCheck, Star, Ticket, UserRound } from "lucide-react";
import { type Avis, type Secteur } from "@/lib/data";
import { type AvisClient, ROLES_PERSONNEL, STATUTS_AVIS, codeVisiteDemo, masquerNom, type PreuveVisite } from "@/lib/avis";
import { resume } from "@/lib/reservation";
import { configParDefaut } from "@/lib/reservation-demo";
import { CLES, type Dossier } from "@/lib/espace";
import { formatDate, formatScore } from "@/lib/format";
import { fmt, tv } from "@/lib/langue";
import { useLangue } from "@/components/langue";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Modal } from "@/components/modal";
import { Stars } from "@/components/ui";
import { useAvis, useCompteClient } from "@/components/avis/use-avis";
import { Pastille } from "@/components/espace/ui";

export function SectionAvis({ etablissementId, nom, secteur, avisDemo }: { etablissementId: string; nom: string; secteur: Secteur; avisDemo: Avis[] }) {
  const { t, locale } = useLangue();
  const { avis, soumettre, evaluer, reservationsElegibles, charge } = useAvis(etablissementId);
  const { compte, creer, charge: compteCharge } = useCompteClient();
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const reponses = dossier?.id === etablissementId ? dossier.reponsesAvis : undefined;
  const [modal, setModal] = useState(false);
  const [etape, setEtape] = useState<"compte" | "preuve" | "note" | "fin">("compte");
  const [preuve, setPreuve] = useState<PreuveVisite | null>(null);
  const [code, setCode] = useState("");
  const [note, setNote] = useState(0);
  const [personnel, setPersonnel] = useState<Record<string, number>>({});
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState<AvisClient | null>(null);

  if (!charge || !compteCharge) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  const publies = avis.filter((a) => a.statut === "publie");
  const miens = compte ? avis.filter((a) => a.compteId === compte.id && a.statut !== "publie" && a.statut !== "rejete") : [];
  const total = avisDemo.length + publies.length;
  const notes = [...avisDemo.map((a) => a.note), ...publies.map((a) => a.note)];
  const moyenne = notes.length ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : 0;
  const personnelNotes = publies.flatMap((a) => (a.personnel ? Object.entries(a.personnel).map(([role, n]) => ({ role, n })) : []));
  const personnelGlobal = personnelNotes.length ? Math.round((personnelNotes.reduce((s, p) => s + p.n, 0) / personnelNotes.length) * 10) / 10 : null;
  const roles = ROLES_PERSONNEL[secteur];

  const ouvrir = () => {
    setEtape(compte ? "preuve" : "compte");
    setPreuve(null);
    setCode("");
    setNote(0);
    setPersonnel({});
    setErreur("");
    setResultat(null);
    setModal(true);
  };

  const creerCompte = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const telephone = String(fd.get("telephone") ?? "").trim();
    if (!/^(\+?225)?\s?(01|05|07|27)(\s?\d{2}){4}$/.test(telephone)) return setErreur(t.numeroInvalide);
    const email = String(fd.get("email") ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErreur(t.emailInvalide);
    setErreur("");
    creer(String(fd.get("nom") ?? "").trim(), telephone, email || undefined);
    setEtape("preuve");
  };

  const choisirPreuve = (p: PreuveVisite) => {
    if (!compte) return;
    const verdict = evaluer(compte, p);
    if (verdict.statut === "rejete") return setErreur(verdict.motif ?? t.preuveInvalide);
    setErreur("");
    setPreuve(p);
    setEtape("note");
  };

  const publier = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!compte || !preuve) return;
    const commentaire = String(new FormData(e.currentTarget).get("commentaire") ?? "");
    void soumettre(compte, { note, commentaire, preuve }, personnel).then((a) => {
      setResultat(a ?? null);
      setEtape("fin");
    });
  };

  return (
    <>
      <div className="mt-3 flex items-center gap-4 rounded-2xl bg-surface p-4">
        <p className="font-display text-4xl font-bold text-ink">{total ? formatScore(moyenne, locale) : "—"}</p>
        <div>
          <Stars value={moyenne} size="md" />
          <p className="mt-1 text-xs text-muted">{fmt(t.avisClients30, { n: total })}</p>
          {personnelGlobal !== null && (
            <p className="mt-1 text-xs font-semibold text-primary">
              {t.personnelLabel} : {formatScore(personnelGlobal, locale)}/5 <span className="font-normal text-muted">({tv(t.notesNb, personnelNotes.length)})</span>
            </p>
          )}
        </div>
        <button type="button" onClick={ouvrir} className="btn btn-primary ml-auto hidden sm:inline-flex">
          <MessageSquareText className="size-4" aria-hidden /> {t.laisserAvis}
        </button>
      </div>
      <button type="button" onClick={ouvrir} className="btn btn-primary mt-3 w-full sm:hidden">
        <MessageSquareText className="size-4" aria-hidden /> {t.laisserAvis}
      </button>

      {miens.length > 0 && (
        <ul className="mt-4 space-y-3">
          {miens.map((a) => (
            <li key={a.id} className="card border-dashed p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{t.votreAvis}</p>
                <Pastille ton={a.statut === "en_verification" ? "primaire" : "alerte"}>{STATUTS_AVIS[a.statut]}</Pastille>
              </div>
              <p className="mt-1 text-xs text-muted">{a.motifRejet ?? t.enExamen}</p>
              <p className="mt-2 text-sm text-ink/90">{a.commentaire}</p>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-4 space-y-4">
        {publies.map((a) => (
          <CarteAvis key={a.id} auteur={a.auteur} date={a.date} note={a.note} commentaire={a.commentaire} personnel={a.personnel} roles={roles} preuve={a.preuve} reponse={reponses?.[a.id]} />
        ))}
        {avisDemo.map((a) => (
          <CarteAvis key={a.auteur + a.date} auteur={a.auteur} date={a.date} note={a.note} commentaire={a.commentaire} roles={roles} reponse={a.reponse} />
        ))}
      </ul>
      {!total && <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-muted">{t.aucunAvisPremier}</p>}

      <Modal open={modal} onClose={() => setModal(false)} title={t.laisserAvisVerifie}>
        {etape === "compte" && (
          <form onSubmit={creerCompte} className="space-y-4" noValidate>
            <p className="flex gap-3 rounded-xl bg-surface p-3 text-sm text-ink">
              <UserRound className="size-5 shrink-0 text-primary" aria-hidden />
              {t.compteRequis}
            </p>
            <div>
              <label htmlFor="av-nom" className="label">
                {t.nomComplet}
              </label>
              <input id="av-nom" name="nom" required className="input" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="av-tel" className="label">
                {t.telephone}
              </label>
              <input id="av-tel" name="telephone" type="tel" required placeholder="07 00 00 00 00" className="input" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="av-email" className="label">
                {t.emailFacultatif}
              </label>
              <input id="av-email" name="email" type="email" className="input" autoComplete="email" />
            </div>
            {erreur && <p className="text-sm font-medium text-ink">{erreur}</p>}
            <button type="submit" className="btn btn-primary w-full py-3">
              {t.creerCompteContinuer}
            </button>
            <p className="text-xs text-muted">{t.nomAbrege}</p>
          </form>
        )}

        {etape === "preuve" && compte && (
          <div className="space-y-4">
            <p className="flex gap-3 rounded-xl bg-surface p-3 text-sm text-ink">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
              {t.unSeulAvis} {fmt(t.connecteEnTant, { n: masquerNom(compte.nom) })}
            </p>
            {reservationsElegibles(compte).length > 0 && (
              <fieldset className="space-y-2">
                <legend className="label">{fmt(t.viaVotreResa, { n: nom })}</legend>
                {reservationsElegibles(compte).map((r) => {
                  const utilisee = avis.some((a) => a.statut !== "rejete" && a.preuve.type === "reservation" && a.preuve.ref === r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={utilisee}
                      onClick={() => choisirPreuve({ type: "reservation", ref: r.id })}
                      className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left text-sm transition enabled:hover:border-primary disabled:opacity-60"
                    >
                      <BadgeCheck className={cn("size-5 shrink-0", utilisee ? "text-muted" : "text-success")} aria-hidden />
                      <span className="min-w-0 flex-1 text-ink">{resume(r, configParDefaut(etablissementId))}</span>
                      {utilisee ? <span className="chip bg-surface text-muted">{t.avisDepose}</span> : <span className="text-xs text-muted">{r.reference}</span>}
                    </button>
                  );
                })}
              </fieldset>
            )}
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                choisirPreuve({ type: "code", code });
              }}
            >
              <label htmlFor="av-code" className="label">
                {t.codeVisiteSurPlace}
              </label>
              <div className="flex gap-2">
                <input id="av-code" className="input flex-1 uppercase" placeholder="VIS-0000" value={code} onChange={(e) => setCode(e.target.value)} required />
                <button type="submit" className="btn btn-primary shrink-0">
                  {t.valider}
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Ticket className="size-3.5" aria-hidden /> {fmt(t.demoCode, { n: codeVisiteDemo(etablissementId) })}
              </p>
            </form>
            {erreur && (
              <p className="flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm font-medium text-ink">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {erreur}
              </p>
            )}
          </div>
        )}

        {etape === "note" && (
          <form onSubmit={publier} className="space-y-4">
            <fieldset>
              <legend className="label">{t.noteGlobale}</legend>
              <NoteEtoiles valeur={note} onChange={setNote} grande />
              {!note && <p className="mt-1 text-xs text-muted">{t.touchezEtoile}</p>}
            </fieldset>
            <fieldset className="rounded-xl border border-line p-3">
              <legend className="label px-1">{t.personnelFacultatif}</legend>
              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{r.label}</span>
                    <NoteEtoiles valeur={personnel[r.id] ?? 0} onChange={(v) => setPersonnel((p) => ({ ...p, [r.id]: v }))} />
                  </div>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="av-com" className="label">
                {t.votreAvis}
              </label>
              <textarea id="av-com" name="commentaire" rows={4} required minLength={20} className="input" placeholder={t.decrivezVisite} />
              <p className="mt-1 text-xs text-muted">{t.vingtCaracteres}</p>
            </div>
            <button type="submit" disabled={!note} className="btn btn-success w-full py-3">
              {t.publierMonAvis}
            </button>
          </form>
        )}

        {etape === "fin" && resultat && (
          <div className="space-y-4 text-center">
            {resultat.statut === "publie" ? <CircleCheck className="mx-auto size-14 text-success" aria-hidden /> : <CircleAlert className="mx-auto size-14 text-primary" aria-hidden />}
            <p className="font-display text-lg font-semibold text-ink">{resultat.statut === "publie" ? t.avisPublieMerci : t.avisEnVerif}</p>
            <p className="text-sm text-muted">
              {resultat.statut === "publie" ? t.avisVisibleAwards : (resultat.motifRejet ?? t.avisApresVerif)}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <QrCode className="size-4" aria-hidden /> {fmt(t.visiteVerifieePar, { n: resultat.preuve.type === "reservation" ? t.viaReservation : t.viaCode })}
            </p>
            <button type="button" className="btn btn-primary w-full py-3" onClick={() => setModal(false)}>
              {t.fermer}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function CarteAvis({ auteur, date, note, commentaire, personnel, roles, preuve, reponse }: { auteur: string; date: string; note: number; commentaire: string; personnel?: Record<string, number>; roles: { id: string; label: string }[]; preuve?: PreuveVisite; reponse?: string }) {
  const { t, locale } = useLangue();
  return (
    <li className="card p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-semibold text-primary">{auteur[0]}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{auteur}</p>
          <p className="text-xs text-muted">{formatDate(date, locale)}</p>
        </div>
        <Stars value={note} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">{commentaire}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip bg-success-soft text-success-dark">{t.visiteVerifieeChip}{preuve?.type === "reservation" ? ` ${t.viaReservation}` : ""}</span>
        {personnel &&
          Object.entries(personnel).map(([role, n]) => (
            <span key={role} className="chip bg-primary-soft text-primary">
              {roles.find((r) => r.id === role)?.label ?? role} {formatScore(n, locale)}/5
            </span>
          ))}
      </div>
      {reponse && (
        <div className="mt-3 rounded-xl border-l-4 border-primary bg-surface p-3 text-sm">
          <p className="text-xs font-semibold text-primary">{t.reponseEtab}</p>
          <p className="mt-1 text-ink/90">{reponse}</p>
        </div>
      )}
    </li>
  );
}

function NoteEtoiles({ valeur, onChange, grande }: { valeur: number; onChange: (v: number) => void; grande?: boolean }) {
  const { t } = useLangue();
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={t.noteLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valeur === n} aria-label={tv(t.etoilesAria, n)} onClick={() => onChange(n === valeur ? 0 : n)} className="grid place-items-center rounded-lg p-0.5 transition hover:bg-surface">
          <Star className={cn(grande ? "size-9" : "size-6", n <= valeur ? "fill-amber-400 text-amber-400" : "text-line")} aria-hidden />
        </button>
      ))}
    </div>
  );
}
