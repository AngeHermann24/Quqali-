"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Building2, Fingerprint, Globe, LogOut, Moon, Trash2, UserPlus, Users } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { SECTEURS } from "@/lib/data";
import { ROLES_PRO, type ComptePro } from "@/lib/pro-demo";
import { cn } from "@/lib/site";
import { useStockage } from "@/lib/stockage";
import { Chargement } from "@/components/espace/ui";
import { EntetePro, PanneauBas, ToastPro } from "@/components/pro/ui";

interface Membre {
  nom: string;
  tel: string;
  role: ComptePro["role"];
}

const TEL_VALIDE = /^\+225\s?(\d{2}\s?){4}\d{2}$/;

function Interrupteur({ actif, onChange, label }: { actif: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={onChange}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition", actif ? "bg-success" : "bg-line")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", actif ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ProfilPro() {
  const router = useRouter();
  const [compte, setCompte] = useStockage<ComptePro | null>(CLES.comptePro);
  const [dossier, setDossier] = useStockage<Dossier | null>(CLES.dossier);
  const [equipe, setEquipe] = useStockage<Membre[]>(CLES.equipePro);
  const [sombre, setSombre] = useStockage<boolean>(CLES.sombrePro);
  const [notifs, setNotifs] = useState(true);
  const [pin, setPin] = useState(true);
  const [inviter, setInviter] = useState(false);
  const [supprimer, setSupprimer] = useState(false);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("+225 ");
  const [role, setRole] = useState<ComptePro["role"]>("responsable");
  const [toast, setToast] = useState("");

  if (compte === undefined || dossier === undefined || equipe === undefined || sombre === undefined) return <Chargement />;

  const membres: Membre[] = [{ nom: `${compte?.responsable ?? "Vous"} (vous)`, tel: compte?.tel ?? "", role: "gerant" }, ...(equipe ?? [])];
  const invitationValide = nom.trim().length >= 3 && TEL_VALIDE.test(tel.trim());

  const envoyer = () => {
    if (!invitationValide) return;
    setEquipe((p) => [...(p ?? []), { nom: nom.trim(), tel: tel.trim(), role }]);
    setInviter(false);
    setNom("");
    setTel("+225 ");
    setRole("responsable");
    setToast(`Invitation envoyée à ${nom.trim()} par SMS.`);
  };

  const supprimerCompte = () => {
    setCompte(null);
    setDossier(null);
    router.push("/pro/connexion");
  };

  return (
    <>
      <EntetePro titre="Profil" />
      <div className="space-y-4 px-5 pb-6">
        {/* Responsable */}
        <div className="flex items-center gap-3.5 rounded-3xl border border-line bg-white p-4 shadow-card">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-white">{(compte?.responsable ?? "Q")[0]}</span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-ink">{compte?.responsable}</p>
            <p className="text-xs text-muted">{compte?.tel} · {ROLES_PRO[compte?.role ?? "gerant"].label}</p>
          </div>
        </div>

        {/* Établissement */}
        {dossier && (
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Building2 className="size-4 text-primary" aria-hidden /> Établissement</p>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Nom", dossier.nom],
                ["Secteur", `${SECTEURS[dossier.secteur].nom} · ${dossier.sousType}`],
                ["Adresse", `${dossier.adresse}, ${dossier.quartier}, ${dossier.commune}`],
                ["Responsable légal", `${dossier.responsable.nom} — ${dossier.responsable.fonction}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="text-right font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Équipe */}
        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Users className="size-4 text-primary" aria-hidden /> Équipe</p>
            <button type="button" onClick={() => setInviter(true)} className="flex items-center gap-1.5 rounded-xl bg-bleu px-3 py-2 text-xs font-bold text-white transition active:scale-95">
              <UserPlus className="size-3.5" aria-hidden /> Inviter
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {membres.map((m) => (
              <li key={`${m.nom}-${m.tel}`} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface font-display text-sm font-bold text-primary">{m.nom[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{m.nom}</span>
                  <span className="text-[11px] text-muted">{m.tel} · {ROLES_PRO[m.role].droits.split(":")[0]}</span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", m.role === "gerant" ? "bg-success-soft text-success" : "bg-surface text-muted")}>{ROLES_PRO[m.role].label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Réglages */}
        <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <ul className="divide-y divide-line">
            <li className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3 text-sm font-semibold text-ink"><Bell className="size-4 text-primary" aria-hidden /> Notifications push, SMS et e-mail</span>
              <Interrupteur actif={notifs} onChange={() => setNotifs(!notifs)} label="Notifications" />
            </li>
            <li className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3 text-sm font-semibold text-ink"><Fingerprint className="size-4 text-primary" aria-hidden /> Verrouillage (empreinte / PIN)</span>
              <Interrupteur actif={pin} onChange={() => setPin(!pin)} label="Verrouillage" />
            </li>
            <li className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3 text-sm font-semibold text-ink"><Globe className="size-4 text-primary" aria-hidden /> Langue</span>
              <span className="text-xs font-semibold text-muted">Français</span>
            </li>
            <li className="flex items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3 text-sm font-semibold text-ink"><Moon className="size-4 text-primary" aria-hidden /> Mode sombre</span>
              <Interrupteur actif={sombre ?? false} onChange={() => setSombre(!sombre)} label="Mode sombre" />
            </li>
          </ul>
        </section>

        {/* Session */}
        <button
          type="button"
          onClick={() => {
            setCompte(null);
            router.push("/pro/connexion");
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger/40 font-bold text-danger transition active:scale-[0.98]"
        >
          <LogOut className="size-4" aria-hidden /> Se déconnecter
        </button>
        <button type="button" onClick={() => setSupprimer(true)} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-muted">
          <Trash2 className="size-3.5" aria-hidden /> Supprimer mon compte
        </button>
      </div>

      {/* Inviter un utilisateur */}
      <PanneauBas ouvert={inviter} titre="Inviter un utilisateur" onFermer={() => setInviter(false)}>
        <p className="text-sm text-muted">La personne recevra un SMS d&apos;invitation à rejoindre votre établissement.</p>
        <div className="mt-3 space-y-3">
          <input className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Nom complet" />
          <input className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-bleu" placeholder="+225 07 00 00 00 00" value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" aria-label="Numéro de téléphone" />
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted uppercase">Rôle</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLES_PRO) as ComptePro["role"][]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r} className={cn("rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition", role === r ? "border-bleu bg-primary-soft text-bleu" : "border-line text-muted")}>
                  {ROLES_PRO[r].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted">{ROLES_PRO[role].droits}</p>
          </div>
        </div>
        <button type="button" onClick={envoyer} disabled={!invitationValide} className="mt-4 h-12 w-full rounded-2xl bg-success font-bold text-white transition active:scale-[0.98] disabled:bg-line disabled:text-muted">
          Envoyer l&apos;invitation
        </button>
      </PanneauBas>

      {/* Suppression */}
      <PanneauBas ouvert={supprimer} titre="Supprimer le compte" onFermer={() => setSupprimer(false)}>
        <p className="text-sm text-muted">Cette action retire l&apos;accès de tous les utilisateurs et masque votre fiche publique. Les données de certification sont conservées 12 mois puis anonymisées.</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setSupprimer(false)} className="h-12 rounded-2xl border-2 border-line font-bold text-muted">Annuler</button>
          <button type="button" onClick={supprimerCompte} className="h-12 rounded-2xl bg-danger font-bold text-white">Supprimer</button>
        </div>
      </PanneauBas>

      <ToastPro visible={!!toast} message={toast} />
    </>
  );
}
