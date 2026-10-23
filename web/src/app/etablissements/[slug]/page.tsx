import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ChevronRight, Clock, Lock, MapPin, Navigation, Trophy } from "lucide-react";
import { ETABLISSEMENTS, SECTEURS, getEtablissement, noteMoyenne, scoreGlobal } from "@/lib/data";
import { formatDate, formatScore, itineraire } from "@/lib/format";
import { SITE } from "@/lib/site";
import { EtablissementCard } from "@/components/etablissement-card";
import { FicheActions } from "@/components/fiche-actions";
import { SectionAvis } from "@/components/avis/section-avis";
import { Carte } from "@/components/map";
import { ScoreBars, ScoreRing } from "@/components/scores";
import { PhotoPlaceholder, PremiumTag, Stars } from "@/components/ui";
import { BadgePublic, BandeauGestion } from "@/components/etat-certification";
import { BoutonFavori } from "@/components/app/favoris";
import { Visite3D } from "@/components/visite-3d";

export function generateStaticParams() {
  return ETABLISSEMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/etablissements/[slug]">): Promise<Metadata> {
  const e = getEtablissement((await props.params).slug);
  if (!e) return {};
  return {
    title: `${e.nom} — ${e.commune}`,
    description: `${e.sousType} certifié ${formatScore(scoreGlobal(e.scores))} % (audit du ${formatDate(e.dateAudit)}). ${e.description}`,
  };
}

const PHOTOS = ["Façade", "Accueil", "Espace principal", "Détail", "Équipe"];

export default function FichePage(props: PageProps<"/etablissements/[slug]">) {
  return (
    <Suspense fallback={<FicheSkeleton />}>
      <Fiche params={props.params} />
    </Suspense>
  );
}

function FicheSkeleton() {
  return (
    <div className="container-page animate-pulse space-y-4 py-6" aria-busy="true">
      <div className="h-4 w-1/3 rounded bg-surface" />
      <div className="aspect-[4/3] rounded-3xl bg-surface sm:aspect-auto sm:h-96" />
      <div className="h-8 w-2/3 rounded bg-surface" />
      <div className="h-48 rounded-2xl bg-surface" />
    </div>
  );
}

async function Fiche({ params }: { params: PageProps<"/etablissements/[slug]">["params"] }) {
  const e = getEtablissement((await params).slug);
  if (!e) notFound();

  const score = scoreGlobal(e.scores);
  const moyenne = noteMoyenne(e.avis);
  const similaires = ETABLISSEMENTS.filter((x) => x.secteur === e.secteur && x.slug !== e.slug).slice(0, 3);

  return (
    <div className="pb-28 lg:pb-16">
      <nav aria-label="Fil d'Ariane" className="container-page flex items-center gap-1 overflow-hidden py-3 text-sm whitespace-nowrap text-muted">
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
        <Link href={`/etablissements?secteur=${e.secteur}`} className="hover:text-primary">
          {SECTEURS[e.secteur].label}
        </Link>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
        <span className="truncate text-ink">{e.nom}</span>
      </nav>

      <div className="relative mx-auto w-full max-w-6xl sm:px-6">
        <BoutonFavori slug={e.slug} className="absolute top-3 right-3 z-10 sm:right-9" />
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:grid sm:h-96 sm:grid-cols-4 sm:grid-rows-2 sm:gap-2 sm:overflow-hidden sm:rounded-3xl">
          {PHOTOS.map((label, i) => (
            <PhotoPlaceholder
              key={label}
              secteur={e.secteur}
              label={`${label} · ${i + 1}/${PHOTOS.length}`}
              className={`relative aspect-[4/3] w-full shrink-0 snap-start sm:aspect-auto ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            />
          ))}
        </div>
      </div>

      <BandeauGestion slug={e.slug} nom={e.nom} />

      <div className="container-page mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-10">
        <header className="lg:col-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <BadgePublic slug={e.slug} size="lg" />
            {e.pack === "premium" && <PremiumTag className="bg-primary-soft py-1.5 text-sm" />}
            {e.awards?.map((a) => (
              <span key={a} className="chip bg-primary text-white">
                <Trophy className="size-3.5" aria-hidden /> {a}
              </span>
            ))}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-4xl">{e.nom}</h1>
          <p className="mt-1 text-muted">{e.sousType}</p>
          <p className="mt-3 flex items-start gap-1.5 text-sm text-ink">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {e.adresse}, {e.ville}
          </p>
          {moyenne > 0 && (
            <a href="#avis" className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
              <Stars value={moyenne} />
              <span className="font-semibold text-ink">{formatScore(moyenne)}/5</span>· {e.avis.length} avis vérifiés
            </a>
          )}
        </header>

        <aside className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div className="card space-y-5 p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-5">
              <ScoreRing value={score} size={112} />
              <div className="min-w-0 text-sm">
                <p className="font-display font-semibold text-primary">Note de gouvernance</p>
                <p className="mt-1 flex items-center gap-1.5 text-muted">
                  <CalendarDays className="size-4 shrink-0" aria-hidden /> Audité le {formatDate(e.dateAudit)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-muted">
                  <Clock className="size-4 shrink-0" aria-hidden /> Prochain contrôle : {formatDate(e.prochainControle)}
                </p>
              </div>
            </div>
            <ScoreBars scores={e.scores} />
            <p className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                Note issue d&apos;un audit sur place. Seuil d&apos;admission : {SITE.seuil} % (repère sur les barres). Le paiement n&apos;influence
                jamais la note.{" "}
                <Link href="/methodologie" className="font-semibold text-primary">
                  Méthodologie
                </Link>
              </span>
            </p>
            <FicheActions slug={e.slug} nom={e.nom} secteur={e.secteur} pack={e.pack} telephone={e.telephone} whatsapp={e.whatsapp} coords={e.coords} visite3d={e.visite3d} />
          </div>
        </aside>

        <div className="mt-8 space-y-8 lg:col-start-1">
          <section>
            <h2 className="font-display text-xl font-semibold text-primary">À propos</h2>
            <p className="mt-2 leading-relaxed text-ink/90">{e.description}</p>
            <p className="mt-3 font-semibold text-ink">{e.prix}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {e.services.map((s) => (
                <li key={s} className="chip bg-surface text-sm text-ink">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Horaires</h2>
              <dl className="card mt-3 divide-y divide-line">
                {e.horaires.map((h) => (
                  <div key={h.jours} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">{h.jours}</dt>
                    <dd className={h.heures === "Fermé" ? "font-medium text-muted" : "text-right font-medium text-ink"}>{h.heures}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Contact</h2>
              <dl className="card mt-3 divide-y divide-line text-sm">
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">Téléphone</dt>
                  <dd>
                    <a href={`tel:${e.telephone.replace(/\s/g, "")}`} className="font-medium text-primary">
                      {e.telephone}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">WhatsApp</dt>
                  <dd>
                    <a href={`https://wa.me/${e.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary">
                      Écrire un message
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">Commune</dt>
                  <dd className="font-medium text-ink">{e.commune}</dd>
                </div>
              </dl>
            </div>
          </section>

          {e.pack === "premium" && e.visite3d && (
            <section id="visite-3d" className="scroll-mt-24">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-semibold text-primary">Visite virtuelle 3D</h2>
                <span className="chip bg-primary-soft text-primary">Premium</span>
              </div>
              <p className="mt-1 text-sm text-muted">Explorez l&apos;établissement à 360° avant de réserver.</p>
              <div className="mt-3">
                <Visite3D lien={e.visite3d} nom={e.nom} />
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-primary">Localisation</h2>
              <a href={itineraire(e.coords)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Navigation className="size-4" aria-hidden /> Itinéraire
              </a>
            </div>
            <div className="mt-3 h-64 overflow-hidden rounded-2xl border border-line sm:h-80">
              <Carte
                interactive={false}
                points={[{ slug: e.slug, nom: e.nom, coords: e.coords, score, sousTitre: e.adresse }]}
                activeSlug={e.slug}
              />
            </div>
          </section>

          <section id="avis" className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-primary">Avis clients</h2>
            <SectionAvis etablissementId={e.slug} nom={e.nom} secteur={e.secteur} avisDemo={e.avis} />
          </section>
        </div>
      </div>

      {similaires.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="font-display text-xl font-semibold text-primary">Autres {SECTEURS[e.secteur].label.toLowerCase()} certifiés</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similaires.map((s) => (
              <EtablissementCard key={s.slug} etablissement={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
