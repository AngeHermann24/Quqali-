"use client";

import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Star, Store } from "lucide-react";
import { LogoApp } from "@/components/app/logo-app";

const LIENS = {
  googlePlay: "https://play.google.com/store",
  appStore: "https://www.apple.com/app-store",
};

function BoutonStore({ href, label, detail, inverse }: { href: string; label: string; detail: string; inverse?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        inverse
          ? "group flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-lg transition hover:bg-white/90"
          : "group flex items-center gap-3.5 rounded-2xl bg-primary px-5 py-4 text-white shadow-lg transition hover:bg-[#16296B]"
      }
    >
      <Store className={inverse ? "size-7 shrink-0 text-primary" : "size-7 shrink-0 text-white"} aria-hidden />
      <span className="text-left">
        <span className={`block text-[11px] font-semibold uppercase tracking-wider ${inverse ? "text-primary/70" : "text-white/70"}`}>{detail}</span>
        <span className="block font-display text-base font-bold">{label}</span>
      </span>
      <ArrowRight className={`ml-auto size-5 transition group-hover:translate-x-0.5 rtl:-scale-x-100 ${inverse ? "text-primary/60" : "text-white/60"}`} aria-hidden />
    </a>
  );
}

/** Vitrine du domaine principal : charte Qualité+ (bleu roi / vert / surface) + hero photo Abidjan. */
export function Vitrine() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      {/* Header */}
      <header className="bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <LogoApp imgClassName="h-11" />
          <span className="chip bg-primary-soft text-primary">Abidjan, Côte d&apos;Ivoire</span>
        </div>
      </header>

      {/* Hero : photo skyline + slogan + stores */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cocody.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgb(30 58 138 / 0.55) 0%, rgb(10 23 48 / 0.88) 100%)" }} />
        <div className="container-page relative pb-16 pt-14 text-center sm:pt-20">
          <p className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Qualité<span className="text-[#4ADE80]">+</span>
          </p>
          <p className="mt-2 font-display text-lg font-semibold text-[#C7D2FE] sm:text-xl">le meilleur rapport qualité prix</p>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
            Les établissements d&apos;Abidjan audités et certifiés par des professionnels. Réservez, notez, choisissez en confiance.
          </p>
          <div className="mx-auto mt-8 grid max-w-md gap-3">
            <BoutonStore inverse href={LIENS.googlePlay} label="Qualité+" detail="Google Play — Clients" />
            <BoutonStore href={LIENS.googlePlay} label="Qualité+ Pro" detail="Google Play — Établissements" />
          </div>
          <p className="mt-4 text-xs text-white/50">Bientôt sur l&apos;App Store — inscrivez-vous pour être informé.</p>
        </div>
      </section>

      {/* Chiffres */}
      <section className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-3 gap-4 py-8 text-center">
          {[
            ["80 %", "seuil de certification"],
            ["3", "niveaux de badge"],
            ["7", "secteurs couverts"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{n}</p>
              <p className="mt-1 text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-14">
        <h2 className="text-center font-display text-2xl font-bold text-ink">Comment ça marche</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { Icon: BadgeCheck, titre: "Audit certifié", texte: "Chaque établissement est audité sur le terrain selon une grille qualité commune.", ton: "bg-primary-soft text-primary" },
            { Icon: Star, titre: "Badge de confiance", texte: "Excellent, Bon ou À améliorer — le niveau est visible sur chaque fiche.", ton: "bg-success-soft text-success" },
            { Icon: ShieldCheck, titre: "Réservez sereinement", texte: "Réservation en ligne, avis vérifiés, notifications en temps réel.", ton: "bg-primary-soft text-primary" },
          ].map(({ Icon, titre, texte, ton }) => (
            <div key={titre} className="rounded-2xl border border-line bg-white p-5">
              <span className={`grid size-11 place-items-center rounded-xl ${ton}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 font-display font-bold text-ink">{titre}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Espace pro */}
      <section className="container-page pb-20">
        <div className="rounded-3xl bg-primary p-7 text-center text-white sm:p-10">
          <Building2 className="mx-auto size-8 text-[#4ADE80]" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-bold">Vous êtes un établissement ?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Faites auditer votre établissement, décrochez le badge Qualité+ et attirez des clients qui ont confiance.
          </p>
          <div className="mx-auto mt-6 grid max-w-xs gap-3">
            <BoutonStore inverse href={LIENS.googlePlay} label="Qualité+ Pro" detail="Espace professionnel" />
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Qualité+ — Abidjan, Côte d&apos;Ivoire
      </footer>
    </div>
  );
}
