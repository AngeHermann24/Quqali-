"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, BadgeCheck, BrushCleaning, Check, ChevronRight, GraduationCap, MessageCircle, Phone, ShieldCheck, Wrench } from "lucide-react";
import { telephoneNorm } from "@/lib/avis";
import { CLES } from "@/lib/espace";
import { secteurPluriel, type CleStr } from "@/lib/langue";
import { useLangue } from "@/components/langue";
import { deposerDemandeService } from "@/lib/actions/usager";
import { useStockage } from "@/lib/stockage";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/site";

const TEL_QUALITE = "+2252700000000";
const WA_QUALITE = "2252700000000";

type Service = "menage" | "atelier";
type DemandeService = { id: string; service: Service; nom: string; tel: string; type: string; quartier: string; creeLe: string };

type ServiceConf = {
  id: Service;
  Icon: typeof BrushCleaning;
  titre: CleStr;
  sous: CleStr;
  pitch: CleStr;
  cta: CleStr;
  garanties: { Icon: typeof ShieldCheck; cle: CleStr }[];
  types: { id: string; cle: CleStr }[];
};

const SERVICES: ServiceConf[] = [
  {
    id: "menage",
    Icon: BrushCleaning,
    titre: "menageHeroTitre",
    sous: "menageHeroSous",
    pitch: "menagePitch",
    cta: "menageDemander",
    garanties: [
      { Icon: GraduationCap, cle: "menageG1" },
      { Icon: ShieldCheck, cle: "menageG2" },
      { Icon: BadgeCheck, cle: "menageG3" },
    ],
    types: [
      { id: "regulier", cle: "menageTypeRegulier" },
      { id: "ponctuel", cle: "menageTypePonctuel" },
      { id: "grand", cle: "menageTypeGrand" },
      { id: "repassage", cle: "menageTypeRepassage" },
    ],
  },
  {
    id: "atelier",
    Icon: Wrench,
    titre: "atelierTitre",
    sous: "atelierSous",
    pitch: "atelierPitch",
    cta: "atelierDemander",
    garanties: [
      { Icon: ShieldCheck, cle: "atelierG1" },
      { Icon: BadgeCheck, cle: "atelierG2" },
      { Icon: Check, cle: "atelierG3" },
    ],
    types: [
      { id: "mecanique", cle: "atTypeMecanique" },
      { id: "electricite", cle: "atTypeElectricite" },
      { id: "clim", cle: "atTypeClim" },
      { id: "groupe", cle: "atTypeGroupe" },
    ],
  },
];

export function ServicesAutre() {
  const { langue, t } = useLangue();
  const router = useRouter();
  const [, majDemandes] = useStockage<DemandeService[]>(CLES.demandesServices);
  const [panneau, setPanneau] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);
  const [erreur, setErreur] = useState(false);
  const [service, setService] = useState<Service>("menage");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [type, setType] = useState("regulier");
  const [quartier, setQuartier] = useState("");

  const ouvrir = (s: Service) => {
    setService(s);
    setType(SERVICES.find((x) => x.id === s)!.types[0].id);
    setErreur(false);
    setEnvoyee(false);
    setPanneau(true);
  };

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || telephoneNorm(tel).length < 8) {
      setErreur(true);
      return;
    }
    const demande: DemandeService = { id: `srv-${Date.now()}`, service, nom: nom.trim(), tel: tel.trim(), type, quartier: quartier.trim(), creeLe: new Date().toISOString() };
    majDemandes((p) => [...(p ?? []), demande]);
    void deposerDemandeService({ service: demande.service, type: demande.type, nom: demande.nom, telephone: demande.tel, quartier: demande.quartier }); // persistée en base quand Supabase est configuré
    setErreur(false);
    setEnvoyee(true);
  };

  const conf = SERVICES.find((s) => s.id === service)!;

  return (
    <div className="pb-8">
      {/* En-tête */}
      <header className="flex items-center justify-between px-5 pt-4">
        <button type="button" onClick={() => router.back()} aria-label={t.retour} className="grid size-10 place-items-center rounded-full text-ink transition active:scale-95">
          <ArrowLeft className="size-5 rtl:-scale-x-100" aria-hidden />
        </button>
        <h1 className="font-display text-lg font-extrabold text-ink">{secteurPluriel("services", langue)}</h1>
        <span className="size-10" aria-hidden />
      </header>

      <p className="px-5 pt-3 text-[13px] leading-snug text-muted">{t.autreIntro}</p>

      {/* Cartes prestations */}
      <div className="space-y-4 px-5 pt-4">
        {SERVICES.map(({ id, Icon, titre, sous, pitch, cta, garanties }) => (
          <section key={id} className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#2C4FB8] p-5 text-white shadow-flottant">
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">{t.menagePrestation}</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold leading-tight">{t[titre]}</h2>
            <p className="mt-0.5 text-[13px] font-semibold text-white/85">{t[sous]}</p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-white/90">{t[pitch]}</p>
            <ul className="mt-3.5 space-y-2">
              {garanties.map(({ Icon: GIcon, cle }) => (
                <li key={cle} className="flex items-center gap-2.5 text-[12.5px] font-medium text-white/90">
                  <GIcon className="size-4 shrink-0 text-emerald-300" aria-hidden />
                  {t[cle]}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => ouvrir(id)} className="mt-4 w-full rounded-2xl bg-white py-3 text-sm font-extrabold text-primary transition active:scale-95">
              {t[cta]}
            </button>
          </section>
        ))}
      </div>

      {/* Comment ça marche */}
      <section className="mx-5 mt-5 rounded-3xl border border-line bg-white p-4 shadow-card">
        <h3 className="font-display text-sm font-extrabold text-ink">{t.menageEtapes}</h3>
        <ol className="mt-3 space-y-3">
          {[t.menageE1, t.menageE2, t.menageE3].map((etape, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">{i + 1}</span>
              <p className="pt-1 text-[13px] leading-snug text-ink/80">{etape}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-2xl bg-surface px-3.5 py-2.5 text-[12px] font-medium leading-snug text-muted">{t.menageTarif}</p>
      </section>

      {/* Contact direct */}
      <div className="mx-5 mt-5 grid grid-cols-2 gap-2.5">
        <a href={`tel:${TEL_QUALITE}`} className="btn flex items-center justify-center gap-2 border border-line bg-white py-3 text-sm font-bold text-primary">
          <Phone className="size-4" aria-hidden /> {t.menageAppeler}
        </a>
        <a href={`https://wa.me/${WA_QUALITE}`} target="_blank" rel="noreferrer" className="btn flex items-center justify-center gap-2 border border-line bg-white py-3 text-sm font-bold text-success">
          <MessageCircle className="size-4" aria-hidden /> {t.menageWhatsapp}
        </a>
      </div>

      {/* Lien vers les établissements du secteur */}
      <Link href="/etablissements?secteur=services" className="mx-5 mt-5 flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3.5 shadow-card transition active:scale-[0.98]">
        <span className="text-sm font-semibold text-ink">{t.autreVoirEtabs}</span>
        <ChevronRight className="size-5 text-muted rtl:-scale-x-100" aria-hidden />
      </Link>

      {/* Formulaire de demande */}
      <Modal open={panneau} onClose={() => setPanneau(false)} title={t.menageFormTitre}>
        {envoyee ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-7" aria-hidden />
            </span>
            <p className="mt-4 font-display text-lg font-extrabold text-ink">{t.menageOkTitre}</p>
            <p className="mx-auto mt-1.5 max-w-60 text-sm text-muted">{t.menageOkDetail}</p>
            <button type="button" onClick={() => setPanneau(false)} className="btn-hero mt-6 w-full">
              {t.fermer}
            </button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="space-y-3.5">
            <div>
              <span className="mb-1.5 block text-xs font-bold text-ink">{t.demandeService}</span>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map(({ id, Icon, titre }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setService(id);
                      setType(SERVICES.find((x) => x.id === id)!.types[0].id);
                    }}
                    aria-pressed={service === id}
                    className={cn("flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[13px] font-bold transition active:scale-95", service === id ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-ink")}
                  >
                    <Icon className="size-4" aria-hidden /> {t[titre]}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">{t.menageNom}</span>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className="input w-full" autoComplete="name" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">{t.telephone}</span>
              <input value={tel} onChange={(e) => setTel(e.target.value)} className="input w-full" inputMode="tel" autoComplete="tel" placeholder="+225 07 00 00 00 00" />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-bold text-ink">{t.menageType}</span>
              <div className="grid grid-cols-2 gap-2">
                {conf.types.map(({ id, cle }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    aria-pressed={type === id}
                    className={cn("rounded-2xl border px-3 py-2.5 text-[13px] font-bold transition active:scale-95", type === id ? "border-primary bg-primary-soft text-primary" : "border-line bg-white text-ink")}
                  >
                    {t[cle]}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">{t.menageQuartier}</span>
              <input value={quartier} onChange={(e) => setQuartier(e.target.value)} className="input w-full" />
            </label>
            {erreur && <p className="text-xs font-semibold text-danger">{t.menageErreur}</p>}
            <button type="submit" className="btn-hero w-full">
              {t.menageEnvoyer}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
