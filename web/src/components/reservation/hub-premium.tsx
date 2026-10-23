"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ArrowRight, CalendarCheck, Check, Lock, Rotate3d, Sparkles } from "lucide-react";
import { HOTES_3D, VISITE_DEMO, analyserLien3D } from "@/lib/visite3d";
import { useEtablissementsGeres } from "@/components/reservation/use-etablissements-geres";
import { Visite3D } from "@/components/visite-3d";
import { Bloc, Chargement, EspaceHeader } from "@/components/espace/ui";

export function HubPremium() {
  const { dossier, setDossier, premiumActif, charge } = useEtablissementsGeres();
  const [lien, setLien] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  if (!charge) return <Chargement />;

  const valeur = lien ?? dossier?.visite3d ?? "";

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    if (!valeur.trim()) {
      setDossier({ ...dossier, visite3d: undefined });
      return setMessage({ ok: true, texte: "Visite 3D retirée de votre fiche." });
    }
    const analyse = analyserLien3D(valeur);
    if ("erreur" in analyse) return setMessage({ ok: false, texte: analyse.erreur });
    setDossier({ ...dossier, visite3d: valeur.trim() });
    setMessage({ ok: true, texte: `Visite ${analyse.fournisseur} enregistrée : elle apparaît sur votre fiche publique.` });
  };

  const cartes = [
    { href: "/pro/reservations", titre: "Réservations en ligne", texte: "Tables, chambres ou rendez-vous : disponibilités, demandes, agenda, SMS de confirmation.", Icone: CalendarCheck },
    { href: "/pro/rapports", titre: "Rapport mensuel IA", texte: "Chaque mois, la synthèse de vos avis : points forts, points faibles, recommandations.", Icone: Sparkles },
  ];

  return (
    <>
      <EspaceHeader role="Espace établissement" titre="Fonctions Premium" sousTitre="Visite 3D, réservation en ligne et rapport mensuel IA." />
      <div className="container-page grid gap-5 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Bloc titre="Visite virtuelle 3D" icone={<Rotate3d className="size-5" aria-hidden />}>
            {premiumActif && dossier ? (
              <form onSubmit={enregistrer} className="space-y-4">
                <p className="text-sm text-muted">
                  Collez le lien de partage de votre visite ({Object.values(HOTES_3D).join(", ")}). Elle s&apos;affiche sur votre fiche, chargée uniquement à la demande du visiteur.
                </p>
                <div>
                  <label htmlFor="lien-3d" className="label">
                    Lien de la visite
                  </label>
                  <input id="lien-3d" className="input" inputMode="url" placeholder="https://my.matterport.com/show/?m=…" value={valeur} onChange={(e) => (setLien(e.target.value), setMessage(null))} />
                </div>
                {message && <p className={message.ok ? "flex items-center gap-1.5 text-sm font-medium text-success-dark" : "text-sm font-medium text-ink"}>{message.ok && <Check className="size-4" aria-hidden />}{message.texte}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => (setLien(VISITE_DEMO), setMessage(null))}>
                    Utiliser la visite de démonstration
                  </button>
                </div>
                {dossier.visite3d && !("erreur" in analyserLien3D(dossier.visite3d)) && (
                  <div>
                    <p className="label">Aperçu sur votre fiche</p>
                    <Visite3D lien={dossier.visite3d} nom={dossier.nom} />
                  </div>
                )}
              </form>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-muted">
                  <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  Réservé aux établissements admis avec un pack Premium actif.
                </p>
                <Link href="/pro/abonnement" className="btn btn-primary shrink-0">
                  Passer en Premium
                </Link>
              </div>
            )}
          </Bloc>
          <div className="grid gap-4 sm:grid-cols-2">
            {cartes.map(({ href, titre, texte, Icone }) => (
              <Link key={href} href={href} className="group card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <Icone className="size-7 text-primary" aria-hidden />
                <p className="mt-3 font-display font-semibold text-ink group-hover:text-primary">{titre}</p>
                <p className="mt-1 flex-1 text-sm text-muted">{texte}</p>
                <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                  Ouvrir <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Bloc titre="Votre statut">
            <p className="text-sm text-ink">{premiumActif ? "Pack Premium actif : toutes les fonctions sont disponibles." : "Pas de pack Premium actif."}</p>
            <p className="mt-2 text-xs text-muted">Les fonctions Premium améliorent votre visibilité. Elles n&apos;ont aucun effet sur votre note de gouvernance.</p>
          </Bloc>
        </div>
      </div>
    </>
  );
}
