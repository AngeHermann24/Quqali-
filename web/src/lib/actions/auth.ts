"use server";

import { prisma } from "@/lib/db";
import { supabaseServeur } from "@/lib/supabase/serveur";

export type ResultatAuth = { ok: boolean; erreur?: string };

const traduireErreur = (msg: string) => {
  if (/invalid login|invalid credentials/i.test(msg)) return "E-mail ou mot de passe incorrect.";
  if (/already registered|already been registered/i.test(msg)) return "Un compte existe déjà avec cet e-mail.";
  if (/password/i.test(msg) && /short|least/i.test(msg)) return "Mot de passe trop court (6 caractères minimum).";
  return msg;
};

/** Inscription usager : compte Supabase Auth + profil applicatif (rôle « usager »). */
export async function inscriptionUsager(entree: { nom: string; email: string; telephone: string; motDePasse: string }): Promise<ResultatAuth> {
  const { nom, email, telephone, motDePasse } = entree;
  if (!nom.trim() || !email.includes("@") || motDePasse.length < 6) return { ok: false, erreur: "Vérifiez le nom, l'e-mail et le mot de passe (6 car. min)." };

  const supabase = await supabaseServeur();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: motDePasse,
    options: { data: { nom: nom.trim(), telephone: telephone.trim() } },
  });
  if (error) return { ok: false, erreur: traduireErreur(error.message) };
  if (!data.user) return { ok: false, erreur: "Inscription impossible, réessayez." };

  await prisma.profil.upsert({
    where: { id: data.user.id },
    update: { nom: nom.trim(), telephone: telephone.trim() },
    create: { id: data.user.id, email: email.trim().toLowerCase(), nom: nom.trim(), telephone: telephone.trim(), role: "usager" },
  });
  return { ok: true };
}

/** Connexion e-mail + mot de passe. */
export async function connexionUsager(entree: { email: string; motDePasse: string }): Promise<ResultatAuth> {
  const supabase = await supabaseServeur();
  const { error } = await supabase.auth.signInWithPassword({ email: entree.email.trim().toLowerCase(), password: entree.motDePasse });
  if (error) return { ok: false, erreur: traduireErreur(error.message) };
  return { ok: true };
}

/** Déconnexion. */
export async function deconnexion(): Promise<void> {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
}
