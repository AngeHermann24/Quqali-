"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Building2, Fingerprint, Globe, LogOut, Moon, UserPlus, Users } from "lucide-react";
import { CLES, type Dossier } from "@/lib/espace";
import { useStockage } from "@/lib/stockage";
import { ROLES_PRO, type ComptePro } from "@/lib/pro-demo";
import { Bloc, Chargement, EspaceHeader, Pastille } from "@/components/espace/ui";
import { SECTEURS } from "@/lib/data";

const UTILISATEURS_DEMO = [
  { nom: "Vous", role: "gerant" as const },
  { nom: "Adjoua (salle)", role: "responsable" as const },
  { nom: "Koffi (compta)", role: "comptable" as const },
];

export function ProfilPro() {
  const router = useRouter();
  const [compte, setCompte] = useStockage<ComptePro>(CLES.comptePro);
  const [dossier] = useStockage<Dossier>(CLES.dossier);
  const [ajoute, setAjoute] = useState<string[]>([]);
  if (compte === undefined) return <Chargement />;

  const utilisateurs = [...UTILISATEURS_DEMO.map((u) => ({ ...u, nom: u.nom === "Vous" ? `${compte?.responsable ?? "Vous"} (vous)` : u.nom })), ...ajoute.map((n, i) => ({ nom: n, role: (["responsable", "comptable"] as const)[i % 2] }))];

  return (
    <>
      <EspaceHeader role="Profil" titre={compte?.responsable ?? "Mon compte"} sousTitre={compte?.tel} />
      <div className="container-page max-w-2xl space-y-5 py-6">
        {dossier && (
          <Bloc titre="Établissement" icone={<Building2 className="size-5" aria-hidden />}>
            <dl className="space-y-2 text-sm">
              <Ligne label="Nom" valeur={dossier.nom} />
              <Ligne label="Secteur" valeur={`${SECTEURS[dossier.secteur].nom} · ${dossier.sousType}`} />
              <Ligne label="Adresse" valeur={`${dossier.adresse}, ${dossier.quartier}, ${dossier.commune}`} />
              <Ligne label="Responsable légal" valeur={`${dossier.responsable.nom} — ${dossier.responsable.fonction}`} />
            </dl>
          </Bloc>
        )}

        <Bloc
          titre="Utilisateurs et rôles"
          icone={<Users className="size-5" aria-hidden />}
          action={
            <button
              type="button"
              className="btn btn-outline px-3 py-1.5 text-xs"
              onClick={() => {
                const nom = window.prompt("Nom du nouvel utilisateur ?");
                if (nom?.trim()) setAjoute([...ajoute, nom.trim()]);
              }}
            >
              <UserPlus className="size-3.5" aria-hidden /> Ajouter
            </button>
          }
        >
          <ul className="space-y-2.5">
            {utilisateurs.map((u) => (
              <li key={u.nom} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{u.nom}</span>
                  <span className="text-xs text-muted">{ROLES_PRO[u.role].droits}</span>
                </span>
                <Pastille ton={u.role === "gerant" ? "succes" : "neutre"}>{ROLES_PRO[u.role].label}</Pastille>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre="Paramètres">
          <ul className="divide-y divide-line text-sm">
            {[
              { Icon: Bell, label: "Notifications push, SMS et e-mail", etat: "Activées" },
              { Icon: Fingerprint, label: "Verrouillage (empreinte / PIN)", etat: "PIN actif" },
              { Icon: Globe, label: "Langue", etat: "Français" },
              { Icon: Moon, label: "Mode sombre", etat: "Bientôt" },
            ].map(({ Icon, label, etat }) => (
              <li key={label} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3 font-medium text-ink">
                  <Icon className="size-4 text-primary" aria-hidden /> {label}
                </span>
                <span className="text-xs text-muted">{etat}</span>
              </li>
            ))}
          </ul>
        </Bloc>

        <button
          type="button"
          className="btn btn-outline w-full border-red-200 text-red-600"
          onClick={() => {
            setCompte(null);
            router.push("/pro/connexion");
          }}
        >
          <LogOut className="size-4" aria-hidden /> Se déconnecter
        </button>
      </div>
    </>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{valeur}</dd>
    </div>
  );
}
