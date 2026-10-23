import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ChartColumn, ClipboardCheck, Handshake, Megaphone, Rocket, Wallet } from "lucide-react";
import { SITE, cn } from "@/lib/site";
import { ComparateurPacks } from "@/components/paiement/comparateur-packs";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Devenir partenaire",
  description: "Faites certifier la qualité de votre établissement sans le coût d'une certification ISO, ou rejoignez nos accompagnateurs.",
};

const BENEFICES = [
  { Icon: BadgeCheck, titre: "Un label de confiance", texte: "Le badge « Qualité certifiée » prouve à vos clients que vous avez été contrôlé sur place." },
  { Icon: Megaphone, titre: "Une visibilité ciblée", texte: "Vous apparaissez auprès d'usagers qui cherchent précisément des établissements fiables." },
  { Icon: ChartColumn, titre: "Un plan de progrès", texte: "Chaque audit vous donne un rapport détaillé et des actions prioritaires classées par impact." },
  { Icon: Wallet, titre: "Un coût maîtrisé", texte: "Une alternative abordable à la certification ISO, payable par Mobile Money ou carte." },
];

const PARCOURS = [
  {
    lettre: "A",
    titre: "Audit direct",
    pour: "Vous pensez déjà répondre aux exigences.",
    Icon: ClipboardCheck,
    etapes: ["Candidature et vérification des documents", "Audit sur place par un agent indépendant", `Note ≥ ${SITE.seuil} % : choix du pack et paiement`, "Publication avec le badge « Qualité certifiée »"],
  },
  {
    lettre: "B",
    titre: "Accompagnement",
    pour: "Vous voulez progresser avant d'être audité.",
    Icon: Handshake,
    etapes: ["Diagnostic de départ", "Plan d'actions avec un accompagnateur partenaire", "Réaudit par un agent différent de votre accompagnateur", `Note ≥ ${SITE.seuil} % : pack, paiement et publication`],
  },
];

const FAQ = [
  { q: "Combien de temps dure le processus ?", r: "En parcours A, comptez généralement 2 à 4 semaines entre la candidature et la publication. En parcours B, la durée dépend de votre plan d'actions." },
  { q: "Que se passe-t-il si j'obtiens moins de 80 % ?", r: "Vous recevez un rapport détaillé avec des actions prioritaires. Vous pouvez demander un réaudit après un délai minimum, ou être accompagné (parcours B)." },
  { q: "Payer le pack Premium améliore-t-il ma note ?", r: "Non, jamais. Les agents et le comité qualité n'ont pas accès aux informations de paiement, et le pack se choisit après l'admission." },
  { q: "Quels moyens de paiement acceptez-vous ?", r: "Orange Money, MTN MoMo, Wave et carte bancaire (Visa, Mastercard). Une facture PDF est générée à chaque paiement." },
];

export default function DevenirPartenairePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-success/20" aria-hidden />
        <div className="container-page relative py-12 sm:py-20">
          <p className="text-xs font-semibold tracking-wider text-[#7ee2a4] uppercase">Établissements & accompagnateurs</p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight font-bold sm:text-5xl">Faites reconnaître la qualité de votre établissement</h1>
          <p className="mt-4 max-w-2xl text-white/80 sm:text-lg">
            La certification ISO coûte cher, et beaucoup d&apos;excellents établissements restent invisibles. Notre label vous offre une preuve de qualité
            crédible et abordable.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#candidature" className="btn btn-success px-6 py-3 text-base">
              Déposer ma candidature <ArrowRight className="size-5" aria-hidden />
            </a>
            <a href="#packs" className="btn btn-white px-6 py-3 text-base">
              Voir les packs
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading eyebrow="Pourquoi nous rejoindre" title="Ce que le label vous apporte" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICES.map(({ Icon, titre, texte }) => (
            <div key={titre} className="card p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-success-soft text-success-dark">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display font-semibold text-ink">{titre}</h3>
              <p className="mt-1 text-sm text-muted">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="parcours" className="scroll-mt-20 bg-surface py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Deux parcours" title="Prêt aujourd'hui, ou prêt demain" />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {PARCOURS.map(({ lettre, titre, pour, Icon, etapes }) => (
              <div key={lettre} className="card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-white">{lettre}</span>
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                      <Icon className="size-5 text-primary" aria-hidden /> {titre}
                    </h3>
                    <p className="text-sm text-muted">{pour}</p>
                  </div>
                </div>
                <ol className="mt-5 space-y-3">
                  {etapes.map((etape, i) => (
                    <li key={etape} className="flex gap-3 text-sm text-ink">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-xs font-bold text-success-dark">{i + 1}</span>
                      {etape}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packs" className="container-page scroll-mt-20 py-12 sm:py-16">
        <SectionHeading
          eyebrow="Les packs"
          title="Choisissez votre visibilité"
          intro="Le pack se choisit après l'admission. Il change votre visibilité, jamais votre note."
          center
        />
        <div className="mt-8">
          <ComparateurPacks />
        </div>
      </section>

      <section id="accompagnateur" className="scroll-mt-20 bg-surface py-12 sm:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Accompagnateurs partenaires"
              title="Vous êtes consultant ou expert qualité ?"
              intro="Aidez les établissements à atteindre le niveau requis. Missions rémunérées, proposées selon vos secteurs et votre zone."
            />
          </div>
          <ul className="space-y-3">
            {[
              "Profil vérifié : expertise, références et entretien",
              "Signature d'une charte déontologique (indépendance, confidentialité)",
              "Vous n'auditez jamais un établissement que vous avez accompagné",
              "Outils fournis : référentiel, modèles de plans d'actions, suivi en ligne",
            ].map((t) => (
              <li key={t} className="flex gap-3 rounded-2xl bg-white p-4 text-sm text-ink shadow-card">
                <Rocket className="size-5 shrink-0 text-primary" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="candidature" className="container-page scroll-mt-20 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Candidature" title="Lancez-vous" intro="Créez votre dossier en ligne et suivez son avancement depuis votre espace." center />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { href: "/pro/inscription", titre: "Je suis un établissement", texte: "Informations, localisation, documents et choix du parcours A ou B.", cta: "Créer mon dossier", Icon: Building2, style: "btn-success" },
              { href: "/partenaire/inscription", titre: "Je suis accompagnateur", texte: "Expertise, zones d'intervention, documents et charte déontologique.", cta: "Postuler", Icon: Handshake, style: "btn-primary" },
            ].map(({ href, titre, texte, cta, Icon, style }) => (
              <div key={href} className="card flex flex-col p-6">
                <Icon className="size-8 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{titre}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{texte}</p>
                <Link href={href} className={cn("btn mt-5 py-3", style)}>
                  {cta} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-xl font-semibold text-primary">Questions fréquentes</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map(({ q, r }) => (
              <details key={q} className="card group p-4 open:shadow-card-hover">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="text-xl text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
