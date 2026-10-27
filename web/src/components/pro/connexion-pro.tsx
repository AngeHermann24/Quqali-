"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Phone, ShieldCheck } from "lucide-react";
import { CLES, maintenant } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { COMPTES_DEMO, nouveauComptePro } from "@/lib/pro-demo";
import type { ComptePro } from "@/lib/pro-demo";
import type { Dossier } from "@/lib/espace";
import { Chargement } from "@/components/espace/ui";
import { LogoProCartouche } from "@/components/pro/ui";
import { cn } from "@/lib/site";

type Mode = "connexion" | "inscription";
const DELAI_RENVOI = 58;

/** Écran 1 — Connexion / Inscription de l'app Pro (fond bleu, carte à onglets, SMS). */
export function ConnexionPro() {
  const router = useRouter();
  const [compte, setCompte] = useStockage<ComptePro>(CLES.comptePro);
  const [, setDossier] = useStockage<Dossier>(CLES.dossier);

  const [mode, setMode] = useState<Mode>("inscription");
  const [tel, setTel] = useState("");
  const [code, setCode] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState("");
  const [responsable, setResponsable] = useState("");
  const [renvoi, setRenvoi] = useState(0);
  const [erreur, setErreur] = useState("");
  const [demos, setDemos] = useState(false);

  useEffect(() => {
    if (renvoi <= 0) return;
    const t = setTimeout(() => setRenvoi(renvoi - 1), 1000);
    return () => clearTimeout(t);
  }, [renvoi]);

  useEffect(() => {
    if (compte) router.replace("/pro");
  }, [compte, router]);

  if (compte === undefined) return <Chargement />;

  const telOk = tel.replace(/\D/g, "").length >= 10;
  const codeOk = code.length === 4;
  const pret = telOk && codeOk && (mode === "connexion" || responsable.trim().length >= 2);

  const buzz = () => navigator.vibrate?.(10);

  const envoyerCode = () => {
    setCodeEnvoye(String(Math.floor(1000 + Math.random() * 9000)));
    setCode("");
    setErreur("");
    setRenvoi(DELAI_RENVOI);
  };

  const soumettre = () => {
    buzz();
    if (!codeEnvoye) return setErreur("Touchez « Recevoir le code » pour obtenir votre SMS.");
    if (code !== codeEnvoye) {
      setErreur("Code incorrect, réessayez.");
      setCode("");
      return;
    }
    if (mode === "inscription") {
      setCompte(nouveauComptePro(`+225 ${tel}`, responsable));
      setDossier(null);
      router.push("/pro/parcours");
    } else {
      setCompte({ tel: `+225 ${tel}`, responsable: responsable || "Gérant", role: "gerant", creeLe: maintenant() });
      router.push("/pro");
    }
  };

  const entrerDemo = (demoId: string) => {
    const demo = COMPTES_DEMO.find((c) => c.id === demoId)!;
    setDossier(demo.dossier());
    setCompte({ tel: demo.tel, responsable: demo.responsable, role: "gerant", demoId, creeLe: maintenant() });
    router.push("/pro");
  };

  const mmss = `${String(Math.floor(renvoi / 60)).padStart(2, "0")}:${String(renvoi % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-primary via-primary-dark to-nuit px-6 pt-14 pb-8">
      <div className="flex flex-col items-center text-center [animation:monte_.5s_ease_both]">
        <LogoProCartouche />
        <h1 className="mt-8 font-display text-3xl font-extrabold text-white">Bienvenue&nbsp;!</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/75">Connectez-vous pour gérer votre établissement et votre certification.</p>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-flottant [animation:monte_.5s_.15s_ease_both]">
        {/* Onglets Connexion / Inscription */}
        <div className="grid grid-cols-2 rounded-2xl bg-surface p-1" role="tablist">
          {(["connexion", "inscription"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setErreur("");
              }}
              className={cn("h-10 rounded-xl text-sm font-bold transition", mode === m ? "bg-white text-primary shadow-card" : "text-muted")}
            >
              {m === "connexion" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="tel-pro" className="label">
              Numéro de téléphone
            </label>
            <div className="flex gap-2">
              <span className="grid h-12 w-[4.5rem] shrink-0 place-items-center rounded-xl border border-line bg-surface text-sm font-bold text-ink">+225</span>
              <input
                id="tel-pro"
                inputMode="tel"
                autoFocus
                placeholder="07 00 00 00 00"
                value={tel}
                onChange={(e) => setTel(e.target.value.replace(/[^\d ]/g, "").slice(0, 14))}
                className="input h-12 flex-1 font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="code-pro" className="label">
                Code SMS
              </label>
              <button type="button" onClick={envoyerCode} disabled={!telOk || renvoi > 0} className="text-xs font-bold text-bleu disabled:text-muted">
                {codeEnvoye ? (renvoi > 0 ? `Renvoyer (${mmss})` : "Renvoyer le code") : "Recevoir le code"}
              </button>
            </div>
            <input
              id="code-pro"
              inputMode="numeric"
              placeholder="Entrer le code reçu"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                setErreur("");
              }}
              className="input h-12 font-semibold tracking-widest"
            />
            {codeEnvoye && (
              <p className="mt-1.5 rounded-lg bg-primary-soft px-2.5 py-1.5 text-[11px] text-ink">
                SMS reçu — code Qualité+ Pro : <span className="font-display font-bold tracking-widest text-primary">{codeEnvoye}</span>{" "}
                <span className="text-muted">(simulation)</span>
              </p>
            )}
          </div>

          {mode === "inscription" && (
            <div>
              <label htmlFor="resp-pro" className="label">
                Nom du responsable
              </label>
              <input id="resp-pro" placeholder="Ex : Aya Koné" value={responsable} onChange={(e) => setResponsable(e.target.value)} className="input h-12" />
            </div>
          )}

          {erreur && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              {erreur}
            </p>
          )}

          <button type="button" disabled={!pret} onClick={soumettre} className="btn btn-success h-13 w-full text-base disabled:opacity-40">
            <Phone className="size-4" aria-hidden /> {mode === "inscription" ? "Créer mon compte" : "Se connecter"}
          </button>

          <p className="text-center text-xs text-muted">
            {mode === "inscription" ? (
              <>
                Déjà un compte ?{" "}
                <button type="button" onClick={() => setMode("connexion")} className="font-bold text-bleu">
                  Se connecter
                </button>
              </>
            ) : (
              <>
                Pas encore de compte ?{" "}
                <button type="button" onClick={() => setMode("inscription")} className="font-bold text-bleu">
                  Créer mon compte
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Accès démonstration */}
      <div className="mt-6 text-center [animation:monte_.5s_.3s_ease_both]">
        <button type="button" onClick={() => setDemos((d) => !d)} className="text-xs font-semibold text-white/60 underline underline-offset-2">
          {demos ? "Masquer la démonstration" : "Explorer avec un compte de démonstration"}
        </button>
        {demos && (
          <div className="mt-3 space-y-2 text-left">
            {COMPTES_DEMO.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => entrerDemo(c.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left backdrop-blur transition active:scale-[0.98]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{c.etablissement}</span>
                  <span className="block text-[11px] text-white/60">{c.situation}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-white/60" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-[11px] text-white/50">
        <ShieldCheck className="size-3.5" aria-hidden /> Espace réservé aux établissements — Ensemble pour la qualité !
      </p>
    </div>
  );
}
