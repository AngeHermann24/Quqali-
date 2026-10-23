"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { CLES, maintenant } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { COMPTES_DEMO, nouveauComptePro } from "@/lib/pro-demo";
import type { ComptePro } from "@/lib/pro-demo";
import type { Dossier } from "@/lib/espace";
import { Logo } from "@/components/logo";
import { Chargement } from "@/components/espace/ui";
import { cn } from "@/lib/site";

type Etape = "choix" | "tel" | "code" | "identite";

export function ConnexionPro() {
  const router = useRouter();
  const [compte, setCompte] = useStockage<ComptePro>(CLES.comptePro);
  const [, setDossier] = useStockage<Dossier>(CLES.dossier);

  const [etape, setEtape] = useState<Etape>("choix");
  const [tel, setTel] = useState("");
  const [code, setCode] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState("");
  const [responsable, setResponsable] = useState("");
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState("");

  if (compte === undefined) return <Chargement />;

  const entrerDemo = (demoId: string) => {
    const demo = COMPTES_DEMO.find((c) => c.id === demoId)!;
    setDossier(demo.dossier());
    setCompte({ tel: demo.tel, responsable: demo.responsable, role: "gerant", demoId, creeLe: maintenant() });
    router.push("/pro");
  };

  const entrerNouveau = () => {
    setCompte(nouveauComptePro(`+225 ${tel}`, responsable));
    setDossier(null);
    router.push("/pro/parcours");
  };

  const buzz = () => navigator.vibrate?.(10);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-8">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Pro</span>
      </div>

      {etape === "choix" && (
        <div className="[animation:monte_.4s_ease_both] mt-8">
          <h1 className="font-display text-3xl leading-tight font-extrabold text-ink">
            Bienvenue sur votre espace <span className="text-primary">établissement</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Certification, audit, abonnement, avis et réservations — tout se pilote ici.</p>

          <div className="mt-6 space-y-3">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Comptes de démonstration</p>
            {COMPTES_DEMO.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  buzz();
                  entrerDemo(c.id);
                }}
                className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.98] hover:border-primary/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{c.etablissement}</span>
                  <span className="block text-xs text-muted">
                    {c.secteur} · {c.situation}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Nouvel établissement</p>
            <button
              type="button"
              onClick={() => {
                buzz();
                setEtape("tel");
              }}
              className="btn btn-primary mt-3 w-full"
            >
              Créer mon compte établissement
            </button>
          </div>
        </div>
      )}

      {etape === "tel" && (
        <div className="[animation:monte_.4s_ease_both] mt-8">
          <h1 className="font-display text-3xl font-extrabold text-ink">Votre téléphone</h1>
          <p className="mt-2 text-sm text-muted">Un code de vérification à 4 chiffres vous est envoyé par SMS.</p>
          <label htmlFor="tel-pro" className="label mt-6">
            Numéro de téléphone
          </label>
          <div className="flex gap-2">
            <span className="grid h-12 w-20 shrink-0 place-items-center rounded-xl border border-line bg-surface font-bold text-ink">+225</span>
            <input
              id="tel-pro"
              inputMode="tel"
              autoFocus
              placeholder="07 00 00 00 00"
              value={tel}
              onChange={(e) => setTel(e.target.value.replace(/[^\d ]/g, "").slice(0, 14))}
              className="input h-12 flex-1 text-lg font-semibold"
            />
          </div>
          <button
            type="button"
            disabled={tel.replace(/\D/g, "").length < 8}
            onClick={() => {
              setCodeEnvoye(String(Math.floor(1000 + Math.random() * 9000)));
              setCode("");
              setEtape("code");
            }}
            className="btn btn-primary mt-5 w-full disabled:opacity-40"
          >
            <Phone className="size-4" aria-hidden /> Recevoir le code
          </button>
          <Retour onClick={() => setEtape("choix")} />
        </div>
      )}

      {etape === "code" && (
        <div className="[animation:monte_.4s_ease_both] mt-8">
          <h1 className="font-display text-3xl font-extrabold text-ink">Code de vérification</h1>
          <p className="mt-2 text-sm text-muted">Envoyé au +225 {tel}</p>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-soft/60 p-3 text-sm text-ink">
            <span className="font-semibold">SMS reçu —</span> Votre code Quqliter Pro : <span className="font-display text-lg font-bold tracking-widest text-primary">{codeEnvoye}</span>{" "}
            <span className="text-xs text-muted">(simulation)</span>
          </div>
          <div className="mt-5 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("grid size-14 place-items-center rounded-2xl border-2 font-display text-2xl font-bold", code[i] ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-muted")}>
                {code[i] ?? "·"}
              </span>
            ))}
          </div>
          <input
            aria-label="Code à 4 chiffres"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setCode(v);
              setErreur("");
              if (v.length === 4) {
                if (v === codeEnvoye) {
                  buzz();
                  setEtape("identite");
                } else {
                  setErreur("Code incorrect, réessayez.");
                  setCode("");
                }
              }
            }}
            className="absolute h-px w-px opacity-0"
          />
          {erreur && <p className="mt-3 text-center text-sm font-semibold text-red-600">{erreur}</p>}
          <p className="mt-4 text-center text-xs text-muted">Saisissez les 4 chiffres du SMS</p>
          <Retour onClick={() => setEtape("tel")} />
        </div>
      )}

      {etape === "identite" && (
        <div className="[animation:monte_.4s_ease_both] mt-8">
          <h1 className="font-display text-3xl font-extrabold text-ink">Votre compte gérant</h1>
          <p className="mt-2 text-sm text-muted">Une seule fois. Vous resterez connecté sur ce téléphone.</p>
          <label htmlFor="resp-pro" className="label mt-6">
            Nom du responsable
          </label>
          <input id="resp-pro" autoFocus placeholder="Ex : Aya Koné" value={responsable} onChange={(e) => setResponsable(e.target.value)} className="input h-12" />
          <label htmlFor="pin-pro" className="label mt-4">
            Code PIN (4 chiffres) <span className="font-normal text-muted">— verrouillage rapide</span>
          </label>
          <input id="pin-pro" inputMode="numeric" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="input h-12" />
          <button
            type="button"
            disabled={responsable.trim().length < 2 || pin.length < 4}
            onClick={() => {
              buzz();
              entrerNouveau();
            }}
            className="btn btn-primary mt-5 w-full disabled:opacity-40"
          >
            <KeyRound className="size-4" aria-hidden /> Créer mon compte
          </button>
          <Retour onClick={() => setEtape("code")} />
        </div>
      )}

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-8 text-center text-[11px] text-muted">
        <ShieldCheck className="size-3.5" aria-hidden /> Espace réservé aux établissements — données de démonstration
      </p>
    </div>
  );
}

function Retour({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-muted">
      <ArrowLeft className="size-4" aria-hidden /> Retour
    </button>
  );
}
