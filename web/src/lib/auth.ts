import "server-only";
import { cache } from "react";
import type { Profil } from "@prisma/client";
import { prisma } from "@/lib/db";
import { supabaseServeur } from "@/lib/supabase/serveur";

export type Role = "usager" | "pro" | "admin" | "partenaire";

/** Usager connecté + son profil applicatif (null si non connecté ou Supabase non configuré). */
export const utilisateurCourant = cache(async (): Promise<Profil | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await supabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.profil.findUnique({ where: { id: user.id } });
});

/** Profil requis — lève si non connecté. */
export async function profilRequis(): Promise<Profil> {
  const profil = await utilisateurCourant();
  if (!profil) throw new Error("Authentification requise.");
  return profil;
}

/** Profil requis avec un rôle précis. */
export async function roleRequis(role: Role): Promise<Profil> {
  const profil = await profilRequis();
  if (profil.role !== role && profil.role !== "admin") throw new Error("Accès réservé.");
  return profil;
}
