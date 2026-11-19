import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/auth";

/** GET /api/moi — profil applicatif de l'usager connecté (ou null). */
export async function GET() {
  const p = await utilisateurCourant();
  return NextResponse.json(
    {
      profil: p
        ? { id: p.id, nom: p.nom, telephone: p.telephone ?? "", email: p.email, role: p.role, creeLe: p.creeLe.toISOString() }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
