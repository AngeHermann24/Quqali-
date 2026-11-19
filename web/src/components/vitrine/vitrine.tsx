"use client";

import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Star, Store } from "lucide-react";
import { LogoApp } from "@/components/app/logo-app";

const LIENS = {
  googlePlay: "https://play.google.com/store",
  appStore: "https://www.apple.com/app-store",
};

function BoutonStore({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur transition hover:bg-white/20"
    >
      <Store className="size-7 shrink-0 text-white" aria-hidden />
      <span className="text-left">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70">{detail}</span>
        <span className="block font-display text-base font-bold text-white">{label}</span>
      </span>
      <ArrowRight className="ml-auto size-5 text-white/60 transition group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
    </a>
  );
}

/** Vitrine du domaine principal : présentation + renvoi vers les stores (modèle Yango). */
export function Vitrine() {
  return (
    <div className="min-h-dvh bg-[#0A1730] text-white">
      {/* Hero */}
      <header className="container-page flex items-center justify-between py-5">
        <LogoApp imgClassName="h-11" />
        <span className="chip border border-white/20 bg-white/10 text-white">Abidjan, Côte d&apos;Ivoire</span>
      </header>

      <section className="container-page pb-16 pt-10 text-center">
        <p className="mx-auto max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Qualité<span className="text-[#4ADE80]">+</span>, le meilleur rapport qualité prix
        </p>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
          Découvrez les établissements d&apos;Abidjan audités et certifiés par des professionnels. Réservez, notez, choisissez en confiance.
        </p>

        <div className="mx-auto mt-9 grid max-w-md gap-3">
          <BoutonStore href={LIENS.googlePlay} label="Qualité+" detail="Disponible sur Google Play — Clients" />
          <BoutonStore href={LIENS.googlePlay} label="Qualité+ Pro" detail="Disponible sur Google Play — Établissements" />
        </div>
        <p className="mt-4 text-xs text-white/50">Bientôt sur l&apos;App Store — inscrivez-vous pour être informé.</p>
      </section>

      {/* Chiffres */}
      <section className="border-y border-white/10 bg-white/5">
        <div className="container-page grid grid-cols-3 gap-4 py-8 text-center">
          {[
            ["80 %", "seuil de certification"],
            ["3", "niveaux de badge"],
            ["7", "secteurs couverts"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-2xl font-extrabold text-[#4ADE80] sm:text-3xl">{n}</p>
              <p className="mt-1 text-xs text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-14">
        <h2 className="text-center font-display text-2xl font-bold">Comment ça marche</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { Icon: BadgeCheck, titre: "Audit certifié", texte: "Chaque établissement est audité sur le terrain selon une grille qualité commune." },
            { Icon: Star, titre: "Badge de confiance", texte: "Excellent, Bon ou À améliorer — le niveau est visible sur chaque fiche." },
            { Icon: ShieldCheck, titre: "Réservez sereinement", texte: "Réservation en ligne, avis vérifiés, notifications en temps réel." },
          ].map(({ Icon, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Icon className="size-6 text-[#4ADE80]" aria-hidden />
              <p className="mt-3 font-display font-bold">{titre}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Espace pro */}
      <section className="container-page pb-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1E3A8A] to-[#0A1730] p-7 text-center sm:p-10">
          <Building2 className="mx-auto size-8 text-[#4ADE80]" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-bold">Vous êtes un établissement ?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Faites auditer votre établissement, décrochez le badge Qualité+ et attirez des clients qui ont confiance.
          </p>
          <div className="mx-auto mt-6 grid max-w-xs gap-3">
            <BoutonStore href={LIENS.googlePlay} label="Qualité+ Pro" detail="Espace professionnel" />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Qualité+ — Abidjan, Côte d&apos;Ivoire
      </footer>
    </div>
  );
}
