import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Camera, ClipboardCheck, Eye, FileText, Gauge, Lock, RefreshCw, Scale, ShieldCheck, Trophy, UserCheck } from "lucide-react";
import { CRITERES } from "@/lib/data";
import { SITE } from "@/lib/site";
import { CRITERE_ICONS, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Notre méthodologie",
  description: "Critères, pondérations, calcul de la note, seuil de 80 %, contrôles réguliers : toute la transparence sur le label.",
};

const SOMMAIRE = [
  { href: "#principes", label: "Principes" },
  { href: "#criteres", label: "Critères" },
  { href: "#calcul", label: "Calcul" },
  { href: "#processus", label: "Processus" },
  { href: "#controles", label: "Contrôles" },
  { href: "#awards", label: "Awards" },
];

const PRINCIPES = [
  { Icon: ClipboardCheck, titre: "Audit sur place, toujours", texte: "Aucun établissement n'est publié sans la visite d'un agent évaluateur formé, avec une grille propre à chaque secteur." },
  { Icon: Scale, titre: "Indépendance", texte: "Un accompagnateur n'audite jamais un établissement qu'il a accompagné. Chaque agent déclare l'absence de conflit d'intérêts et les agents tournent." },
  { Icon: Ban, titre: "Le paiement n'influence jamais la note", texte: "Les agents et le comité qualité n'ont pas accès aux informations de paiement. Le pack se choisit après l'admission." },
  { Icon: Camera, titre: "Preuves et traçabilité", texte: "Photos horodatées et géolocalisées, notes verrouillées après signature, double validation par un comité qualité." },
];

const BAREME = [
  { note: 0, niveau: "Absent / dangereux" },
  { note: 1, niveau: "Très insuffisant" },
  { note: 2, niveau: "Insuffisant" },
  { note: 3, niveau: "Acceptable" },
  { note: 4, niveau: "Bon" },
  { note: 5, niveau: "Excellent" },
];

const PROCESSUS = [
  { titre: "Candidature", texte: "L'établissement dépose son dossier (documents légaux, auto-diagnostic) et choisit son parcours." },
  { titre: "Recevabilité", texte: "Notre équipe vérifie les autorisations et agréments obligatoires." },
  { titre: "Audit sur place", texte: "Un agent indépendant évalue chaque sous-critère de 0 à 5, preuves photo à l'appui." },
  { titre: "Comité qualité", texte: "Le rapport est relu et validé. Le comité ne peut jamais modifier une note : il peut seulement ordonner un contre-audit." },
  { titre: "Publication", texte: `Si la note atteint ${SITE.seuil} %, l'établissement choisit son pack et reçoit le badge « Qualité certifiée ».` },
];

const CONTROLES = [
  { Icon: RefreshCw, texte: "Un audit complet chaque année et au moins un contrôle inopiné." },
  { Icon: Eye, texte: "Des contrôles déclenchés en cas de signalement grave, d'incident ou de chute des avis clients." },
  { Icon: Ban, texte: `Si la note passe sous ${SITE.seuil} %, le badge est retiré immédiatement.` },
  { Icon: UserCheck, texte: "Un établissement peut contester un résultat sous 15 jours : un autre agent réalise un contre-audit, dont le résultat est définitif." },
];

export default function MethodologiePage() {
  return (
    <>
      <section className="bg-primary text-white">
        <div className="container-page py-12 sm:py-16">
          <p className="text-xs font-semibold tracking-wider text-[#7ee2a4] uppercase">Transparence</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Notre méthodologie</h1>
          <p className="mt-4 max-w-2xl text-white/80 sm:text-lg">
            Un label n&apos;a de valeur que si ses règles sont claires. Voici exactement comment nous évaluons, notons et contrôlons chaque
            établissement.
          </p>
          <nav aria-label="Sommaire" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {SOMMAIRE.map((s) => (
              <a key={s.href} href={s.href} className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 hover:bg-white/20">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="principes" className="container-page scroll-mt-20 py-12 sm:py-16">
        <SectionHeading eyebrow="Nos engagements" title="Quatre principes non négociables" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PRINCIPES.map(({ Icon, titre, texte }) => (
            <div key={titre} className="card flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success-dark">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display font-semibold text-ink">{titre}</h3>
                <p className="mt-1 text-sm text-muted">{texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="criteres" className="scroll-mt-20 bg-surface py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Les critères"
            title="Quatre critères, une note de gouvernance"
            intro="Chaque critère regroupe 6 à 8 sous-critères adaptés séparément à l'hôtellerie, à la santé et à la restauration."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CRITERES.map((c) => {
              const Icon = CRITERE_ICONS[c.key];
              return (
                <div key={c.key} className="card flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-display text-3xl font-bold text-primary">{c.poids} %</span>
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-ink">{c.label}</h3>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink/90">
                    {c.exemples.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="calcul" className="container-page scroll-mt-20 py-12 sm:py-16">
        <SectionHeading eyebrow="Le calcul" title={`Comment on obtient la note (et le seuil de ${SITE.seuil} %)`} />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink">1. Chaque sous-critère est noté de 0 à 5</h3>
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
              {BAREME.map((b) => (
                <li key={b.note} className={`rounded-xl p-3 text-center ${b.note >= 4 ? "bg-success-soft" : "bg-surface"}`}>
                  <p className={`font-display text-2xl font-bold ${b.note >= 4 ? "text-success-dark" : "text-primary"}`}>{b.note}</p>
                  <p className="text-[11px] leading-tight text-muted">{b.niveau}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Repère : <strong className="text-ink">4/5 = 80 %</strong>. Un établissement admis est donc « Bon » en moyenne sur l&apos;ensemble de la grille.
              Une photo est obligatoire pour toute note de 2 ou moins.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink">2. Les critères sont pondérés</h3>
            <p className="mt-4 rounded-xl bg-primary p-4 text-center font-mono text-sm leading-relaxed text-white">
              Note = 30 % Hygiène + 25 % Accueil
              <br />+ 20 % Présentation + 25 % Gouvernance
            </p>
            <h4 className="mt-5 text-sm font-semibold text-ink">Exemple : un hôtel</h4>
            <p className="mt-1 text-sm text-muted">Hygiène 90 % · Accueil 80 % · Présentation 75 % · Gouvernance 78 %</p>
            <p className="mt-1 text-sm text-ink">
              27 + 20 + 15 + 19,5 = <strong className="text-success-dark">81,5 % → admis</strong>
            </p>
            <p className="mt-4 flex gap-2 rounded-xl bg-surface p-3 text-xs text-muted">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              Points critiques (sécurité incendie, stérilisation, chaîne du froid…) : une note de 1 ou moins entraîne la non-admission, même au-dessus
              de {SITE.seuil} %. La note n&apos;est jamais arrondie vers le haut pour franchir le seuil.
            </p>
          </div>
        </div>
      </section>

      <section id="processus" className="scroll-mt-20 bg-surface py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Le processus"
            title="De la candidature au badge"
            intro="Un établissement qui n'atteint pas encore le seuil peut être accompagné par un partenaire, puis réaudité par un agent différent."
          />
          <ol className="mt-8 grid gap-4 lg:grid-cols-5">
            {PROCESSUS.map((p, i) => (
              <li key={p.titre} className="card relative p-5">
                <span className="grid size-9 place-items-center rounded-full bg-primary font-display font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-display font-semibold text-ink">{p.titre}</h3>
                <p className="mt-1 text-sm text-muted">{p.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="controles" className="container-page scroll-mt-20 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Après l'admission" title="Un badge qui se garde, ou se perd" />
            <ul className="mt-6 space-y-3">
              {CONTROLES.map(({ Icon, texte }) => (
                <li key={texte} className="flex gap-3 rounded-2xl border border-line p-4">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm text-ink">{texte}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card self-start p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Lock className="size-5" aria-hidden />
              </span>
              <h3 className="font-display font-semibold text-ink">Et les avis clients ?</h3>
            </div>
            <p className="mt-3 text-sm text-muted">
              Seuls les clients ayant réellement visité l&apos;établissement (QR code sur place ou lien après réservation) peuvent laisser un avis. Les
              avis sont modérés et comptent pour les Awards, mais <strong className="text-ink">n&apos;influencent jamais la note du label</strong>, qui
              résulte uniquement de l&apos;audit.
            </p>
            <Link href="/etablissements" className="btn btn-primary mt-5">
              Voir les établissements certifiés <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="awards" className="scroll-mt-20 bg-primary py-12 text-white sm:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Trophy className="size-8 text-[#7ee2a4]" aria-hidden />
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Les Awards annuels</h2>
            <p className="mt-3 text-white/80">
              Chaque année, les établissements certifiés concourent par catégorie. Le classement combine l&apos;expertise de nos évaluateurs et la voix
              des clients.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { label: "Évaluateurs (audits de l'année + jury)", valeur: 70, Icon: Gauge },
              { label: "Votes et témoignages clients vérifiés", valeur: 30, Icon: FileText },
            ].map(({ label, valeur, Icon }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-[#7ee2a4]" aria-hidden /> {label}
                  </span>
                  <span className="font-display text-2xl font-bold">{valeur} %</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-success" style={{ width: `${valeur}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
