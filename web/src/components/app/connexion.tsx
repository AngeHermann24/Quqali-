"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, MessageSquareText, ShieldCheck } from "lucide-react";
import { telephoneNorm } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import { ecrireStockage } from "@/lib/stockage";
import { cn } from "@/lib/site";
import { LogoApp } from "@/components/app/logo-app";

const TEL_VALIDE = /^(\+?225)?[\s.-]?(01|05|07|27)([\s.-]?\d{2}){4}$/;

type Etape = "tel" | "code" | "prenom" | "bienvenue";

export function Connexion() {
  const router = useRouter();
  const params = useSearchParams();
  const suivant = params.get("suivant") ?? "/";

  const [etape, setEtape] = useState<Etape>("tel");
  const [tel, setTel] = useState("");
  const [erreur, setErreur] = useState("");
  const [codeEnvoye, setCodeEnvoye] = useState("");
  const [saisie, setSaisie] = useState(["", "", "", ""]);
  const [prenom, setPrenom] = useState("");
  const cases = useRef<(HTMLInputElement | null)[]>([]);

  const vibre = (m: number | number[]) => navigator.vibrate?.(m);

  const envoyerCode = () => {
    if (!TEL_VALIDE.test(tel.trim())) {
      setErreur("Numéro ivoirien invalide (ex. 07 00 00 00 00).");
      vibre([30, 30, 30]);
      return;
    }
    setErreur("");
    setCodeEnvoye(String(Math.floor(1000 + Math.random() * 9000)));
    setEtape("code");
    vibre(10);
  };

  const taperCode = (i: number, v: string) => {
    const chiffre = v.replace(/\D/g, "").slice(-1);
    const s = [...saisie];
    s[i] = chiffre;
    setSaisie(s);
    if (chiffre && i < 3) {
      cases.current[i + 1]?.focus();
      return;
    }
    const code = s.join("");
    if (code.length === 4) {
      if (code === codeEnvoye) {
        vibre([20, 50, 20]);
        setEtape("prenom");
      } else {
        setErreur("Code incorrect — réessayez.");
        setSaisie(["", "", "", ""]);
        vibre([30, 30, 30]);
        cases.current[0]?.focus();
      }
    }
  };
  const toucheCode = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !saisie[i] && i > 0) cases.current[i - 1]?.focus();
  };

  const terminer = () => {
    const nom = prenom.trim();
    if (nom.length < 2) {
      setErreur("Dites-nous au moins votre prénom.");
      return;
    }
    ecrireStockage(CLES.compte, {
      id: `c-${Date.now()}`,
      nom,
      telephone: `+225 ${telephoneNorm(tel)}`,
      creeLe: new Date().toISOString(),
    });
    vibre([20, 50, 20]);
    setEtape("bienvenue");
  };

  useEffect(() => {
    if (etape === "bienvenue") {
      const t = setTimeout(() => router.push(suivant), 1600);
      return () => clearTimeout(t);
    }
  }, [etape, router, suivant]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-10">
      <LogoApp imgClassName="h-11" />

      {etape === "tel" && (
        <>
          <h1 className="mt-10 font-display text-3xl font-extrabold text-ink">Bienvenue</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Votre numéro suffit : vous recevrez un code SMS à 4 chiffres. Une seule fois — ensuite vous restez connecté.
          </p>
          <label htmlFor="tel" className="label mt-8">
            Numéro de téléphone
          </label>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-3.5 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <span className="font-display font-bold whitespace-nowrap text-primary">+225</span>
            <input
              id="tel"
              inputMode="tel"
              autoFocus
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerCode()}
              placeholder="07 00 00 00 00"
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-wide outline-none"
            />
          </div>
          {erreur && <p className="mt-3 text-sm font-medium text-red-600">{erreur}</p>}
          <button type="button" onClick={envoyerCode} className="btn-hero mt-8 w-full">
            Recevoir le code
          </button>
          <Link href={suivant} className="mt-4 text-center text-sm font-semibold text-muted">
            Explorer sans compte
          </Link>
        </>
      )}

      {etape === "code" && (
        <>
          <span className="mt-10 grid size-14 place-items-center rounded-3xl bg-success-soft text-success">
            <MessageSquareText className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">Code reçu par SMS</h1>
          <p className="mt-2 text-[15px] text-muted">
            Envoyé au <strong className="text-ink">+225 {tel}</strong>
          </p>

          {/* SMS simulé pour la démo */}
          {codeEnvoye && (
            <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-surface p-3.5 text-sm text-ink">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong>Qualité+</strong> — votre code de connexion est <strong className="tracking-widest">{codeEnvoye}</strong>
              </span>
            </p>
          )}

          <div className="mt-7 flex gap-3" role="group" aria-label="Code à 4 chiffres">
            {saisie.map((v, i) => (
              <input
                key={i}
                ref={(el) => {
                  cases.current[i] = el;
                }}
                inputMode="numeric"
                autoFocus={i === 0}
                maxLength={1}
                value={v}
                onChange={(e) => taperCode(i, e.target.value)}
                onKeyDown={(e) => toucheCode(i, e)}
                aria-label={`Chiffre ${i + 1}`}
                className={cn(
                  "h-16 flex-1 rounded-2xl border-2 text-center font-display text-2xl font-extrabold outline-none transition",
                  v ? "border-success bg-success-soft" : "border-line focus:border-primary focus:ring-4 focus:ring-primary/10",
                )}
              />
            ))}
          </div>
          {erreur && <p className="mt-3 text-sm font-medium text-red-600">{erreur}</p>}
          <button type="button" onClick={() => setEtape("tel")} className="mt-8 text-sm font-semibold text-muted">
            ← Changer de numéro
          </button>
        </>
      )}

      {etape === "prenom" && (
        <>
          <h1 className="mt-10 font-display text-3xl font-extrabold text-ink">Une dernière chose</h1>
          <p className="mt-2 text-[15px] text-muted">Comment vous appelle-t-on ?</p>
          <label htmlFor="prenom" className="label mt-8">
            Prénom
          </label>
          <input
            id="prenom"
            autoFocus
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && terminer()}
            placeholder="Ex. Awa"
            className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3.5 text-lg font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {erreur && <p className="mt-3 text-sm font-medium text-red-600">{erreur}</p>}
          <button type="button" onClick={terminer} className="btn-hero mt-8 w-full">
            C&apos;est parti
          </button>
        </>
      )}

      {etape === "bienvenue" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="grid size-20 place-items-center rounded-full bg-success text-white shadow-survol">
            <svg viewBox="0 0 24 24" className="size-10" fill="none">
              <path
                d="M5 13l4 4 10-10"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="[stroke-dasharray:30] [stroke-dashoffset:30] [animation:coche_.5s_.1s_ease_forwards]"
              />
            </svg>
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">Bienvenue, {prenom.trim()}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <Check className="size-4 text-success" aria-hidden /> Vous êtes connecté·e — bonne découverte !
          </p>
          <p className="mt-6 flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-4 text-primary" aria-hidden /> Session active pendant 90 jours
          </p>
        </div>
      )}
    </div>
  );
}
