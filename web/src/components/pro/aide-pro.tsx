import { CircleHelp, MessageCircle, Phone } from "lucide-react";
import { EspaceHeader } from "@/components/espace/ui";

const FAQ = [
  {
    q: "Combien de temps prend la certification ?",
    r: "En général 2 à 4 semaines : examen du dossier, audit sur place, puis publication si vous atteignez 80 %.",
  },
  {
    q: "Comment se déroule l'audit ?",
    r: "Un agent évaluateur indépendant visite votre établissement et note l'hygiène, l'accueil, la présentation du personnel et la gouvernance. Vous choisissez le créneau.",
  },
  {
    q: "Payer plus cher donne-t-il une meilleure note ?",
    r: "Non, jamais. Le pack choisit les fonctionnalités (visite 3D, réservations, rapport IA) — la note vient uniquement de l'audit.",
  },
  {
    q: "Que se passe-t-il sous 80 % ?",
    r: "Vous recevez un rapport détaillé avec les points à corriger, puis vous pouvez demander un accompagnement et un réaudit.",
  },
  {
    q: "Un contrôle peut-il retirer mon badge ?",
    r: "Oui : des contrôles réguliers ont lieu après l'admission. Sous 80 %, un plan de correction vous est proposé avant tout retrait.",
  },
];

export function AidePro() {
  return (
    <>
      <EspaceHeader role="Aide" titre="Questions fréquentes" sousTitre="Notre équipe répond sous 24 h ouvrées" />
      <div className="container-page max-w-2xl space-y-4 py-6">
        <ul className="space-y-3">
          {FAQ.map((f) => (
            <li key={f.q}>
              <details className="card group p-4 open:border-primary/30">
                <summary className="flex cursor-pointer items-center gap-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <CircleHelp className="size-5 shrink-0 text-primary" aria-hidden />
                  {f.q}
                </summary>
                <p className="mt-3 pl-8 text-sm leading-relaxed text-muted">{f.r}</p>
              </details>
            </li>
          ))}
        </ul>
        <div className="card space-y-3 p-5">
          <p className="font-semibold text-ink">Besoin d&apos;aide ?</p>
          <a href="tel:+2252700000000" className="btn btn-outline w-full">
            <Phone className="size-4" aria-hidden /> +225 27 00 00 00 00
          </a>
          <a href="mailto:support@qualite.ci" className="btn btn-outline w-full">
            <MessageCircle className="size-4" aria-hidden /> support@qualite.ci
          </a>
        </div>
      </div>
    </>
  );
}
