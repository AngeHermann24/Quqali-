import type { Metadata } from "next";
import { CONFIG_DEFAUT } from "@/lib/abonnement";
import { SITE } from "@/lib/site";
import { ComparateurPacks } from "@/components/paiement/comparateur-packs";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tarifs : packs Basique et Premium",
  description: "Comparez les packs Basique et Premium. Paiement par Orange Money, MTN MoMo, Wave ou carte. Le paiement n'influence jamais la note.",
};

const FAQ = [
  { q: "Le pack choisi influence-t-il ma note ?", r: "Non, jamais. La note résulte uniquement de l'audit sur place. Les agents et le comité qualité n'ont pas accès aux informations de paiement." },
  {
    q: "Que se passe-t-il si je ne renouvelle pas ?",
    r: `Vous recevez des rappels ${CONFIG_DEFAUT.rappels.map((j) => `${j} j`).join(", ")} avant l'échéance. Après ${CONFIG_DEFAUT.delaiGrace} jours de grâce sans paiement, votre fiche est masquée automatiquement. Votre note est conservée telle quelle et votre fiche réapparaît dès le paiement.`,
  },
  { q: "Puis-je changer de pack en cours d'abonnement ?", r: "Oui. Le changement prend effet immédiatement et la période non consommée est déduite de votre nouvelle facture (avoir au prorata)." },
  { q: "Comment obtenir mes factures ?", r: "Chaque paiement génère une facture PDF téléchargeable depuis votre espace, rubrique Abonnement." },
];

export default function TarifsPage() {
  return (
    <>
      <section className="bg-primary text-white">
        <div className="container-page py-12 text-center sm:py-16">
          <p className="text-xs font-semibold tracking-wider text-[#7ee2a4] uppercase">Tarifs</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Un label abordable, deux niveaux de visibilité</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80 sm:text-lg">
            Le pack se choisit après l&apos;admission ({SITE.seuil} % minimum à l&apos;audit). Paiement par Mobile Money ou carte, en FCFA.
          </p>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <ComparateurPacks />
      </section>

      <section className="container-page pb-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Questions sur le paiement" />
          <div className="mt-4 space-y-3">
            {FAQ.map(({ q, r }) => (
              <details key={q} className="card group p-4">
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
